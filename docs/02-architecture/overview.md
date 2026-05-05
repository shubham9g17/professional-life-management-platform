# Architecture Overview

A single-page system view: what the project is made of, how a request flows, and where each layer lives.

> **Audience:** anyone who wants to grasp the whole system in five minutes — student, teacher, or interviewer.
> **Read after:** [installation](../01-onboarding/installation.md). **Read with:** [data layer](./data-layer.md), [authentication](./authentication.md).

---

## System diagram

```mermaid
flowchart TB
  subgraph Client["Browser (React 19 + React Compiler)"]
    UI[App Router pages]
    State[Zustand + TanStack Query]
    Offline[IndexedDB sync queue]
  end

  subgraph Edge["Next.js 16 server"]
    Proxy[proxy.ts<br/>auth middleware]
    RouteGroup[/app/\(dashboard\)/*<br/>protected pages/]
    API[/app/api/*/<br/>route handlers/]
  end

  subgraph DataLayer["Data layer"]
    Repos[lib/repositories/*<br/>only callers of prisma.*]
    Cache[(Redis<br/>optional, gated)]
    Audit[lib/logging/audit.ts]
  end

  subgraph Persistence["Persistence"]
    DB[(PostgreSQL<br/>18 Prisma models)]
  end

  subgraph CrossCut["Cross-cutting"]
    Auth[NextAuth<br/>JWT, bcrypt]
    Errors[lib/error/*<br/>typed errors]
    Metrics[DailyMetrics<br/>aggregation table]
  end

  Client -->|fetch| Proxy
  Proxy -->|allowed routes| RouteGroup
  Proxy -->|allowed| API
  RouteGroup -->|getServerSession| Auth
  API -->|validate via Zod| Repos
  API -->|getServerSession| Auth
  Repos --> Cache
  Repos --> DB
  Repos --> Audit
  API -->|on side-effect| Metrics
  Metrics --> DB
  Offline -. background sync .-> API
```

## Request lifecycle

A typical authenticated request flows like this:

```
1.  Browser sends fetch('/api/tasks', { method: 'POST', body: ... })
2.  proxy.ts intercepts — checks for 'next-auth.session-token' cookie
       └─ no cookie?  → 302 to /auth/signin
       └─ cookie ok   → continue
3.  app/api/tasks/route.ts (POST handler) runs:
       a. getServerSession(authOptions) → resolves user.id from JWT
       b. body parsed; Zod schema validates shape + enum values
       c. taskRepository.createTask(userId, validated) is called
4.  taskRepository:
       a. prisma.task.create(...) writes the row
       b. cache.invalidate('tasks:userId') — no-op if Redis disabled
       c. auditLogger.logDataAccess(userId, AuditAction.CREATE, ...)
5.  Route handler returns NextResponse.json({ task }, { status: 201 })
6.  Client TanStack Query updates the query cache; UI re-renders
```

A side-effect-bearing mutation (task complete, habit complete, exercise log) adds **step 7**: the repository calls `updateDailyMetrics(userId, date)` from `lib/analytics/metrics-engine.ts`, which upserts the `DailyMetrics` row for that day and recomputes the user's rolling sub-scores. This is the data the analytics page reads.

## Layers and responsibilities

| Layer | Where | What it owns |
|---|---|---|
| **Routing & rendering** | `app/`, `proxy.ts` | URL → component, auth gating, route groups, server vs. client components. |
| **API surface** | `app/api/**/route.ts` | HTTP contract, Zod validation, NextAuth session check, JSON shape. |
| **Repository** | `lib/repositories/*` | Single source of `prisma.*` calls; soft-delete, caching, audit. |
| **Domain primitives** | `lib/{auth,error,security,offline,redis,...}` | Cross-cutting policy: auth config, typed errors, rate limit, etc. |
| **UI components** | `components/{ui,dashboard,tasks,habits,...}` | Presentational + interactive. UI primitives (`components/ui`) are shadcn-style. |
| **Schema** | `prisma/schema.prisma` | Source of truth for the data model. |
| **Tests** | `lib/**/__tests__/`, `tests/e2e/` | Vitest unit + property tests; Playwright e2e. |

## Data model at a glance

18 Prisma models, all owned by `User` with cascade-on-delete relations. Domains:

- **Core:** `User`
- **Productivity:** `Task`, `Habit`, `HabitCompletion`
- **Finance:** `Transaction`, `Budget`
- **Fitness/Health:** `Exercise`, `HealthMetric`, `FitnessGoal`
- **Nutrition:** `Meal`, `WaterIntake`
- **Learning:** `LearningResource`
- **Analytics:** `DailyMetrics`, `Achievement`
- **System:** `Notification`, `SyncQueue`, `ConflictResolution`, `Integration`

Full ERD: [`../assets/erd.svg`](../assets/erd.svg) (auto-generated). Detailed model docs: [`./data-layer.md`](./data-layer.md).

## Cross-cutting policies

| Policy | Lives in | Read more |
|---|---|---|
| Authentication (JWT, 7-day, bcrypt) | `lib/auth/config.ts`, `proxy.ts` | [authentication.md](./authentication.md) |
| Caching (Redis, gated, no-op when off) | `lib/redis.ts`, `lib/cache/repository-cache.ts` | [caching-strategy.md](./caching-strategy.md) |
| Errors (typed, correlation-id-threaded) | `lib/error/*`, `handleApiError` | [error-handling.md](./error-handling.md) |
| Theming (CSS-variable tokens, `.bento-card` surface) | `app/globals.css`, `components/dashboard/bento-card.tsx` | [theme-system.md](./theme-system.md) |
| Offline + sync (IndexedDB → server queue + conflicts) | `lib/offline/*`, `app/api/sync/*` | [offline-and-sync.md](./offline-and-sync.md) |
| Audit (mutating endpoints log who did what) | `lib/logging/audit.ts` | inline in [data-layer.md](./data-layer.md) |
| Rate limiting | `lib/security/rate-limit-middleware.ts` | [../05-operations/security.md](../05-operations/security.md) |

## Why these choices

Every architectural choice has its own short Architecture Decision Record:

- **[ADR-0001](../adr/0001-nextjs-16-app-router.md)** — Next.js 16 with App Router (over Pages Router or Remix).
- **[ADR-0002](../adr/0002-prisma-over-drizzle.md)** — Prisma (over Drizzle, raw SQL, etc.).
- **[ADR-0003](../adr/0003-string-enums-not-prisma-enums.md)** — String-typed enums, validated by Zod, instead of native Prisma enums.
- **[ADR-0004](../adr/0004-jwt-vs-database-sessions.md)** — JWT sessions over database-backed sessions.
- **[ADR-0005](../adr/0005-repository-pattern.md)** — Repository pattern as the only `prisma.*` boundary.
- **[ADR-0006](../adr/0006-bento-card-design-system.md)** — Dual `<BentoCard>` + `.bento-card` surface system.
- **[ADR-0007](../adr/0007-offline-first-with-indexeddb.md)** — IndexedDB queue + conflict resolution for offline.
- **[ADR-0008](../adr/0008-group-by-mean-vs-pearson-correlations.md)** — Group-by-mean for correlations, not Pearson r.

---

> **Next:** [Routing & rendering](./routing-and-rendering.md) · [Data layer](./data-layer.md) · [Authentication](./authentication.md)
> **Up:** [Docs index](../README.md)
