# Testing

Two test runners with deliberately separate scopes.

> **Authoritative spec map:** [`../../Test.md`](../../Test.md) (per-feature coverage map).
> **Status snapshot:** [`../../IMPLEMENTATION_STATUS.md`](../../IMPLEMENTATION_STATUS.md).

---

## Strategy

| Tool | Scope | Why |
|---|---|---|
| **Vitest** + `fast-check` | `lib/**` — repositories, error handling, security primitives | Fast inner loop; property-based tests catch edge cases. |
| **Playwright** | `tests/e2e/` — every page, every API endpoint | Realistic outer loop; verifies UI + integration. |

Coverage is intentionally scoped to `lib/` for Vitest. UI in `app/` and `components/` is verified by Playwright; duplicating with React Testing Library would be redundant.

---

## Vitest

### Running

```bash
npm test                                                # one-shot
npm run test:watch
npm run test:ui
npm run test:coverage                                   # v8 coverage; lib/** only

# single file or pattern
npx vitest run lib/repositories/__tests__/habit-repository.test.ts
npx vitest run -t "name of test case"
```

### Setup

`vitest.config.ts` configures `jsdom`, loads `test/setup.ts` (Testing Library cleanup + jest-dom matchers), aliases `@/*` to the project root.

### Property-based tests

`fast-check` is used in `lib/repositories/__tests__/*.test.ts` to generate random valid inputs and verify invariants:

```typescript
import { fc } from 'fast-check'

it('round-trips tags through JSON encoding', () => {
  fc.assert(fc.property(fc.array(fc.string()), (tags) => {
    const stored = JSON.stringify(tags)
    const parsed = JSON.parse(stored)
    expect(parsed).toEqual(tags)
  }))
})
```

Use property tests when behavior should hold over a class of inputs, not just a hand-picked set.

---

## Playwright (e2e)

### Running

```bash
# full e2e run
npx playwright test --project=laptop

# one spec
npx playwright test crud.spec.ts --project=laptop

# by test name
npx playwright test -g "Tasks CRUD" --project=laptop

# headed (debug)
npx playwright test --project=laptop --headed
```

`npm run dev` must be running in another terminal.

### Configuration

`playwright.config.ts`:

- **Four projects:** `mobile` / `tablet` / `laptop` / `big-screen`. Server-state specs (auth, crud, side-effects) are added to `testIgnore` for non-laptop projects.
- **`fullyParallel: false`, `workers: 1`** — tests share one test user.
- **`globalSetup`** signs up the test user once and persists `tests/e2e/.auth/state.json`. Every spec inherits the session via `storageState`.

### Spec files

| File | Purpose |
|---|---|
| `auth.spec.ts` | Auth happy + sad paths. Excluded from non-laptop to avoid the 5/15min signup rate limit. |
| `crud.spec.ts` | API CRUD on every domain entity + 3 dialog UI smoke tests. |
| `side-effects.spec.ts` | Completion flows, achievements, notifications, sync, analytics, exports, health, cron. |
| `functionality.spec.ts` | Per-page render smoke (heading + key buttons/tabs visible). |
| `visual.spec.ts` | Per-viewport visual snapshots. |

### Self-cleaning

Specs that hit server state are pattern: **create-then-delete**. The DB stays consistent across runs.

Exceptions:
- Tasks are **soft-deleted** (`status='ARCHIVED'`) — the row stays.
- `HealthMetric` has no DELETE endpoint and is **upsert-only**.

---

## Status

68 e2e tests passing on `--project=laptop` in ~5.8 minutes. One `.fixme` test for the `DailyMetrics` schema bug — re-enable once the migration is applied.

See [`../../Test.md`](../../Test.md) for the per-feature spec mapping and [`../../IMPLEMENTATION_STATUS.md`](../../IMPLEMENTATION_STATUS.md) for the latest status.

---

## Adding a test

When adding a feature, follow the ladder:

1. **Vitest unit** for new repository or library logic.
2. **Vitest property test** if the behavior should hold over a class of inputs.
3. **Playwright API spec** in `crud.spec.ts` for new CRUD endpoints.
4. **Playwright API spec** in `side-effects.spec.ts` for new side-effect behavior.
5. **Playwright UI smoke** in `crud.spec.ts` or `functionality.spec.ts` for new dialogs / interactive elements.

Don't add a test for every layer — pick the level that gives the strongest signal for the change.

---

> **Up:** [Development docs](./) · [Docs index](../README.md)
> **Related:** [Adding a feature](./adding-a-feature.md)
