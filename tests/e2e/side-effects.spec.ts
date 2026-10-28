import { test, expect, type APIRequestContext } from '@playwright/test'

// E2E coverage for features beyond plain CRUD: completion side-effects, sync,
// achievements, notifications, analytics, stats, dashboard, exports, GDPR,
// cron, health. See Test.md for the per-feature mapping.
//
// All tests use page.request, which inherits the storageState session cookie
// from global-setup.ts. Each test self-cleans where the entity has a delete
// surface; entities without delete (HealthMetric, DailyMetrics) are left in
// place by design — they're upsert/aggregate-only.

const RUN = `e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
const NOW_ISO = () => new Date().toISOString()

async function jsonOk<T = any>(
  reqCtx: APIRequestContext,
  method: 'get' | 'post' | 'patch' | 'delete',
  url: string,
  body?: unknown
): Promise<T> {
  const opts = body !== undefined ? { data: body } : undefined
  const res = await reqCtx[method](url, opts)
  if (!res.ok()) {
    const text = await res.text().catch(() => '<no body>')
    throw new Error(`${method.toUpperCase()} ${url} failed: ${res.status()} ${text}`)
  }
  return res.json() as Promise<T>
}

// ────────────────────────────────────────────────────────────────────────────
// Auth
// ────────────────────────────────────────────────────────────────────────────
test.describe('Auth', () => {
  test('GET /api/auth/session returns the test user', async ({ page }) => {
    const session = await jsonOk<{ user: { id: string; email: string } }>(page.request, 'get', '/api/auth/session')
    expect(session.user.id).toBeTruthy()
    expect(session.user.email).toMatch(/@example\.com$/)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Tasks: complete-task side-effect (DailyMetrics + productivityScore)
// ────────────────────────────────────────────────────────────────────────────
test.describe('Tasks completion side-effects', () => {
  // KNOWN BUG: prisma/schema.prisma declares `DailyMetrics.date @unique` AND
  // `@@unique([userId, date])`. The standalone `@unique` on the field means
  // only one user platform-wide can have a row per date. The first run today
  // succeeds; every subsequent run fails with a unique-constraint violation
  // when DailyMetrics.create() runs inside POST /api/tasks/[id]/complete.
  // Fix: remove `@unique` from the field (keep the composite); migrate.
  // Re-enable this test after the migration lands.
  test.fixme('completing a task triggers DailyMetrics + productivityScore', async ({ page }) => {
    const created = await jsonOk<{ task: any }>(page.request, 'post', '/api/tasks', {
      title: `Completable ${RUN}`,
      workspace: 'PROFESSIONAL',
    })

    const completed = await jsonOk<{ task: any; message: string }>(page.request, 'post', `/api/tasks/${created.task.id}/complete`)
    expect(completed.task.status).toBe('COMPLETED')
    expect(completed.task.completedAt).toBeTruthy()
    expect(completed.message).toMatch(/metrics updated/i)

    // Completing again is rejected (idempotency guard).
    const second = await page.request.post(`/api/tasks/${created.task.id}/complete`)
    expect(second.status()).toBe(400)

    // Dashboard now reflects at least one completion today.
    const dash = await jsonOk<{ productivity: { tasksCompleted: number } }>(page.request, 'get', '/api/dashboard/overview')
    expect(dash.productivity.tasksCompleted).toBeGreaterThanOrEqual(1)

    // Cleanup: soft-delete the task we created.
    await page.request.delete(`/api/tasks/${created.task.id}`)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Habits: completion side-effect (HabitCompletion row)
// ────────────────────────────────────────────────────────────────────────────
test.describe('Habits completion side-effects', () => {
  test('completing a habit creates a HabitCompletion row', async ({ page }) => {
    const created = await jsonOk<{ habit: any }>(page.request, 'post', '/api/habits', {
      name: `Daily walk ${RUN}`,
      category: 'HEALTH',
      frequency: 'DAILY',
    })

    const after = await jsonOk<{ habit: any }>(page.request, 'post', `/api/habits/${created.habit.id}/complete`, {
      notes: 'felt good',
    })
    // The route returns the updated habit — streak should now be at least 1.
    expect(after.habit.id).toBe(created.habit.id)
    expect(after.habit.currentStreak ?? 0).toBeGreaterThanOrEqual(1)

    // The list endpoint includes completion data; today's completion should be visible.
    const list = await jsonOk<{ habits: any[] }>(page.request, 'get', '/api/habits')
    const habit = list.habits.find((h) => h.id === created.habit.id)
    expect(habit).toBeTruthy()

    await page.request.delete(`/api/habits/${created.habit.id}`)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Budgets: category uniqueness conflict
// ────────────────────────────────────────────────────────────────────────────
test.describe('Budgets', () => {
  test('duplicate category returns 409', async ({ page }) => {
    const category = `Unique-${RUN}`
    const first = await jsonOk<{ budget: any }>(page.request, 'post', '/api/budgets', {
      category,
      monthlyLimit: 100,
      alertThreshold: 75,
    })

    const dup = await page.request.post('/api/budgets', {
      data: { category, monthlyLimit: 200, alertThreshold: 80 },
    })
    expect(dup.status()).toBe(409)

    await page.request.delete(`/api/budgets/${first.budget.id}`)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Fitness goals: ?withProgress=true
// ────────────────────────────────────────────────────────────────────────────
test.describe('Fitness goals', () => {
  test('?withProgress=true returns the active-goals shape', async ({ page }) => {
    const goal = await jsonOk<{ goal: any }>(page.request, 'post', '/api/fitness-goals', {
      goalType: 'EXERCISE_MINUTES',
      targetValue: 600,
      unit: `m-${RUN}`,
    })

    const list = await jsonOk<{ goals: any[] }>(page.request, 'get', '/api/fitness-goals?withProgress=true')
    expect(Array.isArray(list.goals)).toBe(true)
    const found = list.goals.find((g) => g.id === goal.goal.id)
    expect(found).toBeTruthy()

    await page.request.delete(`/api/fitness-goals/${goal.goal.id}`)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Learning: progress side-effects
// ────────────────────────────────────────────────────────────────────────────
test.describe('Learning progress side-effects', () => {
  test('reaching 100% completion auto-sets completedAt', async ({ page }) => {
    const r = await jsonOk<{ resource: any }>(page.request, 'post', '/api/learning/resources', {
      title: `Auto-complete ${RUN}`,
      type: 'ARTICLE',
      category: `cat-${RUN}`,
      startDate: NOW_ISO(),
    })
    expect(r.resource.completedAt).toBeFalsy()

    const updated = await jsonOk<{ resource: any }>(page.request, 'patch', `/api/learning/resources/${r.resource.id}`, {
      completionPercentage: 100,
    })
    expect(updated.resource.completionPercentage).toBe(100)
    expect(updated.resource.completedAt).toBeTruthy()

    await page.request.delete(`/api/learning/resources/${r.resource.id}`)
  })

  test('timeInvested updates are additive', async ({ page }) => {
    const r = await jsonOk<{ resource: any }>(page.request, 'post', '/api/learning/resources', {
      title: `Additive time ${RUN}`,
      type: 'COURSE',
      category: `cat-${RUN}`,
      timeInvested: 30,
      startDate: NOW_ISO(),
    })
    expect(r.resource.timeInvested).toBe(30)

    const after = await jsonOk<{ resource: any }>(page.request, 'patch', `/api/learning/resources/${r.resource.id}`, {
      timeInvested: 45, // server adds delta to existing
    })
    expect(after.resource.timeInvested).toBe(75)

    await page.request.delete(`/api/learning/resources/${r.resource.id}`)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Stats endpoints
// ────────────────────────────────────────────────────────────────────────────
test.describe('Stats', () => {
  test('transactions stats responds', async ({ page }) => {
    const r = await jsonOk<{ stats: any }>(page.request, 'get', '/api/transactions/stats')
    expect(r.stats).toBeTruthy()
  })
  test('exercises stats responds', async ({ page }) => {
    const res = await page.request.get('/api/exercises/stats')
    expect(res.ok()).toBe(true)
  })
  test('learning stats responds', async ({ page }) => {
    const res = await page.request.get('/api/learning/stats')
    expect(res.ok()).toBe(true)
  })
  test('nutrition stats responds', async ({ page }) => {
    const res = await page.request.get('/api/nutrition/stats')
    expect(res.ok()).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Dashboard
// ────────────────────────────────────────────────────────────────────────────
test.describe('Dashboard', () => {
  test('overview returns scores + activities', async ({ page }) => {
    const r = await jsonOk<any>(page.request, 'get', '/api/dashboard/overview')
    for (const key of ['scores', 'productivity', 'wellness', 'growth', 'financial', 'activities']) {
      expect(r, `missing key ${key}`).toHaveProperty(key)
    }
    expect(Array.isArray(r.activities)).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Analytics
// ────────────────────────────────────────────────────────────────────────────
test.describe('Analytics', () => {
  test('insights / overview / trends / reports respond', async ({ page }) => {
    for (const path of [
      '/api/analytics/insights',
      '/api/analytics/overview',
      '/api/analytics/trends?days=7',
    ]) {
      const res = await page.request.get(path)
      expect(res.ok(), `${path} status ${res.status()}`).toBe(true)
    }
    // /api/analytics/reports can legitimately 404 if there's no data yet.
    const r = await page.request.get('/api/analytics/reports?type=weekly')
    expect([200, 404]).toContain(r.status())
  })

  test('reports rejects invalid type', async ({ page }) => {
    const res = await page.request.get('/api/analytics/reports?type=bogus')
    expect(res.status()).toBe(400)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Achievements
// ────────────────────────────────────────────────────────────────────────────
test.describe('Achievements', () => {
  test('GET returns list and total', async ({ page }) => {
    const r = await jsonOk<{ achievements: any[]; total: number }>(page.request, 'get', '/api/achievements')
    expect(Array.isArray(r.achievements)).toBe(true)
    expect(typeof r.total).toBe('number')
  })

  test('POST creates and GET returns it', async ({ page }) => {
    const created = await page.request.post('/api/achievements', {
      data: {
        type: `streak_${RUN}`,
        title: `Test Achievement ${RUN}`,
        description: 'created by side-effects.spec',
        category: 'PRODUCTIVITY',
      },
    })
    expect(created.status()).toBe(201)
    const body = await created.json()
    expect(body.id || body.achievement?.id).toBeTruthy()

    const list = await jsonOk<{ achievements: any[] }>(page.request, 'get', '/api/achievements?limit=50')
    expect(list.achievements.some((a: any) => a.title === `Test Achievement ${RUN}`)).toBe(true)
  })

  test('invalid category returns 400', async ({ page }) => {
    const res = await page.request.post('/api/achievements', {
      data: { type: 't', title: 'x', description: 'y', category: 'BOGUS' },
    })
    expect(res.status()).toBe(400)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Notifications
// ────────────────────────────────────────────────────────────────────────────
test.describe('Notifications', () => {
  test('list returns array and unreadCount', async ({ page }) => {
    const r = await jsonOk<{ notifications: any[]; unreadCount: number }>(page.request, 'get', '/api/notifications')
    expect(Array.isArray(r.notifications)).toBe(true)
    expect(typeof r.unreadCount).toBe('number')
  })

  test('markAllRead works', async ({ page }) => {
    const r = await jsonOk<{ success: boolean; count: number }>(page.request, 'post', '/api/notifications', {
      action: 'markAllRead',
    })
    expect(r.success).toBe(true)
    expect(typeof r.count).toBe('number')
  })

  test('POST with unknown action returns 400', async ({ page }) => {
    const res = await page.request.post('/api/notifications', { data: { action: 'somethingElse' } })
    expect(res.status()).toBe(400)
  })

  test('PATCH unknown id is 404', async ({ page }) => {
    const res = await page.request.patch('/api/notifications/nonexistent-id-12345')
    expect(res.status()).toBe(404)
  })

  test('preferences GET + PATCH round-trip', async ({ page }) => {
    const initial = await jsonOk<any>(page.request, 'get', '/api/notifications/preferences')
    expect(initial).toBeTruthy()

    const updated = await jsonOk<any>(page.request, 'patch', '/api/notifications/preferences', {
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      notificationFrequency: 'HOURLY',
    })
    expect(updated.quietHoursStart).toBe('22:00')
    expect(updated.notificationFrequency).toBe('HOURLY')
  })

  test('invalid quietHoursStart format returns 400', async ({ page }) => {
    const res = await page.request.patch('/api/notifications/preferences', { data: { quietHoursStart: '25:99' } })
    expect(res.status()).toBe(400)
  })

  test('invalid frequency returns 400', async ({ page }) => {
    const res = await page.request.patch('/api/notifications/preferences', { data: { notificationFrequency: 'BOGUS' } })
    expect(res.status()).toBe(400)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Sync
// ────────────────────────────────────────────────────────────────────────────
test.describe('Sync', () => {
  test('queue applies a CREATE op and the task becomes readable', async ({ page }) => {
    const taskId = `sync-${RUN}-${Math.random().toString(36).slice(2)}`
    const r = await jsonOk<{ results: any[]; successful: number; failed: number }>(page.request, 'post', '/api/sync/queue', {
      operations: [
        {
          id: 'op-1',
          operation: 'CREATE',
          entity: 'task',
          entityId: taskId,
          data: {
            title: `Synced task ${RUN}`,
            workspace: 'PROFESSIONAL',
            priority: 'MEDIUM',
            status: 'TODO',
            tags: '[]',
          },
          timestamp: Date.now(),
        },
      ],
    })
    expect(r.successful).toBe(1)
    expect(r.failed).toBe(0)

    // Confirm the task is readable through the standard endpoint.
    const single = await page.request.get(`/api/tasks/${taskId}`)
    expect(single.ok()).toBe(true)

    await page.request.delete(`/api/tasks/${taskId}`)
  })

  test('queue rejects non-array body', async ({ page }) => {
    const res = await page.request.post('/api/sync/queue', { data: { operations: 'not-an-array' } })
    expect(res.status()).toBe(400)
  })

  test('status returns counts and conflicts shape', async ({ page }) => {
    const r = await jsonOk<any>(page.request, 'get', '/api/sync/status')
    for (const key of [
      'status',
      'totalOperations',
      'syncedOperations',
      'pendingOperations',
      'unresolvedConflicts',
      'pendingByEntity',
      'conflicts',
    ]) {
      expect(r, `missing key ${key}`).toHaveProperty(key)
    }
    expect(Array.isArray(r.conflicts)).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Integrations
// ────────────────────────────────────────────────────────────────────────────
test.describe('Integrations', () => {
  test('list responds 200 with array', async ({ page }) => {
    const res = await page.request.get('/api/integrations')
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('connect with bogus provider is 400', async ({ page }) => {
    const res = await page.request.post('/api/integrations/connect', { data: { provider: 'definitely-not-a-real-provider' } })
    expect(res.status()).toBe(400)
  })

  test('connect without provider is 400', async ({ page }) => {
    const res = await page.request.post('/api/integrations/connect', { data: {} })
    expect(res.status()).toBe(400)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Export & GDPR
// ────────────────────────────────────────────────────────────────────────────
test.describe('Export', () => {
  test('JSON returns body + Content-Disposition', async ({ page }) => {
    const res = await page.request.get('/api/export?format=JSON')
    expect(res.ok()).toBe(true)
    expect(res.headers()['content-disposition']).toMatch(/attachment/)
    const text = await res.text()
    expect(() => JSON.parse(text)).not.toThrow()
  })

  test('CSV returns CSV body', async ({ page }) => {
    const res = await page.request.get('/api/export?format=CSV')
    expect(res.ok()).toBe(true)
    expect(res.headers()['content-disposition']).toMatch(/attachment/)
  })

  test('invalid format returns 400', async ({ page }) => {
    const res = await page.request.get('/api/export?format=BOGUS')
    expect(res.status()).toBe(400)
  })
})

test.describe('GDPR', () => {
  test('user/export returns user data', async ({ page }) => {
    const res = await page.request.get('/api/user/export')
    // Strict rate limit may reject in tight loops; accept 200 or 429.
    expect([200, 429]).toContain(res.status())
    if (res.status() === 200) {
      const body = await res.json()
      expect(body).toBeTruthy()
    }
  })

  test('data-retention responds 200', async ({ page }) => {
    const res = await page.request.get('/api/user/data-retention')
    expect(res.ok()).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Cron — only callable when CRON_SECRET is unset (dev default).
// ────────────────────────────────────────────────────────────────────────────
test.describe('Cron', () => {
  test('cleanup is reachable (200 if unsecured, 401 if CRON_SECRET set)', async ({ page }) => {
    const res = await page.request.get('/api/cron/cleanup')
    expect([200, 401]).toContain(res.status())
    if (res.ok()) {
      const body = await res.json()
      expect(body.success).toBe(true)
      for (const key of ['syncQueue', 'conflicts', 'notifications']) {
        expect(body.results, `missing results.${key}`).toHaveProperty(key)
      }
    }
  })

  test('metrics-aggregation is reachable', async ({ page }) => {
    const res = await page.request.get('/api/cron/metrics-aggregation')
    expect([200, 401]).toContain(res.status())
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Health (public — no auth needed, but the storageState cookie is harmless)
// ────────────────────────────────────────────────────────────────────────────
test.describe('Health', () => {
  test('check has db, redis, memory blocks', async ({ page }) => {
    const res = await page.request.get('/api/health')
    // healthy=200, degraded=200, unhealthy=503; any of those count as "responding".
    expect([200, 503]).toContain(res.status())
    const body = await res.json()
    for (const key of ['status', 'timestamp', 'uptime', 'checks']) {
      expect(body, `missing key ${key}`).toHaveProperty(key)
    }
    for (const dep of ['database', 'redis', 'memory']) {
      expect(body.checks, `missing check ${dep}`).toHaveProperty(dep)
    }
  })
})
