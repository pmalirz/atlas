import { Page, expect, Locator } from '@playwright/test';
import { withTenantUiPath } from '../../utils/tenant-paths';

// ─────────────────────────────────────────────────────────────
// AUTH HELPERS
// ─────────────────────────────────────────────────────────────

// Well-known test user credentials (matches E2E seed in e2e-auth.ts)
const TEST_EMAIL = 'e2e-test@atlas.local';
const TEST_PASSWORD = 'e2e-test-password-123';

/**
 * Login with the seeded test user via the UI login page.
 * This user is created by the E2E seed (e2e-auth.ts).
 * Call this in test.beforeEach for each test's page.
 */
export async function loginTestUser(page: Page): Promise<void> {
    // First, navigate to the app to be able to check localStorage
    await page.goto(withTenantUiPath('/'));

    // Check if already authenticated on this page's context
    const hasUser = await page.evaluate(() => {
        return !!localStorage.getItem('atlas_auth_user');
    });

    if (hasUser) {
        // Already logged in on this page, just wait for load
        await waitForPageLoad(page);
        return;
    }

    // Go to login page
    await page.goto(withTenantUiPath('/login'));

    // Wait for login page to load
    await expect(page.getByTestId('auth-card')).toBeVisible({ timeout: 10000 });

    // Make sure we're on the login tab (not register)
    const loginTab = page.getByTestId('login-tab');
    if (await loginTab.isVisible()) {
        await loginTab.click();
    }

    // Fill login form with seeded test user credentials
    await page.getByTestId('auth-email-input').fill(TEST_EMAIL);
    await page.getByTestId('auth-password-input').fill(TEST_PASSWORD);

    // Submit login
    await page.getByTestId('auth-submit-btn').click();

    // Wait for redirect to home page (successful auth)
    await page.waitForURL((url) => {
        const tenantRoot = withTenantUiPath('/');
        return url.pathname === tenantRoot || url.pathname === `${tenantRoot}/`;
    }, { timeout: 15000 });
    await waitForPageLoad(page);
}

/**
 * Ensure user is authenticated before accessing protected routes.
 * Call this in beforeEach for all UI tests.
 */
export async function ensureAuthenticated(page: Page): Promise<void> {
    // Check if we have a user in localStorage
    const hasUser = await page.evaluate(() => {
        return !!localStorage.getItem('atlas_auth_user');
    });

    if (!hasUser) {
        await loginTestUser(page);
    }
}

/**
 * Wait for the page to finish loading (skeletons disappear)
 */
export async function waitForPageLoad(page: Page): Promise<void> {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });

    const primaryContent = page
        .locator('[data-testid="auth-card"], [data-testid="forgot-password-card"], [data-testid="reset-password-card"], [data-testid="verify-email-card"], [data-testid="sidebar"], main')
        .first();
    await expect(primaryContent).toBeVisible({ timeout: 15000 });

    // Non-blocking: give skeletons a chance to settle, but don't fail test if animations persist.
    try {
        await expect(page.locator('main .animate-pulse')).toHaveCount(0, { timeout: 8000 });
    } catch {
        // Ignore intermittent long-lived skeleton animations.
    }
}

/**
 * Navigate to an entity type via sidebar
 */
export async function navigateToEntity(page: Page, entityType: string): Promise<void> {
    // Wait for sidebar and menu config to load first.
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Loading...')).toHaveCount(0, { timeout: 15000 });

    const menuItem = page.getByRole('link', { name: new RegExp(entityType, 'i') }).first();
    await expect(menuItem).toBeVisible({ timeout: 10000 });
    await menuItem.click();

    // Wait for page to load
    await waitForPageLoad(page);
}

/**
 * Select the first entity in the list (works for both tile and table views)
 * @param page - Playwright page
 * @param entityType - Optional entity type to narrow down the tile selector
 */
export async function selectFirstEntity(page: Page, entityType?: string): Promise<void> {
    // Use hierarchical data-testid pattern: tile-{entityType}-{uuid}
    const tileSelector = entityType
        ? `[data-testid^="tile-${entityType}-"]`
        : '[data-testid^="tile-"]';
    const tileCard = page.locator(tileSelector).first();

    // For table view: row-{entityType}-{uuid}
    const rowSelector = entityType
        ? `[data-testid^="row-${entityType}-"]`
        : '[data-testid^="row-"]';
    const tableRow = page.locator(rowSelector).first();

    // Check which view is active and click
    if (await tileCard.isVisible()) {
        await tileCard.click();
    } else if (await tableRow.isVisible()) {
        await tableRow.click();
    } else {
        // Fallback: look for any clickable link in the content area
        const entityLink = page.locator('main a').first();
        await entityLink.click();
    }

    // Wait for detail page to load
    await waitForPageLoad(page);
}

/**
 * Wait for a toast notification to appear with specific text
 */
export async function waitForToast(page: Page, text?: string): Promise<void> {
    const toastLocator = text
        ? page.locator('[data-sonner-toast]', { hasText: text })
        : page.locator('[data-sonner-toast]');

    await expect(toastLocator.first()).toBeVisible({ timeout: 5000 });
}

// ─────────────────────────────────────────────────────────────
// SCHEMA-DRIVEN LOCATORS
// ─────────────────────────────────────────────────────────────

/**
 * Get a section by its schema ID
 * @example getSection(page, 'classification')
 */
export function getSection(page: Page, sectionId: string): Locator {
    return page.getByTestId(`section-${sectionId}`);
}

/**
 * Get a field by section and attribute key
 * @example getField(page, 'classification', 'status')
 */
export function getField(page: Page, sectionId: string, fieldKey: string): Locator {
    return page.getByTestId(`field-${sectionId}-${fieldKey}`);
}

/**
 * Get a tile by entity type and ID
 * @example getTile(page, 'application', 'uuid-123')
 */
export function getTile(page: Page, entityType: string, entityId: string): Locator {
    return page.getByTestId(`tile-${entityType}-${entityId}`);
}

/**
 * Get a table row by entity type and ID
 * @example getTableRow(page, 'application', 'uuid-123')
 */
export function getTableRow(page: Page, entityType: string, entityId: string): Locator {
    return page.getByTestId(`row-${entityType}-${entityId}`);
}

/**
 * Get a table cell by entity type and field
 * @example getTableCell(page, 'application', 'name')
 */
export function getTableCell(page: Page, entityType: string, fieldKey: string): Locator {
    return page.getByTestId(`cell-${entityType}-${fieldKey}`);
}

/**
 * Select a specific entity by name
 */
export async function selectEntity(page: Page, name: string): Promise<void> {
    const tile = page.locator(`[data-testid^="tile-"]`, { hasText: name }).first();
    const row = page.locator(`[data-testid^="row-"]`, { hasText: name }).first();

    if (await tile.isVisible()) {
        await tile.click();
    } else if (await row.isVisible()) {
        await row.click();
    } else {
        const link = page.getByRole('link', { name: name }).first();
        if (await link.isVisible()) {
            await link.click();
        } else {
            await page.getByText(name).first().click();
        }
    }
    await waitForPageLoad(page);
}


