---
name: a11y-semantic-audit
description: >-
  Audits an entire web component, page, or website build outside of a PR diff for WCAG 2.1 AA
  accessibility, semantic HTML structure, keyboard navigation, 320px responsiveness, and
  lightweight vanilla CSS hygiene. Use when auditing existing UI code, landing pages, or
  component libraries for accessibility and responsive quality.
---

# Accessibility, Responsiveness & Semantic Audit Skill

Use this workflow when asked to audit an existing page, app, website, or component library (not scoped to a single PR diff).

## Audit Procedure

1. **Map the Document & Component Tree**:
   - Inspect entry HTML (`index.html`), layout shells, navigation, forms, tables, modals/drawers, and stylesheets.
   - Trace the heading hierarchy (`h1`–`h6`) and landmark regions (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`).
2. **Trace a Keyboard-Only User Journey**:
   - Walk from skip link / top navigation -> main content -> interactive controls -> modal/dropdown open & close -> form validation & submission -> footer.
   - Verify no focus traps outside modals, no lost focus on dynamic close/delete actions, and clear `:focus-visible` outlines on every focusable element.
3. **Evaluate Semantic HTML & ARIA Correctness**:
   - Verify native elements are used instead of clickable `<div>`/`<span>` patterns.
   - Check form `<label>` associations, `<fieldset>`/`<legend>` grouping, `aria-invalid`, `aria-describedby`, `<output aria-live>`, `role="alert"`, `aria-required-children`, and external link `rel="noopener noreferrer"`.
4. **Evaluate Responsiveness (`320px`, `375px`, `768px`, `1024px`, `1440px`)**:
   - Flag horizontal overflow triggers (`min-width`, non-wrapping flex/grid tracks, wide uncontained tables/images).
   - Verify touch target sizing (`@media (pointer: coarse)`), hover-free mobile parity, viewport-clamped popovers, and `@media (prefers-reduced-motion: reduce)`.
5. **Evaluate Lightweight & Presentational Hygiene**:
   - Identify unnecessary heavy CSS/JS dependencies, `!important` wars, duplicate CSS rules, and smart data/store logic trapped inside presentational UI components.

## Output Format

Provide:
1. **Executive Scorecard**: Pass / Needs Attention / Fail across **Accessibility (WCAG 2.1 AA)**, **Responsiveness**, **Semantic HTML**, and **Lightweight/Presentational Hygiene**.
2. **Prioritized Remediation Table** (`Severity | Location | Category | Issue & User Impact | Recommended Fix`).
3. **Top Concrete Code Fixes**: Minimal, copy-pasteable HTML/CSS/component patches for the highest-severity issues.
