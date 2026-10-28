# Analytics Module

The Analytics module surfaces cross-domain insights — productivity / wellness / growth scores, per-domain stats, cross-domain correlations, achievements, and exportable reports — through a single scrolling page at `/analytics`.

## Page layout

`app/(dashboard)/analytics/page.tsx` is the entry point. It owns the period state (`7 | 30 | 90` days, default 30) and passes it down to every section. There is no longer a `<AnalyticsDashboard />` orchestrator; the page composes the sections directly:

```
┌──────────────────────────────────────────────────┐
│ Header + period toggle (7d / 30d / 90d)          │
│ Hero (overall score + Δ vs period avg + sparks + │
│        4 activity counts)                        │
│ TrendCharts (overall area + sub-score lines)     │
│ DomainStatsGrid (Tasks/Habits/Finance/Fitness/   │
│                  Nutrition/Learning — 6 cards)   │
│ CorrelationPanel (3–5 group-by-mean comparisons) │
│ Insights + Achievements (2-column)               │
│ Generate Report → opens ReportGenerator dialog   │
└──────────────────────────────────────────────────┘
```

Each section fetches independently against its own endpoint; the period toggle re-fetches every section on change.

## Components

### `DomainStatsGrid` — `domain-stats-grid.tsx`

6 cards (Tasks, Habits, Finance, Fitness, Nutrition, Learning), each rendering one primary KPI plus 2–3 supporting rows.

**Props:** `{ days: number }`

**Endpoint:** `GET /api/analytics/domains?days=`

### `CorrelationPanel` — `correlation-panel.tsx`

Up to 5 cards, each phrasing a comparison as "on days you X, your Y is Z% higher" with `TrendingUp` / `TrendingDown` / `Minus` icon (5 % threshold for direction). Cards include both With/Without bars and the day count for each side. Hides itself when no comparison has ≥ 3 days on each side.

**Props:** `{ days: number }`

**Endpoint:** `GET /api/analytics/correlations?days=`

### `TrendCharts` — `trend-charts.tsx`

Overall-score area chart + Productivity / Wellness / Growth line chart. Period-aware via the `days` prop.

**Props:** `{ days: number }`

**Endpoint:** `GET /api/analytics/trends?days=`

### `InsightPanel` — `insight-panel.tsx`

AI-generated insights (POSITIVE / IMPROVEMENT / NEUTRAL).

**Props:** `{ insights, isLoading? }`

**Endpoint:** `GET /api/analytics/insights?days=`

### `AchievementDisplay` — `achievement-display.tsx`

Compact mode on the page (limit ~4 with "View all" → opens a dialog rendering the full gallery).

**Props:** `{ achievements, isLoading?, limit?, onViewAll? }`

**Endpoint:** `GET /api/achievements?limit=`

### `ReportGenerator` — `report-generator.tsx`

Mounted inside a `Dialog`. Generates a weekly or monthly report and renders an "Export CSV" link that hits the export route directly (`<a download>` rather than fetch+blob).

**Props:** `{ onGenerate: (type) => Promise<{ report }> }`

**Endpoint:** `GET /api/analytics/reports?type=` (preview); `GET /api/analytics/reports/export?type=` (CSV download).

### `MetricCardsGrid` — `metric-cards.tsx`

Used inside the hero to render the three sub-scores (Productivity / Wellness / Growth). Receives raw numbers — does not fetch.

## API endpoints

All accept `?days=7|30|90` (default 30) unless noted.

| Endpoint | Purpose |
|---|---|
| `GET /api/analytics/overview` | Period-aware: `currentScores`, `today`, `periodAverages`, `periodTotals`, `period`, `daysWithData`. |
| `GET /api/analytics/trends` | Daily score series (`days` may be 1–365). |
| `GET /api/analytics/insights` | Generated insights for the period. |
| `GET /api/analytics/domains` | One composed payload covering all six domain stat cards. Avoids N parallel calls from the page. |
| `GET /api/analytics/correlations` | 5 fixed group-by-mean comparisons over `DailyMetrics` (see below). Each result includes `withCount` / `withoutCount`; results with either side < 3 days are dropped. |
| `GET /api/analytics/reports?type=weekly\|monthly` | Report preview (JSON). |
| `GET /api/analytics/reports/export?type=weekly\|monthly` | Same data as CSV with `Content-Disposition: attachment; filename="analytics-{type}-{date}.csv"`. |
| `GET /api/achievements?limit=` | Unlocked achievements. |

### Correlations — what's compared

Implemented in `lib/repositories/analytics-repository.ts` → `getCorrelations(userId, days)`. Each comparison reads the last *N* `DailyMetrics` rows and groups by a binary condition:

| ID | Metric | Condition |
|---|---|---|
| `prod-vs-exercise` | `productivityScore` | `exerciseMinutes >= 30` |
| `prod-vs-streak` | `productivityScore` | `habitsCompleted >= habitsTotal` (full-streak day) |
| `wellness-vs-nutrition` | `wellnessScore` | `caloriesTracked` true |
| `wellness-vs-water` | `wellnessScore` | `waterGoalMet` true |
| `growth-vs-learning` | `growthScore` | `learningMinutes > 0` |

Direction: `POSITIVE` when delta ≥ +5 %, `NEGATIVE` when ≤ −5 %, otherwise `NEUTRAL`. Group-by-mean was chosen over Pearson r so the user-facing copy reads as "+27 % on exercise days" instead of "r = 0.42".

## Metrics engine

### Score calculation (current weights)

- **Productivity:** task completion 50 %, on-time completion 30 %, task activity 20 %.
- **Wellness:** habits 40 %, exercise 30 %, nutrition 30 %.
- **Growth:** learning time 70 %, consistency bonus 30 %.
- **Overall:** weighted (Productivity 35 % / Wellness 35 % / Growth 30 %).

### Daily aggregation

`DailyMetrics` is the single source of truth for every analytics endpoint. After a side-effect-bearing mutation (task complete, habit complete, exercise log, meal log, water log, learning progress), the corresponding repo calls `updateDailyMetrics(userId, new Date())` from `lib/analytics/metrics-engine.ts`, which upserts the row for that day and recomputes the user's rolling sub-scores.

> **Schema note:** `prisma/schema.prisma` previously had a field-level `@unique` on `DailyMetrics.date` *and* a composite `@@unique([userId, date])`. The field-level constraint blocked all but one user platform-wide from owning a metrics row per date. The schema has been corrected to drop the field-level constraint; the migration `npx prisma migrate dev --name fix_dailymetrics_unique` must be applied for multi-user `DailyMetrics` writes to succeed.

## Future enhancements

- Pearson correlations alongside the group-by-mean view.
- PDF report export (currently CSV only).
- Year-over-year comparisons.
- Custom user-defined correlation queries.
