# Quick Start Guide

## Getting Started in 4 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure the Database

The Prisma datasource is **PostgreSQL** (`prisma/schema.prisma`). Point `DATABASE_URL` at any local or hosted Postgres instance:

```bash
cp .env.example .env
# edit .env:
# DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
# NEXTAUTH_SECRET="$(openssl rand -base64 32)"
# ENABLE_REDIS="false"   # optional — Redis is gated and no-ops when disabled
```

### 3. Apply Migrations
```bash
npx prisma migrate dev
```

(`prisma.config.ts` loads `.env` via `dotenv/config` and pins the `classic` engine; always run via `npx prisma` so the config picks up.)

### 4. Start Development Server
```bash
npm run dev      # uses Turbopack via Next 16
```

Visit: http://localhost:3000

## Useful Commands

### Development
```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npx prisma studio        # Visual database browser
npx prisma generate      # Regenerate Prisma client after schema edits
npx prisma migrate dev   # Create + apply a new migration
npx prisma migrate reset # Reset DB (⚠️ deletes all data)
```

### Tests

```bash
# Vitest — unit + property-based, scoped to lib/**
npm test
npm run test:watch
npm run test:ui
npm run test:coverage

# Playwright — end-to-end (requires `npm run dev` running in another terminal)
npx playwright test --project=laptop                  # all e2e suites
npx playwright test crud.spec.ts --project=laptop     # one spec
npx playwright test -g "Tasks CRUD" --project=laptop  # by test name
```

See [`../Test.md`](../Test.md) for the per-feature spec mapping.

## Database Schema

18 Prisma models, all owned by `User` with cascade-on-delete relations:

**Core:** `User`

**Productivity:** `Task`, `Habit`, `HabitCompletion`

**Finance:** `Transaction`, `Budget`

**Fitness/Health:** `Exercise`, `HealthMetric`, `FitnessGoal`

**Nutrition:** `Meal`, `WaterIntake`

**Learning:** `LearningResource`

**Analytics:** `DailyMetrics`, `Achievement`

**System:** `Notification`, `SyncQueue`, `ConflictResolution`, `Integration`

See [`./DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) for the full schema.

## Project conventions

- **Enums are `String` columns** validated by Zod in code (not native Prisma enums). E.g. `Task.status` is `String` but Zod restricts it to `'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED'`.
- **Array fields are JSON-encoded strings.** `Task.tags` and `Meal.foodItems` are stored as `String @default("[]")` and `JSON.stringify`/`JSON.parse`'d at the API boundary:

  ```typescript
  // Creating
  await prisma.task.create({
    data: {
      title: "My Task",
      tags: JSON.stringify(["urgent", "work"]),
      // ...
    },
  })

  // Reading
  const task = await prisma.task.findUnique({ where: { id } })
  const tags = JSON.parse(task.tags) // ["urgent", "work"]
  ```

- **Repositories in `lib/repositories/*` are the only place that calls `prisma.*` directly.** API routes go through them so caching, soft-delete, and audit logging stay consistent.
- **Auth middleware lives in `proxy.ts`** at the project root (Next 16 renamed `middleware.ts` → `proxy.ts` — do not recreate `middleware.ts`).

## Next Steps

- [`./SETUP.md`](./SETUP.md) - Detailed setup & configuration
- [`./DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) - Database architecture
- [`../Features.md`](../Features.md) - Feature inventory (every page, every endpoint)
- [`../Test.md`](../Test.md) - Test plan
- [`../prisma/README.md`](../prisma/README.md) - Prisma usage notes

## Need Help?

- View database: `npx prisma studio`
- Validate schema: `npx prisma validate`
- Reset database: `npx prisma migrate reset` (⚠️ deletes all data)
- Check health endpoint: `curl http://localhost:3000/api/health`

Happy coding! 🚀
