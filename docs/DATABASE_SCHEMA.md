# Database Schema Overview

## Summary

This document provides a high-level overview of the database schema for the Professional Life Management Platform. The platform uses SQLite for easy development and deployment without requiring a separate database server.

## Entity Relationship Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────────┐
│                            USER                                  │
│  - Authentication & Preferences                                  │
│  - Notification Settings                                         │
│  - Aggregate Metrics                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (one-to-many)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│    TASKS     │      │   HABITS     │     │ TRANSACTIONS │
│              │      │              │     │              │
│ - Workspace  │      │ - Category   │     │ - Type       │
│ - Priority   │      │ - Frequency  │     │ - Category   │
│ - Status     │      │ - Streaks    │     │ - Amount     │
└──────────────┘      └──────────────┘     └──────────────┘
                              │
                              │
                              ▼
                      ┌──────────────┐
                      │   HABIT      │
                      │ COMPLETIONS  │
                      └──────────────┘

        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│  EXERCISES   │      │    MEALS     │     │   LEARNING   │
│              │      │              │     │  RESOURCES   │
│ - Activity   │      │ - Meal Type  │     │              │
│ - Duration   │      │ - Macros     │     │ - Type       │
│ - Intensity  │      │              │     │ - Progress   │
└──────────────┘      └──────────────┘     └──────────────┘

        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│   HEALTH     │      │    WATER     │     │    DAILY     │
│   METRICS    │      │   INTAKE     │     │   METRICS    │
│              │      │              │     │              │
│ - Weight     │      │ - Amount     │     │ - Aggregated │
│ - Sleep      │      │ - Date       │     │ - Scores     │
│ - Stress     │      │              │     │              │
└──────────────┘      └──────────────┘     └──────────────┘

        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│ ACHIEVEMENTS │      │NOTIFICATIONS │     │  SYNC QUEUE  │
│              │      │              │     │              │
│ - Category   │      │ - Type       │     │ - Operation  │
│ - Milestone  │      │ - Read       │     │ - Entity     │
└──────────────┘      └──────────────┘     └──────────────┘

                              │
                              ▼
                      ┌──────────────┐
                      │  CONFLICT    │
                      │ RESOLUTION   │
                      └──────────────┘
```

## Model Categories

### 1. Core User Management
- **User**: Central user entity with authentication and preferences

### 2. Productivity Module
- **Task**: Task management with workspace categorization
- Supports: Professional, Personal, Learning workspaces
- Features: Priority levels, due dates, status tracking

### 3. Habit Formation Module
- **Habit**: Habit definitions with categories
- **HabitCompletion**: Individual completion records
- Features: Streak tracking, completion rates

### 4. Financial Module
- **Transaction**: Income and expense tracking
- **Budget**: Budget limits with alerts
- Features: Custom categories, monthly tracking

### 5. Fitness Module
- **Exercise**: Activity logging
- **HealthMetric**: Daily health tracking
- Features: Duration, intensity, health metrics

### 6. Nutrition Module
- **Meal**: Meal logging with macros
- **WaterIntake**: Hydration tracking
- Features: Meal types, macro tracking

### 7. Learning Module
- **LearningResource**: Professional development tracking
- Features: Progress tracking, time investment

### 8. Analytics Module
- **DailyMetrics**: Aggregated daily performance
- **Achievement**: Milestone tracking
- Features: Multi-dimensional scoring

### 9. System Module
- **Notification**: User notifications
- **SyncQueue**: Offline operation queue
- **ConflictResolution**: Sync conflict handling

## Key Design Decisions

### 1. Workspace Categorization
Tasks are categorized into three workspaces:
- **Professional**: Work-related tasks
- **Personal**: Personal life tasks
- **Learning**: Educational and development tasks

This enables work-life balance tracking and targeted analytics.

### 2. Habit Tracking Strategy
Habits use a two-model approach:
- **Habit**: Definition and aggregate stats
- **HabitCompletion**: Individual completion records

This allows efficient streak calculation and historical analysis.

### 3. Flexible Financial Tracking
Transactions support:
- Custom categories and subcategories
- Tag-based organization
- Budget tracking per category

### 4. Comprehensive Health Tracking
Separate models for:
- **Exercise**: Activity-based tracking
- **HealthMetric**: Daily health indicators
- **Meal**: Nutrition tracking
- **WaterIntake**: Hydration tracking

### 5. Analytics Architecture
Two-tier analytics:
- **DailyMetrics**: Daily aggregations for performance
- **User metrics**: Rolling aggregate scores

This enables both historical analysis and real-time dashboards.

### 6. Offline-First Design
Dedicated models for offline support:
- **SyncQueue**: Queues operations when offline
- **ConflictResolution**: Handles sync conflicts

Ensures data integrity across online/offline transitions.

## Performance Optimizations

### Index Strategy
1. **Single-column indexes**: High-cardinality fields (userId, date, status)
2. **Composite indexes**: Common query patterns (userId + date, userId + status)
3. **Unique indexes**: Data integrity (email, userId + category)

### Query Patterns Optimized
- User data retrieval by ID
- Time-range queries (daily, weekly, monthly)
- Status-based filtering
- Category-based aggregations
- Recent activity queries

### Data Types
- **JSON strings**: Tags and arrays stored as JSON for SQLite compatibility
- **JSON**: Flexible notification and sync data
- **Timestamps**: Automatic tracking with indexes
- **Floats**: Precise metric calculations

## Data Integrity

### Cascade Deletes
All foreign keys use `ON DELETE CASCADE`:
- Deleting a user removes all associated data
- Deleting a habit removes all completions
- Maintains referential integrity

### Unique Constraints
- User email (authentication)
- Budget per category per user (no duplicates)
- Health metrics per date per user (one entry per day)
- Daily metrics per date per user (one entry per day)

### Default Values
- Timestamps auto-managed
- Scores default to 0
- Notification preferences default to enabled
- Boolean flags with sensible defaults

## Scalability Considerations

### Current Design
- Optimized for single-user queries
- Efficient time-series data storage
- Indexed for common access patterns

### Future Enhancements
- Partitioning by date for historical data
- Read replicas for analytics queries
- Caching layer for frequently accessed data
- Archive strategy for old data

## Migration Strategy

### Initial Migration
- `20251128161320_initial_schema`: Complete SQLite schema with all models

### Future Migrations
- Additive changes preferred
- Backward-compatible when possible
- Data migration scripts for breaking changes

## Security Considerations

### Data Protection
- Password hashing (bcrypt) at application layer
- No sensitive data in logs
- Row-level security via userId filtering

### Access Control
- All queries filtered by userId
- Foreign key constraints prevent unauthorized access
- Cascade deletes ensure complete data removal

## Monitoring & Maintenance

### Key Metrics to Monitor
- Query performance (< 100ms reads, < 200ms writes)
- Index usage and efficiency
- Table sizes and growth rates
- Connection pool utilization

### Maintenance Tasks
- Regular VACUUM for SQLite optimization
- Index rebuilding if needed
- Query plan analysis for slow queries
- Regular database file backups

## Related Documentation

- **Detailed Schema**: `prisma/schema.prisma`
- **Migration Files**: `prisma/migrations/`
- **Setup Guide**: `prisma/README.md`
- **Design Document**: `.kiro/specs/professional-life-management-platform/design.md`
- **Requirements**: `.kiro/specs/professional-life-management-platform/requirements.md`
