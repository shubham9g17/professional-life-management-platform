# Installation

Get the project running on your machine in under five minutes.

> **Audience:** the student getting set up for the first time, or anyone cloning the repo to evaluate it.
> **Prerequisites:** see [`./prerequisites.md`](./prerequisites.md) for the exact tool versions.

## 1. Install dependencies

```bash
git clone <repository-url>
cd professional-life-management-platform
npm install
```

## 2. Configure the environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
ENABLE_REDIS="false"   # optional — Redis is gated and no-ops when disabled
```

The Prisma datasource is **PostgreSQL** (`prisma/schema.prisma`). Any local or hosted Postgres instance works. Redis is optional and disabled by default — see [`../05-operations/no-redis-setup.md`](../05-operations/no-redis-setup.md).

## 3. Apply database migrations

```bash
npx prisma migrate dev
```

> Always run migrations through `npx prisma` — the project ships a `prisma.config.ts` that loads `.env` via `dotenv/config` and pins the `classic` engine. Calling Prisma globally bypasses that config.

## 4. Start the dev server

```bash
npm run dev      # uses Turbopack via Next 16
```

Visit **http://localhost:3000** and follow the [first-run guide](./first-run.md) to create your first user and try every module.

---

## Useful commands

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
# Vitest — unit + property-based (jsdom + Testing Library + fast-check), scoped to lib/**
npm test
npm run test:watch
npm run test:ui
npm run test:coverage

# Playwright e2e (requires `npm run dev` running in another terminal)
npx playwright test --project=laptop                  # full e2e run
npx playwright test crud.spec.ts --project=laptop     # one spec
npx playwright test -g "Tasks CRUD" --project=laptop  # by test name
```

See [`../04-development/testing.md`](../04-development/testing.md) for the test strategy and [`../../Test.md`](../../Test.md) for the per-feature spec mapping.

---

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| `Error: P1001 Can't reach database server` | Postgres isn't running, or `DATABASE_URL` is wrong. |
| `Error: NEXTAUTH_SECRET is not set` | Run `openssl rand -base64 32` and put the output in `.env`. |
| `npx prisma migrate dev` says "drift detected" | Schema and migrations are out of sync. `npx prisma migrate reset` (⚠️ wipes data). |
| Multi-user `/api/tasks/[id]/complete` returns 500 with a unique-constraint error | Known schema bug — see [`../05-operations/troubleshooting.md`](../05-operations/troubleshooting.md). The fix is `npx prisma migrate dev --name fix_dailymetrics_unique`. |

For ops-level issues (Redis, deploy, monitoring), see [`../05-operations/troubleshooting.md`](../05-operations/troubleshooting.md).

---

## Next steps

| If you want to … | Go here |
|---|---|
| Understand how the codebase is laid out | [Codebase tour](./codebase-tour.md) |
| See every feature and API endpoint | [`FEATURES.md`](../../FEATURES.md) |
| Read the architecture deep-dive | [Architecture overview](../02-architecture/overview.md) |
| Deploy to production | [Deployment](../05-operations/deployment.md) |
