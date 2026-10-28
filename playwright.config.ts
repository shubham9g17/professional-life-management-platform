import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const STORAGE_STATE = path.join(__dirname, 'tests/e2e/.auth/state.json')

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/global-setup.ts', '**/helpers.ts'],
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    storageState: STORAGE_STATE,
  },
  projects: [
    {
      name: 'mobile',
      testIgnore: ['**/auth.spec.ts', '**/crud.spec.ts', '**/side-effects.spec.ts', '**/demo/**'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 667 },
        hasTouch: true,
      },
    },
    {
      name: 'tablet',
      testIgnore: ['**/auth.spec.ts', '**/crud.spec.ts', '**/side-effects.spec.ts', '**/demo/**'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
      },
    },
    {
      name: 'laptop',
      testIgnore: ['**/demo/**'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'big-screen',
      testIgnore: ['**/auth.spec.ts', '**/crud.spec.ts', '**/side-effects.spec.ts', '**/demo/**'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'demo',
      testMatch: /demo\/walkthrough\.spec\.ts/,
      timeout: 10 * 60 * 1000,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        video: 'on',
        trace: 'off',
        screenshot: 'off',
        launchOptions: { slowMo: 200 },
      },
    },
  ],
})
