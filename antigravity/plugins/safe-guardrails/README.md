# safe-guardrails (Antigravity)

Always-on `PreToolUse` safety hook for Antigravity CLI, IDE, and App.

- Blocks reading/editing/listing/searching sensitive files and directories (`.secrets/`, `.secret/`, `.aws/`, `.gnupg/`, `.kube/`, `.ssh/` non-`.pub` files, `.env`, `.env.*`, keys, cloud/npm credentials) while allowing `.env.example`, `.env.sample`, `.env.template`, and `*.pub`.
- Blocks destructive filesystem/OS commands, remote pipe-to-shell commands, irreversible DB/cloud/container/publish commands, and git force pushes or history wipes.
- Runs via `node ./scripts/guardrails.mjs --adapter antigravity` (zero external dependencies).
