# Future Work & Limitations

Honest accounting of what isn't done and what comes next. Acknowledging limitations is part of design integrity — this section is meant to demonstrate engineering self-awareness, not to undersell the project.

> **Audience:** university teachers, examiners, and the student themselves planning v2.

---

## Known issues (current)

| Issue | Impact | Required action |
|---|---|---|
| `prisma/schema.prisma` had both `@unique` on `DailyMetrics.date` and a composite `@@unique([userId, date])`. The field-level constraint blocked all but one user platform-wide from owning a metrics row per date. | Multi-user `POST /api/tasks/[id]/complete` returned 500. Invisible in single-user dev; fails in multi-user e2e. | Schema source corrected in this iteration. Migration `npx prisma migrate dev --name fix_dailymetrics_unique` must be applied. The corresponding e2e (`side-effects.spec.ts › Tasks completion side-effects`) is gated `.fixme` until the migration lands. |

For the full status snapshot see [`../../IMPLEMENTATION_STATUS.md`](../../IMPLEMENTATION_STATUS.md).

---

## Out of scope (intentional)

The following were explicitly chosen *not* to ship for this iteration:

| Limitation | Why excluded |
|---|---|
| **Multi-user collaboration.** Every model is owned by exactly one `User`. | Adding sharing requires a permissions model, role assignment, conflict UI for shared edits — significant scope. |
| **Real-time updates.** All fetches are pull-based with a 5-minute auto-refresh. | WebSockets / Server-Sent Events add operational complexity. The use case (a personal life-management tool) doesn't need sub-minute latency. |
| **Custom user-defined correlations.** The five comparisons in the analytics page are fixed. | Letting users define arbitrary queries means a query DSL and an admin UI; out of scope. |
| **PDF report export.** CSV only. | PDF needs a server-side renderer (jsPDF, Puppeteer). Doubled the export-feature scope. |
| **Native mobile apps.** Responsive web only. | A React Native port is feasible because the API is well-defined, but it's a separate project. |
| **Deep third-party integrations.** OAuth flows are scaffolded; provider-specific sync is stubbed. | Each integration (Google Calendar, Apple Health, Strava, etc.) is a self-contained engineering task. |

---

## Future work — short term (one-week scope each)

1. **Apply the `DailyMetrics` migration.** Mechanically simple; clears the only known-issue row above.
2. **Re-enable the `.fixme` e2e test.** Once the migration lands.
3. **Wire CI.** Lint + typecheck + Vitest + Playwright on PR via GitHub Actions.
4. **Add Pearson correlation alongside group-by-mean.** Different lens on the same data; see ADR-0008's "Future direction".
5. **Custom date range on the analytics page.** Currently 7d / 30d / 90d only. A custom-range picker would broaden use.
6. **Achievement system expansion.** More achievement types (10-day streak, $1000 saved, 100 km run, 500 minutes learned, etc.).

---

## Future work — medium term (multi-week)

1. **Multi-user collaboration.** Workspaces with member roles; shared task boards, shared budgets.
2. **Real-time updates via SSE.** Server pushes to the dashboard for activity-feed updates.
3. **PDF report export.** Server-side rendering via Puppeteer.
4. **Custom user-defined correlations.** A simple "compare metric A on days where metric B is over X" UI.
5. **Native mobile apps.** React Native, sharing the API. Would also justify a more rigorous API versioning story.
6. **Cross-domain goals.** *"Lose 5 kg by tracking nutrition and exercising 4×/week"* — a goal that pulls from multiple domains.

---

## Future work — long term / research

1. **AI-generated insights.** A nightly job that examines `DailyMetrics` and produces narrative observations: *"You exercise more on Tuesdays. Your productivity also peaks on Tuesdays. Coincidence?"*. Requires careful prompt design to avoid hallucination.
2. **Predictive analytics.** Given current trajectory, when will I hit my goal weight / savings target / habit streak target?
3. **Comparison cohorts (opt-in, anonymized).** *"Users your age who exercise 4× a week have a wellness score of X; you're at Y."*
4. **Sleep tracking ingestion.** Currently health metrics include sleep quality 1–10. A real integration with Apple Health / Oura / Whoop would enable sleep-vs-productivity correlations.

---

## Architectural debts

Honest list of trade-offs taken that I'd revisit with more time:

| Debt | Where | What I'd do |
|---|---|---|
| Service layer between routes and repositories. | Routes are tiny now; as the app grows, the auth-validate-delegate pattern starts to repeat. | Extract a thin service layer when the next route grows past ~50 lines of logic. |
| Native PostgreSQL enums for stable enum fields. | Currently all enums are strings + Zod (ADR-0003). | The truly stable ones (`Task.status`) could become native, with the rest staying flexible. |
| Rolling-window archival for `DailyMetrics`. | The table grows unboundedly. | Roll older-than-1-year rows into monthly summary rows; keep daily-grain only for the last year. |
| Type-system enforcement of the repo-pattern boundary. | Currently convention only. | Could be enforced via an ESLint rule that bans `prisma.*` outside `lib/repositories/`. |
| Audit log retention policy. | All audit rows live forever. | Add a TTL or archival job. |

---

> **Up:** [Academic docs](./) · [Docs index](../README.md)
> **Related:** [Project report](./project-report.md) · [Design decisions](./design-decisions.md)
