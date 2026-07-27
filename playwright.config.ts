import { defineConfig } from '@playwright/test';
import { EnvConfig } from './src/config/env.config';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Use a temp directory outside OneDrive for test outputs to avoid EPERM
 * file-locking errors caused by OneDrive sync on Windows.
 * On CI, use the default in-project directory.
 */
const testResultsDir = process.env.CI
  ? 'test-results'
  : path.join(os.tmpdir(), 'playwright-api-test-results');

// Load environment configuration
const envConfig = EnvConfig.getInstance();

// Write Allure environment properties
const allureResultsDir = path.resolve('allure-results');
if (!fs.existsSync(allureResultsDir)) {
  fs.mkdirSync(allureResultsDir, { recursive: true });
}
fs.writeFileSync(
  path.join(allureResultsDir, 'environment.properties'),
  [
    `Environment=${envConfig.environment}`,
    `Base.URL=${envConfig.baseUrl}`,
    `Node.Version=${process.version}`,
    `OS=${process.platform}`,
    `Timestamp=${new Date().toISOString()}`,
  ].join('\n')
);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  /* Parallel execution configuration */
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,

  /* Retry configuration */
  retries: process.env.CI ? 2 : 1,

  /* Timeout configuration */
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },

  /* Forbid test.only on CI */
  forbidOnly: !!process.env.CI,

  /* Reporter configuration */
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'playwright-report',
        open: process.env.CI ? 'never' : 'on-failure',
      },
    ],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        suiteTitle: true,
        environmentInfo: {
          Environment: envConfig.environment,
          BaseURL: envConfig.baseUrl,
          NodeVersion: process.version,
        },
      },
    ],
  ],

  /* Shared settings for all projects */
  use: {
    /* Base URL for API requests */
    baseURL: envConfig.baseUrl,

    /* Request headers */
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },

    /* Trace collection on failure */
    trace: 'on-first-retry',
  },

  /* Test projects - can be used for different API versions or environments */
  projects: [
    {
      name: 'api-tests',
      testDir: './tests',
      testMatch: '**/*.spec.ts',
    },
  ],

  /* Output directory for test artifacts */
  outputDir: testResultsDir,
});
