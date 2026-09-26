## 2025-05-20 — Accessibility and Motion Enhancements for Shared Controls
**Context:** Updating global controls like `ThemeToggle` to meet WCAG AA standards and support screen readers and keyboard navigation.
**Learning:** Adding dynamic `aria-label` strings (e.g. including current state and next transition action) along with `aria-hidden="true"` on decorative Lucide icons significantly improves screen reader clarity. Adding `focus-visible:ring-2` with `focus-visible:outline-none` and `motion-reduce:*` variants provides accessible focus states and respects system reduced motion preferences without disrupting existing Tailwind design system styling.
**Action:** Always include dynamic `aria-label`, visible focus ring classes (`focus-visible:ring-2`), and `motion-reduce:transition-none` when refining interactive components.

## 2026-09-26 — Fixed Overlay Widget Occlusion & Enhanced Floating Panel A11y
**Context:** Enhancing keyboard navigation, ARIA semantics, and positioning for `FloatingSupportWidget`.
**Learning:** When multiple fixed floating elements inhabit the same screen corner (e.g., `LiveIndicator` and `FloatingSupportWidget` both set to `bottom-6 right-6`), pointer events and focus target region get occluded. Vertically offsetting overlay controls (`bottom-24 right-6`) prevents click interception while preserving keyboard focus visibility (`focus-visible:ring-2`), `Escape` key panel dismissability, and semantic modal dialog structure (`role="dialog"`, `aria-modal="true"`, explicit `htmlFor`/`id` associations).
**Action:** Check fixed viewport corner coordinates for overlay element collisions and ensure all overlay dialogs support `Escape` dismiss and screen-reader form field association.
