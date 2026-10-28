import { test, expect } from '@playwright/test'
import { showCaption, showTitle } from './captions'
import { seedDemoData } from './seed-demo-data'

// One long-form, slow-paced walkthrough recorded as a single .webm by the
// `demo` Playwright project. Captions are DOM-injected, so they're baked into
// the recording — no post-production needed.
//
// Pacing target: 5–7 minutes total. Each section narrates with showCaption
// while waitForTimeout gives the viewer time to read.

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ request }) => {
  await seedDemoData(request)
})

test('platform walkthrough', async ({ page }) => {
  test.setTimeout(12 * 60 * 1000)

  // ── Intro ────────────────────────────────────────────────────────────
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle').catch(() => {})
  await showTitle(page, 'Personal Life Management Platform', 5000)
  await page.waitForTimeout(5000)
  await showTitle(page, 'A unified workspace for tasks, habits, finance, fitness, nutrition and learning', 6500)
  await page.waitForTimeout(6500)

  // ── 1. Dashboard ─────────────────────────────────────────────────────
  await showCaption(page, '1. Dashboard — your day at a glance', 4500)
  await page.waitForTimeout(4000)
  await showCaption(page, 'Bento grid of productivity, wellness, growth and financial scores', 5000)
  await page.waitForTimeout(5000)
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }))
  await page.waitForTimeout(3000)
  await showCaption(page, 'Sparkline charts surface 7-day trends in every domain', 5000)
  await page.waitForTimeout(5000)
  await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'smooth' }))
  await page.waitForTimeout(3000)
  await showCaption(page, 'Activity feed merges recent actions across all features', 5500)
  await page.waitForTimeout(5500)
  await showCaption(page, 'Quick actions give you single-click shortcuts to log anything', 5500)
  await page.waitForTimeout(5500)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await page.waitForTimeout(3000)

  // ── 2. Tasks ─────────────────────────────────────────────────────────
  await showTitle(page, '2. Tasks — multi-view workspace', 4000)
  await page.waitForTimeout(500)
  await page.goto('/tasks')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(2500)
  await showCaption(page, 'Kanban board: drag tasks across To Do, In Progress and Completed', 5000)
  await page.waitForTimeout(5000)
  await showCaption(page, 'Each card shows priority, due date, tags and workspace at a glance', 5000)
  await page.waitForTimeout(5000)
  // Switch to list view to demonstrate the alternate layouts.
  const listTab = page.getByRole('tab', { name: /^list$/i })
  if (await listTab.isVisible().catch(() => false)) {
    await listTab.click()
    await page.waitForTimeout(2500)
    await showCaption(page, 'List view groups tasks by priority with inline due dates', 5000)
    await page.waitForTimeout(4500)
  }
  // Calendar view.
  const calTab = page.getByRole('tab', { name: /calendar/i })
  if (await calTab.isVisible().catch(() => false)) {
    await calTab.click()
    await page.waitForTimeout(2500)
    await showCaption(page, 'Calendar view plots every task on its due date', 4500)
    await page.waitForTimeout(4000)
  }
  // Open the create-task dialog to demo the form.
  const boardTab = page.getByRole('tab', { name: /^board$/i })
  if (await boardTab.isVisible().catch(() => false)) {
    await boardTab.click()
    await page.waitForTimeout(1500)
  }
  const newTaskBtn = page.getByRole('button', { name: /new task/i }).first()
  if (await newTaskBtn.isVisible().catch(() => false)) {
    await newTaskBtn.click()
    await page.waitForTimeout(1500)
    await showCaption(page, 'Create tasks with priority, workspace, due date and tags', 5000)
    await page.waitForTimeout(5000)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(2000)
  }

  // ── 3. Habits ────────────────────────────────────────────────────────
  await showTitle(page, '3. Habits — streaks and consistency', 4000)
  await page.waitForTimeout(500)
  await page.goto('/habits')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(2500)
  await showCaption(page, 'GitHub-style heatmap visualizes long-term consistency', 5000)
  await page.waitForTimeout(5000)
  await showCaption(page, 'Categorized: Health, Professional Development, Personal Growth, Productivity', 5000)
  await page.waitForTimeout(5000)
  // Try to click a "complete" button on the first habit to bump its streak.
  const completeBtn = page
    .getByRole('button', { name: /complete|mark complete|done|check/i })
    .first()
  if (await completeBtn.isVisible().catch(() => false)) {
    await showCaption(page, 'Marking a habit complete updates the streak counter live', 4500)
    await completeBtn.click().catch(() => {})
    await page.waitForTimeout(4000)
    await showCaption(page, 'Daily, weekly and custom frequencies — built-in streak tracking', 5000)
    await page.waitForTimeout(5000)
  } else {
    await showCaption(page, 'Daily, weekly and custom frequencies — built-in streak tracking', 5000)
    await page.waitForTimeout(5000)
  }

  // ── 4. Finance ───────────────────────────────────────────────────────
  await showTitle(page, '4. Finance — transactions and budgets', 4000)
  await page.waitForTimeout(500)
  await page.goto('/finance')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(2500)
  await showCaption(page, 'Overview: monthly income vs expenses with category breakdowns', 5000)
  await page.waitForTimeout(5000)
  const txTab = page.getByRole('tab', { name: /transactions/i })
  if (await txTab.isVisible().catch(() => false)) {
    await txTab.click()
    await page.waitForTimeout(2500)
    await showCaption(page, 'Full transaction history — searchable, taggable, categorizable', 5000)
    await page.waitForTimeout(5000)
  }
  const budgetTab = page.getByRole('tab', { name: /budgets/i })
  if (await budgetTab.isVisible().catch(() => false)) {
    await budgetTab.click()
    await page.waitForTimeout(2500)
    await showCaption(page, 'Budgets with per-category alert thresholds — warning when nearing limits', 5500)
    await page.waitForTimeout(5500)
  }

  // ── 5. Fitness ───────────────────────────────────────────────────────
  await showTitle(page, '5. Fitness — exercise, metrics, goals', 4000)
  await page.waitForTimeout(500)
  await page.goto('/fitness')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(2500)
  await showCaption(page, 'Overview combines exercise log, health metrics and active goals', 5000)
  await page.waitForTimeout(5000)
  const exerciseTab = page.getByRole('tab', { name: /^exercises$/i })
  if (await exerciseTab.isVisible().catch(() => false)) {
    await exerciseTab.click()
    await page.waitForTimeout(2500)
    await showCaption(page, 'Exercise log — activity, duration, intensity, calories burned', 5000)
    await page.waitForTimeout(5000)
  }
  const metricsTab = page.getByRole('tab', { name: /health metrics|metrics/i })
  if (await metricsTab.isVisible().catch(() => false)) {
    await metricsTab.click()
    await page.waitForTimeout(2500)
    await showCaption(page, 'Health metrics: weight, sleep quality, stress and energy levels', 5000)
    await page.waitForTimeout(5000)
  }
  const goalsTab = page.getByRole('tab', { name: /^goals$/i })
  if (await goalsTab.isVisible().catch(() => false)) {
    await goalsTab.click()
    await page.waitForTimeout(2500)
    await showCaption(page, 'Fitness goals tracked against deadlines with progress bars', 5000)
    await page.waitForTimeout(5000)
  }

  // ── 6. Nutrition ─────────────────────────────────────────────────────
  await showTitle(page, '6. Nutrition — meals and hydration', 4000)
  await page.waitForTimeout(500)
  await page.goto('/nutrition')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(2500)
  await showCaption(page, 'Daily meals with macro breakdown — protein, carbs, fats', 5000)
  await page.waitForTimeout(5000)
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }))
  await page.waitForTimeout(3000)
  await showCaption(page, 'Water intake tracked toward a daily hydration goal', 5000)
  await page.waitForTimeout(5000)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await page.waitForTimeout(2500)

  // ── 7. Learning ──────────────────────────────────────────────────────
  await showTitle(page, '7. Learning — books, courses, certifications', 4000)
  await page.waitForTimeout(500)
  await page.goto('/learning')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(2500)
  await showCaption(page, 'Track resources by type — books, courses, certifications, articles', 5500)
  await page.waitForTimeout(5500)
  await showCaption(page, 'Each resource shows completion percentage and total time invested', 5500)
  await page.waitForTimeout(5500)

  // ── 8. Analytics ─────────────────────────────────────────────────────
  await showTitle(page, '8. Analytics — cross-domain insights', 4000)
  await page.waitForTimeout(500)
  await page.goto('/analytics')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(2500)
  await showCaption(page, 'Trends, productivity scores and weekly reports', 5500)
  await page.waitForTimeout(5500)
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }))
  await page.waitForTimeout(3000)
  await showCaption(page, 'Achievements unlock across every domain — productivity, wellness, growth', 5500)
  await page.waitForTimeout(5500)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await page.waitForTimeout(2500)

  // ── 9. Notifications ─────────────────────────────────────────────────
  await showTitle(page, '9. Notifications — stay in the loop', 4000)
  await page.waitForTimeout(500)
  await page.goto('/notifications')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(2500)
  await showCaption(page, 'Configurable notifications with quiet hours and per-domain preferences', 5500)
  await page.waitForTimeout(5500)
  await showCaption(page, 'Mark all read, frequency controls, snooze — all in one place', 5000)
  await page.waitForTimeout(5000)

  // ── 10. Integrations ─────────────────────────────────────────────────
  await showTitle(page, '10. Integrations — connect external services', 4000)
  await page.waitForTimeout(500)
  await page.goto('/integrations')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(2500)
  await showCaption(page, 'OAuth connectors: Google Calendar, fitness trackers and more', 5500)
  await page.waitForTimeout(5500)
  await showCaption(page, 'Two-way sync, conflict resolution and offline queue built in', 5500)
  await page.waitForTimeout(5500)

  // ── Outro ────────────────────────────────────────────────────────────
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(2000)
  await showTitle(page, 'Built with Next.js 16 · Prisma · NextAuth · Playwright', 6500)
  await page.waitForTimeout(6500)
  await showTitle(page, 'Thank you for watching', 5000)
  await page.waitForTimeout(5000)

  // Sanity assert at the very end so the spec passes/fails meaningfully.
  await expect(page).toHaveURL(/\/dashboard/)
})
