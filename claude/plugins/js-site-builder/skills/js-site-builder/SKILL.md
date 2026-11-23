---
name: js-site-builder
description: >-
  Builds complete, modern, WCAG 2.1 AA accessible, responsive (320px+) websites from scratch
  using @steelmasterj/js-components, Vue 3 Composition API (<script setup>), Vite, vue-router,
  and semantic vanilla HTML/CSS with minimal dependencies. Stops to ask the user before
  creating missing UI primitives in the component library vs. site-local components.
---

# `js-site-builder` Skill

Use this runbook whenever designing or building a website or web application powered by `@steelmasterj/js-components`. Every site built with this skill MUST maximize reuse of `@steelmasterj/js-components`, use **Vue 3 Composition API (`<script setup>`)**, **Vite**, **vue-router**, **semantic HTML**, and **pure vanilla CSS**, stay **accessible (WCAG 2.1 AA)** and **responsive down to 320px**, include **automated Vitest tests**, and keep **third-party dependencies minimal**.

Before writing code, read:
- [references/component-catalog.md](./references/component-catalog.md) for the exact catalog of all 24 `@steelmasterj/js-components` components, `toast` helper, built-in `JsIcon` names, and `--js-*` design tokens.
- [references/site-architecture.md](./references/site-architecture.md) for the recommended Vite + Vue 3 + `vue-router` + Vitest project structure, accessible routing pattern, and theming setup.

---

## Step 1: Scope, Architecture & Component Gap Audit (Mandatory Gate)

Before scaffolding or implementing pages, map the site's information architecture (routes, sections, interactive flows) directly against the `@steelmasterj/js-components` catalog:

1. **Map every UI requirement to existing `Js*` components first**:
   - Page headers & breadcrumbs -> `JsTitleBar`
   - Cards, hero blocks, feature panels, scrollable containers -> `JsPanel`
   - Primary/secondary navigation, menus, split CTAs, dropdowns -> `JsNavItem`, `JsPanelNavItem`, `JsBtnSplit`, `JsNavList`, `JsDrop`
   - Searchable / groupable directories, catalogs, resource grids -> `JsPanelNav`
   - Tabbed content sections -> `JsTabs`
   - Dialogs, drawers-as-modals, confirmations -> `JsModal`
   - Data tables -> `JsTable`
   - Forms, contact/signup flows, multi-step wizards -> `JsForm`, `JsInput`, `JsInputCheckbox`, `JsInputRadio`
   - Inline banners & transient notifications -> `JsAlert`, `JsToast` + `toast` helper
   - Inline icons & safe formatted text/tags -> `JsIcon`, `JsMarkdown`
2. **STOP & ASK on Component Gaps**:
   - If a feature requires a **reusable UI primitive** that `@steelmasterj/js-components` does **not** currently provide (for example: accordion/disclosure list, pagination, carousel/slider, off-canvas drawer, stepper/timeline, progress bar, skeleton loader, tooltip popover, chip/tag input, date/range picker) and cannot be cleanly composed from existing `Js*` components:
   - **STOP before implementing a workaround or ad-hoc primitive.** Present a concise **Component Gap Proposal** to the user:
     - **Missing primitive**: Proposed library name (e.g., `JsAccordion`, `JsPagination`) and where the site needs it.
     - **Why existing `Js*` components don't fit**: Brief gap explanation.
     - **Proposed API sketch**: Key `props`, `emits`, and `slots` (strictly dumb presentational).
     - **Ask the user to choose**:
       1. **Build it in `@steelmasterj/js-components`** first (using Vue 3 Options API, pure vanilla scoped CSS, `--js-*` tokens, and `js-component-builder` standards), then consume it in the website; OR
       2. **Build a lightweight site-local component** inside the website repo (`src/components/`) using Vue 3 Composition API (`<script setup>`), semantic HTML, and `--js-*` tokens.
   - Do **not** silently invent a shadow component library inside the website repo.
3. **Keep library vs. app boundaries crystal clear**:
   - **Website app code** (views, layouts, composables, site-local components): **Vue 3 Composition API (`<script setup>`)**.
   - **New components added to `@steelmasterj/js-components`**: **Vue 3 Options API** + strict dumb presentational rules (follow `js-component-builder` / `js-component-architect`).

---

## Step 2: Scaffold with Minimal Dependencies

Keep the dependency footprint tiny and transparent:

1. **Core runtime dependencies** (default stack):
   - `vue` (`^3.5.0`)
   - `vue-router` (`^4.4.0`)
   - `@steelmasterj/js-components` (from npm or local sibling path `../js-components` during local development)
2. **Core dev dependencies**:
   - `vite`, `@vitejs/plugin-vue`, `vitest`, `@vue/test-utils`, `jsdom`
3. **Zero bloat policy**:
   - **No** Tailwind, Bootstrap, Bulma, Sass/SCSS, or CSS-in-JS.
   - **No** icon font packages (FontAwesome, Material Icons, etc.) — use `JsIcon` built-ins and clean inline `<svg>` in `#icon` slots.
   - **No** Axios or heavy HTTP wrappers — use native `fetch`.
   - **No** Pinia/Vuex unless cross-route state genuinely warrants it — start with lightweight Vue 3 composables (`src/composables/use*.js`).
   - If a third-party package is genuinely needed (e.g., Markdown-to-HTML for a full blog, charts), ask/justify it before installing.
4. **Mount `@steelmasterj/js-components` cleanly**:
   - Import `@steelmasterj/js-components/style.css` once in `src/main.js`, followed immediately by your site's `src/styles/theme.css` and `src/styles/base.css`.
   - Prefer **tree-shakeable named imports** (`import { JsPanel, JsTitleBar } from "@steelmasterj/js-components"`) in `<script setup>` files.
   - Mount `<JsToast />` once in the root layout (`App.vue`) so any view can trigger `toast.success(...)` / `toast.danger(...)`.

---

## Step 3: Design System, Modern Layout & Semantic Vanilla CSS

Build a cohesive, modern, clean visual design on top of `--js-*` design tokens:

1. **Theme via `--js-*` CSS custom properties** in `src/styles/theme.css`:
   - Override `--js-color-primary`, `--js-color-primary-hover`, `--js-color-surface`, `--js-color-text`, `--js-font-family`, `--js-radius-*`, and `--js-space-*` to match the brand while **guaranteeing >= 4.5:1 WCAG AA contrast** (3:1 for large text and UI borders).
   - Define site-level semantic tokens (e.g., `--site-max-width: 72rem`, `--site-gutter: clamp(1rem, 3vw, 2rem)`, `--site-section-gap: clamp(2.5rem, 6vw, 5rem)`) alongside `--js-*` tokens.
2. **Write semantic vanilla CSS**:
   - Use `<style scoped>` for view and component styles, and small modular stylesheets (`theme.css`, `base.css`, `layout.css`) for shared layout primitives.
   - Name classes semantically by purpose (`.site-header`, `.hero`, `.feature-grid`, `.pricing-card`, `.site-footer`) — never utility-class soup and **never `!important`**.
   - Use modern native CSS: CSS Grid (`repeat(auto-fit, minmax(min(100%, 18rem), 1fr))`), Flexbox with `gap`, fluid typography (`clamp()`), logical properties (`padding-inline`, `margin-block`), `:focus-visible`, and `@media (prefers-reduced-motion: reduce)`.
3. **Responsive down to `320px`**:
   - Zero horizontal overflow at `320px`, `375px`, `768px`, `1024px`, and `1440px`.
   - Never hardcode widths or `min-width` values wider than `100%`; use `min(100%, ...)` and `overflow-wrap: break-word` where needed.
   - Provide an accessible mobile navigation pattern (e.g., collapsible menu using `JsDrop` or a `<button aria-expanded>` disclosure) so header links never wrap awkwardly or overflow at `320px`.
   - Keep interactive controls >= `var(--js-touch-min)` (`2.25rem` desktop, `2.75rem` coarse pointer).

---

## Step 4: Semantic HTML, Routing & WCAG 2.1 AA Accessibility

1. **Landmarks & Document Outline**:
   - Include a visible-on-focus **Skip to main content** link (`<a href="#main-content" class="skip-link">`) as the first focusable element in `App.vue`.
   - Structure every page with `<header>`, `<nav aria-label="...">`, `<main id="main-content" tabindex="-1">`, `<section>` / `<article>`, and `<footer>`.
   - Maintain **exactly one `<h1>` per page** and strictly ordered headings (`h1` -> `h2` -> `h3`) using the `headingLevel` prop on `JsTitleBar`, `JsPanel`, and `JsModal`.
2. **Accessible `vue-router` Navigation**:
   - Use `createWebHistory()` (or hash history only when hosting requires it) with lazy-loaded route views (`() => import("../views/...")`) and a proper 404 catch-all view.
   - Update `document.title` and `<meta name="description">` on every route via `route.meta`.
   - On route navigation (`router.afterEach`), announce/shift focus cleanly to `#main-content` (or the page `<h1>`) and scroll to top (respecting `savedPosition` and hash anchors) so keyboard and screen-reader users aren't stranded.
3. **Forms, Media & Dynamic UI**:
   - Prefer `JsForm` / `JsInput` / `JsInputCheckbox` / `JsInputRadio` for all user input so labels, hints, `aria-invalid`, and `role="alert"` errors work out of the box.
   - Provide descriptive `alt` text on informative images, `alt=""` on decorative images, and `aria-hidden="true"` on decorative inline SVGs.
   - Use `linkExt` on `JsNavItem` / `JsPanelNav` / `JsTable` for external URLs so `target="_blank"`, `rel="noopener noreferrer"`, and the external icon apply automatically.

---

## Step 5: Vue 3 Composition API Patterns & Testability

1. **Clean Composition API architecture**:
   - Use `<script setup>` in all views, layouts, and site-local components.
   - Extract reusable logic, data fetching, filtering, and form submission handlers into focused composables under `src/composables/` (`use*.js`) so they can be unit-tested independently of the DOM.
   - Keep views declarative and readable: pass structured data into `Js*` components and handle emitted events cleanly.
2. **Write automated tests from day one** (Vitest + `@vue/test-utils` + `jsdom`):
   - **Routing & layout tests**: Verify key routes render expected landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`), single `<h1>`, skip link, and `document.title` updates.
   - **Interactive flow tests**: Verify navigation, tab switching (`JsTabs`), modal open/close (`JsModal`), search/filtering (`JsPanelNav`), form validation & submission (`JsForm`/`JsInput`), and toast/alert feedback (`JsAlert`/`JsToast`).
   - **Accessibility & hygiene checks**: Assert ARIA attributes (`aria-current`, `aria-expanded`, `aria-label`), keyboard interactions, and **zero Vue runtime warnings** during mount/unmount.
3. **Verification Gate**:
   - Run `npm test` and confirm all tests pass with zero warnings.
   - Run `npm run build` and confirm a clean, lean production bundle in `dist/`.
   - Optionally recommend running the `a11y-semantic-audit` or `pr-review` skill (`frontend-pr-reviewer`) for an independent accessibility and 320px responsiveness pass before shipping.
