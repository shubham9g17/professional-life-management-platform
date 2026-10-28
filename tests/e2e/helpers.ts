import { Page, expect } from '@playwright/test'

const RUN_ID = process.env.E2E_RUN_ID ?? Date.now().toString(36)

export function makeUser(label = 'suite') {
  return {
    name: `E2E ${label}`,
    email: `e2e+${label}-${RUN_ID}@example.com`,
    password: 'TestPass123!',
  }
}

export const TEST_USER = makeUser('shared')

export async function signUp(page: Page, user = TEST_USER) {
  await page.goto('/auth/signup')
  await page.getByRole('textbox', { name: 'Full Name' }).fill(user.name)
  await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
  await page.getByRole('textbox', { name: 'Password' }).fill(user.password)
  await page.getByRole('button', { name: /create account/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 })
  await expect(page).toHaveURL(/\/dashboard/)
}

export async function signUpOrSignIn(page: Page, user = TEST_USER) {
  await page.goto('/auth/signin')
  await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
  await page.getByRole('textbox', { name: 'Password' }).fill(user.password)
  await page.getByRole('button', { name: /sign in/i }).click()

  await Promise.race([
    page.waitForURL(/\/dashboard/, { timeout: 4_000 }).catch(() => null),
    page.waitForTimeout(4_000),
  ])

  if (!page.url().includes('/dashboard')) {
    await signUp(page, user)
  }
  await expect(page).toHaveURL(/\/dashboard/)
}

export const DASHBOARD_PAGES = [
  { path: '/dashboard', label: 'dashboard' },
  { path: '/tasks', label: 'tasks' },
  { path: '/habits', label: 'habits' },
  { path: '/finance', label: 'finance' },
  { path: '/fitness', label: 'fitness' },
  { path: '/nutrition', label: 'nutrition' },
  { path: '/learning', label: 'learning' },
  { path: '/analytics', label: 'analytics' },
  { path: '/integrations', label: 'integrations' },
  { path: '/notifications', label: 'notifications' },
] as const

export const PUBLIC_PAGES = [
  { path: '/auth/signin', label: 'signin' },
  { path: '/auth/signup', label: 'signup' },
] as const
