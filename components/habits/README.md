# Habit Tracking Module

This module provides comprehensive habit tracking functionality for the Professional Life Management Platform.

## Features

### Data Layer (`lib/repositories/habit-repository.ts`)
- **Habit CRUD Operations**: Create, read, update, and delete habits
- **Streak Calculation**: Automatically calculates current and longest streaks based on consecutive completions
- **Completion Rate**: Tracks completion percentage since habit creation
- **Category Filtering**: Filter habits by category (Professional Development, Health, Productivity, Personal Growth)

### API Endpoints

#### `GET /api/habits`
Get all habits for the authenticated user with completion data.
- Query params: `category` (optional) - Filter by category

#### `POST /api/habits`
Create a new habit.
- Body: `{ name, category, frequency }`
- Categories: `PROFESSIONAL_DEVELOPMENT`, `HEALTH`, `PRODUCTIVITY`, `PERSONAL_GROWTH`
- Frequencies: `DAILY`, `WEEKLY`, `CUSTOM`

#### `GET /api/habits/[id]`
Get a single habit by ID.

#### `PATCH /api/habits/[id]`
Update a habit.
- Body: `{ name?, category?, frequency? }`

#### `DELETE /api/habits/[id]`
Delete a habit.

#### `POST /api/habits/[id]/complete`
Mark a habit as completed and update streak.
- Body: `{ notes? }`

### UI Components

#### `HabitForm`
Form component for creating and editing habits with category and frequency selection.

#### `HabitCard`
Displays individual habit with:
- Current streak
- Longest streak
- Completion rate
- Complete button (disabled if already completed today)
- Edit and delete actions

#### `HabitBoard`
Main dashboard view with:
- Grid layout of all habits
- Category filtering
- Create new habit form
- Real-time updates on completion

#### `HabitProgress`
Detailed progress visualization showing:
- Last 30 days completion grid
- Current streak, best streak, and completion rate metrics
- Visual indicators for completed vs. missed days

#### `HabitCalendar`
Heat map calendar view showing:
- 12-week history
- Color intensity based on number of habits completed per day
- Month and day labels
- Legend for completion intensity

## Streak Calculation Logic

The streak calculation follows these rules:
1. A streak is consecutive days with completions
2. The most recent completion must be today or yesterday to maintain the streak
3. If more than 1 day has passed since the last completion, the streak resets to 0
4. Completions on the same day count as one completion
5. The longest streak is tracked separately and never decreases

## Completion Rate Calculation

The completion rate is calculated as:
```
(Total Completions / Days Since Creation) * 100
```

- Capped at 100%
- Rounded to 2 decimal places
- Minimum of 1 day is used for habits created today

## Requirements Validated

This implementation satisfies the following requirements:

### Requirement 3.1
- ✅ Habits can be categorized by type (Professional Development, Health, Productivity, Personal Growth)

### Requirement 3.2
- ✅ Completing a habit increments the streak counter and updates metrics
- ✅ Missing a habit resets the streak (handled by streak calculation logic)

### Requirement 3.3
- ✅ Streak calculation provides insights on patterns

### Requirement 3.4
- ✅ Habit streaks are displayed with trend analysis

### Requirement 3.5
- ✅ Habits display completion rates, streaks, and historical performance data

## Testing

Unit tests are provided in `lib/repositories/__tests__/habit-repository.test.ts` covering:
- Streak calculation edge cases
- Completion rate calculation
- Empty state handling
- Consecutive day tracking
- Gap detection in streaks

Run tests with:
```bash
npm test habit-repository.test.ts
```

## Usage Example

```typescript
import { HabitBoard } from '@/components/habits'

export default function HabitsPage() {
  return (
    <div className="container mx-auto p-6">
      <HabitBoard />
    </div>
  )
}
```

## Future Enhancements

- Habit reminders based on optimal completion times
- Achievement notifications for milestone streaks (7, 30, 100 days)
- Weekly/monthly habit reports
- Habit templates for common professional habits
- Integration with calendar for scheduling
