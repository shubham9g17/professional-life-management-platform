# ADR-0003 — String-typed enums validated by Zod

## Status

Accepted.

## Context

Many fields in the schema are conceptually enums:

- `Task.workspace` ∈ `PROFESSIONAL` / `PERSONAL` / `LEARNING`
- `Task.priority` ∈ `LOW` / `MEDIUM` / `HIGH` / `URGENT`
- `Task.status` ∈ `TODO` / `IN_PROGRESS` / `COMPLETED` / `ARCHIVED`
- `Habit.category` ∈ `PROFESSIONAL_DEVELOPMENT` / `HEALTH` / ...
- ... and ~10 more across the domains.

Two natural representations:

1. **Native Prisma enums.** `enum Status { TODO, IN_PROGRESS, ... }` in the schema. Prisma generates a TS enum from it. Database column is a Postgres `enum`.
2. **`String` columns validated in code.** Schema declares `status String`. Application code uses Zod to constrain the allowed values.

Plus a related question: how do we store array fields like `Task.tags`? Postgres has native array columns, but Prisma's array support has historically been less ergonomic across providers.

## Decision

Use **String columns + Zod validation** for every enum-like field. Store **array fields as JSON-encoded strings** (`String @default("[]")`) and `JSON.stringify` / `JSON.parse` at the API boundary.

```prisma
model Task {
  status   String   @default("TODO")
  tags     String   @default("[]")
}
```

```typescript
const taskSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']),
  tags:   z.array(z.string()),
})
```

## Consequences

**Better:**
- **Adding an enum value is a code-only change.** No migration, no enum-type alter. Just edit the Zod schema and ship.
- **Provider portability.** The schema would work on SQLite, MySQL, or other Postgres-compatibles without enum-handling differences.
- **Migrations stay simple.** No `CREATE TYPE`, no `ALTER TYPE ... ADD VALUE`.
- **Test seeds are simpler.** Just plain strings.

**Worse / accepted trade-offs:**
- The database doesn't enforce the enum constraint. A bug that bypasses Zod could write `status: 'banana'`. The audit-logging convention plus the repository layer narrow this exposure to ~zero in practice.
- Migration *would* be required if we ever rename an enum value, but that's true of native enums too.
- Code reading the field has to remember the constraint. Mitigated by a single Zod schema imported wherever the enum is referenced.

The team accepts the trade-off: the 95 % case (adding a new value) becomes vastly cheaper at the cost of a vanishingly rare bug class.

## Note

This convention is documented in `CLAUDE.md` so future contributors don't accidentally introduce a native Prisma enum.
