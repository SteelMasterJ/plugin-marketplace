# `@steelmasterj/plugin-marketplace`

Personal cross-environment plugin marketplace providing always-on safety guardrails, `@steelmasterj/js-components` engineering skills & agents, and accessibility/responsiveness-focused PR review workflows across **Antigravity**, **Claude Code**, and **GitHub Copilot** (CLI + VS Code).

---

## Included Plugins

| Plugin | Purpose | Components |
| :--- | :--- | :--- |
| **`safe-guardrails`** | Always-on `PreToolUse` / `preToolUse` safety hook that blocks reading `.env`/private keys/credentials, destructive commands, irreversible DB/cloud/publish operations, and git force pushes. | Zero-dep Node.js engine (`guardrails.mjs`) + native hooks for Antigravity, Claude Code, and Copilot |
| **`js-components`** | Guides building & maintaining `@steelmasterj/js-components` with Vue 3 Options API, pure vanilla CSS (`--js-*` / `.js-*`), semantic HTML, dumb presentational boundaries, WCAG 2.1 AA accessibility, and `320px` responsiveness. | Skills: `js-component-builder`, `js-component-maintainer` • Agents: `js-component-architect`, `js-component-maintainer` |
| **`web-review`** | Framework-agnostic PR & full-site review workflows usable on `js-components` and any web app or website build, prioritizing WCAG 2.1 AA, responsiveness, semantic HTML, and lightweight/presentational hygiene. | Skills: `pr-review`, `a11y-semantic-audit` • Agent: `frontend-pr-reviewer` (read-only) |

---

## Repository Architecture

Shared logic lives once under `shared/` and is synchronized into native per-environment plugins (`antigravity/`, `claude/`, `copilot/`) so each environment receives clean, valid manifests without schema conflicts and every installed plugin remains completely self-contained.

```text
plugin-marketplace/
├── marketplace.json                  # Multi-environment catalog index
├── antigravity/plugins.json          # Antigravity local plugins registry
├── .claude-plugin/marketplace.json   # Claude Code marketplace catalog
├── .github/plugin/marketplace.json   # GitHub Copilot marketplace catalog
├── shared/
│   ├── guardrails/guardrails.mjs     # Single zero-dep Node hook engine
│   └── skills/                       # Canonical skills & references
├── antigravity/                      # Antigravity plugins + plugins.json
├── claude/                           # Claude Code plugins + settings example
├── copilot/                          # Copilot plugins + standalone hook config
├── scripts/
│   ├── sync-plugins.mjs              # Sync shared/ -> all 3 environments
│   └── install.mjs                   # Cross-env project/user installer
└── tests/                            # node:test suites for guardrails & manifests
```

---

## Installation Options

### Option A — Native Marketplace / Plugin Commands

#### Antigravity (`agy`)
Validate or install each plugin directory locally (Antigravity uses `antigravity/plugins.json` or local directory installs for repo-based plugins, whereas Antigravity's remote `marketplace.json` catalog format targets hosted `.zip` + `sha256` releases):
```bash
agy plugin validate --strict ./antigravity/plugins/safe-guardrails
agy plugin validate --strict ./antigravity/plugins/js-components
agy plugin validate --strict ./antigravity/plugins/web-review

agy plugin install ./antigravity/plugins/safe-guardrails
agy plugin install ./antigravity/plugins/js-components
agy plugin install ./antigravity/plugins/web-review
```
Or reference `antigravity/plugins.json` from `~/.gemini/config/plugins.json` or `.agents/plugins.json`.

#### Claude Code
Register the marketplace and install plugins globally or per project:
```text
/plugin marketplace add SteelMasterJ/plugin-marketplace
/plugin install safe-guardrails@steelmasterj-marketplace
/plugin install js-components@steelmasterj-marketplace
/plugin install web-review@steelmasterj-marketplace
```
Or merge `claude/settings.hooks.example.json` into `~/.claude/settings.json` for always-on guardrails.

#### GitHub Copilot (CLI & VS Code)
```bash
copilot plugin marketplace add SteelMasterJ/plugin-marketplace
copilot plugin install safe-guardrails@steelmasterj-marketplace
copilot plugin install js-components@steelmasterj-marketplace
copilot plugin install web-review@steelmasterj-marketplace
```
For standalone repository hooks without plugin installation, copy `copilot/standalone/.github/hooks/safe-guardrails.json` and `shared/guardrails/guardrails.mjs` into `<repo>/.github/hooks/`.

---

### Option B — Cross-Environment Installer Script (`scripts/install.mjs`)

Install into any project repository (e.g., `../js-components`) or user home profile:

```bash
# Install all 3 plugins into js-components for Antigravity, Claude, and Copilot
node scripts/install.mjs --env all --scope project --target ../js-components

# Install safe-guardrails globally (user scope) for all 3 environments
node scripts/install.mjs --env all --scope user --plugins safe-guardrails

# Install only web-review for Copilot in a website repository
node scripts/install.mjs --env copilot --scope project --target ../2025-portfolio --plugins web-review

# Preview changes without writing
node scripts/install.mjs --env all --scope project --target ../js-components --dry-run
```

---

## `safe-guardrails` Coverage Summary

`guardrails.mjs` runs via `PreToolUse` / `preToolUse` on every tool invocation across all three runtimes:

1. **Sensitive Files, Directories & Env Dumps**:
   - **Blocked**: Any file inside `.secrets/`, `.secret/`, `.aws/`, `.gnupg/`, `.kube/`, or `.ssh/` (excluding `*.pub` public keys), as well as `.env`, `.env.*`, `.envrc`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa`, `id_ed25519`, `.npmrc`, `.docker/config.json`, `credentials.json`, `*service-account*.json`, `terraform.tfvars`, `terraform.tfstate*`, `secrets.*`, plus `printenv`, bare `env`, PowerShell `Env:` dumps, and secret variable prints (`echo $API_SECRET`).
   - **Explicitly Allowed**: `.env.example`, `.env.sample`, `.env.template`, `.env.dist`, `.env.schema`, `.env.defaults` (outside strict sensitive directories), `*.pub`, `.gitignore`, normal source folders like `src/secrets/`, and `NODE_ENV=test npm test`.
2. **Git Force Pushes & Irreversible History Ops**:
   - **Blocked**: `git push --force`, `-f`, `--force-with-lease`, `-uf`, forced refspecs (`+main`), remote deletions (`git push origin --delete`, `:branch`), `git reset --hard`, `git clean -f/-fd/-xdf`, `git branch -D`, `git stash drop/clear`, `git checkout -- .`, `git restore .`, `git filter-branch`, `git filter-repo`, `git reflog expire`, `git gc --prune=now`.
   - **Allowed**: `git push origin feature`, `git branch -d merged`, `git restore src/file.js`, `git status`, `git diff`.
3. **Destructive & Irreversible Commands**:
   - **Blocked**: `rm -rf` / `rm -r` / `rm -f`, `Remove-Item -Recurse -Force`, `rmdir /s /q`, `del /f /s`, `find ... -delete`, `mkfs`/`dd ... of=`/`format`, `chmod 777`, remote pipe-to-shell (`curl ... | sh`, `irm ... | iex`), `DROP TABLE`/`DROP DATABASE`/`TRUNCATE TABLE`/`prisma migrate reset`, `terraform destroy`/`kubectl delete ns`/`gh repo delete`, `docker system prune`/`docker compose down -v`, and `npm publish`/`npm unpublish`.
   - **Allowed**: `npm test`, `npm run build`, `npm run pack:check`, `npm pack --dry-run`.
4. **Fail-Closed & Optional Audit Log**:
   - Malformed or empty JSON input fails closed (`deny`).
   - Set `SAFE_GUARDRAILS_LOG=/path/to/guardrails.jsonl` to record denied calls.

---

## Development & Verification

```bash
# Sync shared/ files into antigravity/, claude/, and copilot/
npm run sync

# Verify zero drift between shared/ and platform plugins
npm run sync:check

# Run full unit, subprocess adapter, manifest, and installer test suite
npm test
```
