# Learning & Development Components

This directory contains all UI components related to the Learning & Development module of the Professional Life Management Platform.

## Components

### ResourceForm
Form component for creating and editing learning resources (books, courses, certifications, articles).

### ResourceList
List view component displaying all learning resources with filtering options.

### ProgressTracker
Component for tracking and updating progress on learning resources.

### LearningDashboard
Main dashboard view showing learning statistics, in-progress resources, and recent completions.

### SkillMatrix
Visualization component showing knowledge areas and proficiency levels.

### LearningCharts
Chart components for visualizing learning trends and patterns.

## Usage

```tsx
import { LearningDashboard } from '@/components/learning'

export default function LearningPage() {
  return <LearningDashboard />
}
```
