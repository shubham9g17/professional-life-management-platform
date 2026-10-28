# References

Libraries, tools, papers, articles, and patterns referenced or used in this project. Citations follow a loose engineering-style format suitable for a CS project report.

> **Audience:** university teachers expecting a citation list; future contributors evaluating the third-party surface.

---

## Frameworks & runtimes

- **Next.js 16** — Vercel. <https://nextjs.org>. App Router, React 19 with the React Compiler, Turbopack, `proxy.ts` middleware (renamed from `middleware.ts` in 16.x).
- **React 19** — Meta. <https://react.dev>. Concurrent rendering, automatic batching, the React Compiler (removes most manual `useMemo`/`useCallback`).
- **Node.js 18+** — OpenJS Foundation. <https://nodejs.org>. JavaScript runtime.

## Database & ORM

- **PostgreSQL** — The PostgreSQL Global Development Group. <https://www.postgresql.org>. Relational database (datasource = `postgresql` in `prisma/schema.prisma`).
- **Prisma 6** — Prisma Data, Inc. <https://www.prisma.io>. Type-safe ORM with auto-generated client and migration tooling.
- **prisma-erd-generator** — <https://www.npmjs.com/package/prisma-erd-generator>. Auto-generates ERD from `schema.prisma`.

## Authentication & security

- **NextAuth.js** — <https://next-auth.js.org>. Auth orchestrator with credentials, OAuth, JWT, and session-cookie support.
- **bcrypt** — Niels Provos & David Mazières. <https://www.npmjs.com/package/bcrypt>. Adaptive password hashing.

## Validation & types

- **TypeScript 5** — Microsoft. <https://www.typescriptlang.org>.
- **Zod** — Colin McDonnell. <https://zod.dev>. Schema-first validation with TypeScript inference.

## State & data fetching

- **Zustand** — Poimandres. <https://zustand-demo.pmnd.rs>. Minimal client-state library.
- **TanStack Query** — Tanner Linsley. <https://tanstack.com/query>. Server-cache management with optimistic updates.

## UI & styling

- **Tailwind CSS v4** — Tailwind Labs. <https://tailwindcss.com>. Utility-first CSS framework.
- **Radix UI** — Modulz. <https://www.radix-ui.com>. Accessible unstyled component primitives.
- **shadcn/ui pattern** — shadcn. <https://ui.shadcn.com>. Component-copy approach (we copy patterns, not depend on the library).
- **lucide-react** — Lucide. <https://lucide.dev>. SVG icon set.
- **Recharts** — <https://recharts.org>. Chart library, used for analytics + dashboard sparklines.
- **Framer Motion** — Framer. <https://www.framer.com/motion>. Animation library.
- **@dnd-kit** — Claudéric Demers. <https://dndkit.com>. Drag-and-drop primitives for the task board.

## Testing

- **Vitest** — <https://vitest.dev>. Unit + integration test runner.
- **fast-check** — Nicolas Dubien. <https://fast-check.dev>. Property-based testing.
- **@testing-library/react** — <https://testing-library.com>. Component testing utilities.
- **Playwright** — Microsoft. <https://playwright.dev>. End-to-end test framework.

## Patterns & methodology

- **Repository pattern.** Eric Evans, *Domain-Driven Design* (2003). The repository pattern as the only `prisma.*` boundary is documented in [ADR-0005](../adr/0005-repository-pattern.md).
- **Architecture Decision Records.** Michael Nygard, *Documenting Architecture Decisions* (2011). <https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions>. Format used for all ADRs in [`../adr/`](../adr/).
- **Twelve-Factor App.** Adam Wiggins. <https://12factor.net>. Configuration-via-env, statelessness, and other principles informing the deployment story.
- **JSON Web Tokens (JWT).** Jones, Bradley, & Sakimura, *RFC 7519* (2015). <https://datatracker.ietf.org/doc/html/rfc7519>. Used for session tokens.
- **Bento grid layout.** General term for the cellular dashboard layout used in the dashboard. Influenced by Apple's keynote design language.

## Statistics & analytics

- **Group-by-mean comparison.** A standard comparative-statistics approach. Discussion in [ADR-0008](../adr/0008-group-by-mean-vs-pearson-correlations.md) covers the trade-off vs. Pearson correlation.

## Tooling

- **ESLint** — flat config — <https://eslint.org>.
- **Turbopack** — Vercel. <https://turbo.build/pack>. Bundler used in dev mode.

## Formatting

This reference list is intentionally a mix of academic-paper citations (where applicable) and engineering-tool citations (the more common case for a software project). Departments expecting strict APA or IEEE format should adapt the entries above; the substance — title, author, URL — is the part that matters.

---

> **Up:** [Academic docs](./) · [Docs index](../README.md)
