import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for Atlas UI E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */

// Get base URL from environment or use default
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173';

// In CI/Docker, use 'preview' to serve the pre-built UI
// Locally, use 'dev:e2e' for hot reload
const isCI = process.env.CI === 'true';

export default defineConfig({
    testDir: './tests/ui',

    // Run tests in parallel
    fullyParallel: true,

    // Fail the build on CI if test.only is left in the source code
    forbidOnly: isCI,

    // Retry on CI only
    retries: isCI ? 1 : 0,

    // Opt out of parallel tests on CI
    workers: isCI ? 1 : undefined,

    // Reporter
    reporter: [['list'], ['html', { open: 'never' }]],

    // Timeout per test
    timeout: 15 * 1000,

    // Shared settings for all the projects below
    use: {
        // Base URL to use in actions like `await page.goto('/')`
        baseURL,

        // Collect trace when retrying the failed test
        trace: 'on-first-retry',

        // Take screenshot on failure
        screenshot: 'only-on-failure',
    },

    // Configure projects for major browsers
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Run your local dev server before starting the tests
    webServer: {
        command: 'npm run dev:e2e -w atlas-ui',
        cwd: '..',
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 60 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
});
