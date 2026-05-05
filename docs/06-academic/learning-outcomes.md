# Learning Outcomes

Skills demonstrated by this project, mapped to a typical CS curriculum. Useful for academic evaluation and self-assessment.

> **Audience:** university teachers / examiners; the student writing a self-evaluation.

---

## CS subject coverage

### Database management systems

- **Relational schema design.** 18 normalized models with cascade-on-delete relations, indexes on frequently-queried columns (`Task.userId + status`), composite uniques where appropriate (`DailyMetrics(userId, date)`).
- **Query optimization.** Aggregation table (`DailyMetrics`) demonstrates trading write-time work for read-time speed.
- **Migrations.** Real Prisma migrations applied via `prisma migrate dev`. Schema evolution is reviewable as text diffs.
- **ACID properties.** Every mutation is atomic; the offline-sync layer respects transactional integrity through conflict detection.

### Software engineering

- **Layered architecture.** Strict separation: UI (`components/`, `app/`) → API (`app/api/`) → Repository (`lib/repositories/`) → Prisma → DB. The boundary between routes and Prisma is *enforced by convention*.
- **Design patterns applied:** Repository (data access), Singleton (Prisma client), Strategy (theme provider), Observer (TanStack Query), Command (offline sync queue).
- **Testing strategy:** unit tests with Vitest, property-based tests with `fast-check`, end-to-end with Playwright. Coverage scoped intentionally.
- **Architecture Decision Records.** Eight ADRs in `docs/adr/` formalize non-trivial choices.

### Web technologies & networks

- **HTTP semantics.** RESTful API, correct status codes (201 on create, 204 on delete-no-body, 409 on conflict), `Content-Disposition` headers for file downloads.
- **Authentication.** JWT-based sessions with bcrypt password hashing, signed by a server secret, transmitted via HTTP-only cookies.
- **CORS, CSRF, security headers.** Implemented via `lib/security/api-wrapper.ts` (`secureApiRoute`).
- **Rate limiting.** IP-keyed, in-memory + Redis-aware.

### Distributed systems

- **Eventual consistency.** Offline-first design with IndexedDB queue + server reconciliation.
- **Conflict detection.** `CREATE` of existing row, `UPDATE` where server `updatedAt` is newer than local, `DELETE` of missing row — each triggers a `ConflictResolution` row.
- **Idempotency.** Sync operations carry stable IDs; retries don't duplicate effects.

### Human–computer interaction (HCI)

- **Responsive design.** Single codebase serves mobile (320 px) through big-screen (1920 px+). Tested across four Playwright viewport projects.
- **Accessibility.** Semantic HTML, ARIA labels on interactive elements, keyboard navigation support, focus management, reduced-motion media query respected.
- **Theming.** Light + dark with semantic CSS-variable tokens. Tokens tuned for legibility in both modes.
- **Affordance.** Loading skeletons mirror the actual grid layout (no layout shift on data arrival); empty states have helpful copy, not just blank cards.

### Statistics / data analysis

- **Aggregation strategy.** Daily-grain aggregation table reduces analytics queries from O(N×domains) joins to O(N) over a single table.
- **Group-by-mean correlation analysis.** Five fixed comparisons with min-sample threshold (3 days each side) and direction threshold (5 %). Trade-off vs. Pearson correlation explicitly documented in ADR-0008.
- **Rolling averages.** User scores are rolling 30-day means, smoothing daily fluctuations.

### Software process

- **Documentation-first.** Every non-trivial decision has an ADR. Onboarding for new contributors is a single doc tree.
- **Continuous testing.** 68 e2e tests pass on a single project, completing in ~5.8 minutes.
- **Honest scope reporting.** Limitations are tracked in [`./future-work.md`](./future-work.md), known issues in [`../../IMPLEMENTATION_STATUS.md`](../../IMPLEMENTATION_STATUS.md).

---

## Skills demonstrated (vocabulary for resume / cover letters)

- Full-stack web development with TypeScript
- React 19 server + client component architecture
- Next.js 16 App Router routing and middleware
- Prisma ORM + PostgreSQL relational design
- NextAuth.js authentication with JWT
- Zod schema-first validation
- Repository pattern, layered architecture
- IndexedDB-backed offline-first applications
- Conflict resolution for distributed writes
- Aggregation table design for analytics
- Group-by-mean correlation analysis
- Tailwind v4 + CSS-variable design systems
- Light/dark theming with semantic tokens
- Recharts data visualization
- Framer Motion animation
- Playwright end-to-end testing
- Vitest unit testing + property-based testing with fast-check
- Architecture Decision Records (Nygard format)
- Audit logging, rate limiting, security headers
- API design (REST, HTTP semantics, error formats)

---

## Beyond the curriculum

Skills you might not see in a typical undergraduate project:

- **Engineering judgment.** ADRs explicitly state trade-offs accepted, not just upside.
- **Production-readiness.** Health endpoint, audit log, structured error format with correlation IDs, rate limiting, security headers — even though there's no production deployment by default.
- **Documentation as a deliverable.** The `docs/` tree is structured for three audiences (student / teacher / employer) with a navigation hub.
- **Honest scope.** Limitations and known issues are tracked publicly (see `IMPLEMENTATION_STATUS.md`'s "Known issues" section), not hidden.

---

> **Up:** [Academic docs](./) · [Docs index](../README.md)
> **Related:** [Project report](./project-report.md) · [Design decisions](./design-decisions.md)
