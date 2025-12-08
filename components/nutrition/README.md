# Nutrition Components

This directory contains all nutrition tracking components for the Professional Life Management Platform.

## Components

### MealForm
Form component for logging meals with meal type, food items, and optional macro tracking (calories, protein, carbs, fats).

**Props:**
- `onSubmit`: Async function to handle form submission
- `initialData`: Optional initial form data for editing
- `isEditing`: Boolean flag for edit mode

**Features:**
- Meal type selection (Breakfast, Lunch, Dinner, Snack)
- Dynamic food items list with add/remove functionality
- Optional macro tracking (calories, protein, carbs, fats)
- Date selection
- Form validation

### MealLog
Component for displaying and managing logged meals.

**Props:**
- `onEdit`: Optional callback for editing meals
- `onDelete`: Optional callback after deleting meals

**Features:**
- Filter meals by type
- Display meal details with food items and macros
- Edit and delete functionality
- Color-coded meal type badges
- Responsive layout

### WaterTracker
Component for tracking daily water intake with progress visualization.

**Props:**
- `dailyGoal`: Daily water intake goal in ml (default: 2000)

**Features:**
- Progress bar showing daily goal achievement
- Quick amount buttons (250ml, 500ml, 750ml, 1000ml)
- Custom amount input
- Today's log with timestamps
- Remove individual water intake entries

### NutritionDashboard
Main dashboard component that combines all nutrition tracking features.

**Features:**
- Tabbed interface (Overview, Meals, Water)
- Statistics cards showing:
  - Total meals logged
  - Average calories per meal
  - Average daily water intake
  - Days tracked
- Meals by type breakdown
- Average macros visualization
- Integrated meal form modal
- Real-time stats updates

### NutritionCharts
Visualization component for nutrition patterns over time.

**Features:**
- Meals per day chart (last 7 days)
- Water intake chart with daily goal indicator
- Calories per day chart (when macro data available)
- Bar chart visualizations
- Date-based grouping

## Usage Example

```tsx
import { NutritionDashboard } from '@/components/nutrition'

export default function NutritionPage() {
  return (
    <div className="container mx-auto p-6">
      <NutritionDashboard />
    </div>
  )
}
```

## API Integration

These components integrate with the following API endpoints:

- `GET /api/meals` - Fetch meals with optional filtering
- `POST /api/meals` - Create new meal log
- `PATCH /api/meals/[id]` - Update meal log
- `DELETE /api/meals/[id]` - Delete meal log
- `GET /api/water` - Fetch water intake logs
- `POST /api/water` - Create water intake log
- `DELETE /api/water/[id]` - Delete water intake log
- `GET /api/nutrition/stats` - Get nutrition statistics

## Data Models

### Meal
```typescript
interface Meal {
  id: string
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
  foodItems: string[]
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
  date: Date
}
```

### WaterIntake
```typescript
interface WaterIntake {
  id: string
  amount: number // ml
  date: Date
}
```

## Requirements Validation

These components fulfill the following requirements:

- **Requirement 6.1**: Meal logging with food items and optional macro tracking
- **Requirement 6.2**: Water intake tracking with daily consumption goals
- **Requirement 6.3**: Daily nutrition goal achievement tracking
- **Requirement 6.4**: Meal patterns and hydration trends visualization
- **Requirement 6.5**: Evidence-based recommendations (through stats and patterns)
