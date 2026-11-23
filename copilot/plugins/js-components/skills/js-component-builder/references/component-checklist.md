# Per-Component Verification Checklist

Complete every item before considering a `@steelmasterj/js-components` component done:

## 1. "Dumb" Presentational Purity
- [ ] All inputs arrive via `props` or slots; no `fetch`, API clients, or store (`Pinia`/`Vuex`) dependencies.
- [ ] User actions and state updates emit upward via explicit `emits` (`update:modelValue`, `change`, `select`, `click`, etc.).
- [ ] No prop mutations; array/object prop defaults use factory functions `() => []` / `() => ({})`.
- [ ] `data()` holds only ephemeral UI state (open/closed, hover/focus tracking, unique ID, scroll hints).

## 2. Vue 3 Options API & SSR Hygiene
- [ ] Component `name` starts with `Js` (e.g., `JsBadge`, `JsAccordion`).
- [ ] Uses Options API (`props`, `emits`, `data`, `computed`, `methods`, `mounted`, `unmounted`), never `<script setup>`.
- [ ] Uses Vue 3 `v-model` (`modelValue` + `update:modelValue`), never Vue 2 `value` / `input` or removed APIs (`_uid`, `$set`, `destroyed`, `beforeDestroy`, `$listeners`, `$children`, `::deep`).
- [ ] All `window`, `document`, and `ResizeObserver` access is SSR-guarded and cleaned up in `unmounted()`.
- [ ] Zero hard `vue-router` dependency (uses `src/utils/router.js` fallback when `$router` is absent).
- [ ] Form controls forward `$attrs` (`inheritAttrs: false` + `v-bind="$attrs"` on the native input/control).

## 3. Semantic HTML & WCAG 2.1 AA Accessibility
- [ ] Native semantic elements used (`<button type="button">`, `<a>`, `<nav>`, `<ol>`/`<ul>`, `<fieldset>`/`<legend>`, `<hr>`, `<table>`/`<caption>`/`<th scope>`, `<header>`/`<footer>`/`<section>`, `<output>`).
- [ ] Configurable `headingLevel` (`1`–`6`) where section/landmark headings exist.
- [ ] No `tabindex > 0`, and no redundant `tabindex="0"` on natively focusable elements.
- [ ] Visible `:focus-visible` indicator using `--js-focus-ring` and `--js-focus-offset`.
- [ ] Complete keyboard navigation (`Tab`, `Enter`/`Space`, `Escape` for overlays/popovers, `Arrow` + `Home`/`End` for composite tabs/listboxes).
- [ ] Form fields link `<label :for>` to `:id`, and expose visible error/hint text via `aria-invalid` + `aria-describedby` + `role="alert"`.
- [ ] External `target="_blank"` links include `rel="noopener noreferrer"`.
- [ ] Decorative icons have `aria-hidden="true"`; meaningful images carry descriptive `alt` text.
- [ ] Color contrast >= 4.5:1 for normal text and >= 3:1 for large text/UI components via `--js-*` tokens.

## 4. Pure Vanilla CSS & Responsiveness (320px+)
- [ ] Pure vanilla `<style scoped>` (no `lang="scss"`, no Tailwind/Bootstrap, no `!important`, no global resets).
- [ ] All custom CSS classes prefixed with `.js-`.
- [ ] Uses `JsIcon` (`src/components/Icon.vue`) and SVG-friendly `#icon` slots; zero FontAwesome dependencies.
- [ ] Zero horizontal overflow down to `320px` viewport width; touch targets use `--js-touch-min`.
- [ ] Respects `@media (prefers-reduced-motion: reduce)` via `--js-transition-*` tokens or explicit overrides.

## 5. Package Exports, Playground & Tests
- [ ] Exported in `src/index.js`, showcased in `playground/App.vue`, and documented in `README.md`.
- [ ] Covered by Vitest + `@vue/test-utils` tests with zero Vue warnings.
- [ ] `npm test` and `npm run build` pass cleanly.
