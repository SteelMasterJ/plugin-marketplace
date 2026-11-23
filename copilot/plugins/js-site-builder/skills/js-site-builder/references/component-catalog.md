# `@steelmasterj/js-components` Catalog & Website Mapping

Use this reference during **Step 1 (Component Gap Audit)** to match website requirements against existing `@steelmasterj/js-components` primitives before proposing a new library component.

## Installation & Entry Setup

```bash
npm install @steelmasterj/js-components vue vue-router
# Or during local development against a sibling repo:
npm install ../js-components
```

```js
// src/main.js
import { createApp } from "vue";
import "@steelmasterj/js-components/style.css";
import "./styles/theme.css";
import "./styles/base.css";
import App from "./App.vue";
import router from "./router";

createApp(App).use(router).mount("#app");
```

---

## Complete Component Inventory (24 Components + `toast`)

### 1. Foundation & Feedback
| Component | Website Use Cases | Key Props / Helpers |
| :--- | :--- | :--- |
| **`JsIcon`** | Inline UI chrome icons or wrapper for custom `<svg>` slots | `name`, `color`, `label`, `spin`, default slot |
| **`JsMarkdown`** | Safe inline rich text (`**bold**`, `_italic_`, `[link](url)`, colored pills `bl[Tag]`/`gn[Tag]`/`rd[Tag]`/`[Tag]`) | `val`, `parse` |
| **`JsAlert`** | Inline callouts, status banners, announcements, form feedback | `v-model`, `type` (`info`/`success`/`warning`/`danger`), `variant` (`soft`/`solid`/`outline`), `theme`, `title`, `message`, `dismissible` |
| **`JsToast`** + **`toast`** | Global snackbar notifications (mount `<JsToast />` once in `App.vue`) | `toast.success(...)`, `toast.info(...)`, `toast.warning(...)`, `toast.danger(...)`, `position`, `duration` (`0` = manual) |
| **`JsModal`** | Confirmations, lightbox/detail dialogs, login/contact modals | `v-model`, `title`, `headingLevel`, `size` (`sm`/`md`/`lg`/`full`), `closeOnBackdrop`, `closeOnEsc`, `#header`/`#footer` |
| **`JsTabs`** | Feature tabs, pricing/plan toggles, documentation sections | `items`, `v-model`, `size`, `theme`, `align` (`start`/`center`/`stretch`), `#tab-<id>` / `#panel` |

### 2. Navigation & Menus
| Component | Website Use Cases | Key Props / Notes |
| :--- | :--- | :--- |
| **`JsNavItem`** | Buttons, `<router-link>` nav items, external links (`linkExt`), dropdown triggers | `item` (`label`, `subLabel`, `icon`, `link`, `linkExt`, `button`, `drop`, `notify`, `tags`), `size`, `active`, `theme`, `block` |
| **`JsPanelNavItem`** | `JsNavItem` with `dropPos` (`bl`, `br`, `tl`, `tr`, `l`, `r`) for panel headers | All `JsNavItem` props + `dropPos` |
| **`JsBtnSplit`** | Segmented button groups, primary action + dropdown caret | `items`, `ariaLabel`, `size`, `grow`, `theme`, `spaced` |
| **`JsNavList`** | Vertical menus, sidebar navigation, footer link lists, dropdown menus | `items` (headers, `<hr>` dividers, nested submenus), `size`, `theme`, `menu`, `scrollable`, `ariaLabel` |
| **`JsDrop`** | Popover menus, user account menus, mobile nav menu, filter popovers | `items`, `v-model`, `triggerLabel`, `triggerIcon`, `right`, `tabs`, `size`, `theme`, `#trigger` / default slot |
| **`JsNavItemActions` / `Icon` / `Labels` / `Notify` / `Tags`** | Composable sub-primitives used inside custom `JsNavItem` layouts | `item` |

### 3. Layout & Data Display
| Component | Website Use Cases | Key Props / Notes |
| :--- | :--- | :--- |
| **`JsPanel`** | Feature cards, hero banners with background images, content sections, scrollable panels | `as` (`section`/`article`/`div`/`aside`), `headingLevel`, `title`, `aboveNote`, `banner`, `footer`, `backgroundImage`, `backgroundImageZoom`, `primaryAction`, `scroll`, `#header`/`#footer`/`#subActions` |
| **`JsPanelNav`** | Searchable directories, portfolio/project grids, docs index, team/resource lists | `items`, `search`, `grouped`, `groupBy`, `columns`, `grid`, `itemsLimit`, `loadAllLabel`, `ariaLabel`, `#empty` |
| **`JsTitleBar`** | Page headers with breadcrumbs, page title/subtitle, action buttons, and status banner | `headingLevel`, `title`, `subTitle`, `description`, `crumbs`, `buttons`, `bannerLabel`, `dark`, `#actions` |
| **`JsTable`** | Comparison tables, pricing matrices, schedules, data tables with sticky columns | `caption`, `rows`, `headerRowCount`, `headerColCount`, `leftColSticky`, `rightColSticky`, `scroll`, `striped`, `hover`, `dark` |

### 4. Forms & Inputs
| Component | Website Use Cases | Key Props / Notes |
| :--- | :--- | :--- |
| **`JsInput`** | Text, email, tel, number, search, textarea, autocomplete, and accessible `type="select"` | `v-model`, `type`, `label`, `placeholder`, `hint`, `error`, `invalid`, `items`, `size`, `theme`, `#icon`/`#prefix`/`#suffix`/`#action` |
| **`JsInputCheckbox`** | Single consent/newsletter checkbox or multi-option `<fieldset>` group | `v-model`, `label`, `items`, `layout`, `hint`, `error`, `invalid`, `theme` |
| **`JsInputRadio`** | Single-choice radio groups or swatch/dot pickers (`dots`) | `v-model`, `label`, `items`, `dots`, `name`, `hint`, `error`, `invalid`, `theme` |
| **`JsForm`** | Contact forms, onboarding/checkout multi-step wizards, settings forms | `v-model` (`{ steps, items, buttons }`), `status`, `buttonsSticky`, `resetButton`, `theme`, `@submit`, `@step-change` |

---

## Built-In `JsIcon` Names (Zero Icon Library Needed)

- **Directional**: `chevron-down`, `chevron-up`, `chevron-left`, `chevron-right`, `angle-down`, `angle-up`, `angle-left`, `angle-right`, `caret-down`, `caret-right`
- **Actions & UI**: `close`, `times`, `search`, `check`, `external`, `external-link-square-alt`, `ellipsis-vertical`, `spinner`
- **Status & Views**: `alert`, `triangle-exclamation`, `warning-triangle`, `info-circle`, `check-circle`, `danger-circle`, `x-circle`, `bell`, `list-ul`, `table-cells`

For brand or domain icons not in this list, pass clean inline `<svg viewBox="0 0 24 24" aria-hidden="true">` into `JsIcon` or component `#icon` slots (`currentColor` is inherited automatically).

---

## Core `--js-*` Design Tokens to Theme

Override in `src/styles/theme.css` (imported after `@steelmasterj/js-components/style.css`):

- **Brand**: `--js-color-primary`, `--js-color-primary-hover`, `--js-color-primary-soft`, `--js-color-primary-text`
- **Surfaces & Text**: `--js-color-surface`, `--js-color-surface-alt`, `--js-color-surface-hover`, `--js-color-surface-dark`, `--js-color-text`, `--js-color-text-muted`, `--js-color-text-inverse`
- **Borders & Focus**: `--js-color-border`, `--js-color-border-strong`, `--js-color-focus`, `--js-focus-ring`, `--js-focus-offset`
- **Semantic Status**: `--js-color-info*`, `--js-color-success*`, `--js-color-warning*`, `--js-color-danger*`
- **Scale & Motion**: `--js-font-family`, `--js-font-size-xs`..`xl`, `--js-space-1`..`6`, `--js-radius-sm`/`md`/`lg`/`pill`, `--js-shadow-sm`/`md`/`lg`, `--js-transition-fast`/`base`, `--js-touch-min`

---

## Common Component Gaps (Trigger the Stop & Ask Gate)

If the website scope genuinely calls for any of these reusable UI primitives, **stop and ask the user** whether to add it to `@steelmasterj/js-components` first or implement it locally:

- **`JsAccordion` / `JsDisclosure`**: FAQ lists, collapsible filter groups, expandable detail sections
- **`JsPagination`**: Paginated blog/catalog/table navigation
- **`JsDrawer` / `JsSidebar`**: Slide-over mobile navigation drawer or filter sheet
- **`JsBadge` / `JsChip`**: Standalone status pills or removable filter chips outside `JsNavItem`
- **`JsProgress` / `JsSkeleton`**: Determinate progress bars or loading placeholders
- **`JsCarousel`**: Accessible multi-slide showcase or testimonial carousel
- **`JsTooltip`**: Standalone focus/hover tooltip primitive
- **`JsBreadcrumbs`**: Standalone breadcrumb bar outside `JsTitleBar`
