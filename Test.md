# Test Plan

Coverage map for every feature in `Features.md`. Each row names the spec file, the `describe`/test that exercises it, and the kind of coverage (UI = browser drives the dialog; API = `page.request` hits the endpoint with the storageState cookie; n/a = not exercisable from outside).

Specs live under `tests/e2e/`. The runner is Playwright with `globalSetup` = a one-time signup that persists `state.json` so every test inherits an authenticated session.

---

## Existing specs

| File | Purpose |
|---|---|
| `tests/e2e/auth.spec.ts` | Auth happy + sad paths — signin reject, signup, signin, protected-route redirect. Excluded from non-laptop projects so we don't trip the 5/15min signup rate limit. |
| `tests/e2e/functionality.spec.ts` | Per-page rendering smoke (heading, key buttons/tabs visible, console-error budget on `/dashboard`). |
| `tests/e2e/visual.spec.ts` | Per-viewport visual snapshots. |
| `tests/e2e/crud.spec.ts` | API CRUD on every domain entity + 3 UI smokes for forms (Tasks no-due, Tasks with-due, Transactions). |
| `tests/e2e/side-effects.spec.ts` | **NEW** — features that aren't direct CRUD: complete-flows, achievements, notifications, sync, analytics, stats, dashboard, exports, health, cron. |

`playwright.config.ts` ignores `auth.spec.ts`, `crud.spec.ts`, and `side-effects.spec.ts` on `mobile`/`tablet`/`big-screen` projects — those are server-state tests that don't vary by viewport, so running them 4× would just churn the DB.

---

## §1 — Authentication & Account

| Feature | Spec | Coverage |
|---|---|---|
| Signin reject invalid creds | `auth.spec.ts` › `sign-in rejects invalid credentials` | UI |
| Signup creates account & lands on `/dashboard` | `auth.spec.ts` › `sign-up creates account ...` | UI |
| Signin valid creds | `auth.spec.ts` › `sign-in with valid creds ...` | UI |
| Protected-route redirect | `auth.spec.ts` › `protected route redirects to signin ...` | UI |
| `GET /api/auth/session` returns user | `side-effects.spec.ts` › `Auth › GET session returns the test user` | API |

Not covered (intentionally): sign-out flow (no UI surface to drive it), 5/15min rate-limit (would block the suite on retry).

## §2 — Tasks

| Feature | Spec | Coverage |
|---|---|---|
| Create / Read / Update / Soft-delete | `crud.spec.ts` › `Tasks CRUD` | API |
| Soft-delete excludes from list (double-fetch) | `crud.spec.ts` › `Cross-cutting: deleted record stays gone after refresh` | API |
| Create-via-dialog with no due date | `crud.spec.ts` › `Tasks UI smoke › no due date` | UI |
| Create-via-dialog with due date (ISO conversion) | `crud.spec.ts` › `Tasks UI smoke › with due date` | UI |
| `POST /api/tasks/[id]/complete` writes a `DailyMetrics` row + recomputes `productivityScore` | `side-effects.spec.ts` › `Tasks › complete a task triggers DailyMetrics + productivityScore` | API |
| Per-page render smoke (board, To Do/In Progress/Completed columns, New Task button) | `functionality.spec.ts` › `tasks page shows kanban + create button` | UI |

Not covered: drag-and-drop status change (Playwright + `@dnd-kit` cross-browser drag is brittle; left as a future visual+interaction test).

## §3 — Habits

| Feature | Spec | Coverage |
|---|---|---|
| CRUD | `crud.spec.ts` › `Habits CRUD` | API |
| `POST /api/habits/[id]/complete` writes a `HabitCompletion` and bumps streak | `side-effects.spec.ts` › `Habits › completing a habit creates a HabitCompletion row` | API |
| Per-page render smoke | `functionality.spec.ts` › `habits page shows create CTA when empty` | UI |

## §4 — Finance

| Feature | Spec | Coverage |
|---|---|---|
| Transactions CRUD | `crud.spec.ts` › `Transactions CRUD` | API |
| Transaction stats | `side-effects.spec.ts` › `Stats › transactions stats responds` | API |
| Budgets CRUD | `crud.spec.ts` › `Budgets CRUD` | API |
| Budget category-uniqueness 409 | `side-effects.spec.ts` › `Budgets › duplicate category returns 409` | API |
| Per-page tabs render | `functionality.spec.ts` › `finance page shows tabs and stat cards` | UI |
| Transaction create-via-dialog | `crud.spec.ts` › `Transactions UI smoke` | UI |

## §5 — Fitness

| Feature | Spec | Coverage |
|---|---|---|
| Exercises CRUD | `crud.spec.ts` › `Exercises CRUD` | API |
| Exercise stats | `side-effects.spec.ts` › `Stats › exercises stats responds` | API |
| Health metrics upsert | `crud.spec.ts` › `Health metrics upsert` | API |
| Fitness goals CRUD | `crud.spec.ts` › `Fitness goals CRUD` | API |
| `withProgress=true` returns active-goals shape | `side-effects.spec.ts` › `Fitness goals › withProgress query` | API |
| Per-page tabs render | `functionality.spec.ts` › `fitness page shows tabs` | UI |

## §6 — Nutrition

| Feature | Spec | Coverage |
|---|---|---|
| Meals CRUD | `crud.spec.ts` › `Meals CRUD` | API |
| Water intake C-R-D | `crud.spec.ts` › `Water intake CRD` | API |
| Nutrition stats | `side-effects.spec.ts` › `Stats › nutrition stats responds` | API |
| Per-page render smoke | `functionality.spec.ts` › `nutrition page shows log meal CTA` | UI |

## §7 — Learning

| Feature | Spec | Coverage |
|---|---|---|
| Resources CRUD | `crud.spec.ts` › `Learning resources CRUD` | API |
| `completionPercentage ≥ 100` auto-sets `completedAt` | `side-effects.spec.ts` › `Learning › 100% completion sets completedAt` | API |
| `timeInvested` is additive | `side-effects.spec.ts` › `Learning › timeInvested updates are additive` | API |
| Learning stats | `side-effects.spec.ts` › `Stats › learning stats responds` | API |
| Per-page render smoke | `functionality.spec.ts` › `learning page shows resource controls` | UI |

## §8 — Analytics & Achievements

| Feature | Spec | Coverage |
|---|---|---|
| Dashboard overview shape | `side-effects.spec.ts` › `Dashboard › overview returns scores + activities` | API |
| Analytics insights / overview / trends / reports | `side-effects.spec.ts` › `Analytics › four endpoints respond 200 with JSON` | API |
| Achievements list | `side-effects.spec.ts` › `Achievements › GET returns list and total` | API |
| Achievement create + read-back | `side-effects.spec.ts` › `Achievements › POST creates and GET returns it` | API |
| Achievement category validation | `side-effects.spec.ts` › `Achievements › invalid category returns 400` | API |
| Per-page render smoke | `functionality.spec.ts` › `analytics page shows tabs` | UI |

## §9 — Notifications

| Feature | Spec | Coverage |
|---|---|---|
| List notifications + unreadCount | `side-effects.spec.ts` › `Notifications › list returns array and unreadCount` | API |
| `markAllRead` action | `side-effects.spec.ts` › `Notifications › markAllRead works` | API |
| Mark single as read returns 404 for unknown id | `side-effects.spec.ts` › `Notifications › PATCH unknown id is 404` | API |
| Get / update preferences | `side-effects.spec.ts` › `Notifications › preferences GET + PATCH` | API |
| Preferences invalid quietHours format | `side-effects.spec.ts` › `Notifications › invalid quietHoursStart returns 400` | API |
| Preferences invalid frequency | `side-effects.spec.ts` › `Notifications › invalid frequency returns 400` | API |

## §10 — Offline / Sync

| Feature | Spec | Coverage |
|---|---|---|
| `POST /api/sync/queue` applies a CREATE op for a task | `side-effects.spec.ts` › `Sync › queue CREATE op writes the task` | API |
| `POST /api/sync/queue` rejects non-array `operations` | `side-effects.spec.ts` › `Sync › queue rejects non-array body` | API |
| `GET /api/sync/status` returns aggregation | `side-effects.spec.ts` › `Sync › status returns counts and conflicts shape` | API |
| Conflict resolution | n/a | Requires a pre-existing unresolved conflict; left to integration tests in `lib/offline/__tests__`. |

## §11 — Integrations

| Feature | Spec | Coverage |
|---|---|---|
| `GET /api/integrations` returns array (likely empty in test env) | `side-effects.spec.ts` › `Integrations › list responds 200 with array` | API |
| `POST /api/integrations/connect` rejects unconfigured providers | `side-effects.spec.ts` › `Integrations › connect with bogus provider is 400` | API |
| OAuth callback / actual sync / disconnect | n/a | Requires real OAuth credentials and a connected integration row. |
| Per-page render smoke | `functionality.spec.ts` › `integrations page lists connector cards` | UI |

## §12 — Data Export & GDPR

| Feature | Spec | Coverage |
|---|---|---|
| `GET /api/export?format=JSON` returns JSON with download headers | `side-effects.spec.ts` › `Export › JSON returns body + Content-Disposition` | API |
| `GET /api/export?format=CSV` returns CSV body | `side-effects.spec.ts` › `Export › CSV returns text/csv` | API |
| `GET /api/export?format=BOGUS` returns 400 | `side-effects.spec.ts` › `Export › invalid format returns 400` | API |
| `GET /api/user/export` (GDPR full dump) | `side-effects.spec.ts` › `GDPR › user/export returns user data` | API |
| `GET /api/user/data-retention` | `side-effects.spec.ts` › `GDPR › data-retention responds 200` | API |
| `DELETE /api/user/delete` | n/a | Destructive — deletes the shared test user and breaks every subsequent test. Covered by unit/integration tests in `lib/security/`. |

## §13 — Cron

| Feature | Spec | Coverage |
|---|---|---|
| `GET /api/cron/cleanup` runs and reports counts | `side-effects.spec.ts` › `Cron › cleanup responds with results shape` | API (bypass auth header check by relying on dev default of unset CRON_SECRET; if `CRON_SECRET` is set in the env, the test asserts 401 instead) |
| `GET /api/cron/metrics-aggregation` runs | `side-effects.spec.ts` › `Cron › metrics-aggregation responds` | API |
| Vercel cron schedule | n/a | Configured in `vercel.json`; verified by the platform. |

## §14 — Observability & Operational

| Feature | Spec | Coverage |
|---|---|---|
| `GET /api/health` returns 200 with `database`/`redis`/`memory` blocks | `side-effects.spec.ts` › `Health › check has db, redis, memory blocks` | API (public, no auth) |
| Correlation IDs / audit log / Redis caching / security wrapper | n/a | These are middleware concerns covered by `lib/**` unit tests; e2e would be an indirect smoke. |

## §15 — Page-render smokes

Every dashboard route is hit by `functionality.spec.ts` for "renders without console errors" and a key heading/button assertion. Quick-action navigation from the dashboard is also covered there.

## §16 — Database conventions

Schema-shape correctness (string-typed enums, JSON-encoded arrays) is enforced per-route through the API tests above (`tags` round-trips as an array; `foodItems` round-trips as an array).

---

## Known issues (tests marked `.fixme`)

| Issue | Fix |
|---|---|
| `Tasks completion side-effects › completing a task triggers DailyMetrics` is gated `.fixme` because `prisma/schema.prisma` declares `DailyMetrics.date @unique` *and* `@@unique([userId, date])`. The standalone `@unique` lets only one user platform-wide own a metrics row per date; every subsequent user gets a 500 from `POST /api/tasks/[id]/complete`. | Remove `@unique` from the `date` field (keep the composite), then run `npx prisma migrate dev --name fix_dailymetrics_unique`. Re-enable the test (drop `.fixme`). |

## Out-of-scope explicitly

These either can't be exercised from a black-box e2e suite or would harm the suite:

- **`DELETE /api/user/delete`** — would invalidate the shared test user mid-run.
- **OAuth callbacks** with real providers (Google/Notion) — require live credentials.
- **Drag-and-drop on the task board** — `@dnd-kit` interactions are flakey under Playwright and out of scope for "feature exists" testing.
- **Scheduled cron firing** — that's Vercel's job, not the app's.
- **Conflict resolution for offline sync** — requires a pre-seeded conflict; covered by `lib/offline/__tests__/`.
- **Auth rate limit tripping** — would block the rest of the run.
- **Notifications email/push delivery** — those are out-of-process side-effects.
