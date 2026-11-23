#!/usr/bin/env node
/**
 * Synchronizes canonical shared/ guardrails and skills into the native
 * Antigravity, Claude Code, and GitHub Copilot plugin directories.
 *
 * Usage:
 *   node scripts/sync-plugins.mjs          # sync files
 *   node scripts/sync-plugins.mjs --check  # exit 1 if any destination differs from shared/
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const ENVIRONMENTS = ["antigravity", "claude", "copilot"];

const FILE_MAPPINGS = [
  {
    src: "shared/guardrails/guardrails.mjs",
    dests: ENVIRONMENTS.map((env) => `${env}/plugins/safe-guardrails/scripts/guardrails.mjs`),
    executable: true,
  },
];

const DIR_MAPPINGS = [
  {
    src: "shared/skills/js-component-builder",
    dests: ENVIRONMENTS.map((env) => `${env}/plugins/js-components/skills/js-component-builder`),
  },
  {
    src: "shared/skills/js-component-maintainer",
    dests: ENVIRONMENTS.map((env) => `${env}/plugins/js-components/skills/js-component-maintainer`),
  },
  {
    src: "shared/skills/pr-review",
    dests: ENVIRONMENTS.map((env) => `${env}/plugins/web-review/skills/pr-review`),
  },
  {
    src: "shared/skills/a11y-semantic-audit",
    dests: ENVIRONMENTS.map((env) => `${env}/plugins/web-review/skills/a11y-semantic-audit`),
  },
];

function listFilesRecursive(dirPath, base = dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const files = [];
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(full, base));
    } else if (entry.isFile()) {
      files.push(path.relative(base, full).replace(/\\/g, "/"));
    }
  }
  return files;
}

function filesEqual(srcPath, destPath) {
  if (!fs.existsSync(destPath)) return false;
  const a = fs.readFileSync(srcPath);
  const b = fs.readFileSync(destPath);
  return a.equals(b);
}

function copyFileExact(srcPath, destPath, executable = false) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  if (executable) {
    try {
      fs.chmodSync(destPath, 0o755);
    } catch {
      // Ignore chmod limits on Windows filesystems
    }
  }
}

export function syncPlugins({ rootDir = REPO_ROOT, checkOnly = false } = {}) {
  const drift = [];
  let copiedCount = 0;

  for (const mapping of FILE_MAPPINGS) {
    const srcAbs = path.join(rootDir, mapping.src);
    if (!fs.existsSync(srcAbs)) {
      throw new Error(`Missing canonical source file: ${mapping.src}`);
    }
    for (const destRel of mapping.dests) {
      const destAbs = path.join(rootDir, destRel);
      if (!filesEqual(srcAbs, destAbs)) {
        if (checkOnly) {
          drift.push(`${destRel} differs from ${mapping.src}`);
        } else {
          copyFileExact(srcAbs, destAbs, mapping.executable);
          copiedCount += 1;
        }
      }
    }
  }

  for (const mapping of DIR_MAPPINGS) {
    const srcDirAbs = path.join(rootDir, mapping.src);
    if (!fs.existsSync(srcDirAbs)) {
      throw new Error(`Missing canonical source directory: ${mapping.src}`);
    }
    const srcFiles = listFilesRecursive(srcDirAbs);

    for (const destRel of mapping.dests) {
      const destDirAbs = path.join(rootDir, destRel);
      const destFiles = listFilesRecursive(destDirAbs);

      // Detect or remove extra files in destination
      for (const extraRel of destFiles) {
        if (!srcFiles.includes(extraRel)) {
          if (checkOnly) {
            drift.push(`Unexpected extra file: ${destRel}/${extraRel}`);
          } else {
            fs.rmSync(path.join(destDirAbs, extraRel), { force: true });
          }
        }
      }

      // Check or copy source files
      for (const fileRel of srcFiles) {
        const srcFileAbs = path.join(srcDirAbs, fileRel);
        const destFileAbs = path.join(destDirAbs, fileRel);
        if (!filesEqual(srcFileAbs, destFileAbs)) {
          if (checkOnly) {
            drift.push(`${destRel}/${fileRel} differs from ${mapping.src}/${fileRel}`);
          } else {
            copyFileExact(srcFileAbs, destFileAbs);
            copiedCount += 1;
          }
        }
      }
    }
  }

  return { drift, copiedCount };
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const { drift, copiedCount } = syncPlugins({ checkOnly });

  if (checkOnly) {
    if (drift.length > 0) {
      console.error("Plugin sync check failed — run `npm run sync` to update:");
      for (const item of drift) {
        console.error(`  - ${item}`);
      }
      process.exitCode = 1;
      return;
    }
    console.log("Plugin sync check passed: all environment copies match shared/.");
    return;
  }

  console.log(`Synced plugins cleanly (${copiedCount} file(s) updated).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
