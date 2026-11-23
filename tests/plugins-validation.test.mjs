import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { syncPlugins } from "../scripts/sync-plugins.mjs";
import { runInstall } from "../scripts/install.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

function readJson(relPath) {
  const fullPath = path.join(REPO_ROOT, relPath);
  assert.equal(fs.existsSync(fullPath), true, `Missing JSON file: ${relPath}`);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function parseYamlFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(match, `Missing YAML frontmatter in ${path.relative(REPO_ROOT, filePath)}`);
  const block = match[1];
  const nameMatch = block.match(/^name:\s*(.+)$/m);
  const descMatch = block.match(/^description:\s*(.+)$/m);
  assert.ok(nameMatch && nameMatch[1].trim(), `Missing name in ${filePath}`);
  assert.ok(descMatch && descMatch[1].trim(), `Missing description in ${filePath}`);
  return { name: nameMatch[1].trim(), description: descMatch[1].trim() };
}

test("all JSON manifests and hook configs parse cleanly and reference valid plugin paths", () => {
  const catalogs = [
    ".claude-plugin/marketplace.json",
    ".github/plugin/marketplace.json",
  ];

  for (const catalogPath of catalogs) {
    const catalog = readJson(catalogPath);
    assert.ok(Array.isArray(catalog.plugins) && catalog.plugins.length === 4, `${catalogPath} should list 4 plugins`);
    for (const plugin of catalog.plugins) {
      assert.ok(plugin.name && plugin.source, `Plugin entry incomplete in ${catalogPath}`);
      const sourcePath = typeof plugin.source === "string" ? plugin.source : plugin.source.path;
      const absSource = path.resolve(REPO_ROOT, sourcePath);
      assert.equal(fs.existsSync(absSource), true, `Plugin source does not exist: ${sourcePath}`);
    }
  }

  const rootIndex = readJson("marketplace.json");
  assert.ok(rootIndex.environments && typeof rootIndex.environments === "object");
  for (const envCatalogRel of Object.values(rootIndex.environments)) {
    assert.equal(fs.existsSync(path.resolve(REPO_ROOT, envCatalogRel)), true, `Missing catalog: ${envCatalogRel}`);
  }
  assert.ok(Array.isArray(rootIndex.plugins) && rootIndex.plugins.length === 4);
  for (const plugin of rootIndex.plugins) {
    for (const pluginRel of Object.values(plugin.paths)) {
      assert.equal(fs.existsSync(path.resolve(REPO_ROOT, pluginRel)), true, `Missing plugin path: ${pluginRel}`);
    }
  }

  const agyPluginsCfg = readJson("antigravity/plugins.json");
  assert.ok(Array.isArray(agyPluginsCfg.entries) && agyPluginsCfg.entries.length >= 1);
  const agyPluginsRoot = path.resolve(REPO_ROOT, "antigravity", agyPluginsCfg.entries[0].path);
  for (const pluginName of ["safe-guardrails", "js-components", "web-review", "js-site-builder"]) {
    const pluginDir = path.join(agyPluginsRoot, pluginName);
    assert.equal(fs.existsSync(path.join(pluginDir, "plugin.json")), true, `Missing Antigravity plugin.json for ${pluginName}`);
    assert.equal(fs.existsSync(path.join(pluginDir, "assets", "logo.svg")), true, `Missing Antigravity logo.svg for ${pluginName}`);
  }

  const standaloneJsonFiles = [
    "package.json",
    "antigravity/plugins.json",
    "claude/settings.hooks.example.json",
    "copilot/standalone/.github/hooks/safe-guardrails.json",
    "antigravity/plugins/safe-guardrails/plugin.json",
    "antigravity/plugins/safe-guardrails/hooks.json",
    "antigravity/plugins/js-components/plugin.json",
    "antigravity/plugins/web-review/plugin.json",
    "antigravity/plugins/js-site-builder/plugin.json",
    "claude/plugins/safe-guardrails/.claude-plugin/plugin.json",
    "claude/plugins/safe-guardrails/hooks/hooks.json",
    "claude/plugins/js-components/.claude-plugin/plugin.json",
    "claude/plugins/web-review/.claude-plugin/plugin.json",
    "claude/plugins/js-site-builder/.claude-plugin/plugin.json",
    "copilot/plugins/safe-guardrails/plugin.json",
    "copilot/plugins/safe-guardrails/.github/plugin/plugin.json",
    "copilot/plugins/safe-guardrails/hooks/hooks.json",
    "copilot/plugins/safe-guardrails/com.github.copilot/hooks/hooks.json",
    "copilot/plugins/js-components/plugin.json",
    "copilot/plugins/js-components/.github/plugin/plugin.json",
    "copilot/plugins/web-review/plugin.json",
    "copilot/plugins/web-review/.github/plugin/plugin.json",
    "copilot/plugins/js-site-builder/plugin.json",
    "copilot/plugins/js-site-builder/.github/plugin/plugin.json",
  ];

  for (const rel of standaloneJsonFiles) {
    readJson(rel);
  }
});

test("all canonical skills and platform agents contain valid YAML frontmatter", () => {
  const skillDirs = [
    "shared/skills/js-component-builder",
    "shared/skills/js-component-maintainer",
    "shared/skills/pr-review",
    "shared/skills/a11y-semantic-audit",
    "shared/skills/js-site-builder",
  ];
  for (const dir of skillDirs) {
    const fm = parseYamlFrontmatter(path.join(REPO_ROOT, dir, "SKILL.md"));
    assert.match(fm.name, /^[a-z0-9-]+$/);
  }

  const agentFiles = [
    "antigravity/plugins/js-components/agents/js-component-architect.md",
    "antigravity/plugins/js-components/agents/js-component-maintainer.md",
    "antigravity/plugins/web-review/agents/frontend-pr-reviewer.md",
    "antigravity/plugins/js-site-builder/agents/js-site-architect.md",
    "claude/plugins/js-components/agents/js-component-architect.md",
    "claude/plugins/js-components/agents/js-component-maintainer.md",
    "claude/plugins/web-review/agents/frontend-pr-reviewer.md",
    "claude/plugins/js-site-builder/agents/js-site-architect.md",
    "copilot/plugins/js-components/agents/js-component-architect.agent.md",
    "copilot/plugins/js-components/agents/js-component-maintainer.agent.md",
    "copilot/plugins/web-review/agents/frontend-pr-reviewer.agent.md",
    "copilot/plugins/js-site-builder/agents/js-site-architect.agent.md",
  ];
  for (const rel of agentFiles) {
    const fm = parseYamlFrontmatter(path.join(REPO_ROOT, rel));
    assert.match(fm.name, /^[a-z0-9-]+$/);
  }
});

test("sync-plugins check reports zero drift between shared/ and all 3 environments", () => {
  const { drift } = syncPlugins({ rootDir: REPO_ROOT, checkOnly: true });
  assert.deepEqual(drift, []);
});

test("installer supports project scope for all 3 environments and is idempotent", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pm-install-"));
  const targetDir = path.join(tempRoot, "sample-project");
  const fakeHome = path.join(tempRoot, "home");
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(fakeHome, { recursive: true });

  // Seed existing Claude settings to verify merge preserves unrelated keys
  fs.mkdirSync(path.join(targetDir, ".claude"), { recursive: true });
  fs.writeFileSync(
    path.join(targetDir, ".claude", "settings.json"),
    JSON.stringify({ permissions: { allow: ["Bash(npm test)"] } }, null, 2),
    "utf8"
  );

  try {
    const first = runInstall({
      rootDir: REPO_ROOT,
      env: "all",
      scope: "project",
      target: targetDir,
      homeDir: fakeHome,
      dryRun: false,
    });
    assert.ok(first.actions.length > 0);

    // Antigravity verification
    assert.equal(fs.existsSync(path.join(targetDir, ".agents/plugins/safe-guardrails/hooks.json")), true);
    assert.equal(fs.existsSync(path.join(targetDir, ".agents/plugins/safe-guardrails/scripts/guardrails.mjs")), true);
    assert.equal(fs.existsSync(path.join(targetDir, ".agents/plugins/js-components/skills/js-component-builder/SKILL.md")), true);
    assert.equal(fs.existsSync(path.join(targetDir, ".agents/plugins/web-review/agents/frontend-pr-reviewer.md")), true);
    assert.equal(fs.existsSync(path.join(targetDir, ".agents/plugins/js-site-builder/skills/js-site-builder/SKILL.md")), true);
    assert.equal(fs.existsSync(path.join(targetDir, ".agents/plugins/js-site-builder/agents/js-site-architect.md")), true);

    // Claude verification (merged settings + skills + agents + script)
    const claudeSettings = JSON.parse(
      fs.readFileSync(path.join(targetDir, ".claude", "settings.json"), "utf8")
    );
    assert.deepEqual(claudeSettings.permissions, { allow: ["Bash(npm test)"] });
    assert.equal(claudeSettings.hooks.PreToolUse.length, 1);
    assert.equal(fs.existsSync(path.join(targetDir, ".claude/hooks/scripts/guardrails.mjs")), true);
    assert.equal(fs.existsSync(path.join(targetDir, ".claude/skills/pr-review/SKILL.md")), true);
    assert.equal(fs.existsSync(path.join(targetDir, ".claude/skills/js-site-builder/SKILL.md")), true);
    assert.equal(fs.existsSync(path.join(targetDir, ".claude/agents/frontend-pr-reviewer.md")), true);
    assert.equal(fs.existsSync(path.join(targetDir, ".claude/agents/js-site-architect.md")), true);

    // Copilot verification
    const copilotHook = JSON.parse(
      fs.readFileSync(path.join(targetDir, ".github/hooks/safe-guardrails.json"), "utf8")
    );
    assert.equal(copilotHook.version, 1);
    assert.equal(copilotHook.hooks.preToolUse.length, 1);
    assert.equal(fs.existsSync(path.join(targetDir, ".github/hooks/scripts/guardrails.mjs")), true);
    assert.equal(fs.existsSync(path.join(targetDir, ".github/skills/js-component-builder/SKILL.md")), true);
    assert.equal(fs.existsSync(path.join(targetDir, ".github/skills/js-site-builder/SKILL.md")), true);
    assert.equal(fs.existsSync(path.join(targetDir, ".github/agents/frontend-pr-reviewer.agent.md")), true);
    assert.equal(fs.existsSync(path.join(targetDir, ".github/agents/js-site-architect.agent.md")), true);

    // Run a second time to verify idempotency (no duplicate PreToolUse entry)
    runInstall({
      rootDir: REPO_ROOT,
      env: "claude",
      scope: "project",
      target: targetDir,
      homeDir: fakeHome,
      plugins: ["safe-guardrails"],
      dryRun: false,
    });
    const claudeSettingsAfter = JSON.parse(
      fs.readFileSync(path.join(targetDir, ".claude", "settings.json"), "utf8")
    );
    assert.equal(claudeSettingsAfter.hooks.PreToolUse.length, 1);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
