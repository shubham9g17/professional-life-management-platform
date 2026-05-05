# Codebase Tour

A narrated walk through the repository. By the end you'll know where every important thing lives and *why* it lives there.

> **Audience:** the student, after running the project locally for the first time.
> **Time:** ~30 minutes if you read along with the files open.
> **Prerequisite:** you've completed [installation](./installation.md) and [first-run](./first-run.md).

---

## Top-level layout

```
professional-life-management-platform/
├── app/                ← all UI + API routes (Next.js App Router)
├── components/         ← React components (UI primitives + domain widgets)
├── lib/                ← non-UI logic (auth, repos, errors, caching, offline)
├── prisma/             ← schema + migrations
├── tests/e2e/          ← Playwright end-to-end specs
├── public/             ← static assets served as-is
├── docs/               ← what you're reading now
├── proxy.ts            ← auth middleware (renamed from middleware.ts in Next 16)
├── prisma.config.ts    ← Prisma config; loads .env, pins classic engine
├── next.config.ts      ← Next.js config
├── tailwind.config.ts  ← Tailwind v4 — but most config now lives in app/globals.css
├── eslint.config.mjs   ← Flat ESLint config
├── vitest.config.ts    ← Vitest setup; coverage scoped to lib/**
├── playwright.config.ts ← e2e setup; 4 viewport projects, fullyParallel: false
├── CLAUDE.md           ← guidance for AI agents
├── README.md           ← project front door
├── FEATURES.md         ← authoritative feature inventory
├── Test.md             ← test plan / coverage map
└── IMPLEMENTATION_STATUS.md ← high-level status snapshot
```

The split is intentional: **`app/` and `components/` are presentation; `lib/` is logic; `prisma/` is data**. Refusing to mix these is what makes the codebase navigable.

---

## Walk 1 — Follow a request from URL to database

Pick a route — say, the user posts a new task. Trace it:

### 1. `proxy.ts` (project root)

```typescript
// proxy.ts
export default withAuth(/* ... */)

export const config = {
  matcher: ['/((?!api/auth|_next|favicon.ico|.*\\.png).*)'],
}
```

Every request that isn't an auth endpoint or a static asset hits this middleware first. It checks for the `next-auth.session-token` cookie. **No cookie = redirect to `/auth/signin`.** This is why no individual page or API route needs its own auth check — the gate is global.

> ⚠️ Next.js 16 renamed `middleware.ts` → `proxy.ts`. **Don't recreate `middleware.ts`** — Next will load both and you'll get duplicate execution.

### 2. `app/api/tasks/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return unauthorized()

  const body = await request.json()
  const validated = createTaskSchema.parse(body)   // Zod

  const task = await taskRepository.createTask(session.user.id, validated)
  return NextResponse.json({ task }, { status: 201 })
}
```

Three responsibilities, in this order:
1. **Resolve the user** via `getServerSession`.
2. **Validate the body** with a Zod schema (defined inline in the route).
3. **Delegate** to a repository method.

The route handler **never** calls `prisma.*` directly. That contract is what keeps caching, audit, and soft-delete consistent.

### 3. `lib/repositories/task-repository.ts`

```typescript
export const taskRepository = {
  async createTask(userId: string, data: CreateTaskInput) {
    const task = await prisma.task.create({
      data: { userId, ...data, tags: JSON.stringify(data.tags ?? []) }
    })
    cache.invalidate(`tasks:${userId}`)
    auditLogger.logDataAccess(userId, AuditAction.CREATE, AuditResource.TASK, task.id)
    return task
  },
  // ...
}
```

Note `JSON.stringify(data.tags)` — array fields are stored as JSON-encoded strings. ([ADR-0003](../adr/0003-string-enums-not-prisma-enums.md) explains why.)

### 4. `prisma/schema.prisma`

```prisma
model Task {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title           String
  workspace       String    // Zod constrains to PROFESSIONAL/PERSONAL/LEARNING
  priority        String    // LOW/MEDIUM/HIGH/URGENT
  status          String    @default("TODO") // TODO/IN_PROGRESS/COMPLETED/ARCHIVED
  dueDate         DateTime?
  tags            String    @default("[]")  // JSON-encoded array
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  @@index([userId, status])
}
```

Cascade-delete: when a user is removed, all their tasks go with them. **Every model is owned by `User`** — no model exists without one.

That's the full chain: cookie → middleware → route → repo → schema → DB. **Five files. Each does one thing.**

---

## Walk 2 — Follow data from DB back to the screen

Now the other direction: the dashboard renders a list of recent tasks.

### 1. `app/(dashboard)/dashboard/page.tsx`

```typescript
export default function DashboardPage() {
  return <DashboardOverview />   // client component
}
```

The page is intentionally thin — it just mounts the orchestrator. Auth is handled by `app/(dashboard)/layout.tsx`, which redirects in `getCurrentUser()` if no session.

### 2. `components/dashboard/dashboard-overview.tsx`

A **client component** (`'use client'` at the top). It fetches `/api/dashboard/overview` once on mount, again every 5 minutes (silent), and on manual refresh button click. The fetch returns one composed payload (productivity / wellness / growth / financial / activities) — see [`docs/03-features/dashboard.md`](../03-features/dashboard.md).

### 3. `app/api/dashboard/overview/route.ts`

Issues parallel queries via `Promise.all` against ~8 repositories, composes the result, and returns JSON.

### 4. The bento grid

`<BentoGrid>` from `components/dashboard/bento-card.tsx` lays out a responsive 4-column auto-row grid. Each tile is a `<BentoCard>` (the React component) or a `div` with the `.bento-card` CSS class — both styled identically. ([ADR-0006](../adr/0006-bento-card-design-system.md) explains why both exist.)

Tiles render `data` from the fetch. Sparklines come from `components/dashboard/spark-area.tsx`, a Recharts wrapper.

That's the read path. Same five-layer structure — **page, component, API, repo, schema** — just running in reverse.

---

## Walk 3 — A side-effect-bearing mutation

When you complete a task, the system doesn't just update the row. It also:

1. Sets `status='COMPLETED'`, `completedAt=now()`.
2. **Upserts a `DailyMetrics` row for today.** This is the aggregation table that drives every analytics chart.
3. Recomputes the user's `productivityScore` from the last 30 days.

Look at `app/api/tasks/[id]/complete/route.ts`. The handler delegates to `taskRepository.completeTask(taskId, userId)`. Inside, you'll see:

```typescript
await prisma.task.update({ where: { id }, data: { status: 'COMPLETED', completedAt: new Date() } })
await updateDailyMetrics(userId, new Date())   // ← the side effect
```

`updateDailyMetrics` lives in `lib/analytics/metrics-engine.ts`. It:
- Counts today's task completions, on-time completions, habit completions, exercise minutes, learning minutes, etc.
- Computes the three sub-scores (productivity, wellness, growth) for that day.
- Upserts a row keyed by `(userId, date)`.

Every analytics endpoint reads from `DailyMetrics` — never from raw activity tables. **That's how the analytics page can compute `+27 % productivity on exercise days` cheaply over 90 days.** ([Read more in `docs/03-features/analytics.md`](../03-features/analytics.md).)

> ⚠️ **Known schema bug.** The `DailyMetrics` table has both a field-level `@unique` on `date` and a composite `@@unique([userId, date])`. The field-level one makes only the first user platform-wide own a metrics row per date. The fix is `npx prisma migrate dev --name fix_dailymetrics_unique` — schema source has been corrected, the migration just needs to be applied. See [ADR-0008 references](../adr/) and [troubleshooting](../05-operations/troubleshooting.md).

---

## Walk 4 — A typical UI form (TaskForm)

Any form that ships ISO timestamps to the API has a sneaky bug waiting if you skip the conversion step. `components/tasks/task-form.tsx` is the canonical pattern:

```typescript
const handleSubmit = (e: FormEvent) => {
  e.preventDefault()
  // <input type="datetime-local"> gives YYYY-MM-DDTHH:mm — no timezone.
  // Zod's .datetime() requires a UTC offset. Convert here, in the form.
  const payload = {
    ...data,
    dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
    // ↑ undefined (not "") so Zod's .optional() applies
  }
  onSubmit(payload)
}
```

Two rules to remember:
1. Empty optional date fields must be **omitted**, not sent as `''`.
2. Convert `YYYY-MM-DDTHH:mm` to a full ISO via `new Date(...).toISOString()` before submit.

`components/finance/transaction-form.tsx` does the same. If you add another form with a date, copy this pattern.

---

## Walk 5 — Where conventions live

When you're unsure how to write something, check these in order:

1. **[`CLAUDE.md`](../../CLAUDE.md)** — the canonical conventions file at repo root.
2. **[`docs/04-development/conventions.md`](../04-development/conventions.md)** — extracted, organized version of the same.
3. **An existing file doing the same thing.** Pattern-match. The codebase is consistent.
4. **An ADR** in [`docs/adr/`](../adr/) — explains *why* a choice was made.

If a pattern doesn't match what you're trying to do, that's a signal something is off — either the task is wrong, or the codebase needs a new convention. Don't invent silently.

---

## Walk 6 — Tests

Two test runners, two scopes:

### Vitest (`npm test`) — `lib/**/__tests__/`

Unit + property-based tests on the logic layer (repositories, error handling, security primitives). Uses `jsdom`, `Testing Library`, `fast-check`. **Coverage is intentionally scoped to `lib/**`** — UI in `app/` and `components/` is verified by Playwright instead.

### Playwright (`npx playwright test --project=laptop`) — `tests/e2e/`

End-to-end. A `globalSetup` signs up one fresh test user per run; every spec inherits the auth cookie. Five spec files:

- `auth.spec.ts` — auth happy/sad paths
- `crud.spec.ts` — API CRUD on every domain entity + 3 dialog UI smoke tests
- `side-effects.spec.ts` — completion side-effects, achievements, sync, analytics, etc.
- `functionality.spec.ts` — per-page render smoke
- `visual.spec.ts` — viewport snapshots

Read [`docs/04-development/testing.md`](../04-development/testing.md) for more.

---

## What's NOT in this codebase (and why)

You won't find:

- **A separate "service" layer** between routes and repositories. Routes are thin enough that a service layer would add ceremony without helping. If a route grows past ~50 lines of logic, that's the signal to extract.
- **Native Prisma enums** for `Task.status`, `Habit.category`, etc. They're `String` columns with Zod validation in code — see [ADR-0003](../adr/0003-string-enums-not-prisma-enums.md).
- **Database-backed sessions.** JWT, signed by `NEXTAUTH_SECRET`, 7-day expiry — see [ADR-0004](../adr/0004-jwt-vs-database-sessions.md).
- **A separate API client library.** `fetch` is fine; React Query handles caching. We don't need an Axios + interceptors stack.
- **A monorepo / microservices**. Single Next.js app. The `lib/` separation does the modularity job a microservice boundary would.

---

> **Next:** [Architecture overview](../02-architecture/overview.md) — the same system from a different angle (diagrams, layers).
> **Up:** [Docs index](../README.md)
