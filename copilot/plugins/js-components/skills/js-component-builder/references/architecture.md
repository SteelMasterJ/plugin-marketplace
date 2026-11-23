# `@steelmasterj/js-components` Architecture Reference

This reference captures the exact conventions of `@steelmasterj/js-components`.

## 1. File & Export Conventions

- **Component source**: `src/components/<ComponentName>.vue` (PascalCase without `Js` or legacy `EL` prefix, e.g., `src/components/Input.vue`, `src/components/Modal.vue`).
- **Sub-primitives**: Grouped under `src/components/<Parent>/<Part>.vue` (e.g., `src/components/NavItem/NavItemIcon.vue`).
- **Public export & `name`**: `Js` prefix everywhere (`JsInput`, `JsModal`, `JsPanel`, etc.), registered in `src/index.js` as both named exports and `default.install(app)`.
- **Build outputs (`vite.config.js`)**:
  - ESM: `dist/js-components.js`
  - CJS: `dist/js-components.cjs`
  - CSS: `dist/style.css` (`cssCodeSplit: false`, exported as `@steelmasterj/js-components/style.css`)
  - Peer dependencies: `vue` (`^3.3.0`, external) and optional `vue-router` (`^4.0.0`, external).

## 2. Shared Utilities (`src/utils/`)

Always reuse existing utilities instead of duplicating helpers:

- `src/utils/uid.js`: `createUid(prefix)` — deterministic SSR/client-safe ID generation.
- `src/utils/router.js`: `hasRouter(vm)`, `resolveLinkTag(vm, opts)` — renders `<router-link>` only when `vue-router` is installed, falling back cleanly to `<a>` or `<button>`.
- `src/utils/sanitize.js`: `escapeHtml(str)`, `isSafeUrl(url)` — XSS-safe inline formatting and URL scheme filtering (rejects `javascript:`, unsafe `data:`).
- `src/utils/search.js`: `findInObject(item, query, props)`, `pluralize(count, word)` — case-insensitive nested property search and badge labels.
- `src/utils/icons.js`: `BUILTIN_ICONS`, `getBuiltinIconPath(name)` — minimal stroke/fill SVG paths consumed by `JsIcon`.
- `src/utils/position.js`: `computeDropdownPlacement(triggerEl, menuEl, preferred)` — viewport-aware flip (`top`/`bottom`, `left`/`right`).

## 3. Design Tokens (`src/styles/tokens.css` & `src/styles/base.css`)

Consume CSS custom properties instead of hardcoded colors/radii/timings:

- **Brand & Surfaces**: `--js-color-primary`, `--js-color-primary-hover`, `--js-color-primary-soft`, `--js-color-primary-text`, `--js-color-surface`, `--js-color-surface-alt`, `--js-color-surface-hover`, `--js-color-surface-dark`, `--js-color-surface-dark-hover`
- **Text & Borders**: `--js-color-text`, `--js-color-text-muted`, `--js-color-text-inverse`, `--js-color-text-inverse-muted`, `--js-color-border`, `--js-color-border-strong`, `--js-color-divider`, `--js-color-divider-dark`
- **Semantic Accents**: `--js-color-success`, `--js-color-warning`, `--js-color-warning-text`, `--js-color-orange`, `--js-color-danger`, `--js-color-purple`, `--js-color-disabled-bg`, `--js-color-disabled-text`
- **Focus Ring**: `--js-color-focus`, `--js-focus-ring`, `--js-focus-offset`
- **Spacing, Radii, Elevation, Z-Index, Motion, Touch**:
  - `--js-space-1` through `--js-space-6`
  - `--js-radius-sm`, `--js-radius-md`, `--js-radius-lg`, `--js-radius-pill`
  - `--js-shadow-sm`, `--js-shadow-md`, `--js-shadow-lg`
  - `--js-z-sticky`, `--js-z-dropdown`, `--js-z-tooltip`, `--js-z-modal`
  - `--js-transition-fast`, `--js-transition-base` (auto-zeroed under `@media (prefers-reduced-motion: reduce)`)
  - `--js-touch-min` (`2.25rem`, expands to `2.75rem` on `@media (pointer: coarse)`)
- **Base Utility Classes (`src/styles/base.css`)**: `.js-sr-only`, `.js-icon`, `.js-tag` (`--bl`, `--db`, `--lb`, `--lt`, `--wh`, `--dk`, `--yw`, `--or`, `--pu`, `--gn`, `--rd`).

## 4. Cross-Cutting Behavioral Conventions

- **`linkExt` convention**: External links use `linkExt` (auto `target="_blank"` + `rel="noopener noreferrer"` + `"external"` icon unless `actionIcon: false`).
- **Dark theme support**: Expose `theme="dark"` (or `dark` boolean matching sibling components) using `--js-color-surface-dark` and `--js-color-text-inverse`.
- **Axe-clean menus & lists**: Keep `role="menu"` strictly for homogeneous menu items (`role="menuitem"`); omit `role="menu"` when mixed widgets (like split buttons or custom dynamic components) appear.
