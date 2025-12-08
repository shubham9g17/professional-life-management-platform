# Fitness Components

This directory contains all fitness tracking related UI components for the Professional Life Management Platform.

## Components

### ExerciseForm
Form component for logging exercise activities with activity type, duration, intensity, calories burned, and notes.

**Props:**
- `onSubmit`: Async function to handle form submission
- `initialData`: Optional initial form data for editing
- `isEditing`: Boolean flag for edit mode

### ExerciseLog
List view component for displaying logged exercises with edit and delete actions.

**Props:**
- `exercises`: Array of exercise objects
- `onEdit`: Optional callback for editing an exercise
- `onDelete`: Optional callback for deleting an exercise

### HealthMetricsForm
Form component for tracking health metrics including weight, sleep quality, stress level, and energy level.

**Props:**
- `onSubmit`: Async function to handle form submission
- `initialData`: Optional initial form data

### FitnessDashboard
Dashboard component displaying weekly summary, exercise statistics, and latest health metrics.

**Props:**
- `stats`: Exercise statistics object
- `latestMetrics`: Optional latest health metrics

### FitnessGoals
Component for creating and tracking fitness goals with progress visualization.

**Props:**
- `goals`: Array of fitness goal objects
- `onCreateGoal`: Optional callback for creating a new goal
- `onUpdateProgress`: Optional callback for updating goal progress
- `onDeleteGoal`: Optional callback for deleting a goal

### FitnessCharts
Visualization component for exercise and health metric trends.

**Props:**
- `exercises`: Array of exercise objects
- `healthMetrics`: Array of health metric objects

## Usage Example

```tsx
import {
  ExerciseForm,
  ExerciseLog,
  HealthMetricsForm,
  FitnessDashboard,
  FitnessGoals,
  FitnessCharts,
} from '@/components/fitness'

// In your page component
export default function FitnessPage() {
  const handleExerciseSubmit = async (data) => {
    const response = await fetch('/api/exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    // Handle response
  }

  return (
    <div>
      <FitnessDashboard stats={stats} latestMetrics={latestMetrics} />
      <ExerciseForm onSubmit={handleExerciseSubmit} />
      <ExerciseLog exercises={exercises} onEdit={handleEdit} onDelete={handleDelete} />
      <FitnessGoals goals={goals} onCreateGoal={handleCreateGoal} />
      <FitnessCharts exercises={exercises} healthMetrics={healthMetrics} />
    </div>
  )
}
```

## API Integration

These components are designed to work with the following API endpoints:

- `GET /api/exercises` - Fetch exercises with optional filtering
- `POST /api/exercises` - Create new exercise log
- `PATCH /api/exercises/[id]` - Update exercise log
- `DELETE /api/exercises/[id]` - Delete exercise log
- `GET /api/exercises/stats` - Get exercise statistics
- `GET /api/health-metrics` - Fetch health metrics
- `POST /api/health-metrics` - Create/update health metrics
- `GET /api/fitness-goals` - Fetch fitness goals
- `POST /api/fitness-goals` - Create new fitness goal
- `PATCH /api/fitness-goals/[id]` - Update fitness goal
- `DELETE /api/fitness-goals/[id]` - Delete fitness goal

## Styling

All components use Tailwind CSS for styling and are designed to match the professional aesthetic of the platform. They are fully responsive and work well on mobile, tablet, and desktop devices.
