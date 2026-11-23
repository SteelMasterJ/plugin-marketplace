# Responsiveness & Cross-Device Review Rubric

Evaluate every UI/layout change from `320px` (narrow mobile) through `1440px+` (desktop) and across mouse, keyboard, and touch input:

## 1. Zero Horizontal Overflow (`320px` Baseline)
- Flag fixed pixel `width` or `min-width` values (`> 280px`) on cards, forms, modals, buttons, or grid tracks that break `320px` viewports.
- Prefer `width: min(100%, ...)`, `max-width: 100%`, `min-width: 0` on flex/grid children, and `overflow-wrap: anywhere` / `word-break` on long labels or URLs.
- Multi-column grids should collapse gracefully using `repeat(auto-fit, minmax(min(100%, 16rem), 1fr))` or progressive `@media (min-width: ...)` rules instead of brittle rigid columns.

## 2. Touch, Pointer & Interaction Parity
- Interactive controls (buttons, tabs, checkboxes, radio targets, close icons, table action triggers) should provide comfortable hit areas (`>= 36px` default, expanding to `>= 44x44px` via `@media (pointer: coarse)`).
- Never gate essential controls, tooltips, menus, or content behind `:hover` alone — touch and keyboard users have no hover state.

## 3. Overflowing Media, Tables & Floating Surfaces
- Wide `<table>` elements must sit inside a responsive overflow wrapper (`overflow-x: auto`, keyboard-focusable `tabindex="0"` + `role="region"` + `aria-label`) rather than stretching `<body>`.
- Images, videos, and SVGs need `max-width: 100%; height: auto` (or explicit aspect ratio) to avoid distortion and cumulative layout shift (CLS).
- Dropdowns, popovers, and tooltips must flip or constrain width within the viewport (`max-width: calc(100vw - 1rem)` / viewport placement calculation) so they do not clip off-screen on mobile.

## 4. Fluid Spacing, Typography & Motion
- Flag hardcoded `px` font sizes that ignore user browser root font scaling (`rem` preferred for typography; `em`/`rem` for spacing).
- Check dark mode / high-contrast media or themed surfaces for broken borders, invisible focus rings, or washed-out muted text.
