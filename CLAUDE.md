# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
# Dev server (Turbopack via Next 16)
npm run dev

# Production build / start
npm run build
npm start

# Lint (flat ESLint config, eslint.config.mjs)
npm run lint

# Vitest (unit / property-based; jsdom + Testing Library + fast-check)
npm test                         # one-shot run
npm run test:watch               # watch mode
npm run test:ui                  # Vitest UI
npm run test:coverage            # v8 coverage; only `lib/**` is included for coverage

# Run a single Vitest file or pattern
npx vitest run lib/repositories/__tests__/habit-repository.test.ts
npx vitest run -t "name of test case"

# Playwright e2e (requires `npm run dev` running in another terminal)
npx playwright test --project=laptop                       # full e2e run
npx playwright test crud.spec.ts --project=laptop          # one spec
npx playwright test -g "Tasks CRUD" --project=laptop       # by test name

# Prisma (schema is `prisma/schema.prisma`, datasource = PostgreSQL)
npx prisma migrate dev           # apply migrations in dev
npx prisma generate              # regenerate client after schema edits
npx prisma studio                # browse DB
```

`prisma.config.ts` overrides defaults — it loads `.env` via `dotenv/config` and pins the `classic` engine. Run Prisma commands through `npx prisma` so this config is picked up.

## Architecture

### Routing & rendering (Next.js 16, App Router, React 19, React Compiler enabled)

- **Route group `app/(dashboard)/`** — all authenticated app pages (`tasks`, `habits`, `finance`, `fitness`, `nutrition`, `learning`, `analytics`, `integrations`, `notifications`, plus `dashboard/`). They share `app/(dashboard)/layout.tsx` (sidebar + header) and inherit auth gating from the root middleware. New protected pages go here — no per-page auth wrapper needed.
- **`app/api/*`** — REST endpoints, one folder per domain. Routes use `getServerSession(authOptions)` and the `lib/repositories/*` modules; many are also wrapped via `lib/security/api-wrapper.ts` (`secureApiRoute`) which centralizes auth, rate limiting, and security headers.
- **`proxy.ts` at the project root is the auth middleware** (Next.js 16 renamed `middleware.ts` → `proxy.ts`; do not recreate `middleware.ts`). It uses `next-auth/middleware` `withAuth` and a matcher that excludes `/api/auth`, static assets, and images. `/` and `/auth/*` are always allowed; everything else requires a session cookie.

### Data layer

- **Prisma over PostgreSQL** is the source of truth. The schema models 18 entities centered on `User`, with cross-domain relations (`Task`, `Habit`/`HabitCompletion`, `Transaction`/`Budget`, `Exercise`/`HealthMetric`/`FitnessGoal`, `Meal`/`WaterIntake`, `LearningResource`, `DailyMetrics`, `Achievement`, `Notification`, `SyncQueue`/`ConflictResolution`, `Integration`).
- **String-typed enums + JSON-encoded arrays.** Fields like `Task.workspace`, `Task.priority`, `Task.status` are `String` (validated in code via Zod), and array fields like `Task.tags` are stored as `String @default("[]")` and `JSON.stringify`/`JSON.parse`'d at the API boundary. Preserve this contract when adding fields — don't introduce native Prisma enums or JSON columns without migrating existing rows and call sites.
- **Repositories in `lib/repositories/*`** are the only place that should call `prisma.*` directly. API routes go through them so caching, soft-delete (e.g. tasks with `status: 'ARCHIVED'` are excluded by default), and audit logging stay consistent.
- **Prisma client is a global singleton** (`lib/prisma.ts`) to survive Next.js dev hot-reload. Don't `new PrismaClient()` elsewhere.

### Auth

- NextAuth.js (`lib/auth/config.ts`) with a credentials provider, JWT strategy, 7-day expiry, bcrypt password hashing. Sessions inject `user.id` into both the JWT and `session.user`; API code reads it via `getServerSession(authOptions)`.
- Cookie names are deliberately `next-auth.session-token` / `__Secure-next-auth.session-token` — `proxy.ts` checks for both.

### Caching (optional)

- `lib/redis.ts` reads `ENABLE_REDIS` (default on if `REDIS_URL` is set; setting `ENABLE_REDIS=false` disables it entirely). When disabled, `cache.get/set/getOrSet/...` become safe no-ops, so call sites don't branch.
- Cache keys live in `lib/cache/repository-cache.ts` — extend that module rather than inventing keys ad hoc.

### Errors, logging, validation

- Throw typed errors from `lib/error` (`AuthenticationError`, `ValidationError`, `AppError`, ...). Wrap route bodies in `try { ... } catch (error) { return handleApiError(error, correlationId) }`. `handleApiError` formats `AppError`, Prisma known/validation errors, and unknowns into a consistent JSON shape.
- Get a correlation id with `getOrCreateCorrelationId(request)` and pass it to `logger.*` calls so logs and the response stay correlated.
- Validate request bodies with `zod` schemas defined inline in the route; convert ZodErrors into `ValidationError`.
- Audit-significant mutations call `auditLogger.logDataAccess(userId, AuditAction.*, AuditResource.*, id, meta)` — keep parity when adding new mutating endpoints.

### Offline + sync

- `lib/offline/` implements an IndexedDB-backed sync queue with conflict detection/resolution; the `SyncQueue` and `ConflictResolution` Prisma models are the server side of this. Touching offline behavior usually means changes on both sides — see `lib/offline/README.md`.

### Testing

**Vitest** (`vitest.config.ts`)
- Uses `jsdom`, loads `test/setup.ts` (Testing Library cleanup + jest-dom matchers), aliases `@/*` to the project root.
- Coverage is intentionally scoped to `lib/**` (UI in `app/` and `components/` is excluded). Property-based tests use `fast-check`.

**Playwright** (`playwright.config.ts`, specs in `tests/e2e/`)
- A one-time `globalSetup` (`tests/e2e/global-setup.ts`) signs up a fresh test user per run and persists the session as `tests/e2e/.auth/state.json`. Every spec inherits authenticated cookies via `storageState`, so `page.request` calls hit the API as that user without re-authenticating.
- Four projects (`mobile` / `tablet` / `laptop` / `big-screen`). Specs that hit server state (`auth.spec.ts`, `crud.spec.ts`, `side-effects.spec.ts`) are added to `testIgnore` for the non-laptop projects — they don't vary by viewport, and running them 4× would multiply DB churn and trip the 5/15-min signup rate limit. New server-state specs should follow the same pattern.
- `fullyParallel: false`, `workers: 1` — tests share a single test user. Each test self-cleans (create-then-delete) so the DB stays clean across runs. Exceptions: tasks are soft-deleted (`status='ARCHIVED'`), `HealthMetric` has no DELETE endpoint and is upsert-only.
- See **`Features.md`** (feature inventory) and **`Test.md`** (per-feature spec mapping + known issues + out-of-scope) for the authoritative coverage map.

### Forms that submit dates

Forms whose backing API uses Zod's `.datetime()` (`Task.dueDate`, `Transaction.date`) must convert the `<input type="datetime-local">` value (`YYYY-MM-DDTHH:mm`, no timezone) to a full ISO string in the form's `handleSubmit` before calling `onSubmit`. Empty values for *optional* date fields must be omitted (not sent as `''`) so `optional()` applies. The fix lives in the form, not the API or the page handler — that's where the empty-vs-set distinction is known. See `components/tasks/task-form.tsx` and `components/finance/transaction-form.tsx` for the canonical pattern.

### Known schema issue

`prisma/schema.prisma` declares `DailyMetrics.date @unique` on the field *and* `@@unique([userId, date])` as a composite. The standalone `@unique` makes only one user platform-wide allowed to own a metrics row per date — every subsequent user's `POST /api/tasks/[id]/complete` 500s with a unique-constraint violation. Fix: drop the field-level `@unique` (keep the composite) and run `npx prisma migrate dev --name fix_dailymetrics_unique`. The corresponding e2e (`side-effects.spec.ts › Tasks completion side-effects`) is gated `.fixme` until the migration lands.

### Path alias

- `@/*` → repo root (configured in both `tsconfig.json` and `vitest.config.ts`). Use it for cross-directory imports instead of long relative paths.
