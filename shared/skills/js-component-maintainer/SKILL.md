---
name: js-component-maintainer
description: >-
  Maintains, fixes, refactors, and verifies @steelmasterj/js-components while preserving Vue 3
  Options API compatibility, dumb presentational boundaries, pure vanilla CSS, WCAG 2.1 AA
  accessibility, 320px responsiveness, and minimal bundle footprint. Use when fixing bugs,
  refactoring existing components, auditing bundle/package output, or preparing releases.
---

# `js-component-maintainer` Skill

Use this runbook whenever maintaining, fixing, refactoring, or auditing `@steelmasterj/js-components`. Read [references/maintenance-and-release.md](./references/maintenance-and-release.md) for bundle budgets, SemVer compatibility rules, and release checks.

## Core Maintenance Guardrails

1. **Preserve public contracts**: Never remove or break existing `props`, `emits`, slot names, `--js-*` CSS tokens, or `.js-*` class contracts in minor/patch changes.
2. **Prevent smart-component creep**: Reject additions that pull API fetching, store state, router hard-dependencies, or app-specific business logic into `src/components/`. Keep components strictly **dumb presentational**.
3. **Keep the footprint lightweight**: Never introduce CSS frameworks, Sass, icon fonts, or external runtime dependencies (`package.json` has zero runtime `dependencies`). Reuse `src/utils/*` (`uid`, `router`, `sanitize`, `search`, `icons`, `position`).

## Maintenance Workflows

### A. Bug Fix Workflow
1. Inspect the component in `src/components/`, its CSS tokens in `src/styles/tokens.css`, and existing tests in `tests/`.
2. Write or extend a Vitest test in `tests/` that reproduces the bug first.
3. Implement the minimal fix in Vue 3 Options API + vanilla scoped CSS.
4. Verify zero regressions across keyboard navigation, ARIA attributes, SSR safety (`mounted`/`unmounted` cleanup), and `320px` responsiveness.

### B. Refactoring & Hygiene Workflow
Audit and eliminate any regressions or legacy artifacts:
- Zero Vue 2 leftovers: `this._uid`, `this.$set`, `destroyed`, `beforeDestroy`, `$listeners`, `$children`, `::deep`.
- Zero Composition API `<script setup>` inside `src/components/`.
- Zero styling/icon bloat: `lang="scss"`, `!important`, Tailwind/Bootstrap classes, `fa-solid`/`fa-regular`, or legacy `EL*`/`el-*` prefixes.
- Zero hardcoded colors/timings where `--js-*` tokens apply.
- Zero duplicate helpers across components — consolidate shared pure logic into `src/utils/`.

### C. Package, Bundle & Tarball Verification
Before any tag or release (and after structural edits to `src/` or `package.json`):
1. Run `npm test` — confirm all Vitest suites pass with zero Vue runtime warnings.
2. Run `npm run build` — verify clean Vite ESM (`dist/js-components.js`), CJS (`dist/js-components.cjs`), and CSS (`dist/style.css`) output without bundle bloat.
3. Run `npm run pack:check` (`npm pack --dry-run`) — confirm the tarball ships **only** `package.json`, `README.md`, `LICENSE`, and `dist/*` (`playground/`, `tests/`, `docs/`, `.agents/`, `src/` stay excluded).
4. Stop before `npm publish` — report test results, bundle sizes, and tarball contents so the maintainer can publish intentionally.
