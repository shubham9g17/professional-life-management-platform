import { test, expect } from '@playwright/test'
import { makeUser, signUp } from './helpers'

// Auth flow does not vary by viewport; auth.spec.ts is excluded from non-laptop projects
// in playwright.config.ts to avoid the 5/15min signup rate limit.

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Auth flow E2E', () => {
  test('sign-in rejects invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.getByRole('textbox', { name: 'Email' }).fill('not-a-user@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('WrongPass123!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForTimeout(1500)
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('sign-up creates account and lands on dashboard', async ({ page }) => {
    const user = makeUser('signup')
    await signUp(page, user)
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('sign-in with valid creds redirects to dashboard', async ({ page }) => {
    const user = makeUser('signin')
    await signUp(page, user)
    // Now sign out by clearing the cookie and sign back in
    const ctx = page.context()
    await ctx.clearCookies()
    await page.goto('/auth/signin')
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email)
    await page.getByRole('textbox', { name: 'Password' }).fill(user.password)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('protected route redirects to signin when unauthenticated', async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/signin/)
    await ctx.close()
  })
})
