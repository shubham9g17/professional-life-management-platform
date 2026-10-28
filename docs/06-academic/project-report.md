# Project Report — Professional Life Management Platform

> **Author:** [Your Name]
> **Course:** [Course / Program]
> **Institution:** [University Name]
> **Submitted:** [Date]
> **Supervisor:** [Supervisor Name]

This report follows the standard CS final-year project report structure. Headings can be renamed to match a department-specific template; the content underneath each section is the substance.

---

## Abstract

The **Professional Life Management Platform** is a unified web application that consolidates six historically siloed life-management domains — task management, habit tracking, personal finance, fitness logging, nutrition tracking, and continuous learning — into a single coherent system, with cross-domain analytics that surface patterns no single-purpose app can detect.

The system is built on Next.js 16 (App Router, React 19 with the React Compiler), TypeScript, Prisma over PostgreSQL, and NextAuth.js. It adopts a strict repository pattern, an offline-first architecture with IndexedDB-backed conflict resolution, role-aware audit logging, and a CSS-variable-based theming system supporting both light and dark modes.

Beyond the per-domain CRUD surface, the platform ships a `DailyMetrics` aggregation table and a metrics engine that produces a daily Productivity / Wellness / Growth score for each user. This in turn powers a single-page analytics dashboard with period-aware trend charts, per-domain stats, and **group-by-mean cross-domain correlations** (e.g. *"on days you exercise ≥ 30 min, your productivity score is 27 % higher"*) — a feature explicitly intended to be more interpretable than Pearson coefficients for a lay audience.

The implementation is verified by 68 Playwright end-to-end tests across four viewports, plus Vitest unit and property-based tests against the repository layer. The codebase totals approximately 18,000 lines of TypeScript across 18 Prisma models and ~50 API routes.

**Keywords:** full-stack web development, Next.js, React, TypeScript, Prisma, PostgreSQL, offline-first, repository pattern, data aggregation, cross-domain analytics, design systems.

---

## 1. Introduction

### 1.1 Background

Working professionals juggle obligations across many disconnected domains. Tasks are tracked in one app, habits in another, finances in a third, fitness in a fourth, and so on. Even when each individual app is well-designed, the *interaction* between domains — *"do I sleep better on days I exercise?"*, *"does my productivity drop when I skip lunch?"* — is invisible to any single tool.

This project addresses that gap by consolidating six domains into one application *and* implementing a lightweight cross-domain analytics layer that makes the interactions visible.

### 1.2 Motivation

Three motivations drove this project:

1. **A real problem with no good single-application solution.** Existing apps optimize for one domain and treat the others as integrations at best.
2. **An opportunity to apply nearly every CS subject in a coherent way** — databases (relational design + aggregation), networks (HTTP, REST, auth tokens), software engineering (separation of concerns, testing strategy), HCI (responsive design, accessibility), distributed systems (offline-first sync with conflict resolution), and mathematics (group-by-mean correlation analysis).
3. **A portfolio-worthy artifact.** A project that demonstrates production-grade engineering practices is more valuable for early-career interviews than a feature-rich prototype.

### 1.3 Objectives

| # | Objective | How it's met |
|---|---|---|
| O1 | Provide CRUD across six life-management domains with a coherent UI | Six `app/(dashboard)/` routes, six per-domain repositories, ~50 API endpoints. |
| O2 | Authenticate users securely | NextAuth.js credentials provider with JWT, bcrypt hashing, signup rate limiting. |
| O3 | Persist data in a normalized relational schema | 18 Prisma models, all owned by `User` with cascade-on-delete relations. |
| O4 | Surface cross-domain analytics | `DailyMetrics` aggregation table + metrics engine + correlation analysis. |
| O5 | Support offline use | IndexedDB queue + conflict-detection-and-resolution endpoints. |
| O6 | Be production-deployable | Health check, structured logging, audit log, rate limiting, CSP headers. |
| O7 | Be testable | 68 Playwright e2e tests + Vitest unit + property tests on `lib/**`. |

### 1.4 Scope and limitations

**In scope:** authenticated single-user accounts, six product domains, analytics, offline support, light/dark theming, accessibility (WCAG-aware), test coverage.

**Out of scope:** multi-user collaboration, real-time features (WebSockets/SSE), mobile-native apps (the web is responsive but no React Native app), payment processing, third-party API integrations beyond stubs.

### 1.5 Document structure

§2 surveys the technology landscape and prior art. §3 presents the system design (architecture, data model, sequence flows). §4 describes the implementation in depth. §5 documents the testing strategy. §6 reports results and screenshots. §7 concludes and proposes future work. §8 lists references.

---

## 2. Literature & Technology Review

### 2.1 Domain-specific apps surveyed

| App | Domain | What's missing |
|---|---|---|
| Todoist, Things | Tasks | No habit / health / finance integration. |
| Habitica, Streaks | Habits | Gamified, but no link to actual outcomes (energy, productivity). |
| Mint, YNAB | Finance | Domain-locked. |
| MyFitnessPal | Nutrition + fitness | No correlation with non-physical domains. |
| Anki, Notion (templates) | Learning | Personal-knowledge-management, not skill tracking. |

The pattern is clear: depth in one domain, no breadth across domains.

### 2.2 Web framework evaluation

| Framework | Verdict |
|---|---|
| Next.js (chosen) | App Router gives ergonomic colocated routing + server components; React Compiler removes most `useMemo` ceremony. |
| Remix | Strong data-loader story but smaller ecosystem; Next.js better-suited for the App Router pattern we wanted. |
| SvelteKit | Excellent performance but smaller TypeScript ecosystem; tighter project-time risk. |
| Plain React + Express | Reinvents what Next.js gives for free (SSR, routing, file-based API). |

### 2.3 Database access evaluation

| Tool | Verdict |
|---|---|
| Prisma (chosen) | Type-safe client, great migrations, mature ecosystem, ideal for a relational schema. |
| Drizzle | Newer, lower-level, but its type-safety story relies more on TS magic. Less mature ecosystem at the time of choosing. |
| Raw SQL + a thin client | Maximum flexibility but every query becomes maintenance overhead. |

ADR-0002 records the decision in detail.

### 2.4 Auth approach

NextAuth.js was chosen over a custom auth implementation because credential management is the wrong place to take chances. Sessions are JWT-based rather than database-backed (ADR-0004) — for a single-server deployment the trade-off (revocation latency vs. database round-trips on every request) favors JWT.

### 2.5 Correlation analysis approach

Two natural candidates for "do these two domains co-vary":

| Approach | Verdict |
|---|---|
| Pearson correlation (`r ∈ [-1, 1]`) | Mathematically standard. But "`r = 0.42`" is not interpretable to a non-technical user; even technical users misinterpret weak correlations. |
| Group-by-mean comparison (chosen) | "On days you do X, Y is Z% higher." Reads as a sentence; the user's understanding matches the math. No interpretation gap. |

ADR-0008 records this trade-off. The implementation is in `lib/repositories/analytics-repository.ts`.

---

## 3. System Design

### 3.1 Architecture diagram

See [`../02-architecture/overview.md`](../02-architecture/overview.md) for the full Mermaid system diagram. Summary:

- **Client tier:** React 19 + React Compiler, Zustand for client state, TanStack Query for server cache, IndexedDB queue for offline.
- **Server tier:** Next.js 16 (App Router), `proxy.ts` middleware for auth gating, route handlers under `app/api/*`, repository layer in `lib/repositories/*`.
- **Data tier:** PostgreSQL (18 Prisma models), optional Redis cache (gated, no-op when disabled).
- **Cross-cutting:** typed errors, audit log, rate limiting, structured logging, security headers.

### 3.2 Layered separation

The codebase enforces a strict layering:

```
UI (components/, app/)
  ↓ fetch
API route (app/api/)
  ↓ delegates
Repository (lib/repositories/)
  ↓ only place that calls
prisma.* (lib/prisma.ts)
  ↓
PostgreSQL
```

**Routes never touch Prisma directly.** This is the single most important convention in the codebase. It centralizes caching, soft-delete, and audit logging into the repository layer where they're guaranteed to be applied consistently.

### 3.3 Data model (ER diagram)

See [`../assets/erd.svg`](../assets/erd.svg) (auto-generated from `prisma/schema.prisma`).

Highlights:
- **`User` is central.** Every other model has a `userId` foreign key with cascade-on-delete.
- **Soft-delete on tasks.** `Task.status='ARCHIVED'` keeps the row but excludes it from list reads. Used for undo and audit purposes.
- **`DailyMetrics` is the aggregation backbone.** Mutating side-effects upsert into it; analytics endpoints read from it. Read [§4.4 Analytics](#44-analytics-engine).
- **`SyncQueue` + `ConflictResolution`** support the offline-first architecture (§4.5).

### 3.4 Sequence: a typical write request

```
Browser ──POST /api/tasks──> proxy.ts (auth check)
                              ↓ session ok
                            app/api/tasks/route.ts
                              ↓ Zod validation
                            taskRepository.createTask(userId, data)
                              ↓ writes via prisma
                              ↓ invalidates cache
                              ↓ logs audit event
                            ← returns 201 with task
```

### 3.5 Sequence: a side-effect-bearing mutation

`POST /api/tasks/[id]/complete` adds two extra steps:

```
... (same as above through repository) ...
taskRepository.completeTask(taskId, userId)
  ↓ marks task COMPLETED
updateDailyMetrics(userId, today)
  ↓ recomputes today's productivity / wellness / growth scores
  ↓ upserts DailyMetrics row
recomputeUserScore(userId, days=30)
  ↓ updates User.productivityScore (rolling 30-day avg)
```

This is what makes the analytics page reactive to single user actions.

---

## 4. Implementation

### 4.1 Routing & rendering

Next.js 16 App Router. Two route groups:

| Group | Path | Purpose |
|---|---|---|
| `(dashboard)` | `app/(dashboard)/...` | Authenticated app pages — share the sidebar/header layout. |
| (auth pages) | `app/auth/...` | Sign-in / sign-up / sign-out. Public. |

`proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`) gates everything except `/auth/*`, `/api/auth/*`, and static assets. See `docs/02-architecture/routing-and-rendering.md`.

### 4.2 Authentication

NextAuth.js (`lib/auth/config.ts`) credentials provider. Bcrypt hashing on signup; JWT-strategy sessions with a 7-day expiry. The session callback injects `user.id` into both the JWT and `session.user`. API routes read `session.user.id` via `getServerSession(authOptions)`.

Signup is rate-limited at 5 attempts per 15 minutes per IP via `lib/security/rate-limit-middleware.ts`.

See [`../02-architecture/authentication.md`](../02-architecture/authentication.md).

### 4.3 Data layer

- **Prisma 6** with PostgreSQL.
- **Repositories** in `lib/repositories/*` are the only place that calls `prisma.*`.
- **Enums are `String` columns** with Zod validation in code, not native Prisma enums (ADR-0003).
- **Array fields are JSON-encoded strings** (`Task.tags` etc.) for Prisma simplicity.
- **Soft-delete on tasks** (`status='ARCHIVED'`) excluded by default in list reads.
- **Audit logging** (`lib/logging/audit.ts`) on every mutating endpoint.

See [`../02-architecture/data-layer.md`](../02-architecture/data-layer.md).

### 4.4 Analytics engine

The system computes per-day Productivity / Wellness / Growth / Overall scores in a `DailyMetrics` row per user per day. Side-effect-bearing mutations call `updateDailyMetrics(userId, date)` which upserts the row.

Five fixed correlation comparisons are implemented:

| ID | Compares | Condition |
|---|---|---|
| `prod-vs-exercise` | productivity score | days with exerciseMinutes ≥ 30 |
| `prod-vs-streak` | productivity score | full-streak days (all habits done) |
| `wellness-vs-nutrition` | wellness score | days with calories tracked |
| `wellness-vs-water` | wellness score | days with water goal met |
| `growth-vs-learning` | growth score | days with learning > 0 min |

Each result needs ≥ 3 days on each side or it's dropped. Direction (`POSITIVE`/`NEGATIVE`/`NEUTRAL`) uses a 5 % threshold.

See `lib/repositories/analytics-repository.ts` and [`../03-features/analytics.md`](../03-features/analytics.md).

### 4.5 Offline & sync

`lib/offline/` implements an IndexedDB queue. Mutations performed while offline are recorded locally; when connectivity returns, the queue posts to `/api/sync/queue`. The server detects conflicts (e.g. an existing row on a `CREATE` op, or `server.updatedAt > local.updatedAt` on `UPDATE`) and writes a `ConflictResolution` row. The user is notified and can resolve via `/api/sync/resolve-conflict`.

See [`../02-architecture/offline-and-sync.md`](../02-architecture/offline-and-sync.md).

### 4.6 Theming and design system

CSS-variable-based semantic tokens in `app/globals.css`. Two card primitives — `<BentoCard>` (React component, used in dashboard) and `.bento-card` (CSS class, used in 27 other places) — both ship the same surface treatment, including a light-mode-only shadow that gives cards depth on the off-white page background. ADR-0006 records why both exist.

See [`../02-architecture/theme-system.md`](../02-architecture/theme-system.md).

### 4.7 Error handling

Typed errors in `lib/error/*` (`AuthenticationError`, `ValidationError`, `AppError`, etc.). API routes wrap their bodies in `try/catch`, calling `handleApiError(error, correlationId)` which formats every known error class into a consistent JSON response shape. Correlation IDs thread through logs and responses. See [`../02-architecture/error-handling.md`](../02-architecture/error-handling.md).

---

## 5. Testing & Validation

### 5.1 Strategy

Two tools, two scopes:

- **Vitest** for `lib/**` — unit + property-based tests. Coverage scoped to `lib/`. UI is intentionally not tested at this layer.
- **Playwright** for `tests/e2e/` — end-to-end. Five spec files: `auth`, `crud`, `side-effects`, `functionality`, `visual`. Runs against `--project=laptop` (other viewports are subsets).

A `globalSetup` signs up one fresh user per Playwright run; specs share auth state via `storageState`. Tests self-clean (create-then-delete) so the DB stays consistent across runs.

### 5.2 Coverage

| Layer | Tool | Result |
|---|---|---|
| Unit / property | Vitest + fast-check | (see `npm run test:coverage`) |
| E2E auth | Playwright | 4/4 |
| E2E CRUD | Playwright | 14/14 |
| E2E side-effects | Playwright | 37/37 (1 `.fixme` for the `DailyMetrics` migration) |
| Per-page render | Playwright | 11/11 |
| Visual snapshots | Playwright | 2/2 |

**68 e2e tests passing in ~5.8 minutes on a single laptop project.** See [`../../Test.md`](../../Test.md).

### 5.3 Quality gates

- TypeScript compiles cleanly (no `any`, no `--skipLibCheck` cheats).
- ESLint flat config with strict rules; lint runs in CI.
- React Compiler enabled (no manual `useMemo`/`useCallback` overhead).
- Health-check endpoint `/api/health` reports DB + Redis + memory status.

---

## 6. Results & Screenshots

### 6.1 Pages delivered

| Page | Route | Status |
|---|---|---|
| Dashboard | `/dashboard` | ✅ Cashflow hero + 4 KPI tiles + activity feed + 8 quick actions |
| Tasks | `/tasks` | ✅ Board / List / Calendar / Timeline views |
| Habits | `/habits` | ✅ Tracker + GitHub-style calendar + progress charts |
| Finance | `/finance` | ✅ Transactions + budgets w/ MTD spend |
| Fitness | `/fitness` | ✅ Exercise log + health metrics + goals |
| Nutrition | `/nutrition` | ✅ Meals + water tracking + macro breakdown |
| Learning | `/learning` | ✅ Resources + progress + skill matrix |
| Analytics | `/analytics` | ✅ Single-scroll: hero, trends, domain grid, correlations, insights, achievements, report dialog |
| Notifications | `/notifications` | ✅ List + preferences |
| Integrations | `/integrations` | ✅ Connection list (OAuth flow scaffolded) |

### 6.2 Screenshots

See [`../assets/screenshots/`](../assets/screenshots/) for:

- Dashboard (light + dark)
- Analytics overview
- Tasks board
- Habit calendar
- Finance overview
- Fitness goals
- Nutrition tracker
- Learning resources

> **Capture instructions:** with `npm run dev` running, sign in, navigate to each page, screenshot the viewport at 1440×900 (laptop). Name files `<page>-<theme>.png`. Replace placeholders.

### 6.3 Quantitative summary

| Metric | Value |
|---|---|
| Lines of TypeScript | ~18,000 |
| Prisma models | 18 |
| API endpoints | ~50 |
| React components | ~80 |
| E2E tests | 68 passing |
| Lighthouse score (production build) | [fill in after deployment] |

---

## 7. Conclusion & Future Work

### 7.1 Conclusion

The project demonstrably meets all seven stated objectives (§1.3). It exhibits production-grade engineering practices — strict layering, typed errors, audit logging, rate limiting, accessibility, offline support, an aggregation table designed for analytics — that are uncommon in coursework projects. The architecture is documented down to ADR-level decision records (`docs/adr/`), making the reasoning behind every choice inspectable.

### 7.2 Limitations

See [`./future-work.md`](./future-work.md) for the full list. Headlines:

1. **Single-user accounts only.** No collaboration, no shared workspaces.
2. **No real-time updates.** All data fetches are pull-based with a 5-minute auto-refresh.
3. **Correlations are fixed.** The five comparisons are hard-coded; users cannot define custom ones.
4. **Reports export to CSV only.** PDF would require a server-side renderer (jsPDF or Puppeteer).
5. **Integrations are scaffolded but not deeply wired.** OAuth flow exists; provider-specific sync is stubbed.

### 7.3 Future work

See [`./future-work.md`](./future-work.md). Highlights: multi-user collaboration, custom user-defined correlation queries, AI-generated insights, native mobile via React Native, real-time updates via Server-Sent Events.

---

## 8. References

See [`./references.md`](./references.md) for the full citation list.

---

## Appendix A — Repository structure

See [`../01-onboarding/codebase-tour.md`](../01-onboarding/codebase-tour.md) for the narrated walk-through.

## Appendix B — Architecture Decision Records

Eight ADRs documenting non-trivial engineering choices live in [`../adr/`](../adr/). Each follows the standard Context / Decision / Status / Consequences format.

## Appendix C — Test inventory

See [`../../Test.md`](../../Test.md) for the per-feature spec mapping.

---

> **Up:** [Docs index](../README.md) · [Academic materials](./)
