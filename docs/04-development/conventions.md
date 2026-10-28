# Coding Conventions

The rules of the road for contributing code to this project. Extracted from `CLAUDE.md` and the patterns observed across the codebase.

> **Audience:** anyone modifying code in this repo.
> **Authoritative source:** when in doubt, [`../../CLAUDE.md`](../../CLAUDE.md) overrides this doc.

---

## The big rules

### 1. Routes never call `prisma.*` directly

Every database access goes through `lib/repositories/<entity>-repository.ts`. The repository owns caching, soft-delete, audit logging, and cross-entity side effects.

```typescript
// ❌ Don't
export async function POST(req: NextRequest) {
  const task = await prisma.task.create({ data: ... })
  // ...
}

// ✅ Do
export async function POST(req: NextRequest) {
  const task = await taskRepository.createTask(userId, validated)
  // ...
}
```

See [ADR-0005](../adr/0005-repository-pattern.md).

### 2. Enums are `String` columns + Zod validation

Don't add native Prisma enums. The pattern is `status String @default("TODO")` in the schema, with Zod constraining values in code:

```typescript
const taskSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']),
})
```

See [ADR-0003](../adr/0003-string-enums-not-prisma-enums.md).

### 3. Array fields are JSON-encoded strings

`Task.tags`, `Meal.foodItems`, etc. are `String @default("[]")`. Stringify on write, parse on read at the API boundary.

### 4. `proxy.ts`, not `middleware.ts`

Next.js 16 renamed `middleware.ts` → `proxy.ts`. Don't recreate `middleware.ts` — Next will load both and you'll get duplicate execution.

### 5. Route bodies use `try / catch / handleApiError`

Every API route wraps its body so errors are formatted consistently:

```typescript
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new AuthenticationError()

    const validated = mySchema.parse(await request.json())
    const result = await myRepo.do(session.user.id, validated)

    return NextResponse.json(result)
  } catch (error) {
    const correlationId = getOrCreateCorrelationId(request)
    return handleApiError(error, correlationId)
  }
}
```

### 6. Form-level date conversion

Forms whose backing API uses Zod's `.datetime()` must convert `<input type="datetime-local">` output to ISO strings before submit:

```typescript
const handleSubmit = (e: FormEvent) => {
  e.preventDefault()
  const payload = {
    ...data,
    dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
    // ↑ undefined (not "") so Zod's .optional() applies
  }
  onSubmit(payload)
}
```

Canonical examples: `components/tasks/task-form.tsx`, `components/finance/transaction-form.tsx`.

---

## Naming & layout

### File naming

| What | Convention | Example |
|---|---|---|
| Routes | `route.ts` (Next.js convention) | `app/api/tasks/route.ts` |
| Pages | `page.tsx` | `app/(dashboard)/tasks/page.tsx` |
| Components | kebab-case file, PascalCase export | `task-card.tsx` exports `TaskCard` |
| Repos | `<entity>-repository.ts` | `task-repository.ts` |
| Tests | colocated under `__tests__/` | `lib/repositories/__tests__/task-repository.test.ts` |
| Hooks | `use-<thing>.ts` | `use-toast.ts` |

### Imports

Use the `@/*` path alias for cross-directory imports:

```typescript
// ✅
import { taskRepository } from '@/lib/repositories/task-repository'

// ❌
import { taskRepository } from '../../lib/repositories/task-repository'
```

### Components: server vs. client

A component is a server component by default. Add `'use client'` at the top of the file only when:

- The component uses hooks (`useState`, `useEffect`, `useReducer`).
- The component subscribes to a context (`useTheme`, `useToast`).
- The component handles browser-only APIs (`localStorage`, `IndexedDB`, etc.).

Pages (`app/.../page.tsx`) are server components by default. The dashboard page mounts a client orchestrator (`<DashboardOverview />`) for the interactive grid.

---

## Conventions about logic

### Authentication

API routes get `userId` via `getServerSession(authOptions)`. The session callback in `lib/auth/config.ts` injects `user.id` — never query the User table again to resolve it.

```typescript
const session = await getServerSession(authOptions)
if (!session?.user?.id) throw new AuthenticationError()
const userId = session.user.id
```

Page-level access uses `getCurrentUser()` from `lib/auth/utils.ts`.

### Validation

Zod schemas are inline in the route file unless they're shared:

```typescript
const createTaskSchema = z.object({ /* ... */ })

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validated = createTaskSchema.parse(body)
  // ...
}
```

Shared schemas (used by both forms and APIs) live in `lib/validation/schemas/<domain>.ts`.

### Errors

Throw typed errors from `lib/error/*`:

- `AuthenticationError` — 401
- `ForbiddenError` — 403
- `NotFoundError` — 404
- `ValidationError` — 400
- `ConflictError` — 409
- `AppError` — generic operational error

`handleApiError(error, correlationId)` formats every known error class into a consistent JSON response.

### Caching

Cache calls go through `lib/redis.ts` and `lib/cache/repository-cache.ts`. They become **safe no-ops when Redis is disabled** (the default). Don't branch on `ENABLE_REDIS` in calling code — the cache module handles it.

### Audit

Mutating repository methods call `auditLogger.logDataAccess(userId, AuditAction.X, AuditResource.Y, id, meta)`. This is a convention — verify when adding new mutating endpoints.

---

## Conventions about UI

### Surfaces

Use one of two card primitives:

- `<BentoCard>` — for the dashboard's animated grid (`components/dashboard/bento-card.tsx`).
- `.bento-card` — for any other card-shaped surface (defined in `app/globals.css`).

Both render visually identical surfaces. See [ADR-0006](../adr/0006-bento-card-design-system.md).

### Theming

Use semantic CSS-variable tokens (`bg-card`, `text-foreground`, `border-border`, etc.) instead of raw colors (`bg-white`, `text-gray-700`). When a raw color is unavoidable, pair it with a `dark:` variant.

```tsx
// ✅
<div className="bg-card text-foreground border-border">

// ✅ (when raw colors are required for an accent)
<span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">

// ❌
<div className="bg-white text-gray-900 border-gray-200">
```

### Loading states

Loading skeletons should mirror the actual layout, not generic placeholder boxes. Layout shift on data arrival is a quality bug.

---

## Conventions about tests

See [`./testing.md`](./testing.md).

---

## When in doubt

1. Read [`../../CLAUDE.md`](../../CLAUDE.md). It's the canonical doc for AI agents and humans.
2. Look at an existing file doing the same thing. The codebase is consistent.
3. Read the relevant ADR in [`../adr/`](../adr/).
4. If a pattern doesn't match what you're trying to do, that's a signal something is off.

---

> **Up:** [Development docs](./) · [Docs index](../README.md)
> **Related:** [Adding a feature](./adding-a-feature.md) · [Testing](./testing.md)
