# Project Highlights

Five technically interesting pieces of this project, picked for what they demonstrate. Each is something I can talk about in detail in an interview.

---

## 1. Cross-domain analytics with a `DailyMetrics` aggregation table

**What:** Every side-effect-bearing mutation (task complete, habit complete, exercise log, meal log, water log, learning progress) calls `updateDailyMetrics(userId, today)`, which upserts a row in `DailyMetrics` keyed by `(userId, date)`. That row stores per-day Productivity / Wellness / Growth / Overall scores plus the raw counts and the user's rolling 30-day score.

**Why it's interesting:** the analytics page can compute things like *"how does your productivity differ on exercise days?"* in O(N) over the period (N = ~30–90 rows) instead of joining four large activity tables. The scores are computed once on write, read many times.

**Where to look:**
- `lib/analytics/metrics-engine.ts` — the upsert logic and score computations.
- `lib/repositories/analytics-repository.ts` — `getDomainStats`, `getCorrelations`, `getOverviewStats`.
- `prisma/schema.prisma` — the `DailyMetrics` model.

**Talking point:** *"I designed an aggregation table because the alternative — recomputing scores from raw activity tables on every dashboard load — would not scale and would couple the analytics layer to schema changes in every domain."*

---

## 2. Group-by-mean correlation analysis

**What:** Five fixed comparisons that ask *"on days you do X, is your Y score higher or lower?"* — for example, *"productivity score on days with exerciseMinutes ≥ 30 vs. days without."* Output is a sentence: *"+27 % on exercise days"*.

**Why it's interesting:** Pearson correlation (`r ∈ [-1, 1]`) is the textbook answer here, but it's hostile to non-statisticians. Group-by-mean produces a sentence the user can act on with no statistics background — and is mathematically more honest about a small N.

**Where to look:** `lib/repositories/analytics-repository.ts → getCorrelations`. ADR-0008 records the trade-off.

**Talking point:** *"The right algorithm depends on the audience. We chose interpretability over statistical purity because the analytics page is for the user, not for a data scientist."*

---

## 3. Offline-first with IndexedDB queue + server conflict resolution

**What:** Every mutation is written first to a local IndexedDB queue, then the UI updates optimistically. When connectivity returns, the queue posts to `/api/sync/queue`. The server detects conflicts (existing row on `CREATE`, server `updatedAt > local` on `UPDATE`) and writes a `ConflictResolution` row that the user can resolve explicitly.

**Why it's interesting:** most apps either don't support offline at all, or "support" it with last-write-wins semantics that silently destroy work. This system surfaces conflicts honestly — the user decides which version to keep.

**Where to look:**
- Client: `lib/offline/sync-queue.ts`, `lib/offline/use-optimistic-mutation.ts`.
- Server: `app/api/sync/queue/route.ts`, `app/api/sync/resolve-conflict/route.ts`.
- Schema: `SyncQueue`, `ConflictResolution` models.
- ADR-0007 records the design.

**Talking point:** *"The hard part of offline isn't the queue — it's the conflict resolution. Last-write-wins is a euphemism for losing data; we made the trade-off explicit by surfacing conflicts to the user."*

---

## 4. Strict repository pattern as the only `prisma.*` boundary

**What:** Routes never call `prisma.*` directly. Every database access goes through `lib/repositories/<entity>-repository.ts`, which owns: the Prisma calls, cache invalidation, soft-delete semantics, audit logging, and any cross-entity side effects (e.g. `taskRepository.completeTask` triggers the daily-metrics update).

**Why it's interesting:** when caching, audit, or soft-delete needs to change, it changes in *one* file. Routes stay tiny — auth check, validate, delegate, return. Every important operational concern lives in a layer where it can be enforced.

**Where to look:** `lib/repositories/`. ADR-0005 records the convention.

**Talking point:** *"The boundary is enforced by convention, not the type system, so I documented it in CLAUDE.md and reviewed every route to ensure no leaks. The discipline buys back composability."*

---

## 5. Dual `<BentoCard>` + `.bento-card` design system with light-mode awareness

**What:** Two card primitives that look identical: `<BentoCard>` (React component, animated, used in the dashboard) and `.bento-card` (CSS class, static, used in 27 module pages). Both live atop a CSS-variable-based token system that supports light + dark mode through `--card`, `--background`, `--border` etc.

**Why it's interesting:** the obvious approach (one component everywhere) bloats the bundle with Framer Motion code where it isn't needed. The dual-primitive approach kept the dashboard's polish without forcing every static stat panel to pay for it.

A subtle bug surfaced during a light-mode polish session: the CSS class had been shipped without the shadow that the component had, making 27 places look flat in light mode while the dashboard looked layered. The fix unified them and adds `.dark .bento-card { box-shadow: none }` because dark mode separates cards via brightness step (#18181b on #09090b), not shadow.

**Where to look:** `app/globals.css`, `components/dashboard/bento-card.tsx`. ADR-0006 records the decision.

**Talking point:** *"Design systems are programs that other developers run. The bug — flat cards in light mode — was caused by two primitives drifting apart. The fix wasn't 'rewrite everything'; it was 'make the CSS class match the React component's surface treatment.'"*

---

## Honorable mentions

- **Audit logging on every mutation** — `auditLogger.logDataAccess(userId, action, resource, id, meta)`. Useful in real production; demonstrates security-mindfulness in a college project.
- **Health endpoint** — `GET /api/health` reports DB + Redis + memory status. The hooks for production monitoring exist even though there's no production deployment by default.
- **Typed errors with correlation IDs** — `lib/error/*` defines a class hierarchy; `handleApiError` formats every error type into a consistent JSON shape; correlation IDs thread through logs and responses.
- **Form-level date conversion** — the canonical pattern in `components/tasks/task-form.tsx` (omit empty optional dates; convert `<input type="datetime-local">` to ISO before submit) prevents an entire class of 400 errors.

---

> **Up:** [Portfolio docs](./) · [Docs index](../README.md)
> **Next:** [Interview talking points](./interview-talking-points.md)
