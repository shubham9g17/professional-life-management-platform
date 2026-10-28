# Design Decisions

Every non-trivial architectural choice in the project, with the *why* behind it. This document is the academic-evaluation companion to the implementation — it answers "*why* did you do it that way?" rather than "*what* did you do?".

> **Audience:** university teachers, examiners, technical interviewers.
> **Read with:** [`../adr/`](../adr/) for the formal Architecture Decision Records.

Each decision below is summarized here and cross-linked to its full ADR.

---

## 1. Next.js 16 with App Router

**Decision:** Use Next.js 16 with the App Router, the React Compiler, and Turbopack.

**Why:** App Router gives colocated server + client components, shared layouts via route groups (`app/(dashboard)/`), and a single file-based routing surface for both pages and API. The React Compiler removes most manual memoization. Turbopack speeds the dev loop.

**Trade-off accepted:** newer pattern means online tutorials still target the older Pages Router; documentation discipline (`CLAUDE.md`, this project) compensates.

→ [ADR-0001](../adr/0001-nextjs-16-app-router.md)

---

## 2. Prisma 6 over Drizzle / raw SQL

**Decision:** Use Prisma with PostgreSQL.

**Why:** Type-safe client generated from the schema, mature migration tooling, `prisma studio` for inspection. The cost of writing types twice (raw SQL) or wrestling with newer-tool quirks (Drizzle) wasn't justified for project-time risk.

**Trade-off accepted:** Some Prisma quirks (e.g. `update` throws `P2025` instead of returning `null`) require defensive wrapping in repository code.

→ [ADR-0002](../adr/0002-prisma-over-drizzle.md)

---

## 3. String-typed enums + JSON-encoded array fields

**Decision:** Enum fields are `String` columns validated by Zod in code, not native Prisma enums. Array fields like `Task.tags` are stored as JSON-encoded strings.

**Why:** Adding a new enum value or array shape becomes a code change, not a migration. Significantly faster iteration during a project where the data model is still evolving.

**Trade-off accepted:** the database doesn't enforce the enum constraint. Mitigated by funneling all writes through repositories that use Zod schemas.

→ [ADR-0003](../adr/0003-string-enums-not-prisma-enums.md)

---

## 4. JWT-strategy sessions

**Decision:** NextAuth.js with JWT sessions, 7-day expiry.

**Why:** No DB round-trip on the auth path; suitable for the project's threat model (single-server deployment, no admin-revocation requirement). Bcrypt for password hashing.

**Trade-off accepted:** signed-out tokens remain valid until natural expiry. Sign-out is cookie-clear; the JWT itself isn't blacklisted.

→ [ADR-0004](../adr/0004-jwt-vs-database-sessions.md)

---

## 5. Repository pattern as the only `prisma.*` boundary

**Decision:** API routes never call `prisma.*` directly. Every database access goes through `lib/repositories/<entity>-repository.ts`.

**Why:** Centralizes caching, soft-delete, audit logging, and cross-entity side effects (e.g. `updateDailyMetrics` after a task completion). Routes stay tiny — auth check, validate, delegate, return.

**Trade-off accepted:** convention enforced by code review and CLAUDE.md, not by the type system.

→ [ADR-0005](../adr/0005-repository-pattern.md)

---

## 6. Dual `<BentoCard>` + `.bento-card` design system

**Decision:** Two card primitives with identical visuals. `<BentoCard>` is a React component with animation, used in the dashboard. `.bento-card` is a CSS class, used in 27 module pages where animation is unnecessary.

**Why:** The dashboard wants animated cards (Framer Motion staggered entrance, hover scale, gradient overlay); other pages don't need that runtime cost. Both render the same surface (border + bg + shadow in light mode, border + bg + brightness step in dark mode) so the visual language is unified.

**Trade-off accepted:** two primitives means two places to update if the surface treatment evolves.

→ [ADR-0006](../adr/0006-bento-card-design-system.md)

---

## 7. Offline-first with IndexedDB + server conflict resolution

**Decision:** All mutations are written first to a local IndexedDB queue; the UI updates optimistically. Background sync posts pending operations to `/api/sync/queue`, which detects conflicts and writes `ConflictResolution` rows for explicit user resolution.

**Why:** Most apps that "support offline" silently overwrite the server state, which is data loss in disguise. This system surfaces conflicts honestly.

**Trade-off accepted:** significantly more client-side complexity; per-entity reconciliation logic on the server.

→ [ADR-0007](../adr/0007-offline-first-with-indexeddb.md)

---

## 8. Group-by-mean correlations, not Pearson

**Decision:** The analytics page computes five fixed group-by-mean comparisons (e.g. *"on days you exercise ≥ 30 min, your productivity score is +27 % higher"*) instead of Pearson correlation coefficients.

**Why:** Pearson `r` is hostile to non-statisticians and even technical users misinterpret weak correlations. Group-by-mean produces a sentence the user can act on with no statistics background.

**Trade-off accepted:** loses the linearity-strength signal that Pearson would give. Five comparisons are hard-coded.

→ [ADR-0008](../adr/0008-group-by-mean-vs-pearson-correlations.md)

---

## Other notable decisions (not full ADRs)

| Decision | Where | Why |
|---|---|---|
| Soft-delete on tasks (`status='ARCHIVED'`) | `lib/repositories/task-repository.ts` | Enables undo; preserves audit history. |
| Audit log on every mutating endpoint | `lib/logging/audit.ts` | Demonstrates security-mindfulness even in a single-user college project. |
| Health endpoint with DB + Redis + memory checks | `/api/health` | Production-deployable hooks; demonstrates ops awareness. |
| Form-level date conversion (ISO with timezone) | `components/tasks/task-form.tsx` (canonical) | Zod's `.datetime()` rejects `<input type="datetime-local">` raw output; conversion belongs in the form, not the API. |
| Coverage scoped to `lib/**` | `vitest.config.ts` | UI is verified by Playwright; duplicating with React Testing Library would test the same thing twice. |
| Single Playwright project for server-state tests | `playwright.config.ts` | Server-state tests don't vary by viewport; running 4× would just churn the DB and trip the signup rate limit. |
| `proxy.ts` instead of `middleware.ts` | project root | Next.js 16 renamed the file; using both creates duplicate execution. |

---

## What this design *isn't*

To be honest about scope, the system **doesn't**:

- Support multi-user collaboration. Every model is owned by exactly one `User`. Adding sharing would require a permissions model — not impossible, but not in scope.
- Use real-time updates. All data fetches are pull-based with a 5-minute auto-refresh. WebSockets / SSE would be a significant addition.
- Implement custom user-defined correlations. The five comparisons are fixed; users can't define their own queries.
- Export reports as PDF. Only CSV. PDF would require a server-side renderer (jsPDF or Puppeteer).

These are recorded honestly in [`./future-work.md`](./future-work.md). Acknowledging limitations is part of design integrity.

---

> **Up:** [Academic docs](./) · [Docs index](../README.md)
> **Related:** [Project report](./project-report.md) · [ADRs](../adr/)
