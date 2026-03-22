import { test, expect } from '@playwright/test';
import { waitForPageLoad, selectFirstEntity, waitForToast } from './utils/test-helpers';
import { withTenantUiPath } from '../utils/tenant-paths';

test.describe('Workflow Engine', () => {
    const REGULAR_USER = {
        email: 'e2e-regular-user@atlas.local',
        password: 'regular',
    };

    test.beforeEach(async ({ page }) => {
        await page.goto(withTenantUiPath('/login'));
        await expect(page.getByTestId('auth-card')).toBeVisible({ timeout: 10000 });

        const loginTab = page.getByTestId('login-tab');
        if (await loginTab.isVisible()) {
            await loginTab.click();
        }

        await page.getByTestId('auth-email-input').fill(REGULAR_USER.email);
        await page.getByTestId('auth-password-input').fill(REGULAR_USER.password);
        await page.getByTestId('auth-submit-btn').click();

        await page.waitForURL((url) => {
            const tenantRoot = withTenantUiPath('/');
            return url.pathname === tenantRoot || url.pathname === `${tenantRoot}/`;
        }, { timeout: 15000 });
        await waitForPageLoad(page);
    });

    test('should restrict enum options based on workflow definitions', async ({ page }) => {
        await page.goto(withTenantUiPath('/book'));
        await waitForPageLoad(page);
        await selectFirstEntity(page);

        // Give React Query time to fetch allowed-transitions
        await page.waitForTimeout(2000); 

        // Find the "status" dropdown trigger. It's usually a button with role="combobox"
        // Let's just find the combobox that has the current status "Available"
        const selectTrigger = page.locator('button[role="combobox"]', { hasText: /available/i }).first();
        
        await selectTrigger.click();

        // Check the options in the listbox
        const listbox = page.locator('[role="listbox"]');
        await expect(listbox).toBeVisible();

        // 'Archived' should NOT be visible for a regular user lacking 'Admin' role
        // 'Borrowed' should be visible for 'Available' book
        const borrowedOption = page.locator('[role="option"]', { hasText: /borrow/i });
        const archivedOption = page.locator('[role="option"]', { hasText: /archiv/i });
        
        await expect(borrowedOption).toBeVisible();
        await expect(archivedOption).not.toBeVisible();
        
        // Select 'borrowed'
        await borrowedOption.click();
        
        // Ensure standard updates show a toast
        await waitForToast(page);

        // After update, status should be "Borrowed" and "Available" should remain selectable without refresh
        const borrowedTrigger = page.locator('button[role="combobox"]', { hasText: /borrowed/i }).first();
        await expect(borrowedTrigger).toBeVisible();
        await borrowedTrigger.click();

        const availableOption = page.locator('[role="option"]', { hasText: /available/i });
        await expect(availableOption).toBeVisible();
        await expect(archivedOption).not.toBeVisible();
    });
});
