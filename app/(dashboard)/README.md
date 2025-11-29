# Dashboard Layout

This directory contains all protected dashboard routes that share a common layout with sidebar and header.

## Structure

All pages in this route group automatically receive:
- **Header**: Top navigation bar with user menu and notifications
- **Sidebar**: Left navigation menu (collapsible on mobile)
- **Authentication**: Automatic redirect to `/auth/signin` if not logged in
- **Responsive Design**: Mobile-friendly with hamburger menu

## Routes

- `/dashboard` - Main dashboard overview
- `/tasks` - Task management (Board, List, Calendar, Timeline views)
- `/habits` - Habit tracking (Board, Calendar, Progress views)
- `/finance` - Financial management (Overview, Transactions, Budgets, Analytics)
- `/fitness` - Fitness tracking (Overview, Exercises, Goals, Health Metrics)
- `/nutrition` - Nutrition tracking (Overview, Meals, Water Intake)
- `/learning` - Learning resources (Overview, Resources, Skills, Analytics)
- `/analytics` - Cross-platform analytics (Trends, Insights, Achievements, Reports)
- `/integrations` - Third-party integrations
- `/notifications` - Notification preferences

## Layout Components

The layout is defined in `layout.tsx` and uses:
- `DashboardLayout` - Main layout wrapper
- `DashboardHeader` - Top header component
- `DashboardSidebar` - Left sidebar navigation

## Adding New Pages

To add a new page to the dashboard:

1. Create a new folder in `app/(dashboard)/your-page/`
2. Add a `page.tsx` file
3. The page will automatically receive the dashboard layout
4. Add navigation link to `components/layout/dashboard-sidebar.tsx`

Example:
```tsx
'use client'

export default function YourPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Page Title</h1>
        <p className="text-muted-foreground">Description</p>
      </div>
      
      {/* Your content here */}
    </div>
  )
}
```

## Notes

- Pages in this group are automatically protected by authentication
- No need to add `DashboardLayout` wrapper in individual pages
- Container and padding are provided by the layout
- Use `space-y-6` for consistent vertical spacing
