# Features

Authoritative inventory of every user-facing and machine-facing feature in the platform, derived directly from the App Router pages in `app/(dashboard)/`, the API routes in `app/api/`, the schema in `prisma/schema.prisma`, and the cross-cutting modules under `lib/`.

This file is the source of truth that `Test.md` maps coverage against.

---

## 1. Authentication & Account

| Feature | Surface | Notes |
|---|---|---|
| Sign up (email + password + name) | `POST /api/auth/signup`, `/auth/signup` page | Bcrypt hash; 5-attempts-per-15-min IP-keyed rate limit; password strength + email format validation. |
| Sign in (credentials) | NextAuth credentials provider via `/auth/signin` page → `POST /api/auth/[...nextauth]` | JWT strategy, 7-day expiry. Cookie names: `next-auth.session-token` and `__Secure-next-auth.session-token`. |
| Sign out | NextAuth signout endpoint | Clears session cookie. |
| Get current session | `GET /api/auth/session` | Returns `{ user: { id, email, name } }` or 401. |
| Protected-route gating | `proxy.ts` (Next.js 16's renamed middleware) | Matcher excludes `/api/auth`, static, images. Unauth → redirect to `/auth/signin`. |
| Session injects `user.id` | `lib/auth/config.ts` JWT/session callbacks | Every API route reads `session.user.id` via `getServerSession(authOptions)`. |

## 2. Tasks

| Feature | Surface |
|---|---|
| Create task | `POST /api/tasks` (Zod-validated; workspace ∈ `PROFESSIONAL`/`PERSONAL`/`LEARNING`, priority ∈ `LOW`/`MEDIUM`/`HIGH`/`URGENT`, status ∈ `TODO`/`IN_PROGRESS`/`COMPLETED`/`ARCHIVED`, optional ISO `dueDate`, `estimatedEffort`, `tags[]`) |
| List tasks (filter by workspace, status, priority, tags, date range) | `GET /api/tasks` |
| Read single task | `GET /api/tasks/[id]` |
| Update task | `PATCH /api/tasks/[id]` |
| **Soft-delete** task | `DELETE /api/tasks/[id]` — sets `status='ARCHIVED'`; row stays but is excluded from list reads |
| Complete task (productivity side-effects) | `POST /api/tasks/[id]/complete` — sets `status='COMPLETED'`, `completedAt=now()`; **upserts a `DailyMetrics` row** for today; recomputes the user's `productivityScore` from the last 30 days |
| 4 view modes (Board / List / Calendar / Timeline) | `app/(dashboard)/tasks/page.tsx` |
| Drag & drop status changes (Board) | `components/tasks/task-board.tsx` (uses `@dnd-kit`) |
| Tag chips | TaskForm (tags stored as JSON-encoded string per CLAUDE.md contract) |

## 3. Habits

| Feature | Surface |
|---|---|
| Create habit | `POST /api/habits` (`name`, `category` ∈ `PROFESSIONAL_DEVELOPMENT`/`HEALTH`/`PRODUCTIVITY`/`PERSONAL_GROWTH`, `frequency` ∈ `DAILY`/`WEEKLY`/`CUSTOM`) |
| List habits + completion data | `GET /api/habits` (optional `?category=`) |
| Read / update / delete habit | `GET`/`PATCH`/`DELETE /api/habits/[id]` |
| **Mark habit complete** | `POST /api/habits/[id]/complete` (`{ notes? }`) — writes a `HabitCompletion` row and updates streak |
| Streak tracking, GitHub-style calendar, progress charts | `components/habits/*` |

## 4. Finance

| Feature | Surface |
|---|---|
| Create / list / read / update / delete transactions | `POST`/`GET /api/transactions`, `GET`/`PATCH`/`DELETE /api/transactions/[id]` (Zod; type ∈ `INCOME`/`EXPENSE`; tags JSON-encoded) |
| Transaction stats | `GET /api/transactions/stats?startDate&endDate` |
| Create / list / read / update / delete budgets | `POST`/`GET /api/budgets`, `GET`/`PATCH`/`DELETE /api/budgets/[id]` (per-user category uniqueness — POST returns 409 on duplicate; `monthlyLimit > 0`, `0 ≤ alertThreshold ≤ 100`) |
| Budget vs. actual spending | `GET /api/budgets` returns each row joined with month-to-date spend |

## 5. Fitness

| Feature | Surface |
|---|---|
| Log / list / update / delete exercise | `POST`/`GET /api/exercises`, `PATCH`/`DELETE /api/exercises/[id]` (intensity ∈ `LOW`/`MODERATE`/`HIGH`/`INTENSE`, positive duration) |
| Exercise stats | `GET /api/exercises/stats?startDate&endDate` |
| Health metrics (weight, sleep 1-10, stress 1-10, energy 1-10) | `POST /api/health-metrics` is an **upsert by date**; `GET /api/health-metrics?startDate&endDate`. No DELETE endpoint. |
| Create / update / delete fitness goal | `POST`/`GET /api/fitness-goals`, `PATCH`/`DELETE /api/fitness-goals/[id]` (goalType ∈ `WEIGHT_LOSS`/`WEIGHT_GAIN`/`EXERCISE_MINUTES`/`STRENGTH`/`ENDURANCE`/`CUSTOM`; status ∈ `ACTIVE`/`COMPLETED`/`ABANDONED`) |
| Goals with progress | `GET /api/fitness-goals?withProgress=true` |

## 6. Nutrition

| Feature | Surface |
|---|---|
| Log meal | `POST /api/meals` (`mealType` ∈ `BREAKFAST`/`LUNCH`/`DINNER`/`SNACK`, `foodItems[]` non-empty, optional macros, date) |
| List / update / delete meal | `GET /api/meals`, `PATCH`/`DELETE /api/meals/[id]` |
| Log water intake (ml) | `POST /api/water` |
| List / delete water intake | `GET /api/water`, `DELETE /api/water/[id]` (no PATCH) |
| Nutrition stats | `GET /api/nutrition/stats?startDate&endDate` |

## 7. Learning

| Feature | Surface |
|---|---|
| Create / list / read / update / delete resource | `POST`/`GET /api/learning/resources`, `GET`/`PATCH`/`DELETE /api/learning/resources/[id]` (type ∈ `BOOK`/`COURSE`/`CERTIFICATION`/`ARTICLE`) |
| **Progress side-effects on PATCH** | `completionPercentage ≥ 100` auto-sets `completedAt`; `timeInvested` is **additive** (server adds delta to existing) |
| Learning stats | `GET /api/learning/stats?startDate&endDate` |

## 8. Analytics & Achievements

| Feature | Surface |
|---|---|
| Cross-domain insights | `GET /api/analytics/insights` |
| Aggregate overview | `GET /api/analytics/overview` |
| Trend series | `GET /api/analytics/trends` |
| Generated reports | `GET /api/analytics/reports` |
| Dashboard overview (parallel queries: tasks/habits/exercise/meals/water/learning/transactions/dailyMetrics + 10-item recent-activity feed) | `GET /api/dashboard/overview` |
| List achievements | `GET /api/achievements?limit=` |
| Create achievement (typically system-triggered) | `POST /api/achievements` (`type`, `title`, `description`, `category` ∈ `PRODUCTIVITY`/`WELLNESS`/`GROWTH`/`FINANCIAL`) |

## 9. Notifications

| Feature | Surface |
|---|---|
| List notifications | `GET /api/notifications?unreadOnly&limit&offset` (also returns `unreadCount`) |
| Mark single as read | `PATCH /api/notifications/[id]` |
| Mark all as read | `POST /api/notifications` `{ action: 'markAllRead' }` |
| Get / update preferences | `GET`/`PATCH /api/notifications/preferences` (HH:mm `quietHoursStart`/`End`; `notificationFrequency` ∈ `REALTIME`/`HOURLY`/`DAILY`) |

## 10. Offline / Sync subsystem

| Feature | Surface |
|---|---|
| Apply a batch of offline operations | `POST /api/sync/queue` `{ operations: [{ id, operation: 'CREATE'\|'UPDATE'\|'DELETE', entity, entityId, data, timestamp }] }`. Supports `task`/`habit`/`transaction`/`exercise`/`meal`/`water`/`learningResource`. Detects conflicts (existing row on CREATE, server `updatedAt > local` on UPDATE). |
| Sync status report | `GET /api/sync/status` — counts pending/synced/conflicts, lastSyncTime, breakdown by entity. |
| Resolve a conflict | `POST /api/sync/resolve-conflict` |
| IndexedDB-backed client queue | `lib/offline/use-optimistic-mutation.ts`, `lib/offline/sync-queue.ts` (client-side; not directly exercised from server-side e2e). |

## 11. Integrations (third-party connectors)

| Feature | Surface |
|---|---|
| List user's integrations (sanitized) | `GET /api/integrations` |
| Initiate OAuth | `POST /api/integrations/connect` `{ provider }` — returns `{ authorizationUrl, state }`; rejects unconfigured providers with 400. |
| OAuth callback | `GET /api/integrations/callback/[provider]` |
| Disconnect / read one | `GET`/`DELETE /api/integrations/[id]` |
| Trigger sync for an integration | `POST /api/integrations/sync` |
| Connectors page UI | `app/(dashboard)/integrations/page.tsx` (lists Google Calendar, Notion cards) |

## 12. Data Export & GDPR

| Feature | Surface |
|---|---|
| User-facing export (CSV / JSON / PDF, optional entity/date filters) | `GET /api/export?format=&entities=&startDate=&endDate=` — sets `Content-Disposition` for download |
| GDPR full-data export (all-tables JSON) | `GET /api/user/export` — strict rate-limited per `lib/security/rate-limit-middleware.ts` |
| Data retention info | `GET /api/user/data-retention` |
| **Hard-delete account** (GDPR right to erasure) | `DELETE /api/user/delete` — destructive; cascades to every owned row. Out of scope for e2e (would invalidate the shared test user mid-run). |

## 13. Cron / Scheduled jobs

| Feature | Surface |
|---|---|
| Daily cleanup (sync queue > 7d, conflicts > 30d, read notifications > 30d) | `GET /api/cron/cleanup` (Bearer-token-protected when `CRON_SECRET` is set; otherwise unprotected) |
| Daily metrics aggregation | `GET /api/cron/metrics-aggregation` (same gating) |
| Schedule | `vercel.json` Vercel Cron config |

## 14. Observability & Operational

| Feature | Surface |
|---|---|
| Health check (DB ping + Redis ping + memory) | `GET /api/health` — public; returns `200 healthy` / `200 degraded` / `503 unhealthy` |
| Correlation IDs | `lib/logging/correlation.ts` — `getOrCreateCorrelationId(request)`; threaded through logs and error responses |
| Structured logger | `lib/logging/logger.ts` |
| Audit log | `lib/logging/audit.ts` — `auditLogger.logDataAccess(userId, action, resource, id, meta)` |
| Centralized error handling | `lib/error/*` — `AppError`, `AuthenticationError`, `ValidationError`; `handleApiError` formats Prisma + Zod + unknowns into a consistent JSON shape |
| Optional Redis cache | `lib/redis.ts` — gated by `ENABLE_REDIS` (default on if `REDIS_URL`); cache calls become safe no-ops when disabled |
| Repository cache keys | `lib/cache/repository-cache.ts` |
| Per-route security wrapper | `lib/security/api-wrapper.ts` `secureApiRoute` (auth + rate limit + security headers) |

## 15. Pages (App Router)

All under `app/(dashboard)/` route group, sharing `layout.tsx` (sidebar + header) and the `proxy.ts` auth gate:

| Path | Page | Owns |
|---|---|---|
| `/dashboard` | `dashboard/page.tsx` | Greeting, today's overview, quick actions |
| `/tasks` | `tasks/page.tsx` | Board / List / Calendar / Timeline tabs + create/edit dialogs |
| `/habits` | `habits/page.tsx` | Habit board + form |
| `/finance` | `finance/page.tsx` | Overview / Transactions / Budgets tabs + forms |
| `/fitness` | `fitness/page.tsx` | Overview / Exercises / Goals / Health Metrics tabs |
| `/nutrition` | `nutrition/page.tsx` | Meals + water + macros |
| `/learning` | `learning/page.tsx` | Resource list + skill matrix + charts |
| `/analytics` | `analytics/page.tsx` | Achievements + Trends tabs |
| `/integrations` | `integrations/page.tsx` | Connector cards |
| `/notifications` | `notifications/page.tsx` | List + preferences |

Public pages: `/auth/signin`, `/auth/signup`, `/` (landing), `/theme-demo`.

## 16. Database (Prisma / PostgreSQL)

18 models in `prisma/schema.prisma`. Cross-domain relations cascade on user delete:

`User` ←→ Task / Habit (→ HabitCompletion) / Transaction / Budget / Exercise / HealthMetric / FitnessGoal / Meal / WaterIntake / LearningResource / DailyMetrics / Achievement / Notification / SyncQueue / ConflictResolution / Integration.

Key project conventions (per `CLAUDE.md`):
- Enums are stored as **`String`** columns and validated in code via Zod (no native Prisma enums).
- Array fields (`tags`, `foodItems`) are stored as **`String @default("[]")`** and `JSON.stringify`/`JSON.parse`'d at the API boundary.
- Repositories in `lib/repositories/*` are the only place that talks to `prisma.*`.
- Prisma client is a global singleton at `lib/prisma.ts` to survive Next.js dev hot-reload.
