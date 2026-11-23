# safe-guardrails (GitHub Copilot)

Always-on `preToolUse` safety hook for GitHub Copilot CLI and VS Code Copilot Agent mode.

- Handles both Copilot CLI stringified `toolArgs` and VS Code Copilot object payloads seamlessly.
- Blocks sensitive files and directories (`.secrets/`, `.secret/`, `.aws/`, `.gnupg/`, `.kube/`, `.ssh/` non-`.pub` files, `.env`, `.env.*`, SSH private keys, cloud/npm credentials) while allowing `.env.example`, `.env.sample`, `.env.template`, and `*.pub`.
- Blocks destructive filesystem/OS commands, remote pipe-to-shell scripts, irreversible DB/cloud/container/publish actions, and git force pushes.
