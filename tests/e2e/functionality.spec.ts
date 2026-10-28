import { test, expect } from '@playwright/test'

test.describe('Per-page functional smoke', () => {

  test('dashboard renders core widgets', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /good (morning|afternoon|evening)/i })).toBeVisible()
    await expect(page.getByText(/Today's Overall/i)).toBeVisible()
    await expect(page.getByText(/Quick Actions/i)).toBeVisible()
  })

  test('tasks page shows kanban + create button', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page.getByText(/Task Board/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /new task/i })).toBeVisible()
    await expect(page.getByText('To Do')).toBeVisible()
    await expect(page.getByText('In Progress')).toBeVisible()
    await expect(page.getByText('Completed')).toBeVisible()
  })

  test('habits page shows create CTA when empty', async ({ page }) => {
    await page.goto('/habits')
    await expect(page.getByRole('heading', { name: /habits/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /new habit/i })).toBeVisible()
  })

  test('finance page shows tabs and stat cards', async ({ page }) => {
    await page.goto('/finance')
    await expect(page.getByRole('heading', { name: /finance/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /transactions/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /budgets/i })).toBeVisible()
  })

  test('fitness page shows tabs', async ({ page }) => {
    await page.goto('/fitness')
    await expect(page.getByRole('heading', { name: /fitness/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /exercises/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /goals/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /health metrics/i })).toBeVisible()
  })

  test('nutrition page shows log meal CTA', async ({ page }) => {
    await page.goto('/nutrition')
    await expect(page.getByRole('heading', { name: /nutrition/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /log meal/i })).toBeVisible()
  })

  test('learning page shows resource controls', async ({ page }) => {
    await page.goto('/learning')
    await expect(page.getByRole('heading', { name: /^learning & development$/i, level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: /add resource/i })).toBeVisible()
  })

  test('analytics page shows tabs', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /achievements/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /trends/i })).toBeVisible()
  })

  test('integrations page lists connector cards', async ({ page }) => {
    await page.goto('/integrations')
    await expect(page.getByRole('heading', { name: /integrations/i })).toBeVisible()
    await expect(page.getByText(/Google Calendar/i)).toBeVisible()
    await expect(page.getByText(/Notion/i)).toBeVisible()
  })

  test('dashboard quick action navigates to tasks/habits etc.', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /add task/i }).click()
    await page.waitForLoadState('networkidle')
    expect(page.url()).toMatch(/tasks|new/)
  })

  test('console has no JS errors on dashboard', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    expect(errors, errors.join('\n')).toEqual([])
  })
})
