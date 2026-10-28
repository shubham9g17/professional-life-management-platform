# Adding a Feature

The end-to-end checklist for adding a new feature to this codebase. Use it as a working document — copy the checklist into your branch's PR description.

> **Audience:** any contributor adding a new domain entity or extending an existing one.

---

## Worked example: adding a `Reminder` entity

Suppose we want to add a reminders feature. The entity has a `title`, a `triggerAt` timestamp, an optional `notes` field, and a `recurring` boolean.

The work breaks into seven layers, in order:

### 1. Schema (`prisma/schema.prisma`)

```prisma
model Reminder {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title      String
  triggerAt  DateTime
  notes      String?
  recurring  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([userId, triggerAt])
}
```

Add the back-reference to `User`:

```prisma
model User {
  // ...
  reminders Reminder[]
}
```

Run `npx prisma migrate dev --name add_reminders`.

### 2. Repository (`lib/repositories/reminder-repository.ts`)

Use an existing repo as a template (`task-repository.ts` is good). The repository owns:

- All `prisma.reminder.*` calls.
- Cache invalidation (no-op if Redis is disabled).
- Audit logging.
- Cross-entity side effects (none here, but e.g. `taskRepository.completeTask` calls `updateDailyMetrics`).

### 3. API routes (`app/api/reminders/`)

Create `route.ts` (list + create) and `[id]/route.ts` (read + update + delete). Use the canonical pattern:

```typescript
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new AuthenticationError()
    const validated = createReminderSchema.parse(await request.json())
    const reminder = await reminderRepository.create(session.user.id, validated)
    return NextResponse.json({ reminder }, { status: 201 })
  } catch (error) {
    return handleApiError(error, getOrCreateCorrelationId(request))
  }
}
```

Define the Zod schema inline. Don't call `prisma.*` from this file.

### 4. UI page (`app/(dashboard)/reminders/page.tsx`)

The page itself is a server component — usually a one-line mount of a client orchestrator:

```tsx
import { ReminderList } from '@/components/reminders/reminder-list'

export default function RemindersPage() {
  return <ReminderList />
}
```

The orchestrator (`'use client'`) fetches `/api/reminders` and renders the UI.

### 5. Components (`components/reminders/`)

Add:
- `reminder-list.tsx` — orchestrator (fetch + state).
- `reminder-form.tsx` — Zod-validated form. Remember the [date conversion pattern](./conventions.md#6-form-level-date-conversion) for `triggerAt`.
- `reminder-card.tsx` — single-reminder display.

Use `bento-card` (or `<BentoCard>` if it goes on the dashboard) for surfaces. Use semantic tokens (`bg-card`, `text-foreground`) for colors.

### 6. Sidebar entry (`components/layout/dashboard-sidebar.tsx`)

Add `Reminders` to the navigation list with an icon from `lucide-react`.

### 7. Tests

| Layer | Where |
|---|---|
| Repository unit tests | `lib/repositories/__tests__/reminder-repository.test.ts` |
| API CRUD e2e | New `Reminders CRUD` block in `tests/e2e/crud.spec.ts` |
| Page render smoke | New entry in `tests/e2e/functionality.spec.ts` |
| Visual snapshot | (auto-included) |

---

## PR checklist (copy into your description)

```markdown
- [ ] Schema migration applied locally (`npx prisma migrate dev`).
- [ ] Repository in `lib/repositories/`. **No `prisma.*` calls outside this file.**
- [ ] Zod schema(s) defined.
- [ ] API routes wrap bodies in try/catch with `handleApiError`.
- [ ] All routes resolve user via `getServerSession(authOptions)`.
- [ ] Page added under `app/(dashboard)/<feature>/page.tsx`.
- [ ] Components use semantic tokens (`bg-card`, `text-foreground`); raw colors paired with `dark:` variants.
- [ ] Forms with date fields convert to ISO before submit (`new Date(...).toISOString()`); empty optional dates omitted.
- [ ] Sidebar entry added.
- [ ] Repository unit tests in `lib/repositories/__tests__/`.
- [ ] E2E CRUD spec added to `tests/e2e/crud.spec.ts`.
- [ ] Per-page render smoke added to `tests/e2e/functionality.spec.ts`.
- [ ] [`../../FEATURES.md`](../../FEATURES.md) updated with new feature row.
- [ ] [`../../Test.md`](../../Test.md) updated with new test mapping.
- [ ] If a non-trivial decision was made, an ADR added to [`../adr/`](../adr/).
- [ ] `npx tsc -p tsconfig.json --noEmit` clean.
- [ ] `npm test` passing.
- [ ] `npx playwright test --project=laptop` passing.
```

---

## Things easy to forget

1. **Cascade-on-delete relation.** The `onDelete: Cascade` on `userId` is what keeps the schema consistent when a user is deleted.
2. **Audit log call.** Every mutation should call `auditLogger.logDataAccess(...)`.
3. **`FEATURES.md` update.** It's the source of truth for the feature inventory; if you skip this the docs drift.
4. **Soft-delete for things users see history for.** Tasks soft-delete; transactions might too. Match the existing convention for the domain you're in.
5. **Side effects on `DailyMetrics`.** If the new feature should affect productivity / wellness / growth scores, add the appropriate counter in `metrics-engine.ts` and call `updateDailyMetrics` from the relevant repository method.

---

> **Up:** [Development docs](./) · [Docs index](../README.md)
> **Related:** [Conventions](./conventions.md) · [Testing](./testing.md)
