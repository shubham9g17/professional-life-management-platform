# Dashboard Components

This directory contains the main dashboard components for the Professional Life Management Platform.

## Overview

The dashboard provides a comprehensive view of user productivity, wellness, growth, and financial metrics with real-time data updates and interactive widgets.

## Components

### DashboardOverview
Main dashboard component that orchestrates the bento grid and handles data fetching.

**Features:**
- Auto-refresh every 5 minutes (silent — no flash of skeleton)
- Manual refresh button
- Skeleton mirrors the actual grid 1:1 (hero 2×2 + 4 KPI cards + 3-col activity feed + 1-col quick actions) instead of generic placeholder boxes
- Loading + error states

**Usage:**
```tsx
import { DashboardOverview } from '@/components/dashboard'

<DashboardOverview />
```

### Grid layout

The dashboard renders a single `BentoGrid` with these tiles, in order. The `index` prop drives the staggered entrance animation.

```
┌──────────┬──────────┬──────┬──────┐
│                     │      │      │
│ Cashflow hero (2×2) │ Hbts │ Tsks │  ← row 1
│                     │      │      │
│                     ├──────┼──────┤
│                     │ Exer │ Lrng │  ← row 2
├─────────────────────┴──────┼──────┤
│ Activity feed (3×1)        │ QA   │  ← row 3
└────────────────────────────┴──────┘
```

### Widgets

#### Cashflow hero (in `dashboard-overview.tsx`)
Replaces the prior "Today's Overall" score hero. Renders the period balance as the primary number with a 2×2 internal grid of income / expenses / savings rate / latest transaction. Uses the chart-3 / chart-4 / chart-1 tokens for accent colors.

#### MetricSlice tiles
Four 1×1 KPI tiles. Each tile takes a string `value`, an icon, a tint, and an optional sparkline data array.

| Tile | Source field | Tint |
|---|---|---|
| Habits | `habitsCompleted / habitsTotal` | `text-chart-3` |
| Tasks | `tasksCompleted / tasksTotal` | `text-chart-1` |
| Exercise | `exerciseMinutes` | `text-chart-4` |
| Learning | `learningMinutes` | `text-chart-2` |

#### QuickActionsWidget
Compact 1×1 grid with 8 quick actions. Each action is a link to the destination page with a query string the page reads (e.g. `?action=new`).

**Actions:** Add Task · Log Habit · Log Exercise · Add Transaction · Log Meal · Log Water · Add Resource · View Stats.

#### ActivityFeedWidget
Recent activity across all modules.

**Props:**
- `activities`: Array of recent activities
- `isLoading`: Loading state

**Activity Types:**
- TASK
- HABIT
- EXERCISE
- MEAL
- TRANSACTION
- LEARNING

## API endpoints

### GET /api/dashboard/overview

Returns the payload that drives every tile on the dashboard. Scores live on the analytics page now — the dashboard is activity- and cashflow-focused.

**Response shape:**
```json
{
  "productivity": { "tasksCompleted": 5, "tasksTotal": 10, "tasksOnTime": 4 },
  "wellness":     { "habitsCompleted": 3, "habitsTotal": 5, "exerciseMinutes": 30, "waterGoalMet": true },
  "growth":       { "learningMinutes": 45, "resourcesInProgress": 2, "resourcesCompleted": 1 },
  "financial":    { "currentBalance": 5000, "monthlyIncome": 6000, "monthlyExpenses": 4000, "savingsRate": 33.3 },
  "activities":   [ /* up to 10 items */ ]
}
```

## Layout Components

### DashboardLayout
Main layout wrapper for dashboard pages.

**Features:**
- Responsive sidebar navigation
- Header with user menu and notifications
- Mobile-friendly with collapsible sidebar

**Usage:**
```tsx
import { DashboardLayout } from '@/components/layout'

<DashboardLayout user={user}>
  <YourContent />
</DashboardLayout>
```

### DashboardHeader
Header component with user menu and notifications.

**Features:**
- User avatar and name
- Notification bell with unread count
- Theme toggle
- Settings and sign out options

### DashboardSidebar
Navigation sidebar with links to all modules.

**Modules:**
- Dashboard
- Tasks
- Habits
- Finance
- Fitness
- Nutrition
- Learning
- Analytics
- Integrations
- Notifications

## Data Fetching Strategy

The dashboard uses a combination of strategies for optimal performance:

1. **Initial Load**: Fetches all data on component mount
2. **Auto-Refresh**: Updates data every 5 minutes automatically
3. **Manual Refresh**: User can trigger refresh via button
4. **Caching**: Uses `cache: 'no-store'` to ensure fresh data
5. **Silent Updates**: Background refreshes don't show loading state

> **Where did the scores go?** The Productivity / Wellness / Growth / Overall scores are computed by `lib/analytics/metrics-engine.ts` and surfaced on the `/analytics` page, not here. The dashboard intentionally focuses on cashflow + today's activity counts.

## Requirements Validation

This implementation satisfies the following requirements:

**Requirement 8.2**: Dashboard displays key performance indicators, trends, and actionable insights
- ✅ KPI widgets for all major metrics
- ✅ Real-time data updates
- ✅ Activity feed showing recent actions

**Requirement 9.1**: Professional interface with customizable themes
- ✅ Clean, professional design
- ✅ Theme toggle in header
- ✅ Consistent design language

**Requirement 9.2**: Smooth transitions and consistent design
- ✅ Smooth hover effects
- ✅ Loading states
- ✅ Responsive animations

**Requirement 10.1**: Enterprise-grade performance
- ✅ Efficient data fetching
- ✅ Auto-refresh with caching
- ✅ Optimized rendering

## Future Enhancements

- [ ] Customizable widget layout (drag-and-drop)
- [ ] Widget preferences (show/hide)
- [ ] Custom date range selection
- [ ] Export dashboard as PDF
- [ ] Real-time WebSocket updates
- [ ] Comparison with previous periods
- [ ] Goal setting from dashboard
- [ ] AI-powered insights
