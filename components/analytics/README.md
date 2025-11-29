# Analytics Module

The Analytics module provides comprehensive insights into user productivity, wellness, and growth through data-driven metrics, visualizations, and intelligent recommendations.

## Components

### AnalyticsDashboard
Main dashboard component that orchestrates all analytics features.

**Features:**
- Real-time score display (Productivity, Wellness, Growth, Overall)
- Today's activity summary
- Personalized insights and recommendations
- Historical trend visualization
- Recent achievements display
- Report generation

**Usage:**
```tsx
import { AnalyticsDashboard } from '@/components/analytics'

export default function AnalyticsPage() {
  return <AnalyticsDashboard />
}
```

### MetricCardsGrid
Displays key performance indicators in a grid layout.

**Props:**
- `productivityScore`: number (0-100)
- `wellnessScore`: number (0-100)
- `growthScore`: number (0-100)
- `overallScore`: number (0-100)

### TrendCharts
Visualizes historical score trends over time.

**Props:**
- `data`: Array of trend data points
- `isLoading`: boolean (optional)

### InsightPanel
Displays AI-generated insights and recommendations.

**Props:**
- `insights`: Array of insight objects
- `isLoading`: boolean (optional)

**Insight Types:**
- `POSITIVE`: Celebrating achievements and good performance
- `IMPROVEMENT`: Suggesting areas for growth
- `NEUTRAL`: General observations and information

### ReportGenerator
Generates weekly or monthly performance reports.

**Props:**
- `onGenerate`: Function to generate report data

**Features:**
- Weekly and monthly report types
- Comprehensive activity summaries
- Average score calculations
- Export capabilities (PDF, CSV)

### AchievementDisplay
Shows unlocked achievements with category badges.

**Props:**
- `achievements`: Array of achievement objects
- `isLoading`: boolean (optional)
- `limit`: number (optional) - Limit displayed achievements

## API Endpoints

### GET /api/analytics/overview
Returns dashboard overview with current scores and key metrics.

**Response:**
```json
{
  "currentScores": {
    "productivityScore": 75.5,
    "wellnessScore": 82.3,
    "growthScore": 68.9,
    "overallScore": 76.2
  },
  "today": {
    "tasksCompleted": 5,
    "habitsCompleted": 3,
    "exerciseMinutes": 45,
    "learningMinutes": 30
  },
  "weeklyAverages": { ... },
  "monthlyTotals": { ... }
}
```

### GET /api/analytics/trends
Returns historical trend data for charts.

**Query Parameters:**
- `days`: number (default: 30, max: 365)

**Response:**
```json
{
  "trends": [
    {
      "date": "2024-01-01",
      "productivityScore": 75,
      "wellnessScore": 80,
      "growthScore": 70,
      "overallScore": 75
    }
  ],
  "period": { ... }
}
```

### GET /api/analytics/insights
Returns AI-generated insights and recommendations.

**Response:**
```json
{
  "insights": [
    {
      "type": "POSITIVE",
      "category": "PRODUCTIVITY",
      "title": "Excellent Productivity",
      "description": "You're maintaining a strong productivity score...",
      "metric": 85
    }
  ],
  "generatedAt": "2024-01-01T00:00:00Z"
}
```

### GET /api/analytics/reports
Generates weekly or monthly summary reports.

**Query Parameters:**
- `type`: "weekly" | "monthly"

**Response:**
```json
{
  "type": "weekly",
  "report": {
    "period": { ... },
    "totals": { ... },
    "averages": { ... },
    "daysTracked": 7
  },
  "generatedAt": "2024-01-01T00:00:00Z"
}
```

### GET /api/achievements
Returns user achievements.

**Query Parameters:**
- `limit`: number (optional)

**Response:**
```json
{
  "achievements": [
    {
      "id": "...",
      "type": "STREAK_7",
      "title": "Week Warrior",
      "description": "Completed habits for 7 consecutive days",
      "category": "WELLNESS",
      "unlockedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 10
}
```

## Metrics Engine

### Score Calculation

#### Productivity Score (0-100)
- Task completion rate: 50%
- On-time completion rate: 30%
- Task activity: 20%

#### Wellness Score (0-100)
- Habit completion rate: 40%
- Exercise activity: 30%
- Nutrition tracking: 30%

#### Growth Score (0-100)
- Learning time invested: 70%
- Consistency bonus: 30%

#### Overall Score (0-100)
Weighted average:
- Productivity: 35%
- Wellness: 35%
- Growth: 30%

### Daily Metrics Aggregation

The system automatically aggregates daily metrics from:
- Task completions and timeliness
- Habit completions
- Exercise logs
- Meal and water tracking
- Learning resource progress

### User Score Updates

User scores are updated as a rolling 7-day average, providing a balanced view of recent performance while smoothing out daily fluctuations.

## Data Flow

1. **User Activity** → Various modules (Tasks, Habits, Fitness, etc.)
2. **Metrics Calculation** → `updateDailyMetrics()` aggregates and calculates scores
3. **Storage** → DailyMetrics table stores daily snapshots
4. **User Scores** → Rolling 7-day average updates User table
5. **API Endpoints** → Serve aggregated data to UI components
6. **Dashboard** → Displays real-time insights and visualizations

## Integration

To trigger metrics updates after user activities:

```typescript
import { updateDailyMetrics } from '@/lib/analytics/metrics-engine'

// After completing a task, habit, exercise, etc.
await updateDailyMetrics(userId, new Date())
```

This ensures scores are always up-to-date with the latest user activities.

## Future Enhancements

- Machine learning-based insights
- Predictive analytics for goal achievement
- Comparative analytics (vs. previous periods)
- Custom metric definitions
- Advanced data export formats
- Social comparison features (opt-in)
