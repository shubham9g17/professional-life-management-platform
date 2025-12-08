# Dashboard Components

This directory contains the main dashboard components for the Professional Life Management Platform.

## Overview

The dashboard provides a comprehensive view of user productivity, wellness, growth, and financial metrics with real-time data updates and interactive widgets.

## Components

### DashboardOverview
Main dashboard component that orchestrates all widgets and handles data fetching.

**Features:**
- Auto-refresh every 5 minutes
- Manual refresh capability
- Loading states and error handling
- Real-time data updates

**Usage:**
```tsx
import { DashboardOverview } from '@/components/dashboard'

<DashboardOverview />
```

### Widgets

#### ProductivityWidget
Displays task completion metrics and productivity score.

**Props:**
- `tasksCompleted`: Number of tasks completed today
- `tasksTotal`: Total number of tasks
- `tasksOnTime`: Number of tasks completed on time
- `productivityScore`: Overall productivity score (0-100)

#### WellnessWidget
Shows health and habit tracking metrics.

**Props:**
- `habitsCompleted`: Number of habits completed today
- `habitsTotal`: Total number of habits
- `exerciseMinutes`: Minutes of exercise today
- `waterGoalMet`: Whether daily water goal is met
- `wellnessScore`: Overall wellness score (0-100)

#### GrowthWidget
Tracks learning and professional development.

**Props:**
- `learningMinutes`: Minutes spent learning today
- `resourcesInProgress`: Number of learning resources in progress
- `resourcesCompleted`: Number of completed resources
- `growthScore`: Overall growth score (0-100)

#### FinancialWidget
Provides financial snapshot for the current month.

**Props:**
- `currentBalance`: Current balance
- `monthlyIncome`: Total income this month
- `monthlyExpenses`: Total expenses this month
- `savingsRate`: Savings rate percentage

#### QuickActionsWidget
Quick access buttons for common actions.

**Actions:**
- Add Task
- Log Habit
- Log Exercise
- Add Transaction

#### ActivityFeedWidget
Shows recent user activities across all modules.

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

## API Endpoints

### GET /api/dashboard/overview

Returns comprehensive dashboard data including:
- Scores (productivity, wellness, growth, overall)
- Productivity metrics
- Wellness metrics
- Growth metrics
- Financial snapshot
- Recent activities

**Response:**
```json
{
  "scores": {
    "productivity": 75,
    "wellness": 80,
    "growth": 65,
    "overall": 73
  },
  "productivity": {
    "tasksCompleted": 5,
    "tasksTotal": 10,
    "tasksOnTime": 4
  },
  "wellness": {
    "habitsCompleted": 3,
    "habitsTotal": 5,
    "exerciseMinutes": 30,
    "waterGoalMet": true
  },
  "growth": {
    "learningMinutes": 45,
    "resourcesInProgress": 2,
    "resourcesCompleted": 1
  },
  "financial": {
    "currentBalance": 5000,
    "monthlyIncome": 6000,
    "monthlyExpenses": 4000,
    "savingsRate": 33.3
  },
  "activities": [...]
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

## Score Calculation

### Productivity Score
- Based on task completion rate
- Formula: (completed / total) * 100
- Capped at 100

### Wellness Score
- Habit completion: 50 points max
- Exercise: 50 points max (30 min = full score)
- Formula: habitScore + exerciseScore

### Growth Score
- Learning time: 70 points max (60 min = full score)
- Resource completion: 30 points per completion
- Capped at 100

### Overall Score
- Average of productivity, wellness, and growth scores
- Formula: (productivity + wellness + growth) / 3

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
