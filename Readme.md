# Professional Life Management Platform

> Enterprise-grade productivity and wellness application for working professionals. Built with Next.js 16, React 19, TypeScript, and PostgreSQL.

## 🌟 Overview

The Professional Life Management Platform is a comprehensive web application designed to help working professionals manage all aspects of their personal and professional lives in one unified system. It integrates task management, habit tracking, financial monitoring, fitness tracking, nutrition logging, and professional development with sophisticated analytics and insights.

### Key Features

- **📋 Task Management** - Organize tasks across Professional, Personal, and Learning workspaces with Kanban, List, Calendar, and Timeline views
- **✅ Habit Tracking** - Build consistent routines with streak tracking, completion rates, and analytics
- **💰 Financial Tracking** - Monitor budget, investments, and financial goals with detailed categorization
- **🏃 Fitness Tracking** - Log exercises, track health metrics, and monitor fitness goals
- **🥗 Nutrition Logging** - Track meals, macros, and hydration with daily goal monitoring
- **📚 Learning & Development** - Monitor professional growth, skill development, and learning progress
- **📊 Analytics Dashboard** - Data-driven insights across all life domains with comprehensive metrics
- **🔄 Offline Support** - Continue working offline with automatic sync and conflict resolution
- **🔗 Integrations** - Connect with calendar apps, fitness trackers, and productivity tools
- **🎨 Professional UI** - Clean, customizable interface with light/dark themes

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Database**: PostgreSQL (the Prisma datasource is `postgresql` — see `prisma/schema.prisma`)
- **Redis**: Optional - can be disabled (see [No Redis Setup](./docs/NO_REDIS_SETUP.md))

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd professional-life-management-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Configure your database URL in .env (PostgreSQL):
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Disable Redis for standalone operation (no external dependencies)
ENABLE_REDIS="false"

# Run database migrations
npx prisma migrate dev

# Start development server (uses Turbopack via Next 16)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📦 Tech Stack

### Core Technologies

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19 with React Compiler enabled, TypeScript
- **UI Framework**: Tailwind CSS v4 with custom design system, Radix UI primitives
- **State Management**: Zustand (client state), TanStack Query (server state)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT sessions (7-day expiry, bcrypt password hashing)
- **Testing**: Vitest + fast-check (unit / property-based, scoped to `lib/**`); Playwright (e2e)

### Optional Services

- **Caching**: Redis (optional - can be disabled)
- **Monitoring**: Sentry, New Relic (optional)
- **Analytics**: Custom analytics engine

## 🏗️ Project Structure

```
professional-life-management-platform/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Authenticated route group (sidebar+header layout)
│   │   ├── dashboard/            # Main dashboard
│   │   ├── tasks/                # Task management (Board / List / Calendar / Timeline)
│   │   ├── habits/               # Habit tracking
│   │   ├── finance/              # Transactions + budgets
│   │   ├── fitness/              # Exercises + goals + health metrics
│   │   ├── nutrition/            # Meals + water
│   │   ├── learning/             # Learning resources + skills
│   │   ├── analytics/            # Cross-domain insights + achievements
│   │   ├── integrations/         # Third-party connectors
│   │   └── notifications/        # Notifications + preferences
│   ├── api/                      # REST API routes (one folder per domain)
│   ├── auth/                     # Sign-in / sign-up pages
│   └── ...
├── components/                   # React components, grouped by domain
├── lib/                          # Cross-cutting modules
│   ├── auth/                     # NextAuth config + helpers
│   ├── cache/                    # Repository cache keys
│   ├── error/                    # AppError, handleApiError
│   ├── integrations/             # OAuth + export service
│   ├── logging/                  # Logger + correlation IDs + audit log
│   ├── offline/                  # IndexedDB sync queue (client) + reconciliation
│   ├── repositories/             # Only place that calls prisma.*
│   ├── security/                 # api-wrapper, rate limit, GDPR
│   └── ...
├── prisma/                       # schema.prisma + migrations
├── proxy.ts                      # Next 16 auth middleware (renamed from middleware.ts)
├── tests/e2e/                    # Playwright suites (auth, crud, side-effects, functionality, visual)
├── test/                         # Vitest setup
├── docs/                         # Operational/dev documentation
├── Features.md                   # Feature inventory (every page, every endpoint)
├── Test.md                       # Test plan (maps every feature to its spec)
├── scripts/                      # Utility scripts
└── monitoring/                   # Monitoring configuration
```

## 📚 Documentation

### Getting Started

- **[Quick Start Guide](./docs/QUICK_START.md)** - Get up and running in 5 minutes
- **[Setup Guide](./docs/SETUP.md)** - Detailed installation and configuration
- **[No Redis Setup](./docs/NO_REDIS_SETUP.md)** - Run without external dependencies
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - Database structure and relationships

### Feature Inventory & Test Coverage

- **[Features.md](./Features.md)** - Authoritative feature inventory: every page, every API endpoint, every cross-cutting concern
- **[Test.md](./Test.md)** - Test plan that maps each feature to its spec, plus an honest "out-of-scope" section

### Development

- **[Authentication Guide](./docs/AUTHENTICATION_GUIDE.md)** - Authentication implementation
- **[Error Handling](./docs/ERROR_HANDLING.md)** - Error handling patterns
- **[Caching Strategy](./docs/CACHING_STRATEGY.md)** - Caching implementation
- **[Performance Optimizations](./docs/PERFORMANCE_OPTIMIZATIONS.md)** - Performance best practices
- **[Theme System](./docs/THEME_SYSTEM.md)** - Theming and design tokens

### Deployment & Operations

- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Complete deployment instructions
- **[Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md)** - Pre-deployment verification
- **[Monitoring Guide](./docs/MONITORING.md)** - Monitoring and observability
- **[Troubleshooting Guide](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Operations Runbook](./docs/RUNBOOK.md)** - Operational procedures
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Quick command reference

### Security & Compliance

- **[Security Guide](./docs/SECURITY.md)** - Security features and best practices
- **[GDPR Compliance](./docs/SECURITY.md#gdpr-compliance)** - Data protection and privacy

### Integration

- **[Integrations Guide](./docs/INTEGRATIONS.md)** - External service integrations

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database (PostgreSQL — the only supported datasource)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"

# Redis (Optional - can be disabled)
ENABLE_REDIS="false"  # Set to "true" to enable caching
# REDIS_URL="redis://localhost:6379"

# Security
ENCRYPTION_KEY="change-this-to-a-secure-random-key"

# Monitoring (Optional)
# APM_DSN=""
# ERROR_TRACKING_DSN=""
LOG_LEVEL="info"
```

### Generate Secure Keys

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -base64 32
```

## 🧪 Testing

The project has two test layers: **Vitest** for unit / property-based tests in `lib/**`, and **Playwright** for end-to-end suites under `tests/e2e/`.

### Vitest (unit / property)

```bash
npm test                  # one-shot run
npm run test:watch        # watch mode
npm run test:ui           # Vitest UI
npm run test:coverage     # v8 coverage; only `lib/**` is included
```

### Playwright (e2e)

```bash
# Start the dev server in one terminal
npm run dev

# In another terminal — run all e2e suites on the laptop project
npx playwright test --project=laptop

# Run a single spec
npx playwright test crud.spec.ts --project=laptop

# Run on every viewport (mobile / tablet / laptop / big-screen) — note: auth/crud/side-effects
# specs are skipped on non-laptop projects to avoid 4× DB churn and signup rate-limit issues
npx playwright test
```

The Playwright suite covers:

| Spec | Coverage |
|---|---|
| `tests/e2e/auth.spec.ts` | Sign-in/up, protected-route redirect |
| `tests/e2e/crud.spec.ts` | Create/Read/Update/Delete on every domain entity, plus 3 UI smokes for forms |
| `tests/e2e/side-effects.spec.ts` | Completion side-effects, achievements, notifications, sync, analytics, stats, dashboard, exports, GDPR, cron, health |
| `tests/e2e/functionality.spec.ts` | Per-page render smoke + console-error budget |
| `tests/e2e/visual.spec.ts` | Per-viewport visual snapshots |

A one-time `tests/e2e/global-setup.ts` signs up a fresh test user per run and persists the session as `tests/e2e/.auth/state.json`, so every spec inherits an authenticated browser context. See **[Test.md](./Test.md)** for the per-feature mapping and known issues.

### Testing Strategy

- **Unit Tests** (Vitest, `lib/**/__tests__/`): repositories, error handling, validation
- **Property-Based Tests** (Vitest + fast-check): invariants on data transformations
- **End-to-End Tests** (Playwright, `tests/e2e/`): real HTTP against the running app, real DB, real auth

## 🚢 Deployment

### Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set environment variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add ENCRYPTION_KEY production

# Deploy
vercel --prod
```

### Docker Deployment

```bash
# Build image
docker build -t professional-life-platform:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e NEXTAUTH_SECRET="..." \
  -e ENABLE_REDIS="false" \
  -e ENCRYPTION_KEY="..." \
  professional-life-platform:latest
```

### Traditional Hosting

```bash
# Build the application
npm run build

# Start production server
npm start

# Or use PM2
pm2 start npm --name "professional-life-platform" -- start
```

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

## 🔍 Monitoring

### Health Check

```bash
curl https://your-domain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy" },
    "redis": { "status": "disabled" },
    "memory": { "status": "healthy" }
  }
}
```

### Monitoring Tools

- **Health Endpoint**: `/api/health` - System health status (database + Redis + memory)
- **Error Tracking**: Sentry integration (optional)
- **APM**: New Relic, Datadog (optional)
- **Uptime Monitoring**: UptimeRobot, Pingdom (optional)

See [Monitoring Guide](./docs/MONITORING.md) for setup instructions.

## 🔐 Security

### Security Features

- ✅ **Authentication**: NextAuth.js with JWT and secure sessions
- ✅ **Password Hashing**: bcrypt with salt rounds
- ✅ **Rate Limiting**: Configurable rate limits on all endpoints
- ✅ **CSRF Protection**: Built-in CSRF token validation
- ✅ **XSS Protection**: Input sanitization and output encoding
- ✅ **SQL Injection Prevention**: Prisma parameterized queries
- ✅ **Encryption**: AES-256 encryption for sensitive data
- ✅ **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- ✅ **Audit Logging**: Comprehensive activity tracking
- ✅ **GDPR Compliance**: Data export and deletion capabilities

See [Security Guide](./docs/SECURITY.md) for details.

## 🎯 Key Features in Detail

### Task Management

- **Multiple Workspaces**: Professional, Personal, Learning
- **Multiple Views**: Kanban board, List, Calendar, Timeline
- **Smart Reminders**: Priority-based intelligent reminders
- **Drag & Drop**: Intuitive task organization
- **Tags & Categories**: Flexible organization system

### Habit Tracking

- **Streak Tracking**: Current and longest streaks
- **Completion Rates**: Historical performance data
- **Categories**: Professional Development, Health, Productivity, Personal Growth
- **Heat Map Calendar**: Visual completion history
- **Milestone Notifications**: Achievement tracking

### Financial Tracking

- **Transaction Management**: Income, expenses with categories
- **Budget Tracking**: Set limits and get alerts
- **Analytics**: Spending patterns, savings rate
- **Export**: CSV, JSON, PDF reports
- **Trends**: Monthly and year-over-year comparisons

### Fitness & Nutrition

- **Exercise Logging**: Activity type, duration, intensity, calories
- **Health Metrics**: Weight, sleep, stress, energy levels
- **Fitness Goals**: Progress tracking and milestones
- **Meal Tracking**: Food items with optional macro tracking
- **Hydration**: Water intake tracking with goals

### Analytics & Insights

- **Productivity Score**: Task completion and on-time delivery
- **Wellness Score**: Habit consistency, fitness, nutrition
- **Growth Score**: Learning progress and skill development
- **Financial Health**: Savings rate, budget adherence
- **Overall Balance**: Weighted composite score
- **Trend Analysis**: Historical data visualization
- **AI Insights**: Pattern detection and recommendations

### Offline Support

- **IndexedDB Storage**: Local data persistence
- **Sync Queue**: Automatic synchronization when online
- **Conflict Detection**: Smart conflict resolution
- **Optimistic Updates**: Instant UI feedback

## 🎨 Customization

### Themes

- **Light Mode**: Professional light theme
- **Dark Mode**: Eye-friendly dark theme
- **Auto Mode**: System preference detection
- **Custom Tokens**: Easily customizable design tokens

### Configuration

All configuration is done through environment variables - no code changes needed.

## 📊 Performance

### Benchmarks

- **API Response Time**: < 200ms (p95)
- **Page Load Time**: < 3 seconds
- **Database Queries**: < 100ms (p95)
- **Lighthouse Score**: > 90

### Optimizations

- Code splitting by route
- Lazy loading for non-critical components
- Image optimization with Next.js Image
- Virtual scrolling for long lists
- Memoization for expensive calculations
- Database query optimization with indexes
- Optional Redis caching for performance boost

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📝 License

Private - All rights reserved

## 🆘 Support

### Getting Help

1. Check the [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
2. Review [Documentation](./docs/)
3. Check application logs
4. Review monitoring dashboards
5. Contact the development team

### Common Issues

- **Database Connection**: See [Troubleshooting Guide](./docs/TROUBLESHOOTING.md#database-issues)
- **Authentication Issues**: See [Authentication Guide](./docs/AUTHENTICATION_GUIDE.md)
- **Performance Issues**: See [Performance Guide](./docs/PERFORMANCE_OPTIMIZATIONS.md)
- **Deployment Issues**: See [Deployment Guide](./docs/DEPLOYMENT.md)

## 🗺️ Roadmap

### Current Version (v1.0)

- ✅ Core task management
- ✅ Habit tracking
- ✅ Financial tracking
- ✅ Fitness & nutrition tracking
- ✅ Learning & development tracking
- ✅ Analytics dashboard
- ✅ Offline support
- ✅ Authentication & security
- ✅ Responsive design
- ✅ Dark mode

### Future Enhancements

- Mobile applications (iOS/Android)
- Team collaboration features
- Advanced AI-powered insights
- Custom dashboard widgets
- Voice input for logging
- Wearable device integrations
- Social features (optional sharing)
- Gamification enhancements

## 📞 Contact

For questions, issues, or feature requests, contact the development team.

---

**Built with ❤️ for working professionals who want to optimize their work-life balance and achieve measurable personal and career growth.**
