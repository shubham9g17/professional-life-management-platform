import type { APIRequestContext } from '@playwright/test'

const TAG = '[DEMO]'

function isoDaysAgo(days: number, hour = 12): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

async function ok<T = any>(req: APIRequestContext, method: 'get' | 'post' | 'patch' | 'delete', url: string, body?: unknown): Promise<T | null> {
  const res = await req[method](url, body !== undefined ? { data: body } : undefined)
  if (!res.ok()) {
    const text = await res.text().catch(() => '<no body>')
    console.warn(`[demo-seed] ${method.toUpperCase()} ${url} → ${res.status()} ${text.slice(0, 200)}`)
    return null
  }
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function cleanup(req: APIRequestContext) {
  // Tasks (soft-delete via DELETE).
  const tasks = await ok<{ tasks: any[] }>(req, 'get', '/api/tasks')
  for (const t of tasks?.tasks ?? []) {
    if (typeof t.title === 'string' && t.title.includes(TAG)) {
      await ok(req, 'delete', `/api/tasks/${t.id}`)
    }
  }

  // Habits.
  const habits = await ok<{ habits: any[] }>(req, 'get', '/api/habits')
  for (const h of habits?.habits ?? []) {
    if (typeof h.name === 'string' && h.name.includes(TAG)) {
      await ok(req, 'delete', `/api/habits/${h.id}`)
    }
  }

  // Transactions.
  const txns = await ok<{ transactions: any[] }>(req, 'get', '/api/transactions')
  for (const t of txns?.transactions ?? []) {
    if (typeof t.description === 'string' && t.description.includes(TAG)) {
      await ok(req, 'delete', `/api/transactions/${t.id}`)
    }
  }

  // Budgets (category-tagged).
  const budgets = await ok<{ budgets: any[] }>(req, 'get', '/api/budgets')
  for (const b of budgets?.budgets ?? []) {
    if (typeof b.category === 'string' && b.category.includes(TAG)) {
      await ok(req, 'delete', `/api/budgets/${b.id}`)
    }
  }

  // Exercises.
  const ex = await ok<{ exercises: any[] }>(req, 'get', '/api/exercises')
  for (const e of ex?.exercises ?? []) {
    if (typeof e.activityType === 'string' && e.activityType.includes(TAG)) {
      await ok(req, 'delete', `/api/exercises/${e.id}`)
    }
  }

  // Fitness goals.
  const goals = await ok<{ goals: any[] }>(req, 'get', '/api/fitness-goals')
  for (const g of goals?.goals ?? []) {
    if (typeof g.unit === 'string' && g.unit.includes(TAG)) {
      await ok(req, 'delete', `/api/fitness-goals/${g.id}`)
    }
  }

  // Meals.
  const meals = await ok<{ meals: any[] }>(req, 'get', '/api/meals')
  for (const m of meals?.meals ?? []) {
    const items: string[] = Array.isArray(m.foodItems) ? m.foodItems : []
    if (items.some((s) => typeof s === 'string' && s.includes(TAG))) {
      await ok(req, 'delete', `/api/meals/${m.id}`)
    }
  }

  // Water — no tag possible (only amount + date), so we delete entries from today only.
  const water = await ok<{ waterIntakes: any[] }>(req, 'get', '/api/water')
  const today = new Date().toISOString().slice(0, 10)
  for (const w of water?.waterIntakes ?? []) {
    if (typeof w.date === 'string' && w.date.startsWith(today)) {
      await ok(req, 'delete', `/api/water/${w.id}`)
    }
  }

  // Learning resources.
  const learn = await ok<{ resources: any[] }>(req, 'get', '/api/learning/resources')
  for (const r of learn?.resources ?? []) {
    if (typeof r.title === 'string' && r.title.includes(TAG)) {
      await ok(req, 'delete', `/api/learning/resources/${r.id}`)
    }
  }
}

async function seedTasks(req: APIRequestContext) {
  const tasks = [
    { title: `${TAG} Finalize Q2 product roadmap`, workspace: 'PROFESSIONAL', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: isoDaysAgo(-2, 17), tags: ['planning', 'roadmap'] },
    { title: `${TAG} Review pull request #482`, workspace: 'PROFESSIONAL', priority: 'MEDIUM', status: 'TODO', dueDate: isoDaysAgo(-1, 14), tags: ['code-review'] },
    { title: `${TAG} Prepare demo video script`, workspace: 'PROFESSIONAL', priority: 'URGENT', status: 'IN_PROGRESS', dueDate: isoDaysAgo(0, 18), tags: ['demo'] },
    { title: `${TAG} 1:1 with engineering manager`, workspace: 'PROFESSIONAL', priority: 'MEDIUM', status: 'TODO', dueDate: isoDaysAgo(-3, 10), tags: ['meeting'] },
    { title: `${TAG} Update OAuth documentation`, workspace: 'PROFESSIONAL', priority: 'LOW', status: 'TODO', tags: ['docs'] },
    { title: `${TAG} Refactor authentication middleware`, workspace: 'PROFESSIONAL', priority: 'HIGH', status: 'COMPLETED', tags: ['refactor'] },
    { title: `${TAG} Ship analytics v2 release`, workspace: 'PROFESSIONAL', priority: 'HIGH', status: 'COMPLETED', tags: ['release'] },
    { title: `${TAG} Plan weekend hike`, workspace: 'PERSONAL', priority: 'LOW', status: 'TODO', tags: ['fun'] },
    { title: `${TAG} Book dentist appointment`, workspace: 'PERSONAL', priority: 'MEDIUM', status: 'TODO', tags: ['health'] },
    { title: `${TAG} Read "Designing Data-Intensive Apps" ch.7`, workspace: 'PERSONAL', priority: 'MEDIUM', status: 'IN_PROGRESS', tags: ['learning'] },
    { title: `${TAG} Reply to investor follow-ups`, workspace: 'PROFESSIONAL', priority: 'URGENT', status: 'TODO', dueDate: isoDaysAgo(0, 21), tags: ['comms'] },
    { title: `${TAG} Migrate Postgres to v16`, workspace: 'PROFESSIONAL', priority: 'MEDIUM', status: 'COMPLETED', tags: ['infra'] },
  ]
  for (const t of tasks) await ok(req, 'post', '/api/tasks', t)
}

async function seedHabits(req: APIRequestContext) {
  const habits = [
    { name: `${TAG} Morning meditation`, category: 'HEALTH', frequency: 'DAILY' },
    { name: `${TAG} Read 30 minutes`, category: 'PROFESSIONAL_DEVELOPMENT', frequency: 'DAILY' },
    { name: `${TAG} Strength training`, category: 'HEALTH', frequency: 'WEEKLY' },
    { name: `${TAG} Journal reflection`, category: 'PERSONAL_GROWTH', frequency: 'DAILY' },
  ]
  for (const h of habits) await ok(req, 'post', '/api/habits', h)
  // Note: habit complete endpoint always marks "today", so we leave habits at
  // streak 0 here — the walkthrough demos a live completion to take streak 0→1.
}

async function seedFinance(req: APIRequestContext) {
  const transactions = [
    { amount: 3200, type: 'INCOME', category: 'Salary', description: `${TAG} Monthly salary`, date: isoDaysAgo(2) },
    { amount: 85.4, type: 'EXPENSE', category: 'Groceries', description: `${TAG} Whole Foods weekly run`, date: isoDaysAgo(1) },
    { amount: 12.5, type: 'EXPENSE', category: 'Coffee', description: `${TAG} Latte at Blue Bottle`, date: isoDaysAgo(0, 9) },
    { amount: 1450, type: 'EXPENSE', category: 'Rent', description: `${TAG} Apartment rent`, date: isoDaysAgo(5) },
    { amount: 42.99, type: 'EXPENSE', category: 'Subscriptions', description: `${TAG} Spotify + Netflix`, date: isoDaysAgo(3) },
    { amount: 220, type: 'EXPENSE', category: 'Dining', description: `${TAG} Anniversary dinner`, date: isoDaysAgo(7) },
    { amount: 60, type: 'EXPENSE', category: 'Transit', description: `${TAG} Monthly transit pass`, date: isoDaysAgo(8) },
    { amount: 500, type: 'INCOME', category: 'Freelance', description: `${TAG} Contract project payout`, date: isoDaysAgo(4) },
  ]
  for (const t of transactions) await ok(req, 'post', '/api/transactions', t)

  const budgets = [
    { category: `${TAG} Groceries`, monthlyLimit: 400, alertThreshold: 80 },
    { category: `${TAG} Dining`, monthlyLimit: 250, alertThreshold: 75 },
  ]
  for (const b of budgets) await ok(req, 'post', '/api/budgets', b)
}

async function seedFitness(req: APIRequestContext) {
  const exercises = [
    { activityType: `Running ${TAG}`, duration: 35, intensity: 'MODERATE', caloriesBurned: 320, date: isoDaysAgo(0, 7) },
    { activityType: `Yoga ${TAG}`, duration: 45, intensity: 'LOW', caloriesBurned: 150, date: isoDaysAgo(1, 7) },
    { activityType: `Strength training ${TAG}`, duration: 50, intensity: 'HIGH', caloriesBurned: 410, date: isoDaysAgo(2, 18) },
    { activityType: `Cycling ${TAG}`, duration: 60, intensity: 'MODERATE', caloriesBurned: 540, date: isoDaysAgo(3, 17) },
    { activityType: `Swimming ${TAG}`, duration: 40, intensity: 'HIGH', caloriesBurned: 380, date: isoDaysAgo(5, 7) },
  ]
  for (const e of exercises) await ok(req, 'post', '/api/exercises', e)

  // Health metrics: 7 days of weight trending down + sleep/stress/energy.
  const weights = [78.4, 78.1, 77.9, 77.6, 77.5, 77.2, 77.0]
  for (let i = 6; i >= 0; i--) {
    await ok(req, 'post', '/api/health-metrics', {
      date: isoDaysAgo(i),
      weight: weights[6 - i],
      sleepQuality: 6 + ((i + 1) % 3),
      stressLevel: 5 - (i % 2),
      energyLevel: 7 + (i % 2),
    })
  }

  const deadline = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
  await ok(req, 'post', '/api/fitness-goals', {
    goalType: 'EXERCISE_MINUTES',
    targetValue: 600,
    currentValue: 360,
    unit: `minutes ${TAG}`,
    deadline,
  })
}

async function seedNutrition(req: APIRequestContext) {
  const meals = [
    { mealType: 'BREAKFAST', foodItems: [`${TAG} oats`, 'banana', 'almond butter'], calories: 380, protein: 14, carbs: 52, fats: 12, date: isoDaysAgo(0, 8) },
    { mealType: 'LUNCH', foodItems: [`${TAG} grain bowl`, 'salmon', 'greens'], calories: 620, protein: 38, carbs: 60, fats: 22, date: isoDaysAgo(0, 13) },
    { mealType: 'DINNER', foodItems: [`${TAG} chicken curry`, 'rice', 'broccoli'], calories: 720, protein: 42, carbs: 72, fats: 24, date: isoDaysAgo(0, 19) },
    { mealType: 'SNACK', foodItems: [`${TAG} yogurt`, 'berries'], calories: 180, protein: 12, carbs: 22, fats: 4, date: isoDaysAgo(0, 16) },
    { mealType: 'BREAKFAST', foodItems: [`${TAG} avocado toast`, 'eggs'], calories: 420, protein: 22, carbs: 30, fats: 24, date: isoDaysAgo(1, 8) },
    { mealType: 'LUNCH', foodItems: [`${TAG} chicken caesar`, 'parmesan'], calories: 540, protein: 36, carbs: 28, fats: 28, date: isoDaysAgo(1, 13) },
  ]
  for (const m of meals) await ok(req, 'post', '/api/meals', m)

  // Today's water intake — 5 entries totaling ~1.9L.
  const waterEntries = [
    { amount: 350, date: isoDaysAgo(0, 8) },
    { amount: 500, date: isoDaysAgo(0, 11) },
    { amount: 350, date: isoDaysAgo(0, 14) },
    { amount: 350, date: isoDaysAgo(0, 16) },
    { amount: 400, date: isoDaysAgo(0, 19) },
  ]
  for (const w of waterEntries) await ok(req, 'post', '/api/water', w)
}

async function seedLearning(req: APIRequestContext) {
  const resources = [
    { title: `${TAG} Designing Data-Intensive Applications`, type: 'BOOK', category: 'Engineering', completionPercentage: 80, timeInvested: 420, startDate: isoDaysAgo(40), notes: 'Chapter 7 next.' },
    { title: `${TAG} System Design Interview Course`, type: 'COURSE', category: 'Engineering', completionPercentage: 40, timeInvested: 240, startDate: isoDaysAgo(20), notes: '' },
    { title: `${TAG} AWS Solutions Architect`, type: 'CERTIFICATION', category: 'Cloud', completionPercentage: 100, timeInvested: 1200, startDate: isoDaysAgo(120), notes: 'Passed Apr 12.' },
    { title: `${TAG} On Writing Well`, type: 'ARTICLE', category: 'Writing', completionPercentage: 0, timeInvested: 0, startDate: isoDaysAgo(0), notes: '' },
  ]
  for (const r of resources) await ok(req, 'post', '/api/learning/resources', r)
}

export async function seedDemoData(req: APIRequestContext) {
  console.log('[demo-seed] Cleaning previous [DEMO] rows…')
  await cleanup(req)
  console.log('[demo-seed] Seeding fresh data…')
  await seedTasks(req)
  await seedHabits(req)
  await seedFinance(req)
  await seedFitness(req)
  await seedNutrition(req)
  await seedLearning(req)
  console.log('[demo-seed] Done.')
}
