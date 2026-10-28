import { test, expect, type APIRequestContext } from '@playwright/test'

// API-level CRUD coverage for every domain module. Uses page.request, which
// inherits the storageState cookie populated by global-setup, so each call is
// authenticated as the shared E2E user.
//
// Each describe block creates → reads → updates → deletes its own record and
// verifies the record is gone (or, for upsert/no-delete modules, verifies the
// final state). Tests are independent: they do not share IDs across blocks.

const NOW_ISO = () => new Date().toISOString()
const RUN_TAG = `e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

async function expectOk(req: () => Promise<{ ok: () => boolean; status: () => number; text: () => Promise<string> }>) {
  const res = await req()
  if (!res.ok()) {
    const body = await res.text().catch(() => '<no body>')
    throw new Error(`Request failed: ${res.status()} ${body}`)
  }
  return res
}

async function jsonOk<T = any>(reqCtx: APIRequestContext, method: 'get' | 'post' | 'patch' | 'delete', url: string, body?: unknown): Promise<T> {
  const opts = body !== undefined ? { data: body } : undefined
  const res = await reqCtx[method](url, opts)
  if (!res.ok()) {
    const text = await res.text().catch(() => '<no body>')
    throw new Error(`${method.toUpperCase()} ${url} failed: ${res.status()} ${text}`)
  }
  return res.json() as Promise<T>
}

test.describe('Tasks CRUD', () => {
  test('create → read → update → soft-delete → verify archived', async ({ page }) => {
    const tag = `${RUN_TAG}-task`

    const created = await jsonOk<{ task: any }>(page.request, 'post', '/api/tasks', {
      title: `E2E Task ${tag}`,
      description: 'created by crud.spec',
      workspace: 'PROFESSIONAL',
      priority: 'HIGH',
      status: 'TODO',
      tags: [tag],
    })
    expect(created.task.id).toBeTruthy()
    expect(created.task.title).toBe(`E2E Task ${tag}`)
    expect(created.task.tags).toEqual([tag])

    const list = await jsonOk<{ tasks: any[] }>(page.request, 'get', '/api/tasks')
    expect(list.tasks.find((t) => t.id === created.task.id)).toBeTruthy()

    const single = await jsonOk<{ task: any }>(page.request, 'get', `/api/tasks/${created.task.id}`)
    expect(single.task.id).toBe(created.task.id)

    const updated = await jsonOk<{ task: any }>(page.request, 'patch', `/api/tasks/${created.task.id}`, {
      title: `E2E Task ${tag} (updated)`,
      priority: 'URGENT',
      status: 'IN_PROGRESS',
    })
    expect(updated.task.title).toBe(`E2E Task ${tag} (updated)`)
    expect(updated.task.priority).toBe('URGENT')
    expect(updated.task.status).toBe('IN_PROGRESS')

    const del = await page.request.delete(`/api/tasks/${created.task.id}`)
    expect(del.ok()).toBe(true)

    // Soft delete: GET list excludes archived rows.
    const listAfter = await jsonOk<{ tasks: any[] }>(page.request, 'get', '/api/tasks')
    expect(listAfter.tasks.find((t) => t.id === created.task.id)).toBeFalsy()
  })
})

test.describe('Habits CRUD', () => {
  test('create → read → update → delete', async ({ page }) => {
    const tag = `${RUN_TAG}-habit`

    const created = await jsonOk<{ habit: any }>(page.request, 'post', '/api/habits', {
      name: `Read for 30 min ${tag}`,
      category: 'PROFESSIONAL_DEVELOPMENT',
      frequency: 'DAILY',
    })
    expect(created.habit.id).toBeTruthy()
    expect(created.habit.frequency).toBe('DAILY')

    const list = await jsonOk<{ habits: any[] }>(page.request, 'get', '/api/habits')
    expect(list.habits.find((h: any) => h.id === created.habit.id)).toBeTruthy()

    const single = await jsonOk<{ habit: any }>(page.request, 'get', `/api/habits/${created.habit.id}`)
    expect(single.habit.id).toBe(created.habit.id)

    const updated = await jsonOk<{ habit: any }>(page.request, 'patch', `/api/habits/${created.habit.id}`, {
      name: `Read for 60 min ${tag}`,
      frequency: 'WEEKLY',
    })
    expect(updated.habit.name).toBe(`Read for 60 min ${tag}`)
    expect(updated.habit.frequency).toBe('WEEKLY')

    await expectOk(() => page.request.delete(`/api/habits/${created.habit.id}`))

    const after = await page.request.get(`/api/habits/${created.habit.id}`)
    expect(after.status()).toBe(404)
  })
})

test.describe('Transactions CRUD', () => {
  test('create → read → update → delete', async ({ page }) => {
    const tag = `${RUN_TAG}-txn`

    const created = await jsonOk<{ transaction: any }>(page.request, 'post', '/api/transactions', {
      amount: 12.5,
      type: 'EXPENSE',
      category: `Food-${tag}`,
      description: `Coffee ${tag}`,
      date: NOW_ISO(),
      tags: [tag],
    })
    expect(created.transaction.id).toBeTruthy()
    expect(created.transaction.amount).toBe(12.5)
    expect(created.transaction.tags).toEqual([tag])

    const list = await jsonOk<{ transactions: any[] }>(page.request, 'get', '/api/transactions')
    expect(list.transactions.find((t) => t.id === created.transaction.id)).toBeTruthy()

    const updated = await jsonOk<{ transaction: any }>(page.request, 'patch', `/api/transactions/${created.transaction.id}`, {
      amount: 15,
      description: `Coffee + tip ${tag}`,
    })
    expect(updated.transaction.amount).toBe(15)
    expect(updated.transaction.description).toBe(`Coffee + tip ${tag}`)

    await expectOk(() => page.request.delete(`/api/transactions/${created.transaction.id}`))

    const listAfter = await jsonOk<{ transactions: any[] }>(page.request, 'get', '/api/transactions')
    expect(listAfter.transactions.find((t) => t.id === created.transaction.id)).toBeFalsy()
  })
})

test.describe('Budgets CRUD', () => {
  test('create → read → update → delete', async ({ page }) => {
    const tag = `${RUN_TAG}-budget`
    const category = `Groceries-${tag}` // category is unique per user; randomize to avoid 409 on re-runs

    const created = await jsonOk<{ budget: any }>(page.request, 'post', '/api/budgets', {
      category,
      monthlyLimit: 400,
      alertThreshold: 80,
    })
    expect(created.budget.id).toBeTruthy()
    expect(created.budget.category).toBe(category)

    const list = await jsonOk<{ budgets: any[] }>(page.request, 'get', '/api/budgets')
    expect(list.budgets.find((b: any) => b.id === created.budget.id)).toBeTruthy()

    const single = await jsonOk<{ budget: any }>(page.request, 'get', `/api/budgets/${created.budget.id}`)
    expect(single.budget.id).toBe(created.budget.id)

    const updated = await jsonOk<{ budget: any }>(page.request, 'patch', `/api/budgets/${created.budget.id}`, {
      monthlyLimit: 500,
      alertThreshold: 90,
    })
    expect(updated.budget.monthlyLimit).toBe(500)
    expect(updated.budget.alertThreshold).toBe(90)

    await expectOk(() => page.request.delete(`/api/budgets/${created.budget.id}`))

    const after = await page.request.get(`/api/budgets/${created.budget.id}`)
    expect(after.status()).toBe(404)
  })
})

test.describe('Exercises CRUD', () => {
  test('create → read → update → delete', async ({ page }) => {
    const tag = `${RUN_TAG}-ex`

    const created = await jsonOk<{ exercise: any }>(page.request, 'post', '/api/exercises', {
      activityType: `Running-${tag}`,
      duration: 30,
      intensity: 'MODERATE',
      caloriesBurned: 280,
      date: NOW_ISO(),
    })
    expect(created.exercise.id).toBeTruthy()
    expect(created.exercise.duration).toBe(30)

    const list = await jsonOk<{ exercises: any[] }>(page.request, 'get', '/api/exercises')
    expect(list.exercises.find((e: any) => e.id === created.exercise.id)).toBeTruthy()

    const updated = await jsonOk<{ exercise: any }>(page.request, 'patch', `/api/exercises/${created.exercise.id}`, {
      duration: 45,
      intensity: 'HIGH',
    })
    expect(updated.exercise.duration).toBe(45)
    expect(updated.exercise.intensity).toBe('HIGH')

    await expectOk(() => page.request.delete(`/api/exercises/${created.exercise.id}`))

    const listAfter = await jsonOk<{ exercises: any[] }>(page.request, 'get', '/api/exercises')
    expect(listAfter.exercises.find((e: any) => e.id === created.exercise.id)).toBeFalsy()
  })
})

test.describe('Fitness goals CRUD', () => {
  test('create → read → update → delete', async ({ page }) => {
    const tag = `${RUN_TAG}-goal`
    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const created = await jsonOk<{ goal: any }>(page.request, 'post', '/api/fitness-goals', {
      goalType: 'EXERCISE_MINUTES',
      targetValue: 600,
      currentValue: 0,
      unit: `minutes-${tag}`,
      deadline,
    })
    expect(created.goal.id).toBeTruthy()
    expect(created.goal.targetValue).toBe(600)

    const list = await jsonOk<{ goals: any[] }>(page.request, 'get', '/api/fitness-goals')
    expect(list.goals.find((g: any) => g.id === created.goal.id)).toBeTruthy()

    const updated = await jsonOk<{ goal: any }>(page.request, 'patch', `/api/fitness-goals/${created.goal.id}`, {
      currentValue: 200,
      status: 'ACTIVE',
    })
    expect(updated.goal.currentValue).toBe(200)
    expect(updated.goal.status).toBe('ACTIVE')

    await expectOk(() => page.request.delete(`/api/fitness-goals/${created.goal.id}`))

    const listAfter = await jsonOk<{ goals: any[] }>(page.request, 'get', '/api/fitness-goals')
    expect(listAfter.goals.find((g: any) => g.id === created.goal.id)).toBeFalsy()
  })
})

test.describe('Health metrics upsert', () => {
  test('create → read → upsert update', async ({ page }) => {
    // health-metrics has no DELETE; POST is an upsert by date. We pick a date
    // unique to this run to avoid trampling other tests' data.
    const date = new Date(Date.UTC(2030, 0, Math.floor(Math.random() * 28) + 1)).toISOString()

    const created = await jsonOk<{ metric: any }>(page.request, 'post', '/api/health-metrics', {
      date,
      weight: 70,
      sleepQuality: 7,
      stressLevel: 4,
      energyLevel: 8,
    })
    expect(created.metric.id).toBeTruthy()
    expect(created.metric.weight).toBe(70)

    const list = await jsonOk<{ metrics: any[] }>(page.request, 'get', '/api/health-metrics')
    expect(list.metrics.find((m: any) => m.id === created.metric.id)).toBeTruthy()

    const upserted = await jsonOk<{ metric: any }>(page.request, 'post', '/api/health-metrics', {
      date,
      weight: 71,
      sleepQuality: 9,
    })
    expect(upserted.metric.id).toBe(created.metric.id) // same row, upserted
    expect(upserted.metric.weight).toBe(71)
    expect(upserted.metric.sleepQuality).toBe(9)
  })
})

test.describe('Meals CRUD', () => {
  test('create → read → update → delete', async ({ page }) => {
    const tag = `${RUN_TAG}-meal`

    const created = await jsonOk<{ meal: any }>(page.request, 'post', '/api/meals', {
      mealType: 'LUNCH',
      foodItems: [`salad-${tag}`, 'chicken'],
      calories: 450,
      protein: 35,
      carbs: 30,
      fats: 18,
      date: NOW_ISO(),
    })
    expect(created.meal.id).toBeTruthy()
    expect(created.meal.foodItems).toEqual([`salad-${tag}`, 'chicken'])

    const list = await jsonOk<{ meals: any[] }>(page.request, 'get', '/api/meals')
    expect(list.meals.find((m: any) => m.id === created.meal.id)).toBeTruthy()

    const updated = await jsonOk<{ meal: any }>(page.request, 'patch', `/api/meals/${created.meal.id}`, {
      calories: 500,
      foodItems: [`salad-${tag}`, 'chicken', 'avocado'],
    })
    expect(updated.meal.calories).toBe(500)
    expect(updated.meal.foodItems).toEqual([`salad-${tag}`, 'chicken', 'avocado'])

    await expectOk(() => page.request.delete(`/api/meals/${created.meal.id}`))

    const listAfter = await jsonOk<{ meals: any[] }>(page.request, 'get', '/api/meals')
    expect(listAfter.meals.find((m: any) => m.id === created.meal.id)).toBeFalsy()
  })
})

test.describe('Water intake CRD', () => {
  test('create → read → delete (no update endpoint)', async ({ page }) => {
    const created = await jsonOk<{ waterIntake: any }>(page.request, 'post', '/api/water', {
      amount: 250,
      date: NOW_ISO(),
    })
    expect(created.waterIntake.id).toBeTruthy()
    expect(created.waterIntake.amount).toBe(250)

    const list = await jsonOk<{ waterIntakes: any[] }>(page.request, 'get', '/api/water')
    expect(list.waterIntakes.find((w: any) => w.id === created.waterIntake.id)).toBeTruthy()

    await expectOk(() => page.request.delete(`/api/water/${created.waterIntake.id}`))

    const listAfter = await jsonOk<{ waterIntakes: any[] }>(page.request, 'get', '/api/water')
    expect(listAfter.waterIntakes.find((w: any) => w.id === created.waterIntake.id)).toBeFalsy()
  })
})

test.describe('Learning resources CRUD', () => {
  test('create → read → update → delete', async ({ page }) => {
    const tag = `${RUN_TAG}-learn`

    const created = await jsonOk<{ resource: any }>(page.request, 'post', '/api/learning/resources', {
      title: `Effective TypeScript ${tag}`,
      type: 'BOOK',
      category: `Programming-${tag}`,
      completionPercentage: 0,
      timeInvested: 0,
      startDate: NOW_ISO(),
      notes: 'reading notes',
    })
    expect(created.resource.id).toBeTruthy()
    expect(created.resource.type).toBe('BOOK')

    const list = await jsonOk<{ resources: any[] }>(page.request, 'get', '/api/learning/resources')
    expect(list.resources.find((r: any) => r.id === created.resource.id)).toBeTruthy()

    const single = await jsonOk<{ resource: any }>(page.request, 'get', `/api/learning/resources/${created.resource.id}`)
    expect(single.resource.id).toBe(created.resource.id)

    const updated = await jsonOk<{ resource: any }>(page.request, 'patch', `/api/learning/resources/${created.resource.id}`, {
      completionPercentage: 50,
      timeInvested: 90, // route adds this to existing timeInvested
    })
    expect(updated.resource.completionPercentage).toBe(50)
    expect(updated.resource.timeInvested).toBe(90)

    await expectOk(() => page.request.delete(`/api/learning/resources/${created.resource.id}`))

    const after = await page.request.get(`/api/learning/resources/${created.resource.id}`)
    expect(after.status()).toBe(404)
  })
})

test.describe('Tasks UI smoke (form → API)', () => {
  // Locks in the fix for the dueDate bug: TaskForm used to ship the empty
  // string `''` (or the datetime-local `YYYY-MM-DDTHH:mm` format) directly,
  // both of which fail the API's Zod .datetime().optional() validation. The
  // form now omits empty values and converts non-empty values to full ISO.
  test('create a task with no due date through the dialog', async ({ page }) => {
    const title = `UI Task ${RUN_TAG}-no-due`

    await page.goto('/tasks')
    await page.getByRole('button', { name: /new task/i }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByLabel(/title/i).fill(title)
    await dialog.getByRole('button', { name: /create task/i }).click()

    await expect(dialog).toBeHidden({ timeout: 10_000 })
    await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 })

    const list = await jsonOk<{ tasks: any[] }>(page.request, 'get', '/api/tasks')
    const created = list.tasks.find((t) => t.title === title)
    expect(created).toBeTruthy()
    expect(created.dueDate).toBeFalsy()
    if (created) await page.request.delete(`/api/tasks/${created.id}`)
  })

  test('create a task with a due date through the dialog', async ({ page }) => {
    const title = `UI Task ${RUN_TAG}-with-due`

    await page.goto('/tasks')
    await page.getByRole('button', { name: /new task/i }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByLabel(/title/i).fill(title)
    // datetime-local accepts "YYYY-MM-DDTHH:mm".
    await dialog.locator('#dueDate').fill('2030-06-15T10:30')
    await dialog.getByRole('button', { name: /create task/i }).click()

    await expect(dialog).toBeHidden({ timeout: 10_000 })

    const list = await jsonOk<{ tasks: any[] }>(page.request, 'get', '/api/tasks')
    const created = list.tasks.find((t) => t.title === title)
    expect(created).toBeTruthy()
    expect(created.dueDate).toBeTruthy()
    // ISO round-trip: form-local → UTC. The day must still be 2030-06-15
    // regardless of timezone offset (offsets are < 24h).
    expect(new Date(created.dueDate).toISOString()).toMatch(/^2030-06-1[45]T/)
    if (created) await page.request.delete(`/api/tasks/${created.id}`)
  })
})

test.describe('Transactions UI smoke (form → API)', () => {
  // Locks in the fix for the date bug: TransactionForm used to ship the
  // datetime-local format directly to a required `date: z.string().datetime()`
  // field, which 400'd every submit. Form now converts to full ISO.
  test('create a transaction through the dialog', async ({ page }) => {
    const description = `UI Txn ${RUN_TAG}`

    await page.goto('/finance')
    // The transactions tab hosts the create button.
    await page.getByRole('tab', { name: /transactions/i }).click()
    await page.getByRole('button', { name: /add transaction|new transaction|create transaction/i }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('#amount').fill('42.5')
    await dialog.locator('#category').selectOption({ index: 1 })
    await dialog.locator('#description').fill(description)
    await dialog.getByRole('button', { name: /create transaction/i }).click()

    await expect(dialog).toBeHidden({ timeout: 10_000 })

    const list = await jsonOk<{ transactions: any[] }>(page.request, 'get', '/api/transactions')
    const created = list.transactions.find((t) => t.description === description)
    expect(created).toBeTruthy()
    expect(created.amount).toBe(42.5)
    if (created) await page.request.delete(`/api/transactions/${created.id}`)
  })
})

test.describe('Cross-cutting: deleted record stays gone after refresh', () => {
  // Guards against the class of bug where a soft-delete (tasks) or hard-delete
  // (others) is reflected in client state but the server-side filter is wrong
  // and a fresh GET still returns the row. We use tasks because soft-delete is
  // the trickier case.
  test('archived task is not returned on refresh', async ({ page }) => {
    const title = `Refresh Task ${RUN_TAG}`

    const created = await jsonOk<{ task: any }>(page.request, 'post', '/api/tasks', {
      title,
      workspace: 'PERSONAL',
    })
    await expectOk(() => page.request.delete(`/api/tasks/${created.task.id}`))

    // First refresh.
    const list1 = await jsonOk<{ tasks: any[] }>(page.request, 'get', '/api/tasks')
    expect(list1.tasks.find((t) => t.id === created.task.id)).toBeFalsy()

    // Second refresh — proves it is not a transient cache-miss.
    const list2 = await jsonOk<{ tasks: any[] }>(page.request, 'get', '/api/tasks')
    expect(list2.tasks.find((t) => t.id === created.task.id)).toBeFalsy()
  })
})
