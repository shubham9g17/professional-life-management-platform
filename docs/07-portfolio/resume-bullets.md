# Resume Bullets

Quantified, action-verb-leading bullets ready to paste into a CV. Each highlights different aspects so you can mix-and-match for different roles.

> **Tip:** lead with impact (the *what*), follow with mechanism (the *how*), close with technical specifics. Recruiters skim the first half of each line.

---

## One-liner (tagline)

> Built a six-domain life-management web app with cross-domain analytics, offline-first sync, and 68 end-to-end tests in Next.js 16, React 19, TypeScript, and PostgreSQL.

## For full-stack engineering roles

- Architected and shipped a unified life-management platform spanning six domains (tasks, habits, finance, fitness, nutrition, learning) — **18,000 lines of TypeScript, 18 Prisma models, ~50 REST endpoints, 80+ React components**.
- Designed a `DailyMetrics` aggregation table that powers cross-domain analytics; reduced typical analytics queries from N-table joins to O(N) over a single table.
- Implemented a strict repository pattern as the only `prisma.*` boundary, centralizing caching, soft-delete, and audit logging in `lib/repositories/*`.
- Authored 8 Architecture Decision Records (ADRs) documenting non-trivial choices — Next.js 16 App Router, JWT vs. database sessions, group-by-mean over Pearson correlations, etc.

## For frontend / UX-leaning roles

- Designed a CSS-variable-based design system with parallel `<BentoCard>` (animated, React) and `.bento-card` (static, CSS class) primitives — kept Framer Motion runtime cost out of 27 module pages while preserving visual consistency across the dashboard.
- Implemented light + dark theming with semantically named tokens (`--card`, `--border`, `--muted-foreground`, etc.) and a light-mode-only shadow rule that prevents the white-on-near-white surface flatness.
- Built responsive layouts verified across four Playwright viewport projects (mobile / tablet / laptop / big-screen).

## For backend / data-heavy roles

- Implemented an offline-first architecture with an IndexedDB queue on the client and server-side conflict detection (existing-row CREATE, stale-write UPDATE, missing-row DELETE), with explicit user resolution via `ConflictResolution` rows.
- Designed a NextAuth credentials-provider auth flow with JWT-strategy sessions, bcrypt password hashing, and rate-limited signup (5 attempts / 15 min / IP).
- Authored an audit-logging convention applied at the repository layer; every mutating endpoint logs to a queryable trail.

## For testing / DX-leaning roles

- Built a 68-test Playwright end-to-end suite covering auth, CRUD on every domain, completion side-effects, sync, analytics, per-page render, and visual snapshots — completing in ~5.8 minutes on a single laptop project.
- Pair the e2e suite with Vitest unit + property-based tests (`fast-check`) scoped to the `lib/**` logic layer, deliberately excluding UI from coverage to avoid double-testing.
- Configured a `globalSetup` for Playwright that signs up one test user per run and shares the auth cookie across specs via `storageState` — avoiding the signup rate limit.

## For "why this stack" interviews

- Selected Next.js 16 (App Router) over Remix and SvelteKit on TypeScript-ecosystem maturity grounds; Prisma over Drizzle on migration-tooling maturity; JWT sessions over database sessions on per-request DB-cost grounds — every choice recorded as an ADR.
- Chose group-by-mean comparison over Pearson correlation for the analytics page because the user-facing copy reads as a sentence (*"+27 % on exercise days"*) rather than an `r` value that requires statistical literacy.

## Pickable verbs

If you need synonyms: *architected, built, designed, engineered, implemented, shipped, scoped, authored, instrumented, integrated, productionized, validated, optimized, refactored*.

---

## Final-version pattern

Pick **3 bullets max** for any role. The shape that works:

```
[VERB] [WHAT] [QUANTIFIED IMPACT] — [MECHANISM] in [STACK].
```

Example:

> **Architected** a six-domain life-management web app **shipping 50+ REST endpoints across 18 normalized Prisma models** — strict repository pattern, JWT-based auth, IndexedDB-backed offline sync — in Next.js 16, React 19, TypeScript, and PostgreSQL.

---

> **Up:** [Portfolio docs](./) · [Docs index](../README.md)
> **Related:** [Elevator pitch](./elevator-pitch.md) · [Highlights](./highlights.md)
