# CI & Build

Build and continuous-integration setup.

---

## Local builds

```bash
npm run build              # Next.js production build (Turbopack)
npm start                  # Run the production server (after build)
npm run lint               # ESLint flat config
npx tsc -p tsconfig.json --noEmit   # Type-check only
```

The build outputs to `.next/`. Standalone server start: `npm start`.

---

## Quality gates

The minimum bar before merging a change:

| Gate | Command |
|---|---|
| TypeScript compiles | `npx tsc -p tsconfig.json --noEmit` |
| Lint passes | `npm run lint` |
| Unit + property tests pass | `npm test` |
| E2E suite passes (laptop project) | `npx playwright test --project=laptop` (requires `npm run dev` running) |
| Production build succeeds | `npm run build` |

---

## CI configuration

> **Status:** the project is structured for CI but a CI workflow file is **not currently checked in**. Adding one is in [`../06-academic/future-work.md`](../06-academic/future-work.md). The shape it would take:

```yaml
# .github/workflows/ci.yml (proposed)
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test
      - run: npm run build
        env:
          NEXTAUTH_SECRET: test-secret
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
      # E2E would run in a separate job that boots the dev server
```

---

## Deployment

See [`../05-operations/deployment.md`](../05-operations/deployment.md) and [`../05-operations/deployment-checklist.md`](../05-operations/deployment-checklist.md).

---

> **Up:** [Development docs](./) · [Docs index](../README.md)
> **Related:** [Testing](./testing.md) · [Operations](../05-operations/)
