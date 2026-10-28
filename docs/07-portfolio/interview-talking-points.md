# Interview Talking Points

Anticipated technical questions with thought-out answers grounded in this codebase. Use these as starting points; in a real interview, watch the interviewer's interest and follow it.

---

## "Walk me through the architecture."

Open with the system diagram from [`../02-architecture/overview.md`](../02-architecture/overview.md). One sentence per layer:

1. **Client.** React 19 with the React Compiler; Zustand for client state; TanStack Query for server cache; IndexedDB queue for offline writes.
2. **Edge.** Next.js 16, App Router. `proxy.ts` middleware at the project root gates every route except `/auth/*` and static assets.
3. **API.** Route handlers under `app/api/*`. Each one resolves the user via `getServerSession`, validates the body with Zod, delegates to a repository, and returns JSON. They never call Prisma directly.
4. **Repository.** `lib/repositories/*` — the *only* place that calls `prisma.*`. Owns caching, soft-delete, audit logging, cross-entity side effects.
5. **Persistence.** PostgreSQL via Prisma. 18 models, all owned by `User` with cascade-on-delete. Optional Redis cache that's gated and no-ops when disabled.
6. **Cross-cutting.** Typed errors with correlation IDs threaded through logs; rate limiting; structured audit logging.

Close with: *"The constraint that routes don't call Prisma is the single most important convention. It's documented in CLAUDE.md and there are eight ADRs in `docs/adr/` for the other non-trivial decisions."*

---

## "How does authentication work?"

> NextAuth.js with a credentials provider. JWT-strategy sessions, 7-day expiry, bcrypt for password hashing. The session callback injects `user.id` into both the JWT and `session.user`. API routes read it via `getServerSession(authOptions)`. The middleware at `proxy.ts` checks for the session cookie and redirects unauthenticated requests to `/auth/signin`.

If the interviewer pushes:
- **"Why JWT and not database sessions?"** → ADR-0004. Single-server deployment, JWT-friendly threat model, no database round-trip on the auth path.
- **"How do you revoke a session?"** → Sign-out clears the cookie. The JWT itself remains valid until expiry (7 days). For higher-security needs we'd revisit; the trade-off is recorded in ADR-0004.
- **"Rate limiting?"** → Signup is 5 attempts per 15 minutes per IP, in `lib/security/rate-limit-middleware.ts`.

---

## "What was the hardest problem you solved?"

Three candidates depending on what the interviewer wants to dig into:

### "Cross-domain analytics without killing the database"

> Naive approach: every analytics chart joins four big activity tables. With 90 days of data and dozens of charts, that's hundreds of joins per page load.
>
> Solution: a `DailyMetrics` aggregation table. When a user completes a task, logs an exercise, etc., the repository calls `updateDailyMetrics(userId, today)` which recomputes today's row. The analytics page reads only from `DailyMetrics`. Even a 90-day correlation query is O(90) over one table.
>
> The trade-off: side-effect work on every mutation. Fast and bounded, but you have to remember to update the right metrics from the right places. That's centralized in `lib/analytics/metrics-engine.ts`.

### "Offline conflict resolution"

> Most 'offline' apps silently overwrite the server with the local version. That's last-write-wins, which is a euphemism for losing data.
>
> I built an IndexedDB queue on the client and a conflict-detection layer on the server. When the queue posts pending ops to `/api/sync/queue`, the server checks: a `CREATE` of an existing row, or an `UPDATE` where the server's `updatedAt` is newer, or a `DELETE` of a missing row — each is a conflict. Conflicts get a `ConflictResolution` row that the user resolves explicitly via the UI.
>
> The honest UX is harder than silent overwrite, but the data integrity guarantees are worth it.

### "Two card primitives that drifted apart"

> The dashboard had a `<BentoCard>` React component with animation + a subtle gradient overlay. Every other page used a `.bento-card` CSS class for performance. Both were supposed to look identical.
>
> During a light-mode polish session I noticed analytics and module pages looked flat compared to the dashboard. Cause: the CSS class had been shipped without the shadow the component had. 27 places looked wrong in light mode.
>
> Two-line fix in `globals.css`: add the same shadow to the class, and `.dark .bento-card { box-shadow: none }` because dark mode separates cards via brightness step (#18181b card on #09090b page), not shadow. The takeaway is that two design-system primitives drift apart unless the rules are written down (ADR-0006 now exists).

---

## "How do you test this?"

> Two tools, two scopes. Vitest for the logic layer in `lib/**` — unit tests plus property-based tests with fast-check. Coverage is intentionally scoped to `lib/`. Playwright for end-to-end across four viewports — auth, CRUD on every domain entity, side-effects (completion flows, achievements, sync, analytics), per-page render, and visual snapshots. 68 e2e tests pass on `--project=laptop`.
>
> The tests share a single signed-up user via Playwright's `globalSetup` + `storageState` so we don't trip the signup rate limit. Tests self-clean (create-then-delete) so the DB stays consistent across runs.

If they push:
- **"Why scope coverage to `lib/`?"** → UI in `app/` and `components/` is exercised by Playwright; duplicating that with React Testing Library would test the same thing twice without adding signal.
- **"What about CI?"** → Workspace-pinned dependencies, lint + build + test as a single CI job. (Acknowledge if not yet wired in this project.)

---

## "Why Next.js 16 instead of plain React?"

> File-based routing for both pages and API on a single deployment, server components for data-heavy pages, the React Compiler removes the bulk of `useMemo`/`useCallback` ceremony, and Turbopack makes the dev loop fast. ADR-0001 records the alternatives — Pages Router (legacy direction), Remix (smaller community), SvelteKit (smaller TS ecosystem at decision time).

---

## "What's your data model look like?"

> Eighteen Prisma models, all owned by `User` with cascade-on-delete. Five domains plus an analytics aggregation table.
>
> Two non-obvious conventions. First, enums are `String` columns validated by Zod, not native Prisma enums — adding a new enum value is a code change instead of a migration. Second, array fields like `Task.tags` are stored as JSON-encoded strings (`"[...]"`) and parsed at the API boundary. Both are documented in ADR-0003.

---

## "What if the database goes down?"

> The health endpoint at `/api/health` reports DB + Redis + memory status. Repositories raise typed errors that `handleApiError` formats into a consistent JSON response. The IndexedDB sync queue means *write* failures are recoverable: the user keeps working offline, the queue retries when connectivity returns. *Read* failures show an error message — there's no client-side cache that can serve stale data.

---

## "What would you do differently next time?"

> Three things. First, I'd add native PostgreSQL enums for the truly stable enum fields (`Task.status` doesn't change), and keep the Zod-validated string approach only for the volatile ones. Second, I'd write a service layer between routes and repositories — the routes are tiny right now but as the app grows the auth-and-validation pattern starts to repeat. Third, I'd implement a proper rolling-window for `DailyMetrics` so old rows can be archived without losing the aggregated view; right now it grows unboundedly.

---

## "How long did this take?"

> The substantive engineering took [N] weeks. The polish — light-mode tuning, design-system unification, documentation — took longer than I expected, which I think is the right ratio. A working product that's not documented is half-done.

---

## Tips for the interview

1. **Always tie answers to a file path.** *"That's in `lib/repositories/analytics-repository.ts`"* is more credible than abstract description.
2. **Cite ADRs.** Saying *"that decision is recorded as ADR-0008"* shows engineering maturity even if the interviewer doesn't ask to read it.
3. **Lead with the trade-off, not the upside.** *"We chose JWT over database sessions; the trade-off was revocation latency"* sounds like an engineer; *"JWT is faster"* sounds like a beginner.
4. **Don't oversell.** If the interviewer asks about something you handwaved (e.g. real-time updates), say *"that's an explicit limitation; see future-work.md"*.
5. **Have one demo path memorized.** Sign in → log a habit → check the analytics page → show a correlation. This is your live elevator pitch.

---

> **Up:** [Portfolio docs](./) · [Docs index](../README.md)
> **Related:** [Highlights](./highlights.md) · [Tech stack rationale](./tech-stack-rationale.md)
