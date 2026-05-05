# Tech Stack Rationale

Every major dependency, why it was chosen, and what was considered.

> **Audience:** anyone who wants to evaluate the engineering judgment behind the project — interviewer, teacher, or future maintainer.

---

## Framework — Next.js 16

**Chosen because:** App Router gives ergonomic colocated routing for both pages and API; React 19 + React Compiler eliminate most `useMemo`/`useCallback` ceremony; Turbopack makes the dev loop fast.

**Alternatives:** Remix (smaller ecosystem), SvelteKit (smaller TS community at decision time), plain React + Express (reinvents what Next gives free).

ADR-0001 has the full record.

---

## Language — TypeScript 5

**Chosen because:** type-safety is non-negotiable for a 18k-line codebase. Prisma's generated types compose with Zod's inferred types to give end-to-end safety from form to schema with no DTO duplication.

**Alternatives:** plain JavaScript (rejected — no compiler help), Flow (sunsetting at Meta).

---

## Database — PostgreSQL via Prisma 6

**Chosen because:** PostgreSQL is the boring-correct choice for a relational schema with foreign keys, cascade-deletes, and JSON-encoded fields. Prisma's type-safe client + migration tooling matches the project's correctness requirements.

**Alternatives:**
- **MySQL.** Comparable but no native JSON column ergonomics; the JSON-as-String pattern works regardless.
- **SQLite.** Fine for prototyping; the e2e suite is happier with a real Postgres for concurrency.
- **Drizzle.** Newer, lower-level, type-safety relies on more advanced TS — ADR-0002.
- **Raw SQL.** Maximum flexibility, all maintenance on you. Rejected for cost-of-ownership reasons.

---

## Auth — NextAuth.js

**Chosen because:** credential management is the wrong place to take chances. NextAuth's credentials provider gives bcrypt + JWT + session cookies + middleware integration out of the box.

**Alternatives:** custom auth (rejected — too easy to get wrong), Clerk (paid SaaS), Auth0 (paid SaaS), Supabase Auth (couples to a different DB).

JWT vs. database sessions is recorded in ADR-0004.

---

## Validation — Zod

**Chosen because:** schema-first validation that infers TypeScript types automatically. Used for both API request bodies and form inputs. The Zod schema is the single source of truth for the shape; the inferred type and the runtime check come for free.

**Alternatives:** Yup (slower types), Joi (no first-class TS), `class-validator` (decorator-heavy, mismatches React patterns).

---

## State management

| Layer | Choice | Why |
|---|---|---|
| Client UI state | Zustand | Tiny, no provider wrapping, idiomatic with hooks. |
| Server cache | TanStack Query | Battle-tested for fetch + cache + revalidate; integrates with optimistic updates. |
| Offline queue | Custom IndexedDB layer | Domain-specific; commercial libraries didn't fit our conflict-resolution UX. |

**Rejected:** Redux (overkill — no shared client state outside per-feature concerns), MobX (declining ecosystem), Recoil (also declining).

---

## Styling — Tailwind v4

**Chosen because:** utility-first matches the design-system + token approach. Tailwind v4 moves config into CSS itself (`@theme inline`), which keeps `app/globals.css` as the single source of truth for tokens, colors, and the `.bento-card` utility.

**Alternatives:** CSS Modules (verbose), styled-components / Emotion (runtime cost), plain CSS (no constraint enforcement).

---

## Component primitives — Radix UI + shadcn-style copying

**Chosen because:** Radix gives accessible primitives (Dialog, Tabs, Select, etc.) with no styling. We copy the shadcn pattern: each `components/ui/*.tsx` file is a small wrapper that adds Tailwind styling on top. No npm dependency that locks us into a design language.

**Alternatives:** Material UI (too opinionated), Chakra (older, ecosystem moving), Headless UI (smaller scope).

---

## Charts — Recharts + Framer Motion

**Recharts** for line / area / bar charts on the analytics + dashboard pages. SVG-based, accessible, lightweight.
**Framer Motion** for entrance animations on the dashboard's bento grid (staggered reveal, hover scale, reduced-motion respect).

**Alternatives considered:** Chart.js (canvas-based, harder to style), Visx (lower-level but more code).

---

## Testing — Vitest + Playwright

| Tool | Scope |
|---|---|
| Vitest + fast-check | `lib/**` — unit tests plus property-based tests on the repository layer. |
| Playwright | `tests/e2e/*` — end-to-end on the live dev server. Five spec files, four viewport projects. |

**Why two tools:** different jobs. Vitest is the fast inner loop for logic; Playwright is the slow but realistic outer loop for UI + integration.

**Rejected:** Jest (Vitest is faster, better TS, drop-in API), Cypress (Playwright has better cross-browser story).

---

## Other deps worth a note

| Dep | Purpose |
|---|---|
| `bcrypt` | Password hashing. Standard. |
| `next-auth` | Auth orchestrator. See above. |
| `@dnd-kit/core` | Drag-and-drop in the task board. Lighter and React 19-friendly than `react-beautiful-dnd`. |
| `lucide-react` | Icon set. SVG, tree-shakeable, large coverage. |
| `date-fns` | Date utilities. Smaller and more functional than Moment. |
| `prisma-erd-generator` | Auto-generates the ERD diagram from `schema.prisma`. |

---

## Things deliberately NOT used

| Tool | Why not |
|---|---|
| Redux / RTK | Server state lives in TanStack Query; client state is small enough for Zustand. |
| GraphQL / tRPC | The REST surface is small (~50 endpoints) and conventional. The investment doesn't pay back. |
| Microservices | One app, one DB. The `lib/` separation gives the modularity a microservice boundary would. |
| WebSockets / SSE | Pull-based 5-minute auto-refresh is sufficient for this use case. Real-time is in `future-work.md`. |
| A separate API client (Axios + interceptors) | Plain `fetch` + TanStack Query covers the need. |

---

> **Up:** [Portfolio docs](./) · [Docs index](../README.md)
> **Related:** [Highlights](./highlights.md) · [Interview talking points](./interview-talking-points.md) · [ADRs](../adr/)
