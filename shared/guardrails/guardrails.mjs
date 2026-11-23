#!/usr/bin/env node
/**
 * safe-guardrails: Cross-environment PreToolUse / preToolUse hook engine.
 *
 * Supports Antigravity, Claude Code, and GitHub Copilot (CLI + VS Code)
 * with zero external dependencies. Fail-closed on malformed payloads or errors.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const VALID_ADAPTERS = new Set(["antigravity", "claude", "copilot", "auto"]);

const FILE_INSPECT_TOOLS = new Set([
  "read_file",
  "view_file",
  "view_file_outline",
  "view_code_item",
  "read",
  "view",
  "readfile",
  "edit_file",
  "edit",
  "replace_file_content",
  "multi_replace_file_content",
  "write_file",
  "write_to_file",
  "write",
  "create",
  "create_file",
  "notebookedit",
  "list_dir",
  "list_directory",
  "ls",
]);

const SEARCH_TOOLS = new Set([
  "grep",
  "grep_search",
  "glob",
  "find_by_name",
]);

const GLOB_TOOLS = new Set(["glob", "find_by_name"]);

const SHELL_TOOLS = new Set([
  "run_command",
  "bash",
  "powershell",
  "pwsh",
  "sh",
  "zsh",
  "cmd",
  "terminal",
  "run_in_terminal",
  "execute_command",
  "exec",
]);

const PATH_KEYS = new Set([
  "path",
  "file_path",
  "filepath",
  "targetfile",
  "absolutepath",
  "searchpath",
  "directorypath",
  "target_path",
  "files",
  "paths",
  "uri",
  "glob",
  "includes",
]);

const SAFE_BASENAMES = new Set([
  ".env.example",
  ".env.sample",
  ".env.template",
  ".env.dist",
  ".env.schema",
  ".env.defaults",
  ".gitignore",
]);

const SENSITIVE_EXACT_BASENAMES = new Set([
  ".env",
  ".envrc",
  "id_rsa",
  "id_ed25519",
  "id_ecdsa",
  "id_dsa",
  "authorized_keys",
  ".npmrc",
  ".pypirc",
  ".netrc",
  "_netrc",
  ".git-credentials",
  "credentials.json",
  "application_default_credentials.json",
  "terraform.tfvars",
  "terraform.tfstate",
  ".vault-token",
  "secrets.yml",
  "secrets.yaml",
  "secrets.json",
  "secrets.toml",
  ".secrets",
  "master.key",
  "credentials.yml.enc",
  ".htpasswd",
]);

const SENSITIVE_EXTENSIONS = [
  ".pem",
  ".key",
  ".p12",
  ".pfx",
  ".jks",
  ".keystore",
  ".ppk",
  ".tfvars",
  ".env",
];

const SENSITIVE_RELATIVE_PATHS = [
  ".aws/credentials",
  ".aws/config",
  ".docker/config.json",
  ".kube/config",
  ".azure/accesstokens.json",
  "/etc/shadow",
];

const STRICT_SENSITIVE_DIR_SEGMENTS = new Set([
  ".secrets",
  ".secret",
  ".gnupg",
  ".aws",
  ".kube",
]);

/**
 * Parses `--adapter <mode>` or `--adapter=<mode>` from CLI arguments.
 * @param {string[]} argv
 * @returns {"antigravity" | "claude" | "copilot" | "auto"}
 */
export function parseAdapterFlag(argv = []) {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--adapter" && i + 1 < argv.length) {
      const candidate = String(argv[i + 1]).toLowerCase();
      return VALID_ADAPTERS.has(candidate) ? candidate : "auto";
    }
    if (arg.startsWith("--adapter=")) {
      const candidate = arg.slice("--adapter=".length).toLowerCase();
      return VALID_ADAPTERS.has(candidate) ? candidate : "auto";
    }
  }
  return "auto";
}

/**
 * Normalizes incoming hook JSON payloads across Antigravity, Claude Code, and Copilot.
 * @param {unknown} payload
 * @param {"antigravity" | "claude" | "copilot" | "auto"} [adapterFlag="auto"]
 * @returns {{ adapter: "antigravity" | "claude" | "copilot", toolName: string, toolArgs: Record<string, unknown> }}
 */
export function normalizeInput(payload, adapterFlag = "auto") {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Hook payload must be a JSON object.");
  }

  let adapter = adapterFlag;
  if (adapter === "auto") {
    if (payload.toolCall && typeof payload.toolCall === "object") {
      adapter = "antigravity";
    } else if (payload.toolName !== undefined || payload.toolArgs !== undefined) {
      adapter = "copilot";
    } else if (payload.tool_name !== undefined || payload.tool_input !== undefined) {
      adapter = "claude";
    } else {
      adapter = "antigravity";
    }
  }

  let rawName = "";
  let rawArgs = {};

  if (adapter === "antigravity") {
    const tc = payload.toolCall && typeof payload.toolCall === "object" ? payload.toolCall : payload;
    rawName = tc.name ?? payload.tool_name ?? payload.toolName ?? "";
    rawArgs = tc.args ?? payload.tool_input ?? payload.toolArgs ?? {};
  } else if (adapter === "claude") {
    rawName = payload.tool_name ?? payload.toolName ?? payload.toolCall?.name ?? "";
    rawArgs = payload.tool_input ?? payload.toolArgs ?? payload.toolCall?.args ?? {};
  } else {
    rawName = payload.toolName ?? payload.tool_name ?? payload.toolCall?.name ?? "";
    rawArgs = payload.toolArgs ?? payload.tool_input ?? payload.toolCall?.args ?? {};
  }

  let toolArgs = {};
  if (typeof rawArgs === "string") {
    const trimmed = rawArgs.trim();
    if (trimmed.length > 0) {
      try {
        const parsed = JSON.parse(trimmed);
        toolArgs =
          parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed
            : { command: rawArgs };
      } catch {
        toolArgs = { command: rawArgs };
      }
    }
  } else if (rawArgs && typeof rawArgs === "object" && !Array.isArray(rawArgs)) {
    toolArgs = rawArgs;
  }

  return {
    adapter,
    toolName: String(rawName || "").trim(),
    toolArgs,
  };
}

/**
 * Formats an allow/deny decision into the native JSON shape for the target adapter.
 * @param {"antigravity" | "claude" | "copilot"} adapter
 * @param {{ allowed: boolean, category?: string, reason?: string }} result
 * @returns {Record<string, unknown>}
 */
export function formatOutput(adapter, result) {
  if (result.allowed) {
    if (adapter === "claude") {
      return {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
        },
      };
    }
    if (adapter === "copilot") {
      return {
        permissionDecision: "allow",
      };
    }
    return {
      decision: "allow",
    };
  }

  const category = result.category || "policy";
  const rawReason = result.reason || "Action blocked by safe-guardrails.";
  const formattedReason = rawReason.startsWith("[safe-guardrails]")
    ? rawReason
    : `[safe-guardrails] (${category}) ${rawReason}`;

  if (adapter === "claude") {
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: formattedReason,
      },
    };
  }
  if (adapter === "copilot") {
    return {
      permissionDecision: "deny",
      permissionDecisionReason: formattedReason,
    };
  }
  return {
    decision: "deny",
    reason: formattedReason,
  };
}

function normalizePathSlashes(value) {
  return value.replace(/\\/g, "/").replace(/\/+/g, "/").trim();
}

function getBasenameLower(normalizedPath) {
  const cleaned = normalizedPath.replace(/\/+$/, "");
  const parts = cleaned.split("/");
  return (parts[parts.length - 1] || "").toLowerCase();
}

/**
 * Checks whether a single file path or glob pattern refers to a sensitive file.
 * Returns null if allowed, or an explanation string if blocked.
 * @param {string} rawCandidate
 * @returns {string | null}
 */
export function matchSensitivePath(rawCandidate) {
  if (!rawCandidate || typeof rawCandidate !== "string") {
    return null;
  }

  let candidate = rawCandidate.trim().replace(/^['"`]+|['"`]+$/g, "");
  if (!candidate) {
    return null;
  }

  // Strip Windows drive or file:// prefix only for matching convenience
  candidate = candidate.replace(/^file:\/\//i, "");
  const norm = normalizePathSlashes(candidate);
  const lower = norm.toLowerCase();
  const base = getBasenameLower(norm);
  const segments = lower.replace(/\/+$/, "").split("/").filter(Boolean);

  if (!base || base === "." || base === "..") {
    return null;
  }

  // Block any path inside strict sensitive directories before safe-basename exceptions
  for (const seg of segments) {
    if (STRICT_SENSITIVE_DIR_SEGMENTS.has(seg) || seg === ".secrets*" || seg === ".secret*") {
      return `Access to sensitive directory "${seg}" in "${norm}" is blocked.`;
    }
  }

  // Explicit safe allowlist checked next
  if (SAFE_BASENAMES.has(base)) {
    return null;
  }
  if (base.endsWith(".pub")) {
    return null;
  }

  // Block any non-public file inside .ssh/
  if (segments.includes(".ssh")) {
    return `Access to sensitive directory ".ssh" in "${norm}" is blocked.`;
  }

  // Exact sensitive basenames
  if (SENSITIVE_EXACT_BASENAMES.has(base)) {
    return `Access to sensitive file "${base}" is blocked.`;
  }

  // `.env.*` variants (e.g., `.env.local`, `.env.production`, `.env*`, `**/.env*`)
  if (/^\.env(?:\.|$|\*)/.test(base)) {
    return `Access to environment file "${base}" is blocked (use .env.example or .env.template for safe templates).`;
  }

  // `terraform.tfstate.*`
  if (/^terraform\.tfstate(?:\.|$|\*)/.test(base)) {
    return `Access to Terraform state file "${base}" is blocked.`;
  }

  // SSH private key naming (`id_rsa.*`, `id_ed25519.*`, etc., already excluding `.pub`)
  if (/^id_(?:rsa|ed25519|ecdsa|dsa)(?:$|\.|_)/.test(base)) {
    return `Access to SSH private key "${base}" is blocked.`;
  }

  // `*service-account*.json` / `*service_account*.json`
  if (/service[-_]account.*\.json$/i.test(base)) {
    return `Access to service account credential "${base}" is blocked.`;
  }

  // Sensitive file extensions (handle exact extension or glob like `*.pem`)
  for (const ext of SENSITIVE_EXTENSIONS) {
    if (base.endsWith(ext) || base === `*${ext}`) {
      if (ext === ".env" && base === ".gitignore") {
        continue;
      }
      return `Access to sensitive "${ext}" file "${base}" is blocked.`;
    }
  }

  // Sensitive relative path suffixes
  for (const rel of SENSITIVE_RELATIVE_PATHS) {
    if (
      lower === rel ||
      lower.endsWith(`/${rel}`) ||
      lower.startsWith(`${rel}/`) ||
      (rel.startsWith("/") && lower === rel)
    ) {
      return `Access to credential path "${norm}" is blocked.`;
    }
  }

  return null;
}

function collectPathStrings(value, { includePatternKey = false } = {}, acc = []) {
  if (typeof value === "string") {
    acc.push(value);
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectPathStrings(item, { includePatternKey }, acc);
    }
    return acc;
  }
  if (value && typeof value === "object") {
    for (const [key, val] of Object.entries(value)) {
      const lk = key.toLowerCase();
      if (PATH_KEYS.has(lk) || (includePatternKey && lk === "pattern")) {
        collectPathStrings(val, { includePatternKey }, acc);
      } else if (val && typeof val === "object") {
        collectPathStrings(val, { includePatternKey }, acc);
      }
    }
  }
  return acc;
}

function extractCommandString(toolArgs) {
  const keys = ["CommandLine", "commandLine", "command", "cmd", "script", "input"];
  for (const key of keys) {
    if (typeof toolArgs[key] === "string" && toolArgs[key].trim()) {
      return toolArgs[key];
    }
  }
  for (const [k, v] of Object.entries(toolArgs)) {
    if (typeof v === "string" && v.trim() && /command|cmd|script/i.test(k)) {
      return v;
    }
  }
  return "";
}

function splitCommandSegments(command) {
  const segments = [];
  let current = "";
  let quote = null;

  for (let i = 0; i < command.length; i += 1) {
    const ch = command[i];
    const next = command[i + 1];

    if (quote) {
      if (ch === "\\" && quote === '"' && i + 1 < command.length) {
        current += ch + next;
        i += 1;
        continue;
      }
      if (ch === quote) {
        quote = null;
      }
      current += ch;
      continue;
    }

    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
      continue;
    }

    if (
      (ch === "&" && next === "&") ||
      (ch === "|" && next === "|")
    ) {
      if (current.trim()) segments.push(current.trim());
      current = "";
      i += 1;
      continue;
    }

    if (ch === ";" || ch === "|" || ch === "\n" || ch === "\r") {
      if (current.trim()) segments.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  if (current.trim()) {
    segments.push(current.trim());
  }

  return segments;
}

function tokenizeArgs(segment) {
  const tokens = [];
  let current = "";
  let quote = null;

  for (let i = 0; i < segment.length; i += 1) {
    const ch = segment[i];
    if (quote) {
      if (ch === "\\" && quote === '"' && i + 1 < segment.length) {
        current += segment[i + 1];
        i += 1;
        continue;
      }
      if (ch === quote) {
        quote = null;
        continue;
      }
      current += ch;
      continue;
    }

    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }

    if (/\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += ch;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

function isShortFlagClusterWith(token, chars) {
  if (!token.startsWith("-") || token.startsWith("--") || token.length < 2) {
    return false;
  }
  const body = token.slice(1);
  return chars.some((ch) => body.includes(ch));
}

function checkGitSegment(tokens) {
  let idx = 0;
  while (idx < tokens.length) {
    const t = path.posix.basename(tokens[idx].replace(/\\/g, "/")).toLowerCase();
    if (t === "sudo" || t === "env") {
      idx += 1;
      continue;
    }
    if (/^[a-z_][a-z0-9_]*=/.test(tokens[idx])) {
      idx += 1;
      continue;
    }
    break;
  }

  if (idx >= tokens.length) return null;
  const cmdName = path.posix.basename(tokens[idx].replace(/\\/g, "/")).toLowerCase();
  if (cmdName !== "git" && cmdName !== "git.exe") {
    return null;
  }

  let i = idx + 1;
  // Skip global git flags
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok === "-C" || tok === "-c" || tok === "--git-dir" || tok === "--work-tree" || tok === "--namespace") {
      i += 2;
      continue;
    }
    if (
      tok.startsWith("--git-dir=") ||
      tok.startsWith("--work-tree=") ||
      tok.startsWith("--namespace=") ||
      tok === "-p" ||
      tok === "--paginate" ||
      tok === "-P" ||
      tok === "--no-pager" ||
      tok === "--bare" ||
      tok === "--no-replace-objects" ||
      tok === "--literal-pathspecs" ||
      tok === "--glob-pathspecs" ||
      tok === "--noglob-pathspecs" ||
      tok === "--icase-pathspecs"
    ) {
      i += 1;
      continue;
    }
    if (tok.startsWith("-")) {
      i += 1;
      continue;
    }
    break;
  }

  if (i >= tokens.length) return null;
  const subcommand = tokens[i].toLowerCase();
  const rest = tokens.slice(i + 1);

  if (subcommand === "push") {
    for (const arg of rest) {
      if (
        arg === "--force" ||
        arg === "--force-with-lease" ||
        arg.startsWith("--force-with-lease=") ||
        arg === "--force-if-includes" ||
        isShortFlagClusterWith(arg, ["f"])
      ) {
        return {
          category: "git-force-push",
          reason: `Git force push ("${arg}") is blocked to prevent overwriting remote history.`,
        };
      }
      if (arg === "--delete" || isShortFlagClusterWith(arg, ["d"])) {
        return {
          category: "git-irreversible",
          reason: `Deleting remote git refs via "git push ${arg}" is blocked.`,
        };
      }
      if (!arg.startsWith("-") && arg.startsWith("+")) {
        return {
          category: "git-force-push",
          reason: `Forced git refspec ("${arg}") is blocked to prevent overwriting remote history.`,
        };
      }
      if (!arg.startsWith("-") && arg.startsWith(":") && arg.length > 1) {
        return {
          category: "git-irreversible",
          reason: `Deleting remote git branch via refspec ("${arg}") is blocked.`,
        };
      }
    }
  }

  if (subcommand === "reset" && rest.includes("--hard")) {
    return {
      category: "git-irreversible",
      reason: '"git reset --hard" permanently discards uncommitted work and is blocked.',
    };
  }

  if (subcommand === "clean") {
    for (const arg of rest) {
      if (arg === "--force" || isShortFlagClusterWith(arg, ["f"])) {
        return {
          category: "git-irreversible",
          reason: '"git clean" with force flags permanently deletes untracked files and is blocked.',
        };
      }
    }
  }

  if (subcommand === "branch") {
    for (const arg of rest) {
      if (arg === "-D" || isShortFlagClusterWith(arg, ["D"])) {
        return {
          category: "git-irreversible",
          reason: '"git branch -D" force-deletes unmerged branches and is blocked (use lowercase -d for merged branches).',
        };
      }
    }
  }

  if (subcommand === "stash") {
    const action = rest.find((a) => !a.startsWith("-"))?.toLowerCase();
    if (action === "drop" || action === "clear") {
      return {
        category: "git-irreversible",
        reason: `"git stash ${action}" permanently discards stashed changes and is blocked.`,
      };
    }
  }

  if (subcommand === "checkout") {
    const nonFlags = rest.filter((a) => !a.startsWith("-") || a === "--");
    const hasDot = nonFlags.includes(".") || rest.includes(".");
    if (hasDot) {
      return {
        category: "git-irreversible",
        reason: '"git checkout ." / "git checkout -- ." discards all working tree modifications and is blocked.',
      };
    }
  }

  if (subcommand === "restore") {
    if (rest.includes(".")) {
      return {
        category: "git-irreversible",
        reason: '"git restore ." discards all working tree changes and is blocked.',
      };
    }
  }

  if (subcommand === "filter-branch" || subcommand === "filter-repo") {
    return {
      category: "git-irreversible",
      reason: `"git ${subcommand}" rewrites repository history and is blocked.`,
    };
  }

  if (subcommand === "reflog") {
    const action = rest.find((a) => !a.startsWith("-"))?.toLowerCase();
    if (action === "expire" || action === "delete") {
      return {
        category: "git-irreversible",
        reason: `"git reflog ${action}" permanently purges git recovery history and is blocked.`,
      };
    }
  }

  if (subcommand === "gc" && rest.some((a) => a === "--prune=now")) {
    return {
      category: "git-irreversible",
      reason: '"git gc --prune=now" permanently purges dangling recovery objects and is blocked.',
    };
  }

  if (subcommand === "update-ref" && rest.includes("-d")) {
    return {
      category: "git-irreversible",
      reason: '"git update-ref -d" deletes repository references and is blocked.',
    };
  }

  return null;
}

function checkCommandSensitiveAccess(command, segments) {
  // Environment variable secret dumps
  for (const seg of segments) {
    if (/\bprintenv\b/i.test(seg)) {
      return {
        category: "sensitive-env",
        reason: "Dumping environment variables via printenv is blocked.",
      };
    }
    if (/^\s*(?:\/\S+\/)?env\s*$/i.test(seg) || /(?:^|[;&|]\s*)env(?:\s*$|\s*[|>;])/i.test(seg)) {
      return {
        category: "sensitive-env",
        reason: "Dumping process environment via bare env is blocked.",
      };
    }
    if (/\b(?:Get-ChildItem|gci|ls|dir|Get-Item|gi)\s+env:/i.test(seg)) {
      return {
        category: "sensitive-env",
        reason: "Reading PowerShell Env: drive is blocked to protect secrets.",
      };
    }
    if (/\b(?:echo|printf|Write-Output|Write-Host)\b[^;\n]*(?:\$\{?[A-Z0-9_]*(?:SECRET|TOKEN|KEY|PASSWORD|PASS|AUTH|CRED)[A-Z0-9_]*\}?|%[A-Z0-9_]*(?:SECRET|TOKEN|KEY|PASSWORD|PASS|AUTH|CRED)[A-Z0-9_]*%)/i.test(seg)) {
      return {
        category: "sensitive-env",
        reason: "Printing secret environment variables to output is blocked.",
      };
    }
    if (/\$env:\w*(?:SECRET|TOKEN|KEY|PASSWORD|PASS|AUTH|CRED)\w*/i.test(seg)) {
      return {
        category: "sensitive-env",
        reason: "Accessing secret $env: variables is blocked.",
      };
    }

    // Extract tokens and check for sensitive file paths
    const tokens = tokenizeArgs(seg);
    // Allow `git check-ignore` or `git ignore` diagnostics safely
    const isGitCheckIgnore =
      tokens[0]?.toLowerCase() === "git" &&
      (tokens[1]?.toLowerCase() === "check-ignore" || tokens[1]?.toLowerCase() === "ignore");
    if (isGitCheckIgnore) {
      continue;
    }

    for (const rawTok of tokens) {
      const cleanedParts = [rawTok.replace(/^[<>]+/, "")];
      const eqIdx = rawTok.indexOf("=");
      if (eqIdx > 0 && eqIdx < rawTok.length - 1) {
        cleanedParts.push(rawTok.slice(eqIdx + 1));
      }
      for (const candidate of cleanedParts) {
        if (!candidate || candidate.startsWith("-")) {
          continue;
        }
        const hit = matchSensitivePath(candidate);
        if (hit) {
          return {
            category: "sensitive-file",
            reason: hit,
          };
        }
      }
    }
  }

  // Fallback check on redirection attached directly without whitespace (e.g. `<.env`)
  const redirMatches = command.match(/(?:^|\s)[<>]+([^\s;|&]+)/g) || [];
  for (const m of redirMatches) {
    const filePart = m.replace(/^\s*[<>]+/, "");
    const hit = matchSensitivePath(filePart);
    if (hit) {
      return {
        category: "sensitive-file",
        reason: hit,
      };
    }
  }

  return null;
}

function checkDestructiveSegment(seg, tokens) {
  // Unix rm with recursive/force flags
  const firstBin = tokens[0] ? path.posix.basename(tokens[0].replace(/\\/g, "/")).toLowerCase() : "";
  const secondBin = tokens[1] ? path.posix.basename(tokens[1].replace(/\\/g, "/")).toLowerCase() : "";
  const activeBin = (firstBin === "sudo" || firstBin === "env") ? secondBin : firstBin;
  const activeRest = (firstBin === "sudo" || firstBin === "env") ? tokens.slice(2) : tokens.slice(1);

  if (activeBin === "rm") {
    for (const arg of activeRest) {
      if (arg === "--recursive" || arg === "--force" || isShortFlagClusterWith(arg, ["r", "R", "f"])) {
        return {
          category: "destructive-fs",
          reason: `Destructive recursive/forced removal ("rm ${arg}") is blocked.`,
        };
      }
    }
  }

  if (activeBin === "find" && (/\s-delete\b/.test(seg) || /\s-exec(?:dir)?\s+(?:\/\S+\/)?rm\b/.test(seg))) {
    return {
      category: "destructive-fs",
      reason: 'Destructive "find" file deletion is blocked.',
    };
  }

  if (activeBin === "shred" || activeBin === "wipe" || activeBin === "srm") {
    return {
      category: "destructive-fs",
      reason: `Irreversible file wipe command ("${activeBin}") is blocked.`,
    };
  }

  // Windows / PowerShell recursive or forced removal
  if (
    /^(?:remove-item|ri|del|erase|rd|rmdir)$/i.test(activeBin) &&
    activeRest.some((arg) => /^(?:-recurse|-force|\/s|\/q|\/f)$/i.test(arg))
  ) {
    return {
      category: "destructive-fs",
      reason: `Destructive Windows/PowerShell deletion ("${activeBin}") is blocked.`,
    };
  }

  // Disk / OS / permission nukes
  if (/\b(?:mkfs(?:\.\w+)?|fdisk|parted|diskpart|Stop-Computer|Restart-Computer)\b/i.test(seg)) {
    return {
      category: "destructive-system",
      reason: "Disk partitioning, formatting, or system shutdown commands are blocked.",
    };
  }
  if (/\bdd\b.*\bof=/i.test(seg)) {
    return {
      category: "destructive-system",
      reason: 'Low-level block write ("dd ... of=") is blocked.',
    };
  }
  if (/\bformat\s+[a-z]:/i.test(seg) || /\bcipher\s+\/w\b/i.test(seg)) {
    return {
      category: "destructive-system",
      reason: "Drive format or secure-wipe commands are blocked.",
    };
  }
  if (/^(?:sudo\s+)?(?:shutdown|reboot|poweroff|halt)\b/i.test(seg)) {
    return {
      category: "destructive-system",
      reason: "System power-state commands are blocked.",
    };
  }
  if (/\bchmod\s+(?:-[a-zA-Z]*\s+)*0?777\b/.test(seg)) {
    return {
      category: "destructive-system",
      reason: 'World-writable "chmod 777" permission changes are blocked.',
    };
  }
  if (/\bicacls\b.*\/(?:reset|grant\s+everyone:f)/i.test(seg)) {
    return {
      category: "destructive-system",
      reason: "Destructive Windows ACL reset or Everyone:F grant is blocked.",
    };
  }

  // SQL / DB / ORM irreversible actions
  if (/\bDROP\s+(?:DATABASE|SCHEMA|TABLE)\b/i.test(seg)) {
    return {
      category: "irreversible-db",
      reason: "SQL DROP DATABASE/SCHEMA/TABLE statements are blocked.",
    };
  }
  if (/\bTRUNCATE\s+TABLE\b/i.test(seg)) {
    return {
      category: "irreversible-db",
      reason: "SQL TRUNCATE TABLE statements are blocked.",
    };
  }
  if (/\bDELETE\s+FROM\s+\S+\s*(?:;|$)/i.test(seg) && !/\bWHERE\b/i.test(seg)) {
    return {
      category: "irreversible-db",
      reason: "Unbounded SQL DELETE FROM without a WHERE clause is blocked.",
    };
  }
  if (
    /\bprisma\s+migrate\s+reset\b/i.test(seg) ||
    /\bprisma\s+db\s+push\b.*--force-reset/i.test(seg) ||
    /\bdrizzle-kit\s+drop\b/i.test(seg) ||
    /\bsupabase\s+db\s+reset\b/i.test(seg) ||
    /\bdropDatabase\s*\(/i.test(seg)
  ) {
    return {
      category: "irreversible-db",
      reason: "Irreversible database reset/drop commands are blocked.",
    };
  }

  // Cloud / Infrastructure destruction
  if (
    /\b(?:terraform|tofu|pulumi|cdk)\s+destroy\b/i.test(seg) ||
    /\b(?:serverless|sls)\s+remove\b/i.test(seg) ||
    /\bkubectl\s+delete\s+(?:namespace|ns|--all)\b/i.test(seg) ||
    /\bhelm\s+uninstall\b/i.test(seg) ||
    /\baws\s+s3\s+(?:rb|rm\b.*--recursive)\b/i.test(seg) ||
    /\baws\s+(?:ec2\s+terminate-instances|rds\s+delete-db-instance)\b/i.test(seg) ||
    /\bgcloud\s+(?:projects\s+delete|storage\s+rm\b.*-r)\b/i.test(seg) ||
    /\baz\s+group\s+delete\b/i.test(seg) ||
    /\b(?:fly\s+apps\s+destroy|heroku\s+apps:destroy|vercel\s+rm|gh\s+repo\s+delete|gh\s+release\s+delete)\b/i.test(seg)
  ) {
    return {
      category: "irreversible-cloud",
      reason: "Irreversible cloud, repository, or infrastructure deletion is blocked.",
    };
  }

  // Container & volume wipes
  if (
    /\bdocker\s+(?:system\s+prune|volume\s+(?:prune|rm)|rm\s+-f)\b/i.test(seg) ||
    /\bdocker(?:\s+|-)compose\s+down\b.*(?:-v\b|--volumes\b)/i.test(seg)
  ) {
    return {
      category: "irreversible-container",
      reason: "Destructive Docker container/volume prune or removal is blocked.",
    };
  }

  // Irreversible package publishing
  if (
    /\b(?:npm|pnpm|yarn|cargo)\s+(?:publish|unpublish)\b/i.test(seg) ||
    /\btwine\s+upload\b/i.test(seg) ||
    /\bgem\s+push\b/i.test(seg)
  ) {
    return {
      category: "irreversible-publish",
      reason: "Package registry publish/unpublish commands are blocked (run pack/dry-run locally and publish manually).",
    };
  }

  return null;
}

/**
 * Evaluates a normalized tool call against safe-guardrails policy rules.
 * @param {string} toolName
 * @param {Record<string, unknown>} toolArgs
 * @returns {{ allowed: boolean, category?: string, reason?: string }}
 */
export function evaluateToolCall(toolName, toolArgs = {}) {
  const lowerTool = String(toolName || "").toLowerCase();

  // 1. File read/write/edit/search tools
  if (FILE_INSPECT_TOOLS.has(lowerTool) || SEARCH_TOOLS.has(lowerTool)) {
    const includePatternKey = GLOB_TOOLS.has(lowerTool);
    const candidates = collectPathStrings(toolArgs, { includePatternKey });
    for (const candidate of candidates) {
      const hit = matchSensitivePath(candidate);
      if (hit) {
        return {
          allowed: false,
          category: "sensitive-file",
          reason: hit,
        };
      }
    }
    return { allowed: true };
  }

  // 2. Shell / command execution tools
  const command = extractCommandString(toolArgs);
  if (SHELL_TOOLS.has(lowerTool) || command) {
    if (!command) {
      return { allowed: true };
    }

    // Remote pipe-to-shell checks across the entire command before splitting on `|`
    if (/(?:curl|wget)\b[^|]*\|\s*(?:env\s+)?(?:sudo\s+)?(?:ba|z|da)?sh\b/i.test(command)) {
      return {
        allowed: false,
        category: "remote-exec",
        reason: "Piping remote downloads directly into a shell is blocked.",
      };
    }
    if (/(?:irm|iwr|Invoke-WebRequest|Invoke-RestMethod)\b[^|]*\|\s*(?:iex|Invoke-Expression)\b/i.test(command)) {
      return {
        allowed: false,
        category: "remote-exec",
        reason: "Piping remote PowerShell scripts directly into Invoke-Expression is blocked.",
      };
    }

    const segments = splitCommandSegments(command);

    const sensitiveHit = checkCommandSensitiveAccess(command, segments);
    if (sensitiveHit) {
      return { allowed: false, ...sensitiveHit };
    }

    for (const seg of segments) {
      const tokens = tokenizeArgs(seg);
      if (tokens.length === 0) continue;

      const gitHit = checkGitSegment(tokens);
      if (gitHit) {
        return { allowed: false, ...gitHit };
      }

      const destructiveHit = checkDestructiveSegment(seg, tokens);
      if (destructiveHit) {
        return { allowed: false, ...destructiveHit };
      }
    }

    return { allowed: true };
  }

  // 3. Fallback path scan for unknown tools carrying explicit path arguments
  const genericPaths = collectPathStrings(toolArgs, { includePatternKey: false });
  for (const candidate of genericPaths) {
    const hit = matchSensitivePath(candidate);
    if (hit) {
      return {
        allowed: false,
        category: "sensitive-file",
        reason: hit,
      };
    }
  }

  return { allowed: true };
}

function appendAuditLog(entry) {
  const logPath = process.env.SAFE_GUARDRAILS_LOG;
  if (!logPath) return;
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, `${JSON.stringify(entry)}\n`, "utf8");
  } catch {
    // Audit logging must never interfere with hook decisions
  }
}

function runCli() {
  const adapterFlag = parseAdapterFlag(process.argv.slice(2));
  const fallbackAdapter = adapterFlag === "auto" ? "antigravity" : adapterFlag;

  try {
    const rawStdin = fs.readFileSync(0, "utf8");
    if (!rawStdin || !rawStdin.trim()) {
      const result = {
        allowed: false,
        category: "fail-closed",
        reason: "Empty hook payload on stdin; failing closed.",
      };
      appendAuditLog({
        timestamp: new Date().toISOString(),
        adapter: fallbackAdapter,
        toolName: "",
        category: result.category,
        reason: result.reason,
      });
      process.stdout.write(`${JSON.stringify(formatOutput(fallbackAdapter, result))}\n`);
      return;
    }

    const payload = JSON.parse(rawStdin);
    const { adapter, toolName, toolArgs } = normalizeInput(payload, adapterFlag);
    const evaluation = evaluateToolCall(toolName, toolArgs);

    if (!evaluation.allowed) {
      appendAuditLog({
        timestamp: new Date().toISOString(),
        adapter,
        toolName,
        category: evaluation.category,
        reason: evaluation.reason,
      });
    }

    process.stdout.write(`${JSON.stringify(formatOutput(adapter, evaluation))}\n`);
  } catch (err) {
    const result = {
      allowed: false,
      category: "fail-closed",
      reason: `Invalid hook input or internal guardrails error (${err?.message || "unknown error"}); failing closed.`,
    };
    appendAuditLog({
      timestamp: new Date().toISOString(),
      adapter: fallbackAdapter,
      toolName: "",
      category: result.category,
      reason: result.reason,
    });
    process.stdout.write(`${JSON.stringify(formatOutput(fallbackAdapter, result))}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runCli();
}
