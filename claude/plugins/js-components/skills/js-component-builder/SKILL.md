---
name: js-component-builder
description: >-
  Builds new Vue 3 Options API components for @steelmasterj/js-components that are lightweight,
  vanilla-CSS styled, semantic-HTML-first, dumb presentational, WCAG 2.1 AA accessible, and
  responsive down to 320px. Use when creating a new component in src/components/ or extending
  the library's component catalog.
---

# `js-component-builder` Skill

Use this runbook whenever building a new component for `@steelmasterj/js-components`. Every component MUST be lightweight, vanilla, semantic-HTML-first, strictly **dumb presentational**, WCAG 2.1 AA accessible, responsive down to 320px, and dependency-free.

Before writing code, read [references/architecture.md](./references/architecture.md) for the exact project tokens, utilities, and export conventions, and verify every item in [references/component-checklist.md](./references/component-checklist.md) before marking the component complete.

## Step 1: Enforce the "Dumb" Presentational Boundary

Design the component as a pure presentation primitive:

1. **Data-down, events-up**:
   - Accept all domain data and configuration via explicit `props`.
   - Emit user interactions and state requests via explicit `emits` (`update:modelValue`, `change`, `select`, `click`, `open`, `close`, etc.).
   - Expose flexible slots (`default`, `#icon`, `#action`, `#header`, `#footer`) so host applications own custom markup and SVGs.
2. **Zero smart/business coupling**:
   - **Never** perform `fetch`/API calls, routing mutations, or Pinia/Vuex store reads inside a component.
   - **Never** encode domain-specific business rules or brand strings.
   - **Never** mutate incoming props (clone or emit `update:*` instead).
   - Keep `data()` limited to minimal ephemeral UI state (e.g., `isOpen`, `activeIndex`, `uid`, `placement`, `isScrollable`).

## Step 2: Design Semantic HTML & WAI-ARIA First

Choose native HTML elements before adding ARIA attributes:

- Interactive triggers and actions: `<button type="button">` (never `<div @click>` or `<a href="#">`).
- Internal & external navigation: `<nav>` + `<ol>`/`<ul>` + `<a href>` or optional `<RouterLink>` via `src/utils/router.js`. External `linkExt` items always use `target="_blank"` with `rel="noopener noreferrer"` and render the `"external"` icon unless `actionIcon: false`.
- Option groups: `<fieldset>` + `<legend>` for checkboxes and radio buttons.
- Tabular data: `<table>`, `<caption>`, `<thead>`, `<tbody>`, `<th scope="col|row">`.
- Structural chrome: `<header>`, `<footer>`, `<section>`, `<article>`, `<aside>`, `<hr>` dividers.
- Dynamic announcements: `<output aria-live="polite">` for counts/filter status; `role="alert"` for visible validation errors linked via `aria-describedby` and `aria-invalid`.
- Configurable heading levels: accept `headingLevel` (`1`–`6`) on landmark containers (`JsPanel`, `JsTitleBar`, `JsModal`) so components fit any host document outline.
- Custom widgets (only when native HTML cannot achieve the pattern, such as `JsTabs`, `JsModal`, `JsDrop`, or `JsInput type="select"`): implement the complete WAI-ARIA Authoring Practices keyboard model (`Tab`, `Enter`/`Space`, `Escape`, `Arrow` keys, `Home`/`End`, roving `tabindex`, focus trap + focus restore on modals).

## Step 3: Implement with Vue 3 Options API & Pure Vanilla CSS

1. **Vue 3 Options API only**:
   - Use `export default { name: "Js...", inheritAttrs, props, emits, data, computed, watch, methods, mounted, unmounted }` — never `<script setup>` or Composition API in `src/components/`.
   - Use Vue 3 `v-model` (`modelValue` + `update:modelValue`).
   - Use factory functions (`() => []`, `() => ({})`) for all array/object prop defaults.
   - Use `createUid()` from `src/utils/uid.js` for deterministic IDs.
   - Forward native HTML attributes via `inheritAttrs: false` + `v-bind="$attrs"` on primary form controls.
   - Guard every `window`, `document`, and `ResizeObserver` access for SSR/Nuxt safety, attach listeners in `mounted()`, and clean up every listener/observer in `unmounted()`.
2. **Pure vanilla scoped CSS**:
   - Use `<style scoped>` with standard CSS only — **zero** Sass (`lang="scss"`), **zero** Tailwind/Bootstrap classes, **zero** `!important`, **zero** global resets.
   - Prefix all classes with `.js-` (BEM-style `.js-block__element--modifier`).
   - Consume `--js-*` custom properties from `src/styles/tokens.css` so host apps can theme via CSS variables while preserving >= 4.5:1 WCAG AA contrast.
   - Use `JsIcon` (`src/components/Icon.vue`) for built-in chrome SVGs and provide `#icon` slots for host raw `<svg>` elements (never FontAwesome).

## Step 4: Harden Responsiveness & Accessibility

- Use fluid sizing (`width: min(100%, ...)`, `flex-wrap: wrap`, `grid-template-columns: repeat(auto-fit, minmax(...))`) and avoid fixed `min-width` values that force horizontal scroll at `320px`.
- Wrap wide tables or scroll areas in keyboard-focusable containers (`tabindex="0"`, `role="region"`, `aria-label`) with visible `:focus-visible` outlines (`outline: var(--js-focus-ring); outline-offset: var(--js-focus-offset)`).
- Enforce touch target minimums (`min-height: var(--js-touch-min)`) and wrap transitions with `@media (prefers-reduced-motion: reduce)` or `--js-transition-*` tokens.
- Never rely on hover-only tooltips for validation errors or critical text.
- Position floating menus/dropdowns with `computeDropdownPlacement()` from `src/utils/position.js` so popovers flip cleanly near viewport edges.

## Step 5: Export, Showcase, Test, and Verify

1. Export the new component (named export + global `install` map) in `src/index.js`.
2. Add an interactive showcase section in `playground/App.vue`.
3. Document props, events, and slots in `README.md`.
4. Add unit/integration tests using Vitest + `@vue/test-utils` under `tests/` verifying:
   - Default rendering & semantic HTML tags
   - Props, slots, `$attrs` forwarding, and Vue 3 `v-model` / emitted payloads
   - Keyboard interactions (`Escape`, `Enter`/`Space`, arrows) and ARIA linkage (`aria-describedby`, `aria-invalid`, `aria-expanded`)
   - SSR-safe mount/unmount with **zero Vue console warnings**.
5. Run verification commands (`npm test`, `npm run build`, and `npm run pack:check` if packaging files changed) and confirm passing output with clean bundle deltas.
