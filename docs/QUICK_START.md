# Quick Start Guide

## Getting Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Database is Ready!
The SQLite database has already been created and migrated. No additional setup needed!

Location: `prisma/dev.db`

### 3. Start Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## That's It! 🎉

The database is already set up with all tables, indexes, and relationships. You can start building features immediately.

## Useful Commands

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
```

### Database
```bash
npx prisma studio    # Visual database browser (http://localhost:5555)
npx prisma generate  # Regenerate Prisma client
npx prisma migrate dev  # Create new migration
```

### Testing
```bash
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Open test UI
npm run test:coverage # Generate coverage report
```

### Code Quality
```bash
npm run lint         # Run ESLint
```

## Database Schema

The database includes 16 models:

**Core:**
- User (authentication & preferences)

**Productivity:**
- Task (with workspace categorization)
- Habit & HabitCompletion

**Finance:**
- Transaction & Budget

**Health:**
- Exercise & HealthMetric
- Meal & WaterIntake

**Learning:**
- LearningResource

**Analytics:**
- DailyMetrics & Achievement

**System:**
- Notification
- SyncQueue & ConflictResolution

## Working with Array Fields

SQLite stores arrays as JSON strings. Use these patterns:

```typescript
// Creating with arrays
const task = await prisma.task.create({
  data: {
    title: "My Task",
    tags: JSON.stringify(["urgent", "work"]),
    // ... other fields
  },
});

// Reading arrays
const task = await prisma.task.findUnique({ where: { id } });
const tags = JSON.parse(task.tags); // ["urgent", "work"]
```

## Next Steps

1. ✅ Database is ready
2. ✅ All dependencies installed
3. 🔨 Start building features!

Check out:
- `SETUP.md` - Detailed setup documentation
- `DATABASE_SCHEMA.md` - Database architecture
- `SQLITE_MIGRATION.md` - SQLite-specific information
- `prisma/README.md` - Database documentation

## Need Help?

- View database: `npx prisma studio`
- Check schema: `npx prisma validate`
- Reset database: `npx prisma migrate reset` (⚠️ deletes all data)

Happy coding! 🚀
