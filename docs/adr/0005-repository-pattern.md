# ADR-0005 — Repository pattern as the only `prisma.*` boundary

## Status

Accepted.

## Context

In a typical Next.js + Prisma project, route handlers call `prisma.*` directly:

```typescript
// app/api/tasks/route.ts
export async function POST(req: NextRequest) {
  const task = await prisma.task.create({ data: ... })
  return NextResponse.json({ task })
}
```

This works for small projects but as the codebase grows it creates coupling problems:

- **Caching.** Adding a Redis layer means editing every route that reads or writes the entity.
- **Soft-delete.** When `Task` becomes soft-deletable, every list query needs `where: { status: { not: 'ARCHIVED' } }` retrofitted. Easy to miss.
- **Audit logging.** Every mutating endpoint needs an audit record. If it's per-route, it gets forgotten on new endpoints.
- **Testability.** Testing a route requires a real DB; a repository can be mocked.

## Decision

**Routes never call `prisma.*` directly.** All database access goes through `lib/repositories/<entity>-repository.ts`. The repository owns:

- The Prisma calls themselves.
- Cache invalidation (`cache.invalidate(key)`).
- Soft-delete semantics (filter `ARCHIVED` out of list reads).
- Audit log writes (`auditLogger.logDataAccess(...)`).
- Cross-entity side effects (e.g. `taskRepository.completeTask` calls `updateDailyMetrics`).

A few examples:

```typescript
// lib/repositories/task-repository.ts
export const taskRepository = {
  async createTask(userId: string, data: CreateTaskInput) {
    const task = await prisma.task.create({ data: { userId, ...data } })
    cache.invalidate(`tasks:${userId}`)
    auditLogger.logDataAccess(userId, AuditAction.CREATE, AuditResource.TASK, task.id)
    return task
  },
  async listTasks(userId: string, filter?: TaskFilter) {
    return prisma.task.findMany({
      where: {
        userId,
        status: { not: 'ARCHIVED' },     // soft-delete enforced here
        ...filter,
      }
    })
  },
}
```

Some repositories are objects (factory style); others are free functions. The shape varies by what was natural at the time. The contract (no `prisma.*` outside `lib/repositories/`) is what matters.

## Consequences

**Better:**
- Adding caching, audit, or soft-delete to an entity means editing one file (the repository).
- Routes are tiny — auth check, validate body, delegate, return.
- Repository tests live in `lib/repositories/__tests__/` with a focused unit-test scope.
- A future contributor who wants to know "what happens when a task is deleted?" looks in one place.

**Worse / accepted trade-offs:**
- One extra file to navigate per entity.
- Some repositories duplicate boilerplate (auth check + audit log) — this could be factored into a higher-order helper but hasn't been (KISS).
- The contract is convention, not enforced by the type system. A new contributor could call `prisma.task.create` from an API route and it would compile. Mitigated by code review and CLAUDE.md documenting the rule.
