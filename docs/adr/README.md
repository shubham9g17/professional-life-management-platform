# Architecture Decision Records (ADRs)

An ADR captures a single non-trivial architectural choice: what was decided, the context around the decision, and what the consequences are. They're short, immutable once accepted, and read in chronological order they tell the engineering story of the project.

## Why we keep them

- **Onboarding.** A new contributor can read the ADRs and understand *why* the codebase looks the way it does without having to ask.
- **Inspection.** When someone asks "why did you choose Prisma?" the answer is one link.
- **Honesty.** Each ADR explicitly lists the trade-offs accepted, not just the upside.

## Format

Each ADR follows [Michael Nygard's classic format](https://github.com/joelparkerhenderson/architecture-decision-record/tree/main/locales/en/templates/decision-record-template-by-michael-nygard):

```
## Status
Accepted | Proposed | Deprecated | Superseded by ADR-XXXX

## Context
What forced the decision? What constraints existed?

## Decision
What did we choose, and how does it work?

## Consequences
What's better, what's worse, what's now harder, what's now possible?
```

## Index

| # | Decision | Status |
|---|---|---|
| [0001](./0001-nextjs-16-app-router.md) | Next.js 16 with App Router | Accepted |
| [0002](./0002-prisma-over-drizzle.md) | Prisma 6 (over Drizzle / raw SQL) | Accepted |
| [0003](./0003-string-enums-not-prisma-enums.md) | String-typed enums validated by Zod | Accepted |
| [0004](./0004-jwt-vs-database-sessions.md) | JWT sessions over database-backed sessions | Accepted |
| [0005](./0005-repository-pattern.md) | Repository pattern as the only `prisma.*` boundary | Accepted |
| [0006](./0006-bento-card-design-system.md) | Dual `<BentoCard>` component + `.bento-card` CSS class | Accepted |
| [0007](./0007-offline-first-with-indexeddb.md) | IndexedDB queue + server-side conflict resolution | Accepted |
| [0008](./0008-group-by-mean-vs-pearson-correlations.md) | Group-by-mean correlation analysis (not Pearson r) | Accepted |

## Adding a new ADR

1. Copy `0001-nextjs-16-app-router.md` to a new file with the next number.
2. Edit the title, status, and the four sections.
3. Add a row to the index above.
4. Open a PR. Once merged, the ADR is **immutable** — never edit accepted ADRs in place. To change a decision, write a new ADR with status "Supersedes ADR-XXXX" and update the original's status to "Superseded by ADR-YYYY".

---

> **Up:** [Docs index](../README.md)
