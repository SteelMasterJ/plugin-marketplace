# Safe Guardrails Policy

1. Never read, print, list, or exfiltrate `.env` files, `.secrets/` or `.secret/` folders (or any files inside them), private SSH keys (`id_rsa`, `id_ed25519`, `*.pem`, `*.key`, `.ssh/` non-`.pub` files), `.aws/`, `.gnupg/`, `.kube/` credentials, or secret configuration files. Inspect `.env.example` or `.env.template` instead.
2. Never execute destructive recursive deletes (`rm -rf`, `Remove-Item -Recurse -Force`), disk/system wipes, or remote pipe-to-shell scripts (`curl ... | sh`, `irm ... | iex`).
3. Never force-push (`git push --force`, `git push -f`, `git push --force-with-lease`), rewrite shared git history, or run irreversible database/cloud/publish commands (`DROP TABLE`, `terraform destroy`, `npm publish`).
4. When a `safe-guardrails` hook denies a tool call, explain the risk to the user and choose a safe, reversible alternative.
