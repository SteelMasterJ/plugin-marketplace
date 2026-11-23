# safe-guardrails (Claude Code)

Always-on `PreToolUse` safety hook for Claude Code.

- Intercepts `Read`, `Edit`, `Write`, `Grep`, `Glob`, `Bash`, and MCP tool calls via `${CLAUDE_PLUGIN_ROOT}/scripts/guardrails.mjs --adapter claude`.
- Blocks `.secrets/`, `.secret/`, `.aws/`, `.gnupg/`, `.kube/`, `.ssh/` non-`.pub` files, `.env` files (while allowing `.env.example`, `.env.sample`, `.env.template` outside strict secret directories), private keys, cloud credentials, destructive filesystem/OS commands, remote pipe-to-shell, irreversible DB/cloud/container/publish commands, and git force pushes or history wipes.
