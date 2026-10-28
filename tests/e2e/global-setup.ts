import { chromium, FullConfig } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { TEST_USER } from './helpers'

const STORAGE_PATH = path.join(__dirname, '.auth', 'state.json')

export default async function globalSetup(_config: FullConfig) {
  fs.mkdirSync(path.dirname(STORAGE_PATH), { recursive: true })

  const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ baseURL })
  const page = await ctx.newPage()

  await page.goto('/auth/signup')
  await page.getByRole('textbox', { name: 'Full Name' }).fill(TEST_USER.name)
  await page.getByRole('textbox', { name: 'Email' }).fill(TEST_USER.email)
  await page.getByRole('textbox', { name: 'Password' }).fill(TEST_USER.password)
  await page.getByRole('button', { name: /create account/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })

  await ctx.storageState({ path: STORAGE_PATH })
  await browser.close()

  console.log(`[global-setup] Test user ${TEST_USER.email} ready, state saved.`)
}
