# Prisma / Database Documentation

## Overview

The platform uses **Prisma over PostgreSQL** as the source of truth. The schema in `prisma/schema.prisma` defines 18 models, all owned by `User` with cascade-on-delete relations. `prisma.config.ts` loads `.env` via `dotenv/config` and pins the `classic` engine — always run via `npx prisma` so this config is picked up.

For a high-level walkthrough see [`../docs/DATABASE_SCHEMA.md`](../docs/DATABASE_SCHEMA.md).

## Project conventions

These conventions are enforced in code, not in the schema. Preserve them when adding fields:

- **Enums are `String` columns** validated by Zod at the API boundary (no native Prisma enums). E.g. `Task.status` is `String` but Zod restricts it to `'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED'`.
- **Array fields are JSON-encoded strings.** `Task.tags` and `Meal.foodItems` are stored as `String @default("[]")` and `JSON.stringify`/`JSON.parse`'d at the API boundary.
- **Repositories in `lib/repositories/*` are the only place that should call `prisma.*` directly.** API routes go through them so caching, soft-delete (e.g. `Task.status = 'ARCHIVED'`), and audit logging stay consistent.
- **Prisma client is a global singleton** (`lib/prisma.ts`) to survive Next.js dev hot-reload. Don't `new PrismaClient()` elsewhere.

## Schema models

### Core
- **User** — auth credentials, notification preferences, theme, timezone, aggregate scores

### Productivity
- **Task** — workspace (Professional/Personal/Learning), priority, status, due date, tags. Soft-deleted on DELETE (`status = 'ARCHIVED'`).
- **Habit** + **HabitCompletion** — streak + completion-rate tracking; `HabitCompletion` rows written by `POST /api/habits/[id]/complete`.

### Finance
- **Transaction** — INCOME/EXPENSE, category + subcategory, tags
- **Budget** — monthly limit + alert threshold; `(userId, category)` composite-unique → POST returns 409 on duplicate

### Fitness/Health
- **Exercise** — activityType, duration, intensity (LOW/MODERATE/HIGH/INTENSE)
- **HealthMetric** — daily upsert (weight, sleep, stress, energy 1-10)
- **FitnessGoal** — goalType, targetValue, currentValue, status (ACTIVE/COMPLETED/ABANDONED)

### Nutrition
- **Meal** — mealType, foodItems[], optional macros
- **WaterIntake** — amount in ml; no PATCH endpoint (delete + re-create instead)

### Learning
- **LearningResource** — type (BOOK/COURSE/CERTIFICATION/ARTICLE), completionPercentage, timeInvested. Reaching 100% auto-sets `completedAt`; `timeInvested` updates are additive at the route layer.

### Analytics
- **DailyMetrics** — daily aggregate; written by `POST /api/tasks/[id]/complete` and the `/api/cron/metrics-aggregation` job.
- **Achievement** — milestone records; written by the analytics service.

### System
- **Notification** — read flag, flexible JSON `data` field
- **SyncQueue** + **ConflictResolution** — offline reconciliation (server side of the IndexedDB queue in `lib/offline/`)
- **Integration** — third-party connectors (Google Calendar, Notion, etc.); OAuth state in encrypted columns

## Indexes

Composite indexes target the most common query shapes:
- `Task` — userId, status, workspace, dueDate; composite `(userId, status)`
- `Habit` — userId, category
- `Transaction` — userId, type, category, date; composite `(userId, date)`
- `Exercise`, `Meal` — userId, date
- `Notification` — userId, read, createdAt
- `SyncQueue` — userId, synced, timestamp

## Unique constraints

| Constraint | Purpose |
|---|---|
| `User.email` (unique) | Identity |
| `Budget (userId, category)` (composite) | One budget per category per user (POST returns 409 on duplicate) |
| `HealthMetric (userId, date)` (composite) | Daily upsert key |
| `DailyMetrics (userId, date)` (composite) | Daily aggregate key |

> **Known schema bug:** `DailyMetrics` currently *also* declares `date @unique` on the field, in addition to the composite. That allows only one user platform-wide to own a row per date, breaking `POST /api/tasks/[id]/complete` for every user except the first. Fix: drop the field-level `@unique`, run `npx prisma migrate dev --name fix_dailymetrics_unique`. See [`../docs/TROUBLESHOOTING.md#known-issues`](../docs/TROUBLESHOOTING.md#known-issues).

## Common commands

```bash
# Generate Prisma client (run after schema edits)
npx prisma generate

# Create + apply a migration in dev
npx prisma migrate dev --name <descriptive_name>

# Apply pending migrations in prod / CI
npx prisma migrate deploy

# Visual data browser
npx prisma studio

# Validate schema without applying
npx prisma validate

# Reset DB (⚠️ deletes all data)
npx prisma migrate reset
```

## DATABASE_URL

The datasource is `postgresql`. Configure in `.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
# Add ?sslmode=require for managed Postgres providers.
```

## Cascade deletes

Every owned model relates to `User` via `onDelete: Cascade`. `DELETE /api/user/delete` (GDPR right-to-erasure) relies on this — see `lib/security/gdpr-compliance.ts`.

## Migration discipline

1. **Never edit migration files manually** after they've been applied.
2. **Always `npx prisma generate`** after schema changes so the typed client matches.
3. **Use `prisma.$transaction(...)`** for operations spanning multiple tables (see `app/api/tasks/[id]/complete/route.ts` for an example).
4. **Test migrations against a snapshot** in staging before production.
5. **Back up the database** before running migrations in production.

## Troubleshooting

- **Migration fails:** verify `DATABASE_URL`, check the migration SQL for column-rename conflicts, and confirm the live schema matches `_prisma_migrations` history.
- **Schema drift in dev:** `npx prisma migrate dev` will detect drift and offer to reset. Avoid `npx prisma db push --accept-data-loss` in shared environments.
- **Connection issues:** `npx prisma db execute --stdin <<< "SELECT 1"` confirms the URL is reachable.

## Related Docs

- [Prisma Documentation](https://www.prisma.io/docs)
- [`../docs/DATABASE_SCHEMA.md`](../docs/DATABASE_SCHEMA.md) — high-level overview + ERD
- [`../CLAUDE.md`](../CLAUDE.md) — schema conventions
- [`../Features.md`](../Features.md) — which models back which features
