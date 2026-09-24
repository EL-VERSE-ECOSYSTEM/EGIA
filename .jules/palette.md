## 2025-05-20 — Accessibility and Motion Enhancements for Shared Controls
**Context:** Updating global controls like `ThemeToggle` to meet WCAG AA standards and support screen readers and keyboard navigation.
**Learning:** Adding dynamic `aria-label` strings (e.g. including current state and next transition action) along with `aria-hidden="true"` on decorative Lucide icons significantly improves screen reader clarity. Adding `focus-visible:ring-2` with `focus-visible:outline-none` and `motion-reduce:*` variants provides accessible focus states and respects system reduced motion preferences without disrupting existing Tailwind design system styling.
**Action:** Always include dynamic `aria-label`, visible focus ring classes (`focus-visible:ring-2`), and `motion-reduce:transition-none` when refining interactive components.

## 2025-05-24 — Interactive Notification Popover Keyboard & Motion Accessibility
**Context:** Enhancing `NotificationBell` in `components/notifications/NotificationBell.tsx` for keyboard and screen reader accessibility.
**Learning:** Adding `aria-expanded` and `aria-controls` to trigger buttons along with `Escape` key and click-outside listeners provides a predictable keyboard navigation experience. Guarding decorative animations (such as notification bounce badges) with `motion-reduce:animate-none` prevents disorientation for users with vestibular sensitivities while preserving visual state indicators.
**Action:** Always pair popover triggers with `aria-expanded`, `aria-controls`, `Escape` listener, outside-click ref dismissal, and `motion-reduce:*` guards on continuous CSS animations.
