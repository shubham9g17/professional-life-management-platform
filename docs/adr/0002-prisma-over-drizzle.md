# ADR-0002 — Prisma 6 over Drizzle / raw SQL

## Status

Accepted.

## Context

The application has a relational schema (18 models, all owned by `User`, with foreign keys and cascade-on-delete relations). The team needs:

- Type-safe queries from TypeScript without writing types twice.
- A migration tool that generates migration files from schema diffs.
- A studio / introspection UI for ad-hoc DB inspection.
- A community big enough that solutions for edge cases (composite uniques, JSON columns, etc.) are searchable.

Alternatives considered:

- **Drizzle.** Lower-level, closer to the SQL you write. Type-safety is real but relies on more advanced TS gymnastics; the migration story is younger.
- **Raw SQL (e.g. `pg` or `postgres.js`).** Maximum control. Every query becomes maintenance overhead — no schema-driven types.
- **TypeORM / Sequelize.** Older ORMs; their TypeScript stories are weaker than Prisma's.

## Decision

Use **Prisma 6** with PostgreSQL.

The project includes a custom `prisma.config.ts` that loads `.env` via `dotenv/config` and pins the `classic` engine. All Prisma commands run via `npx prisma` so the config is picked up.

A single `PrismaClient` instance lives in `lib/prisma.ts` as a `globalThis`-cached singleton — necessary because Next.js dev hot-reload would otherwise create a new client every time a file changes.

## Consequences

**Better:**
- The Prisma client is fully typed from the schema — no DTO duplication.
- `prisma migrate dev` produces migration files and applies them in one step.
- `prisma studio` is a first-class DB browser for debugging.
- Schema changes are reviewable as text diffs.

**Worse / accepted trade-offs:**
- Native Prisma enums forced trade-offs we didn't want — see [ADR-0003](./0003-string-enums-not-prisma-enums.md).
- Native array columns are PostgreSQL-specific; we use JSON-encoded strings for portability — see [ADR-0003](./0003-string-enums-not-prisma-enums.md).
- The Prisma client bundle is large; tree-shaking limits help but not on the server.
- A few subtle behaviors (e.g. `update` throwing `P2025` vs. returning null) need wrapping in repository code (see `lib/repositories/notification-repository.ts` for an example).
