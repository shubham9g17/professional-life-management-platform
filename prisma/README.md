# Database Schema Documentation

## Overview

This directory contains the Prisma schema and migrations for the Professional Life Management Platform. The database uses SQLite for easy development and deployment, designed to support comprehensive tracking of productivity, wellness, and professional development activities.

## Schema Structure

### Core Models

#### User Model
- Stores user authentication credentials and preferences
- Includes notification preferences (quiet hours, frequency)
- Tracks aggregate metrics (productivity, wellness, growth scores)
- Theme and timezone preferences

#### Task Management
- **Task**: Tasks with workspace categorization (Professional, Personal, Learning)
- Supports priority levels, due dates, and estimated effort
- Soft delete capability with status tracking

#### Habit Tracking
- **Habit**: Habit definitions with categories and frequency
- **HabitCompletion**: Individual completion records
- Automatic streak calculation and completion rate tracking

#### Financial Tracking
- **Transaction**: Income and expense tracking with categories
- **Budget**: Monthly budget limits with alert thresholds
- Support for custom categories and subcategories

#### Fitness & Health
- **Exercise**: Activity logging with duration and intensity
- **HealthMetric**: Daily health metrics (weight, sleep, stress, energy)

#### Nutrition
- **Meal**: Meal logging with optional macro tracking
- **WaterIntake**: Hydration tracking

#### Learning & Development
- **LearningResource**: Books, courses, certifications, articles
- Progress tracking with completion percentage and time invested

#### Analytics
- **DailyMetrics**: Aggregated daily performance metrics
- **Achievement**: Milestone tracking across all categories

#### System Features
- **Notification**: User notifications with read status
- **SyncQueue**: Offline operation queue for sync
- **ConflictResolution**: Conflict resolution for offline sync

## Database Indexes

The schema includes comprehensive indexes for optimal query performance:

- **User indexes**: email lookup
- **Task indexes**: userId, status, workspace, dueDate, composite indexes
- **Habit indexes**: userId, category, composite indexes
- **Transaction indexes**: userId, type, category, date, composite indexes
- **Exercise indexes**: userId, date, activityType
- **Meal indexes**: userId, date, mealType
- **Notification indexes**: userId, read status, createdAt
- **SyncQueue indexes**: userId, synced status, timestamp

## Running Migrations

### Prerequisites

1. No database server required - SQLite is file-based!
2. Configure DATABASE_URL in `.env` file:
   ```
   DATABASE_URL="file:./dev.db"
   ```

### Generate Prisma Client

```bash
npx prisma generate
```

### Apply Migrations

```bash
# Apply all pending migrations
npx prisma migrate deploy

# Or for development (creates migration if schema changed)
npx prisma migrate dev
```

### Reset Database (Development Only)

```bash
npx prisma migrate reset
```

This will:
1. Drop the database
2. Create a new database
3. Apply all migrations
4. Run seed script (if configured)

## Prisma Studio

To explore and edit data visually:

```bash
npx prisma studio
```

This opens a web interface at http://localhost:5555

## Schema Validation

To validate the schema without applying changes:

```bash
npx prisma validate
```

## Key Features

### Cascade Deletes
All relations use `onDelete: Cascade` to ensure data integrity when users are deleted.

### Unique Constraints
- User email must be unique
- Budget per category per user must be unique
- HealthMetric per date per user must be unique
- DailyMetrics per date per user must be unique

### Default Values
- Timestamps (createdAt, updatedAt) are automatically managed
- Boolean flags default to sensible values
- Numeric scores default to 0
- Notification preferences default to enabled

### JSON Fields
- Notification data (flexible additional data)
- SyncQueue data (operation payload)
- ConflictResolution versions (local, server, resolved)

## Performance Considerations

1. **Composite Indexes**: Frequently queried combinations (userId + date, userId + status) have composite indexes
2. **JSON Fields**: Tags and arrays stored as JSON strings for SQLite compatibility
3. **Timestamps**: All date fields are indexed for time-based queries
4. **Foreign Keys**: All relations have proper foreign key constraints with cascade deletes

## Migration History

- `20251128161320_initial_schema`: Initial SQLite database schema with all models, indexes, and relationships

## Troubleshooting

### Migration Fails
If a migration fails:
1. Verify DATABASE_URL is correct in .env file
2. Check file permissions for the database directory
3. Review migration SQL for conflicts
4. Delete dev.db and run migrations again if needed

### Schema Drift
If schema and database are out of sync:
```bash
npx prisma db push --accept-data-loss  # Development only!
```

### Connection Issues
Test database connection:
```bash
npx prisma db execute --stdin <<< "SELECT 1"
```

## Best Practices

1. **Never edit migration files manually** after they've been applied
2. **Always generate Prisma Client** after schema changes
3. **Use transactions** for operations that modify multiple tables
4. **Test migrations** in development before applying to production
5. **Backup database** before running migrations in production
6. **Version control** all schema and migration files

## Related Documentation

- [Prisma Documentation](https://www.prisma.io/docs)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- Design Document: `../.kiro/specs/professional-life-management-platform/design.md`
- Requirements: `../.kiro/specs/professional-life-management-platform/requirements.md`
