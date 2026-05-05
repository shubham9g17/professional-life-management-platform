# Professional Life Management Platform

> A unified web app for managing work, habits, finances, fitness, nutrition, and learning — with cross-domain analytics, offline-first sync, and a polished design system.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-green)](#)

---

## What it does

Most "life management" apps own one domain. This one connects six.

- **📋 Tasks** — board / list / calendar / timeline views, drag-and-drop, soft-delete.
- **✅ Habits** — streak tracking, GitHub-style calendar, completion rates.
- **💰 Finance** — transactions, budgets with month-to-date spend, savings rate.
- **🏃 Fitness** — exercise logging, health metrics (weight / sleep / stress / energy), goals.
- **🥗 Nutrition** — meals with macros, hydration goals, daily nutrition snapshot.
- **📚 Learning** — books / courses / certifications / articles with auto-completion logic.

Then it adds the part most apps skip: **cross-domain analytics**. The system aggregates a `DailyMetrics` row per user per day and computes group-by-mean correlations — *"on days you exercise ≥ 30 min, your productivity score is +27 % vs. days you don't."*

## Stack at a glance

| Concern | Choice |
|---|---|
| Framework | Next.js 16 App Router with Turbopack |
| UI | React 19 (with React Compiler), Tailwind v4, Radix primitives, Recharts, Framer Motion |
| Database | PostgreSQL via Prisma 6 |
| Auth | NextAuth.js with credentials provider, JWT, bcrypt |
| Validation | Zod (request bodies + form schemas) |
| State | Zustand (client), TanStack Query (server) |
| Cache | Redis (gated — disabled by default; safe no-ops everywhere) |
| Tests | Vitest + fast-check (unit / property), Playwright (e2e) |
| Offline | IndexedDB queue with conflict detection + resolution |

## Quick start

```bash
git clone <repository-url>
cd professional-life-management-platform
npm install
cp .env.example .env             # set DATABASE_URL + NEXTAUTH_SECRET
npx prisma migrate dev
npm run dev
```

Visit **http://localhost:3000**. Full setup walkthrough: [`docs/01-onboarding/installation.md`](./docs/01-onboarding/installation.md).

## Documentation

Three audience-specific paths:

- **🧑‍💻 Learning the codebase?** Start at [`docs/01-onboarding/codebase-tour.md`](./docs/01-onboarding/codebase-tour.md).
- **🎓 Evaluating academically?** Read [`docs/06-academic/project-report.md`](./docs/06-academic/project-report.md).
- **💼 Hiring or interviewing?** Skim [`docs/07-portfolio/highlights.md`](./docs/07-portfolio/highlights.md).

Full doc index: [`docs/README.md`](./docs/README.md).

## Highlights

A few things worth a closer look:

- **Cross-domain correlations** ([`lib/repositories/analytics-repository.ts`](./lib/repositories/analytics-repository.ts)) — five fixed group-by-mean comparisons over a `DailyMetrics` aggregation table. Group-by-mean rather than Pearson r so the user-facing copy reads as `+27 %` instead of `r = 0.42`.
- **Repository pattern with soft-delete + audit** ([`lib/repositories/`](./lib/repositories/)) — the only place that touches `prisma.*` directly. Tasks are archived rather than dropped; mutating endpoints log to an audit trail.
- **Offline-first sync** ([`lib/offline/`](./lib/offline/)) — IndexedDB queue + conflict resolution; the server-side `SyncQueue` and `ConflictResolution` Prisma models are the other half.
- **Design system** ([`app/globals.css`](./app/globals.css), [`components/dashboard/bento-card.tsx`](./components/dashboard/bento-card.tsx)) — RGB-triplet semantic tokens, dual-mode `<BentoCard>` + `.bento-card` surface system, Mermaid-friendly architecture diagrams.
- **Single-scroll analytics page** ([`app/(dashboard)/analytics/page.tsx`](./app/\(dashboard\)/analytics/page.tsx)) — period-aware (7d / 30d / 90d) hero, trends, per-domain stats grid, correlations, insights, achievements, and CSV report export, all on one page.

## Project status

✅ TypeScript builds cleanly · ✅ 68/69 e2e specs passing on `--project=laptop` · ✅ React Compiler enabled · ✅ Light + dark theme polished

For the authoritative status: [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md). Every feature: [`FEATURES.md`](./FEATURES.md). Every test: [`Test.md`](./Test.md).

## Contributing

If you're cloning to learn or extend: [`docs/04-development/conventions.md`](./docs/04-development/conventions.md) lays out the conventions (string-typed enums, JSON-encoded array fields, repo-pattern boundaries, the `proxy.ts` rename in Next 16). [`docs/04-development/adding-a-feature.md`](./docs/04-development/adding-a-feature.md) walks through the schema → repo → API → UI → tests workflow.

## License

MIT.
