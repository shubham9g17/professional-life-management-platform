# ADR-0006 — Dual `<BentoCard>` component + `.bento-card` CSS class

## Status

Accepted.

## Context

The dashboard, analytics page, and most module pages display content in card-shaped surfaces. Two needs in tension:

1. **The dashboard wants animated, interactive cards** — staggered entrance, hover scale, subtle gradient overlay. Best implemented as a React component with Framer Motion.
2. **Simple stat panels and grouped content elsewhere don't need animation** — they just want the same visual surface (border, radius, background, shadow). Forcing a React component (with Framer Motion overhead) for a static info card is overkill.

Approaches considered:

- **One React component everywhere.** Forces every card-shaped div to be a `<BentoCard>` even when interaction is unnecessary. Bloats bundle and adds Framer Motion render cost where it's not needed.
- **One CSS class everywhere.** Loses the dashboard's polished animation and the gradient overlay (which requires `position: relative` + `::before`).
- **Two primitives that look identical.** A React component for the dashboard's interactive grid; a CSS utility class for everything else. Both render the same surface.

## Decision

Ship **both**:

- **`<BentoCard>` React component** (`components/dashboard/bento-card.tsx`) — animated, interactive, used in the dashboard's bento grid. Carries `shadow-sm` + a subtle `before:bg-gradient-to-br from-foreground/[0.03]` overlay + Framer Motion entrance.
- **`.bento-card` CSS class** (defined in `app/globals.css`) — static, used in 27 places across analytics and module pages. Carries `border + bg-card + box-shadow` (light mode only; dark mode suppresses the shadow because the bg-card → bg-page brightness step does the visual work).

Both render visually identical card surfaces.

```css
.bento-card {
  position: relative;
  border-radius: var(--card-radius);
  background: rgb(var(--card));
  border: 1px solid rgb(var(--border));
  box-shadow:
    0 1px 2px 0 rgb(15 23 42 / 0.04),
    0 1px 3px 0 rgb(15 23 42 / 0.06);
}

.dark .bento-card { box-shadow: none; }
```

## Consequences

**Better:**
- The dashboard gets its animated interactive surface without any pages outside the dashboard paying for Framer Motion.
- Analytics and module pages can sprinkle `bento-card` on a `<div>` with no React-component overhead.
- The two primitives are visually indistinguishable, so the page reads as one design system.
- Light + dark coherence is enforced once (in `globals.css`) instead of per-component.

**Worse / accepted trade-offs:**
- Two primitives means two places where a future change has to land if the surface treatment evolves. (`box-shadow` was added to both during the light-mode polish session.)
- A new contributor has to know to reach for one or the other. Documented in `docs/02-architecture/theme-system.md`.

## Origin story

This ADR was written *after* the fact — early in the project, only `<BentoCard>` existed; the `.bento-card` class was added later when analytics and module pages started needing card surfaces without animation. During a light-mode polish session it was discovered that `.bento-card` had been shipped without the shadow that `<BentoCard>` had, causing 27 module surfaces to look flat in light mode. The fix unified them.
