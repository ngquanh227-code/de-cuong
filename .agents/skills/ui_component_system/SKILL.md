---
name: ui_component_system
description: Design, architect, and implement production-ready UI component systems, atomic design structures, comprehensive state variants (8-state model), and aesthetic styling.
---

# UI Component System Skill

A complete architecture reference for designing and implementing cohesive, modular, and resilient UI component libraries for web applications.

## Component Quality Bar: The 8-State Model

Every interactive component MUST handle all applicable states:
1. **Default (Resting)**: Base visual presentation.
2. **Hover**: Clear feedback on pointer hover without jarring layout shifts.
3. **Focus / Focus-Visible**: Prominent, accessible keyboard focus ring (≥ 3:1 contrast ratio).
4. **Active (Pressed)**: Visual feedback when pressed or triggered.
5. **Selected / Checked**: Distinct style for active tabs, toggled buttons, checked inputs (`aria-pressed`, `aria-selected`, `aria-checked`).
6. **Disabled**: Visually muted (`opacity: 0.5-0.6`, `cursor: not-allowed`), non-focusable or `aria-disabled="true"`.
7. **Loading**: Visual skeleton or spinner, `aria-busy="true"`, preventing double-submits.
8. **Error / Invalid**: Clear error border/text, icon, and `aria-invalid="true"` with accompanying descriptive helper message.

## Atomic Hierarchy & References

Inspect the included files in `./references/`:
- `references/components/atoms.md`: Buttons, badges, inputs, checkboxes, toggles, avatars, tooltips.
- `references/components/molecules.md`: Search bars, form groups, card headers, pagination items, alert banners.
- `references/components/organisms.md`: Navbars, data tables, modal dialogs, complex filters, dashboards.
- `references/components/navigation.md`: Breadcrumbs, sidebars, tabs, command palettes, pagination.
- `references/components/feedback.md`: Toast notifications, skeleton loaders, empty states, banners.
- `references/components/forms-advanced.md`: Date pickers, multi-select comboboxes, file uploaders.
- `references/components/overlays.md`: Drawers, bottom sheets, lightboxes, popovers.
- `references/taste/design-taste.md`: Typography pairing, visual hierarchy, avoiding AI clichés.
- `references/taste/aesthetic-systems.md`: Presets for Modern Minimal, Dark Tech / Bento, Soft SaaS, Editorial, Brutalist.
- `references/taste/motion-choreography.md`: Easing curves, micro-interactions, layout transitions.
