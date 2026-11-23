# Maintenance, Bundle Budgets & Release Checklist

## 1. SemVer Compatibility Rules

- **Patch (`0.1.x`)**: Bug fixes, WCAG contrast/ARIA fixes, CSS overflow fixes, internal helper refactoring with identical public API (`props`, `emits`, slots, `--js-*` tokens, `src/index.js` exports).
- **Minor (`0.x.0`)**: New `Js*` components, new optional props with backward-compatible defaults, new slots, new `--js-*` tokens, new built-in `JsIcon` names.
- **Major (`x.0.0`)**: Renamed/removed props or events, changed `v-model` payload shape, removed CSS tokens or exported components, peer dependency major bumps.

## 2. Lightweight Footprint & Hygiene Audit

Check `src/` before wrapping up maintenance work:

1. **Zero legacy tokens**: No `EL*`, `el-*`, `fa-`, `lang="scss"`, `!important`, `this._uid`, `this.$set`, `destroyed(`, `::deep`.
2. **Dependencies**: `dependencies` must stay empty in `package.json`; `vue` (`^3.3.0`) and optional `vue-router` (`^4.0.0`) remain `peerDependencies`.
3. **Bundle size awareness**: Compare `npm run build` output (`dist/js-components.js`, `dist/js-components.cjs`, `dist/style.css`) against the baseline (`~169 kB` ESM / `~32 kB` gzip, `~131 kB` CJS / `~28 kB` gzip, `~76 kB` CSS / `~10 kB` gzip) and explain any unexpected growth.

## 3. Consumer Import & Tarball Checklist

- [ ] `npm test` passes (all unit tests + `tests/package.test.js` ESM/CJS/CSS checks).
- [ ] `npm run build` succeeds with zero Vite warnings.
- [ ] `npm run pack:check` (`npm pack --dry-run`) lists **only**:
  - `package.json`
  - `README.md`
  - `LICENSE`
  - `dist/js-components.js`
  - `dist/js-components.cjs`
  - `dist/style.css`
- [ ] `playground/`, `tests/`, `docs/`, `.agents/`, and `src/` are **excluded** from the tarball.
- [ ] Manual publish (`npm publish --access public`) is left to the user (never run publish commands automatically).
