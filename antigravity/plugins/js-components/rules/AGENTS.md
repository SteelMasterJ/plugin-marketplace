# `@steelmasterj/js-components` Engineering Rules

When working inside `@steelmasterj/js-components`:

1. Keep every component strictly **dumb presentational**: accept data via `props`, emit interactions via explicit `emits`, expose slots (`#icon`, `#action`, `#header`, `#footer`), and never put API calls, store access, or business logic inside `src/components/`.
2. Use **Vue 3 Options API** only (`name: "Js..."`, explicit `emits`, Vue 3 `v-model` via `modelValue` / `update:modelValue`, factory defaults for objects/arrays, SSR-guarded `mounted()`/`unmounted()` cleanup). Never use `<script setup>` or Vue 2 removed APIs (`_uid`, `$set`, `destroyed`, `::deep`).
3. Write **semantic HTML first** (`<button type="button">`, `<nav>` + `<ol>`/`<ul>`, `<fieldset>`/`<legend>`, `<table>`/`<caption>`/`<th scope>`, `<output aria-live="polite">`, `role="alert"`, configurable `headingLevel`) and ensure full **WCAG 2.1 AA** keyboard operability (`Tab`, `Enter`/`Space`, `Escape`, Arrows/Home/End, visible `:focus-visible`).
4. Style exclusively with **pure vanilla `<style scoped>`** using `--js-*` tokens from `src/styles/tokens.css` and `.js-*` class prefixes. Zero Sass, Bootstrap, Tailwind, FontAwesome, `!important`, or global CSS resets.
5. Keep layouts **responsive down to 320px** without horizontal overflow, honor `@media (prefers-reduced-motion: reduce)`, and support `--js-touch-min` coarse-pointer targets.
6. Keep `vue-router` optional via `src/utils/router.js`, forward `$attrs` (`inheritAttrs: false`) on primary form controls, and verify every change with `npm test` and `npm run build`.
