import { test, expect } from '@playwright/test'
import { DASHBOARD_PAGES, PUBLIC_PAGES } from './helpers'

test.describe('Visual layer @ all viewports', () => {
  test('public pages render at this viewport', async ({ browser }, testInfo) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await ctx.newPage()
    for (const { path, label } of PUBLIC_PAGES) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }))
      expect(
        overflow.scrollW,
        `horizontal overflow on ${label} (${overflow.scrollW} > ${overflow.clientW})`,
      ).toBeLessThanOrEqual(overflow.clientW + 1)
      await page.screenshot({
        path: testInfo.outputPath(`public-${label}.png`),
        fullPage: true,
      })
    }
    await ctx.close()
  })

  test('dashboard pages render at this viewport', async ({ page }, testInfo) => {
    for (const { path, label } of DASHBOARD_PAGES) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }))
      expect(
        overflow.scrollW,
        `horizontal overflow on ${label} (${overflow.scrollW} > ${overflow.clientW})`,
      ).toBeLessThanOrEqual(overflow.clientW + 1)
      await page.screenshot({
        path: testInfo.outputPath(`dash-${label}.png`),
        fullPage: true,
      })
    }
  })
})
