---
name: pr-review
description: >-
  Performs thorough, structured pull request and code reviews across @steelmasterj/js-components
  and any web application or website build (Vue, React, Svelte, Astro, or vanilla HTML/CSS/JS).
  Prioritizes WCAG 2.1 AA accessibility, responsiveness down to 320px, semantic HTML, vanilla
  lightweight code, and dumb presentational component boundaries. Use whenever reviewing a PR,
  git diff, branch, or changed frontend files.
---

# Frontend PR & Code Review Skill

Use this workflow whenever reviewing a PR, diff, or set of frontend changes — whether in `@steelmasterj/js-components` or any web application/website repository.

## Step 1: Gather Context & Scope

1. Inspect the full diff and changed file list (`git diff`, `git status`, or targeted files).
2. Identify the project stack from `package.json` / config files (e.g., `@steelmasterj/js-components` library, Vue, React, Astro, static HTML/CSS/JS).
3. Read surrounding component/stylesheet/test context for every modified file so you never judge a diff snippet in isolation.

## Step 2: Review Across the Four Prioritized Pillars

Evaluate every change in priority order using the dedicated reference rubrics:

1. **Accessibility (WCAG 2.1 AA)** — Read [references/accessibility-wcag.md](./references/accessibility-wcag.md).
   - Keyboard operability, focus management/restoration, visible `:focus-visible` indicators, accessible names, `<label>`/`aria-describedby`/`role="alert"` wiring, landmarks & heading hierarchy, ARIA role validity (`aria-required-children`), contrast >= 4.5:1, reduced motion, and `alt` / `aria-hidden` hygiene.
2. **Responsiveness & Device Resilience** — Read [references/responsive-layout.md](./references/responsive-layout.md).
   - Zero horizontal overflow at `320px`, fluid layouts/grids/typography, responsive tables/media, touch target sizes (`>= 44x44px` on coarse pointers), no hover-only critical information, and viewport-aware popovers/modals.
3. **Semantic HTML, Vanilla Hygiene & "Dumb" Presentational Boundaries** — Read [references/semantic-presentational.md](./references/semantic-presentational.md).
   - Native HTML before ARIA (`<button>`, `<a>`, `<nav>`, `<fieldset>`/`<legend>`, `<table>`, `<header>`/`<footer>`/`<section>`), strict data-down / events-up separation in presentational components, lightweight vanilla CSS (no unnecessary dependencies, `!important`, or global leakage).
4. **Correctness, Security, Lifecycle & `js-components` Overlay**
   - XSS sanitization (`v-html` / `dangerouslySetInnerHTML` / raw HTML), safe URL checks, `rel="noopener noreferrer"` on `target="_blank"`, SSR safety (`window` / `document` / `ResizeObserver` guards and cleanup on unmount), and test coverage.
   - **If the repo is `js-components`** (or edits `src/components/`): additionally enforce Vue 3 Options API only (no `<script setup>`), `Js*` naming, `.js-*` / `--js-*` tokens, `JsIcon` / `#icon` slot support, `$attrs` forwarding, optional `vue-router` fallback, `npm test` + `npm run build` verification.

## Step 3: Output a Structured, Actionable Review

Never report passing checks you did not run, and never invent file paths or line numbers. Format your review strictly as follows:

1. **Summary & Verdict**:
   - Verdict: `Approve` | `Approve with Suggestions` | `Request Changes`
   - 2–3 sentence summary covering scope, test/build verification observed, and primary risk areas.
2. **Findings Grouped by Severity**:
   - **Blocker** (accessibility traps, WCAG AA failures, XSS/security issues, broken builds/tests, severe mobile breakage)
   - **High** (missing keyboard parity, broken semantics, smart-logic leaked into presentational components, missing listener cleanup, `320px` horizontal overflow)
   - **Medium** (hardcoded colors breaking theming, suboptimal CSS/bundle bloat, missing edge-case tests)
   - **Nit** (clarity, naming, minor polish)
   - For each finding include:
     - `path/to/file.ext:line`
     - **Pillar**: `Accessibility` | `Responsiveness` | `Semantics` | `Presentational/Vanilla` | `Correctness/Security`
     - **Impact**: concrete user or maintainer consequence
     - **Fix**: minimal, copy-pasteable code or CSS suggestion
3. **Verification Checklist Status**: Note what tests, linters, builds, or manual checks ran and what still needs verification.
