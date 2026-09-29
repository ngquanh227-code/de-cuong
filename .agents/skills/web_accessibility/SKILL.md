---
name: web_accessibility
description: Audit, design, and implement web interfaces complying with WCAG 2.2 AA/AAA, ARIA patterns, color contrast standards, keyboard navigation, focus management, and screen-reader accessibility.
---

# Web Accessibility (A11y) Skill

Use this skill when designing or auditing web interfaces, web apps, components, and forms for accessibility, WCAG 2.2 compliance, and assistive technologies.

## Quick Workflow

1. **Contrast First**: Ensure normal text has at least 4.5:1 contrast against its background; large text (18pt+ or 14pt bold) needs 3:1. Non-text UI controls and states require at least 3:1 contrast.
2. **Keyboard Navigability**: Every interactive element must be reachable and operable using `Tab`, `Shift+Tab`, `Enter`, `Space`, and Arrow keys. Never hide the focus ring (`outline: none`) without a visible custom replacement (`:focus-visible`).
3. **Semantic HTML & ARIA**: Use native HTML elements (`<button>`, `<input>`, `<nav>`, `<dialog>`, etc.) before creating custom `<div>`-based widgets. Add appropriate ARIA roles, states, and properties (`aria-expanded`, `aria-haspopup`, `aria-controls`, `aria-label`).
4. **Touch Target Size**: Interactive targets must be at least 24×24px (WCAG 2.2 Level AA 2.5.8) or ideally 44×44px for mobile devices.
5. **Reduced Motion**: Respect user preferences with `@media (prefers-reduced-motion: reduce)`.

## Detailed References

Refer to the included guides in `./references/`:
- `references/wcag-checklist.md`: Full WCAG 2.2 Level A, AA, and AAA rules categorized by POUR (Perceivable, Operable, Understandable, Robust).
- `references/aria-patterns.md`: Concrete implementation patterns for modals, dropdowns, accordions, tooltips, comboboxes, tabs, and menus.
- `references/vision.md`: Contrast rules, color blindness considerations, text resizing up to 200%.
- `references/cognitive.md`: Clear visual cues, error recovery, concise copy.
- `references/i18n-rtl.md`: Bidirectional text (LTR/RTL) and internationalization layout support.
