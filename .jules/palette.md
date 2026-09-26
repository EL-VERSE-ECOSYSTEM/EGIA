# Palette UX & Accessibility Journal

## 2025-05-18 — Floating Overlay Z-Index & Dark Theme Contrast
**Context:** Consolidating floating widget components (`FloatingSupportWidget`) and ensuring keyboard accessibility and high contrast.
**Learning:**
1. High-contrast dark backgrounds (`bg-slate-950` / `bg-slate-900`) with explicit text colors (`text-white`, `text-slate-300`, `text-emerald-400`) are necessary for floating modal dialogs overlaying unpredictable page background gradients to ensure WCAG AA (4.5:1+) contrast.
2. Floating widgets in the bottom corners must maintain logical positioning and z-indexing without colliding with existing fixed UI overlays (like live status indicators or developer devtools).
**Action:** Always test floating modals with solid/opaque background tokens and verify keyboard dismissal (`Escape`), visible focus rings, and `aria-expanded`/`aria-controls` bindings.
