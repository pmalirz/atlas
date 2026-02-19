import { test, expect } from '@playwright/test';
import { waitForPageLoad, navigateToEntity, selectFirstEntity, waitForToast, loginTestUser } from './utils/test-helpers';

/**
 * UI Smoke Tests
 * 
 * Verifies the application loads and major features work correctly.
 * These tests run against E2E seed data (Book, Author entities).
 * 
 * Known test data from E2E seed:
 * - Books: "Clean Code", "The Pragmatic Programmer", "Wzorce Projektowe", "Test Book Without Author"
 * - Authors: "Robert C. Martin", "David Thomas", "Andrew Hunt", "Test Author Inactive"
 */

test.describe('Application Smoke Tests', () => {

    // Login before each test (each test has its own browser context)
    test.beforeEach(async ({ page }) => {
        await loginTestUser(page);
    });

    test.describe('App Launch & Navigation', () => {

        test('should load the application without errors', async ({ page }) => {
            // Collect console errors
            const consoleErrors: string[] = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            await page.goto('/');
            await waitForPageLoad(page);

            // Verify page loaded
            await expect(page).toHaveTitle(/Atlas/i);

            // No critical console errors (ignore some common dev warnings)
            const criticalErrors = consoleErrors.filter(e =>
                !e.includes('DevTools') &&
                !e.includes('React DevTools')
            );
            expect(criticalErrors).toHaveLength(0);
        });

        test('should display sidebar navigation', async ({ page }) => {
            await page.goto('/');
            await waitForPageLoad(page);

            // Sidebar should be visible
            const sidebar = page.locator('aside, [data-testid="sidebar"]').first();
            await expect(sidebar).toBeVisible();

            // Should have navigation items
            const navItems = page.locator('nav a, aside a');
            await expect(navItems.first()).toBeVisible();
        });

        test('should navigate to Books page', async ({ page }) => {
            await page.goto('/');
            await waitForPageLoad(page);

            await navigateToEntity(page, 'Books');

            // Verify we're on the books page
            await expect(page).toHaveURL(/\/book/);
            await expect(page.getByRole('heading', { name: /Books/i })).toBeVisible();
        });

        test('should navigate to Authors page', async ({ page }) => {
            await page.goto('/');
            await waitForPageLoad(page);

            await navigateToEntity(page, 'Authors');

            // Verify we're on the authors page
            await expect(page).toHaveURL(/\/author/);
            await expect(page.getByRole('heading', { name: /Authors/i })).toBeVisible();
        });
    });

    test.describe('Entity Listing (Browse Page)', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto('/book');
            await waitForPageLoad(page);
        });

        test('should display book list with data', async ({ page }) => {
            // Either tiles or table rows should be visible
            // Using hierarchical data-testid pattern: tile-{entityType}-{uuid}
            const tiles = page.locator('[data-testid^="tile-"]');
            const tableRows = page.locator('[data-testid^="row-"]');

            // Wait for at least one item to be visible
            await expect(tiles.first().or(tableRows.first())).toBeVisible();
        });

        test('should display known book from seed - Clean Code', async ({ page }) => {
            // Look for Clean Code book in the list
            const cleanCodeTile = page.locator('[data-testid^="tile-"]', { hasText: 'Clean Code' });
            const cleanCodeRow = page.locator('[data-testid^="row-"]', { hasText: 'Clean Code' });

            await expect(cleanCodeTile.or(cleanCodeRow)).toBeVisible();
        });

        test('should toggle between tile and table views', async ({ page }) => {
            // Find view toggle buttons
            const tileButton = page.getByRole('button', { name: /tile/i });
            const tableButton = page.getByRole('button', { name: /table/i });

            // If toggles exist, test them
            if (await tileButton.isVisible()) {
                // Switch to table view
                await tableButton.click();
                await expect(page.locator('table')).toBeVisible();

                // Switch back to tile view
                await tileButton.click();
                await expect(page.locator('table')).not.toBeVisible();
            }
        });

        test('should show Create button', async ({ page }) => {
            // Create button uses Button asChild with Link, so it's rendered as a link
            const createButton = page.getByTestId('create-entity-btn');
            await expect(createButton).toBeVisible();
        });
    });

    test.describe('Entity Details Page', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto('/book');
            await waitForPageLoad(page);
            await selectFirstEntity(page);
        });

        test('should display book details', async ({ page }) => {
            // Should be on a detail page URL
            await expect(page).toHaveURL(/\/book\/[a-f0-9-]+/);

            // Entity name should be visible in header
            const header = page.getByRole('heading').first();
            await expect(header).toBeVisible();

            // Back button should exist
            const backButton = page.getByRole('link', { name: /back/i }).or(
                page.locator('a[href="/book"]')
            );
            await expect(backButton.first()).toBeVisible();
        });

        test('should display sections', async ({ page }) => {
            // Look for common section titles
            const sections = page.locator('section, [class*="card"], [class*="Card"]');
            await expect(sections.first()).toBeVisible();
        });

        test('should display Basic Information section', async ({ page }) => {
            // Basic section from E2E UI config
            const basicSection = page.locator('[data-testid="section-basic"]').or(
                page.locator('text=Basic Information')
            );
            await expect(basicSection.first()).toBeVisible();
        });

        test('should display Classification section', async ({ page }) => {
            // Classification section from E2E UI config
            const classificationSection = page.locator('[data-testid="section-classification"]').or(
                page.locator('text=Classification')
            );
            await expect(classificationSection.first()).toBeVisible();
        });
    });

    test.describe('Field Interactions', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto('/book');
            await waitForPageLoad(page);
            await selectFirstEntity(page);
        });

        test('should edit a text field', async ({ page }) => {
            // Find a text input field (e.g., description)
            const textField = page.locator('textarea, input[type="text"]').first();

            if (await textField.isVisible()) {
                // Clear and type new value
                const testValue = `Test edit ${Date.now()}`;
                await textField.fill(testValue);
                await textField.blur();

                // Wait for save confirmation
                await waitForToast(page);
            }
        });

        test('should edit a genre enum/select field', async ({ page }) => {
            // Find a select/dropdown trigger - these may not exist on all entity types
            const selectTrigger = page.locator('[role="combobox"]').first();

            // Skip if no select field exists on this entity
            const hasSelect = await selectTrigger.count() > 0;
            test.skip(!hasSelect, 'No select/enum field found on this entity');

            await selectTrigger.click();

            // Select a different option 
            const option = page.locator('[role="option"]').first();
            await expect(option).toBeVisible({ timeout: 3000 });
            await option.click();

            // Verify dropdown closed (interaction completed)
            await expect(option).not.toBeVisible({ timeout: 3000 });
        });

        test('should interact with date field', async ({ page }) => {
            // Find a date picker trigger
            const dateField = page.locator('button:has-text("Pick a date")').first();

            // Skip if no date field exists
            const hasDateField = await dateField.count() > 0;
            test.skip(!hasDateField, 'No date picker field found on this entity');

            await dateField.click();

            // Look for calendar popup
            const calendar = page.locator('[role="dialog"]').first();
            await expect(calendar).toBeVisible({ timeout: 3000 });

            // Just verify the calendar opened - don't try to select a date
            // as this can be flaky depending on calendar implementation
        });

        test('should display relation panel for authors', async ({ page }) => {
            // Scroll to bottom to ensure all content is loaded
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

            // Wait a moment for any lazy-loaded content
            await page.waitForTimeout(500);

            // Look for Authors section from E2E UI config
            const authorsSection = page.locator('[data-testid="section-authors"]').or(
                page.locator('text=Authors')
            );
            await expect(authorsSection.first()).toBeVisible();
        });
    });

    test.describe('Author Entity Details', () => {

        test.beforeEach(async ({ page }) => {
            await page.goto('/author');
            await waitForPageLoad(page);
            await selectFirstEntity(page);
        });

        test('should display author details', async ({ page }) => {
            await expect(page).toHaveURL(/\/author\/[a-f0-9-]+/);

            const header = page.getByRole('heading').first();
            await expect(header).toBeVisible();
        });

        test('should display author specializations (array field)', async ({ page }) => {
            // Look for specializations field from E2E UI config
            const expertiseSection = page.locator('[data-testid="section-expertise"]').or(
                page.locator('text=Expertise')
            );
            await expect(expertiseSection.first()).toBeVisible();
        });

        test('should display books relation for author', async ({ page }) => {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(500);

            // Look for Books section in author details
            const booksSection = page.locator('[data-testid="section-books"]').or(
                page.locator('text=Books')
            );
            await expect(booksSection.first()).toBeVisible();
        });
    });

    test.describe('Data Persistence', () => {

        test('should persist changes after page refresh', async ({ page }) => {
            await page.goto('/book');
            await waitForPageLoad(page);
            await selectFirstEntity(page);

            // Get current URL to return to
            const detailUrl = page.url();

            // Find and edit a text field
            const textField = page.locator('textarea').first();

            if (await textField.isVisible()) {
                const testValue = `Persistence test ${Date.now()}`;
                await textField.fill(testValue);
                await textField.blur();

                // Wait for save
                await waitForToast(page);

                // Reload page
                await page.reload();
                await waitForPageLoad(page);

                // Verify value persisted
                await expect(textField).toHaveValue(testValue);
            }
        });
    });
});
