# Features

One doc per product domain. Each links to the canonical source-of-truth (the per-component README in `components/<domain>/`) and the relevant FEATURES.md section.

> **Authoritative inventory:** [`../../FEATURES.md`](../../FEATURES.md) — every page, every endpoint.
> **Test coverage map:** [`../../Test.md`](../../Test.md).

---

## Domains

| Domain | Page | Per-component README | FEATURES.md section |
|---|---|---|---|
| Tasks | `/tasks` | [`../../components/tasks/README.md`](../../components/tasks/README.md) | [§2](../../FEATURES.md#2-tasks) |
| Habits | `/habits` | [`../../components/habits/README.md`](../../components/habits/README.md) | [§3](../../FEATURES.md#3-habits) |
| Finance | `/finance` | [`../../components/finance/README.md`](../../components/finance/README.md) | [§4](../../FEATURES.md#4-finance) |
| Fitness | `/fitness` | [`../../components/fitness/README.md`](../../components/fitness/README.md) | [§5](../../FEATURES.md#5-fitness) |
| Nutrition | `/nutrition` | [`../../components/nutrition/README.md`](../../components/nutrition/README.md) | [§6](../../FEATURES.md#6-nutrition) |
| Learning | `/learning` | [`../../components/learning/README.md`](../../components/learning/README.md) | [§7](../../FEATURES.md#7-learning) |
| Analytics | `/analytics` | [`../../components/analytics/README.md`](../../components/analytics/README.md) | [§8](../../FEATURES.md#8-analytics--achievements) |
| Notifications | `/notifications` | [`../../components/notifications/README.md`](../../components/notifications/README.md) | [§9](../../FEATURES.md#9-notifications) |
| Integrations | `/integrations` | See [`./integrations.md`](./integrations.md) | (in §10 / §11) |
| Dashboard | `/dashboard` | [`../../components/dashboard/README.md`](../../components/dashboard/README.md) | n/a (composes other domains) |

---

## Why this is a thin index

Per-component READMEs are colocated with the code they describe. Duplicating their content here would create two sources of truth that drift apart. This index exists so a teacher or recruiter can navigate by domain without already knowing where the components live.

If a per-component README is out of date relative to the code, that's a documentation bug — fix the README, not this index.

---

> **Up:** [Docs index](../README.md)
> **Related:** [`../../FEATURES.md`](../../FEATURES.md) · [`../../Test.md`](../../Test.md)
