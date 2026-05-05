# Elevator Pitch

Three lengths — pick the one that fits the moment.

---

## 30 seconds

> "I built a unified web app that consolidates task management, habits, finances, fitness, nutrition, and learning into one Next.js application — and then added a cross-domain analytics layer that shows the user patterns no single-purpose app can detect, like *'your productivity is 27 % higher on days you exercise more than 30 minutes.'* It's around 18,000 lines of TypeScript with a strict repository pattern, offline-first sync, full Playwright e2e coverage, and a polished light/dark design system."

---

## 2 minutes

> "Most life-management apps own one domain — Todoist for tasks, Habitica for habits, Mint for finances, MyFitnessPal for nutrition. Each is good at what it does, but the *interaction* between domains — *'do I sleep better on days I exercise?'*, *'does my productivity drop when I skip lunch?'* — is invisible to any single tool.
>
> So I built one app that handles all six domains, with a `DailyMetrics` aggregation table at its core. Every time you complete a task, log a habit, or finish a meal, the system upserts a row capturing today's Productivity, Wellness, and Growth scores. The analytics page reads from that aggregation, computes group-by-mean correlations across domains, and tells you things like *'on days you exercise ≥ 30 min, your productivity score is 27 % higher.'*
>
> The architecture enforces strict layering: routes go through repositories which are the only callers of Prisma. Offline writes queue to IndexedDB and reconcile against the server with explicit conflict detection. The whole thing is verified by 68 Playwright end-to-end tests across four viewports.
>
> Stack: Next.js 16 with the App Router, React 19 with the React Compiler, TypeScript, Prisma over PostgreSQL, NextAuth.js with JWT sessions. Light/dark theming built on CSS-variable semantic tokens. The codebase is fully documented including ADRs for every non-trivial architectural choice."

---

## 5 minutes

> "Let me tell you what I built and what I learned doing it.
>
> The product is a unified life-management web app — six product domains in one application: tasks, habits, finance, fitness, nutrition, and learning. Each domain has its own page with full CRUD, but the interesting part is the seventh page, analytics, which sits *across* the domains.
>
> **Why it matters:** there's no shortage of single-purpose apps. The gap I wanted to close was the lack of cross-domain analysis. *Do I get more done on the days I sleep well? Is my productivity actually correlated with exercise, or am I imagining it?* Existing apps can't answer those questions because they don't have the data. This app does.
>
> **The architecture in three sentences:** one Next.js 16 app, App Router, React Server Components for the heavy data pages and client components for the interactive ones. A strict repository pattern means routes never touch Prisma directly — they validate input with Zod, delegate to a repository function, and return JSON. Authentication is JWT-based via NextAuth, gated by a single `proxy.ts` middleware at the project root.
>
> **The analytics engine** is the technically interesting bit. Whenever you do something with a side effect — complete a task, log an exercise, log a meal — the system upserts a `DailyMetrics` row for today, recomputing your Productivity / Wellness / Growth / Overall scores. The analytics page reads from that aggregation, which means even a 90-day correlation query is O(90) over a single table instead of joining four big activity tables.
>
> The correlations themselves are deliberately *not* Pearson. I went with group-by-mean — *'on days you do X, your Y score is Z % higher'* — because Pearson is hostile to non-statisticians and even technical users misinterpret weak correlations. The output reads as a sentence the user can act on.
>
> **Offline support** was the second hard problem. The app has to work without internet. I built an IndexedDB-backed queue on the client; when connectivity returns, it posts pending operations to `/api/sync/queue` and the server detects conflicts — `CREATE` of an existing row, `UPDATE` where the server's `updatedAt` is newer than the local one. Conflicts are surfaced to the user via a `ConflictResolution` row they can resolve explicitly. Most apps that 'support offline' silently overwrite; this one is honest about it.
>
> **What I learned:** the hard problems weren't the obvious ones. The framework is well-trodden; the schema is straightforward. The interesting decisions were *boundaries* — where to enforce caching, where to put audit logs, how to keep two card primitives visually identical without forcing one of them on every page. I documented all of those as ADRs in `docs/adr/`. Every non-trivial choice has a recorded rationale.
>
> **By the numbers:** 18,000 lines of TypeScript, 18 Prisma models, ~50 API endpoints, 80 React components, 68 passing Playwright e2e tests across four viewports, plus Vitest unit and property-based tests on the repository layer. Light + dark theme. WCAG-aware. Production-deployable with a health endpoint, audit log, rate limiting, and security headers.
>
> Happy to dive deeper anywhere — the architecture, the analytics engine, the offline sync, the testing strategy, or the design system."

---

## How to use these

| Situation | Use |
|---|---|
| Recruiter scan | 30s version. They mostly want signal that you can articulate. |
| Phone screen | 2-minute version. Leaves room for follow-up. |
| Behavioral or technical interview opener | 5-minute version, but pause every minute to read the interviewer's interest. |
| Resume bullet (max 1 line) | The first sentence of the 2-minute version. |
| Cover letter intro | The 30s version, expanded to a single paragraph. |

---

> **Up:** [Portfolio docs](./) · [Docs index](../README.md)
