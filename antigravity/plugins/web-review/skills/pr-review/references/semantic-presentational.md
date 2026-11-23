# Semantic HTML, Vanilla Hygiene & Presentational Boundaries Rubric

## 1. Semantic HTML First (Zero Div-Soup)

| Interactive / Structural Intent | Required Native HTML | Flag as Anti-Pattern |
| :--- | :--- | :--- |
| In-page action / toggle / submit | `<button type="button\|submit">` | `<div @click>`, `<span onClick>`, `<a href="#">` |
| Navigation / route / external URL | `<a href>` / `<RouterLink>` inside `<nav><ul>` | Click handler calling `window.open` on `<div>` |
| External link in new tab | `<a target="_blank" rel="noopener noreferrer">` | Missing `rel="noopener noreferrer"` (tabnabbing risk) |
| Form field group | `<fieldset>` + `<legend>` | Unlinked `<div>` title above inputs |
| Tabular data | `<table>` + `<caption>` + `<th scope="col\|row">` | CSS Grid of `<div>` cells for tabular datasets |
| Section divider | `<hr>` | Empty `<div class="divider">` |
| Page / card structure | `<header>`, `<main>`, `<nav>`, `<section>`, `<aside>`, `<footer>` | Nested `<div>` wrappers everywhere |
| Status / error feedback | `<output aria-live="polite">` / `role="alert"` | Silent DOM text without live region when async |

## 2. "Dumb" Presentational Component Discipline
Flag any reusable UI/design-system component that violates data-down / events-up purity:
- Fetching data (`fetch`, `axios`, SDK calls) or subscribing to app stores (`Pinia`, `Vuex`, `Redux`, `Zustand`) inside a presentational component.
- Mutating props directly instead of emitting `update:*` / callback props.
- Hardcoding domain copy, routes, or business calculations inside UI primitives instead of accepting props/slots.
- Missing slots or attribute forwarding (`$attrs` / `...rest`) that forces consumers to fork the component for simple customization.

## 3. Vanilla & Lightweight Footprint
- Flag unnecessary third-party UI/CSS/icon dependencies added for simple problems (e.g., pulling an icon font or utility library for 2 SVGs or basic flex spacing).
- Flag `!important` overrides, global un-scoped CSS resets inside component stylesheets, `lang="scss"` inside vanilla CSS libraries, and duplicated style/helper logic that belongs in shared tokens/utilities.

## 4. `js-components` Specific Overlay (Apply When Reviewing `js-components`)
- Strictly Vue 3 Options API (`export default { name: "Js...", ... }`) — block `<script setup>` in `src/components/`.
- Strictly pure vanilla scoped CSS using `.js-*` classes and `--js-*` tokens from `src/styles/tokens.css`.
- Must preserve SSR safety (`window`/`document`/`ResizeObserver` guarded and cleaned up in `unmounted()`), optional `vue-router` fallback (`src/utils/router.js`), `JsIcon` + `#icon` slots, and zero legacy `EL*`/`el-*`/`fa-` tokens.
