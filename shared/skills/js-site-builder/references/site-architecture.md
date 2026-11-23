# Website Architecture & Verification Reference

Recommended structure for a clean, lightweight, testable Vue 3 Composition API + Vite + `vue-router` + `@steelmasterj/js-components` website.

## Recommended Project Structure

```text
<site-repo>/
├── index.html                  # Semantic lang="en", viewport meta, clean title/description
├── package.json                # Minimal deps: vue, vue-router, @steelmasterj/js-components
├── vite.config.js              # @vitejs/plugin-vue + Vitest jsdom config
├── public/                     # Static favicon, robots.txt, og-image
├── src/
│   ├── main.js                 # Imports @steelmasterj/js-components/style.css -> theme.css -> base.css
│   ├── App.vue                 # Skip link, SiteHeader, <main id="main-content">, SiteFooter, <JsToast />
│   ├── router/
│   │   └── index.js            # Lazy-loaded routes, meta titles, accessible focus/scroll behavior
│   ├── styles/
│   │   ├── theme.css           # --js-* overrides + --site-* semantic tokens (WCAG AA contrast)
│   │   └── base.css            # Box-sizing, typography, .skip-link, .site-container, reduced-motion
│   ├── components/             # Site-specific shell/layout components (<script setup> + semantic CSS)
│   │   ├── SiteHeader.vue
│   │   └── SiteFooter.vue
│   ├── composables/            # Pure testable Composition API logic (use*.js)
│   ├── data/                   # Static/structured content modules (navigation, services, FAQs)
│   └── views/                  # Route-level pages (<script setup>)
│       ├── HomeView.vue
│       └── NotFoundView.vue
└── tests/
    ├── app.spec.js             # Landmarks, skip link, routing, document.title
    └── <feature>.spec.js       # Forms, tabs, modals, filters, keyboard & ARIA tests
```

---

## Accessible `vue-router` Pattern (`src/router/index.js`)

```js
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/HomeView.vue"),
    meta: { title: "Home | Site Name", description: "Concise page summary." },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../views/NotFoundView.vue"),
    meta: { title: "Page Not Found | Site Name" },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash };
    return { top: 0 };
  },
});

router.afterEach((to) => {
  if (typeof document === "undefined") return;
  if (to.meta?.title) document.title = String(to.meta.title);

  const desc = document.querySelector('meta[name="description"]');
  if (desc && to.meta?.description) {
    desc.setAttribute("content", String(to.meta.description));
  }

  // Move focus to main content on client-side route transitions for keyboard/SR users
  requestAnimationFrame(() => {
    const main = document.getElementById("main-content");
    if (main) main.focus({ preventScroll: true });
  });
});

export default router;
```

---

## Root Shell Pattern (`src/App.vue`)

```vue
<script setup>
import { JsToast } from "@steelmasterj/js-components";
import SiteHeader from "./components/SiteHeader.vue";
import SiteFooter from "./components/SiteFooter.vue";
</script>

<template>
  <div class="site-shell">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <SiteHeader />
    <main id="main-content" class="site-main" tabindex="-1">
      <RouterView />
    </main>
    <SiteFooter />
    <JsToast position="bottom-right" />
  </div>
</template>
```

---

## Semantic Base CSS Essentials (`src/styles/base.css`)

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-family: var(--js-font-family);
  color: var(--js-color-text);
  background-color: var(--js-color-surface);
  line-height: 1.6;
}

body {
  margin: 0;
  min-height: 100dvh;
}

.site-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.site-main {
  flex: 1 0 auto;
  outline: none;
}

.site-container {
  width: min(100% - 2 * var(--site-gutter, 1rem), var(--site-max-width, 72rem));
  margin-inline: auto;
}

.skip-link {
  position: absolute;
  inset-block-start: -100%;
  inset-inline-start: var(--js-space-4);
  z-index: calc(var(--js-z-toast) + 1);
  padding: var(--js-space-2) var(--js-space-4);
  background: var(--js-color-primary);
  color: var(--js-color-primary-text);
  border-radius: var(--js-radius-md);
  text-decoration: none;
}

.skip-link:focus-visible {
  inset-block-start: var(--js-space-4);
  outline: var(--js-focus-ring);
  outline-offset: var(--js-focus-offset);
}

img,
svg {
  max-width: 100%;
  height: auto;
}

:focus-visible {
  outline: var(--js-focus-ring);
  outline-offset: var(--js-focus-offset);
}
```

---

## Minimal Vite + Vitest Config (`vite.config.js`)

```js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    globals: false,
  },
});
```

---

## Pre-Ship Verification Checklist

- [ ] **Component reuse**: Every applicable UI element uses `@steelmasterj/js-components`; any missing reusable primitive was raised with the user before building a workaround.
- [ ] **Composition API**: All website views, layouts, composables, and site-local components use Vue 3 Composition API (`<script setup>`).
- [ ] **Minimal dependencies**: Only essential packages (`vue`, `vue-router`, `@steelmasterj/js-components`, Vite/Vitest dev tools) are installed; no CSS frameworks or icon libraries.
- [ ] **Semantic HTML & WCAG 2.1 AA**: Skip link, landmarks, single `<h1>` per route, ordered heading levels, keyboard navigation, `:focus-visible`, >= 4.5:1 contrast, accessible forms and external links.
- [ ] **Responsive down to 320px**: Fluid grids/typography, usable mobile navigation, coarse-pointer touch targets, zero horizontal overflow.
- [ ] **Reduced motion**: Transitions/animations honor `@media (prefers-reduced-motion: reduce)`.
- [ ] **Tests & Build**: `npm test` passes with zero Vue warnings and `npm run build` succeeds cleanly.
