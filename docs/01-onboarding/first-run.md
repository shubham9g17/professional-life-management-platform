# First Run

A guided 10-minute tour through the app — sign up, exercise every domain, see the analytics light up.

> **Prerequisite:** you've completed [installation](./installation.md) and the dev server is running at <http://localhost:3000>.

---

## 1. Sign up

Visit <http://localhost:3000>. You'll be redirected to the sign-in page. Click **Sign up**, fill in name + email + password, submit.

You're now on `/dashboard`. It's empty — the panels show empty-state messages, not errors.

> **What just happened:** `proxy.ts` saw no session cookie, redirected you to `/auth/signin`. You signed up, NextAuth created a JWT and set the `next-auth.session-token` cookie, and the middleware now lets you through.

---

## 2. Add a task

Sidebar → **Tasks**. Click **+ New Task**. Fill in:

- Title: `Try the dashboard`
- Workspace: `PERSONAL`
- Priority: `MEDIUM`
- Due date: pick today

Submit. The board view shows the task in the **TODO** column.

Click **Complete**. The card animates to **COMPLETED**.

> **What just happened:** `POST /api/tasks` created the task; `POST /api/tasks/[id]/complete` set `status='COMPLETED'`, upserted today's `DailyMetrics` row, and recomputed your `productivityScore`.

---

## 3. Log a habit

Sidebar → **Habits**. Click **+ New Habit**. Fill in:

- Name: `Drink water`
- Category: `HEALTH`
- Frequency: `DAILY`

Submit. The habit appears with `currentStreak: 0`. Click **Complete**.

> **What just happened:** `POST /api/habits/[id]/complete` wrote a `HabitCompletion` row, bumped the streak, and updated today's `DailyMetrics` row.

---

## 4. Log an exercise

Sidebar → **Fitness**. **Exercises** tab. Click **+ Log Exercise**. Fill in:

- Activity: `Running`
- Duration: `30` minutes
- Intensity: `MODERATE`
- Date: today

Submit. The exercise appears in the log.

> **What just happened:** `POST /api/exercises` created the row and updated today's `DailyMetrics` (specifically: `exerciseMinutes` += 30, which contributes to the wellness score).

---

## 5. Log a meal + water

Sidebar → **Nutrition**. **Meals** tab. **+ Log Meal** with `BREAKFAST` and a couple of food items. Submit.

**Water** tab. Add `2000` ml. Submit.

---

## 6. Add a financial transaction

Sidebar → **Finance**. **Transactions** tab. Click **+ New Transaction**. Fill in:

- Type: `EXPENSE`
- Amount: `15.00`
- Category: `FOOD`
- Date: today

Submit. The transaction appears.

---

## 7. Add a learning resource

Sidebar → **Learning**. **+ Add Resource** → Title: `Understanding Next.js 16`, Type: `ARTICLE`, set Time Invested = `45` minutes. Submit.

---

## 8. See the analytics light up

Sidebar → **Analytics**. You should now see:

- **Hero:** Overall score with deltas vs. period average. Activity counts (1 task, 1 habit, 30 exercise min, 45 learning min).
- **Trend chart:** today's data point. (Most of the line is empty until you've logged a few days.)
- **Per-domain grid:** Tasks shows 100 % completion, Habits shows 1 active, Finance shows the balance, Fitness shows 30 min, Nutrition shows the meal, Learning shows 45 min.
- **Correlations:** mostly empty — needs at least 3 days on each side to compare.
- **Insights:** one or two short observations.
- **Achievements:** possibly one for your first habit completion.

Click **Generate Report** → choose **Weekly** → **Export CSV**. A file downloads.

---

## 9. Toggle the theme

Header → moon/sun icon. Toggle dark mode. Notice that the cards stay clearly defined in both modes.

> **What just happened:** the theme provider toggled the `.dark` class on `<html>` and set a temporary `[data-theme-transition]` attribute that scopes the color transition to a single moment. See [theme system](../02-architecture/theme-system.md).

---

## 10. Test offline (optional)

Open DevTools → Network tab → set throttling to **Offline**. Try logging another habit. The UI updates immediately — but the request goes into the IndexedDB queue.

Set throttling back to **No throttling**. The queue posts to `/api/sync/queue`. Refresh the page — your habit completion is now persisted on the server.

> **What just happened:** the offline-first stack. See [offline-and-sync](../02-architecture/offline-and-sync.md) and [ADR-0007](../adr/0007-offline-first-with-indexeddb.md).

---

## What to read next

| If you want to … | Go here |
|---|---|
| Understand how the codebase is laid out | [Codebase tour](./codebase-tour.md) |
| See the architecture diagram | [Architecture overview](../02-architecture/overview.md) |
| Read why each technology was chosen | [Tech stack rationale](../07-portfolio/tech-stack-rationale.md) |
| Add a new feature | [Adding a feature](../04-development/adding-a-feature.md) |

---

> **Next:** [Codebase tour](./codebase-tour.md) · **Up:** [Docs index](../README.md)
