import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForToast, navigateToEntity, loginTestUser } from './utils/test-helpers';

/**
 * Entity Creation Tests
 * 
 * Tests the generic entity creation flow.
 * Uses E2E seed data (Book, Author entities).
 */

test.describe('Entity Creation', () => {

    // Login before each test (each test has its own browser context)
    test.beforeEach(async ({ page }) => {
        await loginTestUser(page);
    });

    test.describe('Route Accessibility', () => {

        test('should load create page via direct URL', async ({ page }) => {
            await page.goto('/book/create');
            await waitForPageLoad(page);

            // Create page should be visible with correct heading
            await expect(page.getByRole('heading', { name: /create/i })).toBeVisible();

            // Form fields should be visible
            await expect(page.getByTestId('create-entity-name-input')).toBeVisible();
            await expect(page.getByTestId('create-entity-description-input')).toBeVisible();

            // Action buttons should be visible
            await expect(page.getByTestId('create-entity-save-and-edit-btn')).toBeVisible();
            await expect(page.getByTestId('create-entity-save-and-new-btn')).toBeVisible();
        });

        test('should navigate to create page from browse page Create button', async ({ page }) => {
            await page.goto('/book');
            await waitForPageLoad(page);

            // Click the Create button
            const createBtn = page.getByTestId('create-entity-btn');
            await expect(createBtn).toBeVisible();
            await createBtn.click();

            // Should navigate to create page
            await expect(page).toHaveURL(/\/book\/create/);
            await expect(page.getByRole('heading', { name: /create/i })).toBeVisible();
        });
    });

    test.describe('Form Validation', () => {

        test('should show validation error when name is empty', async ({ page }) => {
            await page.goto('/book/create');
            await waitForPageLoad(page);

            // Click Save & Edit without entering name
            await page.getByTestId('create-entity-save-and-edit-btn').click();

            // Should show validation error
            await expect(page.getByText(/name is required/i)).toBeVisible();

            // Should stay on create page
            await expect(page).toHaveURL(/\/book\/create/);
        });

        test('should clear validation error when name is entered', async ({ page }) => {
            await page.goto('/book/create');
            await waitForPageLoad(page);

            // Trigger validation error
            await page.getByTestId('create-entity-save-and-edit-btn').click();
            await expect(page.getByText(/name is required/i)).toBeVisible();

            // Enter a name
            await page.getByTestId('create-entity-name-input').fill('Test Book');

            // Error should disappear
            await expect(page.getByText(/name is required/i)).not.toBeVisible();
        });
    });

    test.describe('Save & Edit Flow', () => {

        test('should create entity and navigate to detail page', async ({ page }) => {
            await page.goto('/book/create');
            await waitForPageLoad(page);

            const uniqueName = `E2E Test Book ${Date.now()}`;
            const description = 'Test description for E2E';

            // Fill in the form
            await page.getByTestId('create-entity-name-input').fill(uniqueName);
            await page.getByTestId('create-entity-description-input').fill(description);

            // Click Save & Edit
            await page.getByTestId('create-entity-save-and-edit-btn').click();

            // Wait for success toast
            await waitForToast(page, 'created successfully');

            // Should navigate to detail page
            await expect(page).toHaveURL(/\/book\/[a-f0-9-]+$/);

            // Entity name should be visible in header
            await expect(page.getByRole('heading', { name: uniqueName })).toBeVisible();
        });
    });

    test.describe('Save & Create New Flow', () => {

        test('should create entity and reset form', async ({ page }) => {
            await page.goto('/book/create');
            await waitForPageLoad(page);

            const uniqueName = `E2E Test Book New ${Date.now()}`;

            // Fill in the form
            await page.getByTestId('create-entity-name-input').fill(uniqueName);
            await page.getByTestId('create-entity-description-input').fill('Test description');

            // Click Save & Create New
            await page.getByTestId('create-entity-save-and-new-btn').click();

            // Wait for success toast
            await waitForToast(page, 'created successfully');

            // Should stay on create page
            await expect(page).toHaveURL(/\/book\/create/);

            // Form should be reset
            await expect(page.getByTestId('create-entity-name-input')).toHaveValue('');
            await expect(page.getByTestId('create-entity-description-input')).toHaveValue('');
        });

        test('should be able to create multiple entities in succession', async ({ page }) => {
            await page.goto('/book/create');
            await waitForPageLoad(page);

            // Create first entity
            await page.getByTestId('create-entity-name-input').fill(`Multi Test Book 1 ${Date.now()}`);
            await page.getByTestId('create-entity-save-and-new-btn').click();
            await waitForToast(page, 'created successfully');

            // Create second entity (form should be reset)
            await page.getByTestId('create-entity-name-input').fill(`Multi Test Book 2 ${Date.now()}`);
            await page.getByTestId('create-entity-save-and-new-btn').click();
            await waitForToast(page, 'created successfully');

            // Should still be on create page with empty form
            await expect(page).toHaveURL(/\/book\/create/);
            await expect(page.getByTestId('create-entity-name-input')).toHaveValue('');
        });
    });

    test.describe('Different Entity Types', () => {

        test('should work for Author entity', async ({ page }) => {
            await page.goto('/author/create');
            await waitForPageLoad(page);

            // Should show Author in the heading
            await expect(page.getByRole('heading', { name: /create.*author/i })).toBeVisible();

            const uniqueName = `E2E Test Author ${Date.now()}`;

            // Fill and save
            await page.getByTestId('create-entity-name-input').fill(uniqueName);
            await page.getByTestId('create-entity-save-and-edit-btn').click();

            await waitForToast(page, 'created successfully');
            await expect(page).toHaveURL(/\/author\/[a-f0-9-]+$/);
        });
    });

    test.describe('Cancel and Back Navigation', () => {

        test('should navigate back to browse page via Cancel', async ({ page }) => {
            // Navigate through /book first to establish browser history
            // since Cancel uses navigate(-1) which requires history
            await page.goto('/book');
            await waitForPageLoad(page);

            // Click Create to go to /book/create
            await page.getByTestId('create-entity-btn').click();
            await waitForPageLoad(page);

            // Click Cancel (button that navigates back)
            await page.getByRole('button', { name: /cancel/i }).click();

            // Should be back on browse page
            await expect(page).toHaveURL(/\/book$/);
        });

        test('should navigate back to browse page via back arrow', async ({ page }) => {
            await page.goto('/book/create');
            await waitForPageLoad(page);

            // Click back arrow (first link in header area pointing to entityType)
            await page.locator('a[href="/book"]').first().click();

            // Should be back on browse page
            await expect(page).toHaveURL(/\/book$/);
        });
    });
});
