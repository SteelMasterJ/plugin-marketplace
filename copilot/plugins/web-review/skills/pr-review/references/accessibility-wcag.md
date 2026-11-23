# Accessibility Review Rubric (WCAG 2.1 AA)

Accessibility failures are **Blocker** or **High** findings. Check every item below:

## 1. Keyboard Operability & Focus Management
- Every interactive control must be reachable and operable via keyboard alone (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`).
- Never remove `outline` without providing an explicit `:focus-visible` indicator (`>= 2px`, high contrast).
- Never use `tabindex > 0`, and never add redundant `tabindex="0"` to native `<button>`, `<a>`, `<input>`, `<select>`, or `<textarea>`.
- Scrollable non-interactive regions (e.g., wide tables, scrollable cards) must be keyboard-scrollable (`tabindex="0"`, `role="region"`, `aria-label`, and `:focus-visible` ring).
- Modals / dialogs (`role="dialog"`, `aria-modal="true"`):
  - Move focus inside on open, trap `Tab` / `Shift+Tab` inside the dialog, close on `Escape` (unless intentionally locked), and restore focus to the trigger element on close.
- Composite widgets (`tablist`, `listbox`, `menu`, `combobox`):
  - Implement WAI-ARIA APG arrow-key navigation, `Home`/`End`, and roving `tabindex` or `aria-activedescendant`.

## 2. Accessible Names, Forms & Live Feedback
- Every icon-only `<button>` must have `aria-label`, `aria-labelledby`, or visually hidden `.sr-only` text.
- Form controls must associate `<label for="...">` with matching `:id` (never placeholder-only labels).
- Hints and validation errors must be visibly rendered (not hover-only tooltips) and connected via `aria-describedby` + `aria-invalid="true"`.
- Real-time status counts use `<output>` or `aria-live="polite"`; urgent errors/validation summaries use `role="alert"`.
- Multi-checkbox and radio groups wrap inside `<fieldset>` + `<legend>`.

## 3. ARIA Validity & Structural Semantics
- Never violate `aria-required-children` / `aria-required-parent`:
  - `role="menu"` may only directly contain `menuitem` / `menuitemcheckbox` / `menuitemradio` (or `role="none"` wrappers). If mixed buttons/widgets exist, omit `role="menu"` and use a plain list!
  - `role="tablist"` -> `role="tab"` (`aria-selected`, `aria-controls`) -> `role="tabpanel"` (`aria-labelledby`).
- Keep heading outline valid (`h1` -> `h2` -> `h3` without skipping levels) and avoid multiple top-level `<main>` landmarks without labels.
- Decorative `<svg>` / icons must carry `aria-hidden="true"`; meaningful images need real `alt` descriptions (flag placeholder `alt="thumb"`, `alt="image"`, or filename strings).

## 4. Contrast, Color Independence & Motion
- Normal text contrast `>= 4.5:1`; large text (`>= 18pt` or `14pt` bold) and UI borders/focus rings `>= 3:1` (against both light AND dark surfaces).
- Never communicate state or errors solely by color — pair with text, icon, or pattern.
- Animations/transitions must honor `@media (prefers-reduced-motion: reduce)`.
