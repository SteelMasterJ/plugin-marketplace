#!/usr/bin/env node
/**
 * Cross-environment installer for @steelmasterj/plugin-marketplace.
 *
 * Installs selected plugins (`safe-guardrails`, `js-components`, `web-review`)
 * into Antigravity, Claude Code, and/or GitHub Copilot at project or user scope.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const ALL_ENVS = ["antigravity", "claude", "copilot"];
const ALL_PLUGINS = ["safe-guardrails", "js-components", "web-review", "js-site-builder"];

function printHelp() {
  console.log(`Usage: node scripts/install.mjs [options]

Options:
  --env <antigravity|claude|copilot|all>   Target environment(s) (default: all)
  --scope <project|user>                   Install scope (default: project)
  --target <dir>                           Project directory for project scope (default: cwd)
  --plugins <csv>                          Comma-separated plugins from: ${ALL_PLUGINS.join(",")}
  --dry-run                                Print actions without writing files
  -h, --help                               Show help
`);
}

export function parseInstallArgs(argv) {
  const opts = {
    env: "all",
    scope: "project",
    target: process.cwd(),
    plugins: [...ALL_PLUGINS],
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      opts.help = true;
    } else if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--env" && i + 1 < argv.length) {
      opts.env = argv[++i].toLowerCase();
    } else if (arg.startsWith("--env=")) {
      opts.env = arg.slice("--env=".length).toLowerCase();
    } else if (arg === "--scope" && i + 1 < argv.length) {
      opts.scope = argv[++i].toLowerCase();
    } else if (arg.startsWith("--scope=")) {
      opts.scope = arg.slice("--scope=".length).toLowerCase();
    } else if (arg === "--target" && i + 1 < argv.length) {
      opts.target = path.resolve(argv[++i]);
    } else if (arg.startsWith("--target=")) {
      opts.target = path.resolve(arg.slice("--target=".length));
    } else if (arg === "--plugins" && i + 1 < argv.length) {
      opts.plugins = argv[++i]
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    } else if (arg.startsWith("--plugins=")) {
      opts.plugins = arg
        .slice("--plugins=".length)
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    } else {
      throw new Error(`Unknown or incomplete option: ${arg}`);
    }
  }

  if (opts.env !== "all" && !ALL_ENVS.includes(opts.env)) {
    throw new Error(`Invalid --env "${opts.env}". Expected one of: antigravity, claude, copilot, all.`);
  }
  if (opts.scope !== "project" && opts.scope !== "user") {
    throw new Error(`Invalid --scope "${opts.scope}". Expected "project" or "user".`);
  }
  for (const p of opts.plugins) {
    if (!ALL_PLUGINS.includes(p)) {
      throw new Error(`Unknown plugin "${p}". Expected subset of: ${ALL_PLUGINS.join(", ")}.`);
    }
  }
  if (opts.plugins.length === 0) {
    throw new Error("At least one plugin must be specified.");
  }

  return opts;
}

function copyDirRecursive(srcDir, destDir, dryRun, actions) {
  if (!fs.existsSync(srcDir)) return;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, dryRun, actions);
    } else if (entry.isFile()) {
      actions.push(`copy ${destPath}`);
      if (!dryRun) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

function copyFileAction(srcPath, destPath, dryRun, actions) {
  actions.push(`copy ${destPath}`);
  if (!dryRun) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
  }
}

function writeJsonAction(destPath, data, dryRun, actions) {
  actions.push(`write ${destPath}`);
  if (!dryRun) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }
}

function installAntigravity({ rootDir, scope, target, homeDir, plugins, dryRun, actions }) {
  const basePluginsDir =
    scope === "project"
      ? path.join(target, ".agents", "plugins")
      : path.join(homeDir, ".gemini", "config", "plugins");

  for (const plugin of plugins) {
    const srcPlugin = path.join(rootDir, "antigravity", "plugins", plugin);
    const destPlugin = path.join(basePluginsDir, plugin);
    copyDirRecursive(srcPlugin, destPlugin, dryRun, actions);
  }
}

function installClaude({ rootDir, scope, target, homeDir, plugins, dryRun, actions }) {
  const baseClaudeDir =
    scope === "project" ? path.join(target, ".claude") : path.join(homeDir, ".claude");

  for (const plugin of plugins) {
    const srcPlugin = path.join(rootDir, "claude", "plugins", plugin);
    if (plugin === "safe-guardrails") {
      const destScript = path.join(baseClaudeDir, "hooks", "scripts", "guardrails.mjs");
      copyFileAction(
        path.join(srcPlugin, "scripts", "guardrails.mjs"),
        destScript,
        dryRun,
        actions
      );

      const settingsPath = path.join(baseClaudeDir, "settings.json");
      let existingSettings = {};
      if (fs.existsSync(settingsPath)) {
        const raw = fs.readFileSync(settingsPath, "utf8").trim();
        if (raw) {
          existingSettings = JSON.parse(raw);
          if (!existingSettings || typeof existingSettings !== "object" || Array.isArray(existingSettings)) {
            throw new Error(`Existing ${settingsPath} must be a JSON object.`);
          }
        }
      }

      const hookCommand =
        scope === "project"
          ? 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/scripts/guardrails.mjs" --adapter claude'
          : `node "${destScript.replace(/\\/g, "/")}" --adapter claude`;

      const hooksObj =
        existingSettings.hooks && typeof existingSettings.hooks === "object"
          ? { ...existingSettings.hooks }
          : {};
      const preToolUseList = Array.isArray(hooksObj.PreToolUse) ? [...hooksObj.PreToolUse] : [];

      const alreadyPresent = preToolUseList.some(
        (entry) =>
          Array.isArray(entry?.hooks) &&
          entry.hooks.some(
            (h) =>
              typeof h?.command === "string" &&
              h.command.includes("guardrails.mjs") &&
              h.command.includes("--adapter claude")
          )
      );

      if (!alreadyPresent) {
        preToolUseList.push({
          matcher: "*",
          hooks: [
            {
              type: "command",
              command: hookCommand,
              timeout: 10,
            },
          ],
        });
      }

      hooksObj.PreToolUse = preToolUseList;
      const merged = {
        ...existingSettings,
        hooks: hooksObj,
      };
      writeJsonAction(settingsPath, merged, dryRun, actions);
    } else {
      copyDirRecursive(path.join(srcPlugin, "skills"), path.join(baseClaudeDir, "skills"), dryRun, actions);
      copyDirRecursive(path.join(srcPlugin, "agents"), path.join(baseClaudeDir, "agents"), dryRun, actions);
    }
  }
}

function installCopilot({ rootDir, scope, target, homeDir, plugins, dryRun, actions }) {
  const baseCopilotDir =
    scope === "project" ? path.join(target, ".github") : path.join(homeDir, ".copilot");

  for (const plugin of plugins) {
    const srcPlugin = path.join(rootDir, "copilot", "plugins", plugin);
    if (plugin === "safe-guardrails") {
      const destScript = path.join(baseCopilotDir, "hooks", "scripts", "guardrails.mjs");
      copyFileAction(
        path.join(srcPlugin, "scripts", "guardrails.mjs"),
        destScript,
        dryRun,
        actions
      );

      const hookCmd =
        scope === "project"
          ? "node ./.github/hooks/scripts/guardrails.mjs --adapter copilot"
          : `node "${destScript.replace(/\\/g, "/")}" --adapter copilot`;

      const hookConfig = {
        version: 1,
        hooks: {
          preToolUse: [
            {
              type: "command",
              command: hookCmd,
              bash: hookCmd,
              powershell: hookCmd,
              timeoutSec: 10,
            },
          ],
        },
      };

      writeJsonAction(
        path.join(baseCopilotDir, "hooks", "safe-guardrails.json"),
        hookConfig,
        dryRun,
        actions
      );
    } else {
      copyDirRecursive(path.join(srcPlugin, "skills"), path.join(baseCopilotDir, "skills"), dryRun, actions);
      copyDirRecursive(path.join(srcPlugin, "agents"), path.join(baseCopilotDir, "agents"), dryRun, actions);
    }
  }
}

export function runInstall({
  rootDir = REPO_ROOT,
  env = "all",
  scope = "project",
  target = process.cwd(),
  homeDir = os.homedir(),
  plugins = ALL_PLUGINS,
  dryRun = false,
} = {}) {
  const envs = env === "all" ? ALL_ENVS : [env];
  const actions = [];

  for (const currentEnv of envs) {
    if (currentEnv === "antigravity") {
      installAntigravity({ rootDir, scope, target, homeDir, plugins, dryRun, actions });
    } else if (currentEnv === "claude") {
      installClaude({ rootDir, scope, target, homeDir, plugins, dryRun, actions });
    } else if (currentEnv === "copilot") {
      installCopilot({ rootDir, scope, target, homeDir, plugins, dryRun, actions });
    }
  }

  return { envs, scope, target, plugins, dryRun, actions };
}

function main() {
  try {
    const opts = parseInstallArgs(process.argv.slice(2));
    if (opts.help) {
      printHelp();
      return;
    }

    const result = runInstall(opts);
    const prefix = opts.dryRun ? "[dry-run] " : "";
    console.log(
      `${prefix}Installed plugins (${result.plugins.join(", ")}) for [${result.envs.join(", ")}] at ${result.scope} scope:`
    );
    for (const action of result.actions) {
      console.log(`  ${prefix}${action}`);
    }
  } catch (err) {
    console.error(`Install error: ${err.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
