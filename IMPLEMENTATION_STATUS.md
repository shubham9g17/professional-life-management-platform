# Implementation Status

> **Authoritative inventory:** see [`Features.md`](./Features.md) for what exists and [`Test.md`](./Test.md) for what's verified. This document gives a high-level snapshot.

## Domain coverage

Each domain has a working page under `app/(dashboard)/` and a backing REST API under `app/api/`. CRUD on every entity is verified end-to-end by `tests/e2e/crud.spec.ts`; side-effect endpoints (completion flows, stats, exports, sync, etc.) are verified by `tests/e2e/side-effects.spec.ts`.

| Domain | Page | API surface | E2E status |
|---|---|---|---|
| Tasks | `/tasks` (Board / List / Calendar / Timeline) | `/api/tasks`, `/api/tasks/[id]`, `/api/tasks/[id]/complete` | ✅ CRUD + soft-delete + dialog UI smoke |
| Habits | `/habits` | `/api/habits`, `/api/habits/[id]`, `/api/habits/[id]/complete` | ✅ CRUD + completion side-effect |
| Finance | `/finance` | `/api/transactions[/...]`, `/api/budgets[/...]`, `.../stats` | ✅ CRUD + duplicate-category 409 + dialog UI smoke |
| Fitness | `/fitness` | `/api/exercises[/...]`, `/api/fitness-goals[/...]`, `/api/health-metrics`, `.../stats` | ✅ CRUD + upsert + `?withProgress=true` |
| Nutrition | `/nutrition` | `/api/meals[/...]`, `/api/water[/...]`, `.../stats` | ✅ CRUD + nutrition stats |
| Learning | `/learning` | `/api/learning/resources[/...]`, `.../stats` | ✅ CRUD + auto-`completedAt` + additive `timeInvested` |
| Analytics | `/analytics` | `/api/analytics/{insights,overview,trends,reports}`, `/api/dashboard/overview`, `/api/achievements` | ✅ All endpoints respond + invalid type rejected |
| Notifications | `/notifications` | `/api/notifications[/...]`, `/api/notifications/preferences` | ✅ List + markAllRead + 404 on unknown id + preferences validation |
| Integrations | `/integrations` | `/api/integrations[/...]`, OAuth connect/callback/sync | ✅ List + 400 on bogus provider; OAuth flow not e2e-tested (requires real creds) |
| Sync | (background) | `/api/sync/{queue,status,resolve-conflict}` | ✅ Apply CREATE op + status shape + non-array rejection |
| Export / GDPR | (background) | `/api/export`, `/api/user/{export,data-retention,delete}` | ✅ JSON/CSV + invalid format + GDPR endpoints; `delete` excluded from e2e |
| Cron | (background) | `/api/cron/{cleanup,metrics-aggregation}` | ✅ Reachable (200 if `CRON_SECRET` unset, 401 if set) |
| Health | (public) | `/api/health` | ✅ DB + Redis + memory blocks present |

## Test verification status

| Layer | Tool | Suite | Last run on `--project=laptop` |
|---|---|---|---|
| Unit / property | Vitest + fast-check | `lib/**/__tests__/` | (run via `npm test`) |
| E2E auth | Playwright | `tests/e2e/auth.spec.ts` | 4/4 |
| E2E CRUD | Playwright | `tests/e2e/crud.spec.ts` | 14/14 |
| E2E side-effects | Playwright | `tests/e2e/side-effects.spec.ts` | 37 passed, 1 `.fixme` (see Known issues) |
| Per-page render | Playwright | `tests/e2e/functionality.spec.ts` | 11/11 |
| Visual snapshots | Playwright | `tests/e2e/visual.spec.ts` | 2/2 |

Total e2e: **68 passed, 1 skipped** in ~5.8 min on a single laptop project.

## Bugs found and fixed in this iteration

| Bug | Location | Fix |
|---|---|---|
| `TaskForm` shipped `dueDate: ''` to the API; Zod's `.datetime().optional()` rejects empty strings (always 400 when due date was empty) | `components/tasks/task-form.tsx` | `handleSubmit` omits empty `dueDate`; converts non-empty to ISO via `new Date(...).toISOString()` |
| `TaskForm` and `TransactionForm` shipped the `<input type="datetime-local">` format (`YYYY-MM-DDTHH:mm`, no timezone); Zod's `.datetime()` requires a UTC offset (always 400 when a date was set) | `components/tasks/task-form.tsx`, `components/finance/transaction-form.tsx` | Convert to full ISO in `handleSubmit` before calling `onSubmit` |
| `PATCH /api/notifications/[id]` returned 500 on unknown id instead of 404 (Prisma `update` throws `P2025`; the `if (!notification)` branch was dead code) | `lib/repositories/notification-repository.ts` | `markAsRead` does `findFirst` first, returns `null` if missing |
| `PATCH /api/notifications/preferences` accepted `25:99` as quiet hours (regex was shape-only, not range-aware) | `app/api/notifications/preferences/route.ts` | Tightened regex to `^([01]\d\|2[0-3]):[0-5]\d$` |

## Known issues (not yet fixed)

| Issue | Impact | Required action |
|---|---|---|
| `prisma/schema.prisma` declares `DailyMetrics.date @unique` *and* `@@unique([userId, date])`. The standalone `@unique` lets only one user platform-wide own a metrics row per date. | Every user except the first to complete a task on a given date gets a 500 from `POST /api/tasks/[id]/complete`. Invisible in single-user dev; immediate failure under multi-user load or in e2e (where each run signs up a new user). | Drop the field-level `@unique` (keep the composite) → `npx prisma migrate dev --name fix_dailymetrics_unique` → drop `.fixme` from `tests/e2e/side-effects.spec.ts` |

## Cross-cutting features (verified by tests / configured in code)

- **Auth**: NextAuth credentials provider, JWT 7-day expiry, bcrypt hashing, signup rate-limited 5/15 min/IP. Session-cookie–gated by `proxy.ts` (Next.js 16 middleware rename). Verified by `auth.spec.ts`.
- **Data layer**: Prisma over PostgreSQL, repositories in `lib/repositories/*` are the only `prisma.*` callers. String-typed enums + JSON-encoded array fields per the convention in `CLAUDE.md`. Verified by every CRUD test.
- **Errors**: Typed errors in `lib/error/*`, centralized via `handleApiError`. Correlation IDs threaded through logs and responses. Verified by negative-path tests in `side-effects.spec.ts`.
- **Caching**: `lib/redis.ts` — gated by `ENABLE_REDIS`; cache calls become safe no-ops when disabled. Cache keys live in `lib/cache/repository-cache.ts`.
- **Audit**: `auditLogger.logDataAccess` on mutating endpoints (`lib/logging/audit.ts`).
- **Offline**: IndexedDB sync queue (`lib/offline/`) — server-side endpoints verified by `side-effects.spec.ts`; client-side reconciliation requires a real browser+offline scenario and is covered in `lib/offline/__tests__/` (Vitest).
- **Security**: `lib/security/api-wrapper.ts` (`secureApiRoute`), rate limiting via `lib/security/rate-limit-middleware.ts`, GDPR via `lib/security/gdpr-compliance.ts` (export + delete-cascade).

## Build status

✅ TypeScript builds cleanly
✅ E2E suite green on `--project=laptop` (1 known `.fixme` for the schema bug)
✅ React Compiler enabled (Next.js 16, React 19)

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 with React Compiler, Tailwind CSS v4, Radix UI primitives |
| State | Zustand (client), TanStack Query (server) |
| Database | PostgreSQL via Prisma |
| Auth | NextAuth.js (JWT, credentials, bcrypt) |
| Validation | Zod (route bodies + form schemas) |
| Cache | Redis (optional, gated) |
| Tests | Vitest + fast-check (unit / property), Playwright (e2e) |

## Where things live

```
app/(dashboard)/<domain>/page.tsx     # Authenticated pages
app/api/<domain>/route.ts             # REST endpoints
components/<domain>/*.tsx             # Domain components
lib/repositories/<domain>-repository  # Only place that calls prisma.*
prisma/schema.prisma                  # Source of truth for DB
proxy.ts                              # Auth middleware (Next 16 rename)
tests/e2e/*.spec.ts                   # Playwright suites
Features.md / Test.md                 # Inventory + test plan
```

---

**Last verified:** 2026-04-29 (`npx playwright test --project=laptop` → 68 passed, 1 skipped)
