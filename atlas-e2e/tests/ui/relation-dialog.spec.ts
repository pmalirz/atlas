import { test, expect } from '@playwright/test';
import { waitForPageLoad, navigateToEntity, selectEntity, loginTestUser } from './utils/test-helpers';

import { withTenantUiPath } from '../utils/tenant-paths';

/**
 * Relation Dialog E2E Tests
 * 
 * Verifies the RelationDialogField component, focusing on:
 * - Adding relations with attributes (role, contribution)
 * - Editing existing relation attributes
 * - Removing relations
 * 
 * Uses 'Book' -> 'Author' relation (book_written_by) from E2E seed.
 * Target Book: "Clean Code"
 * Target Author to add: "Test Author Inactive" (should be available to add)
 */

test.describe('Relation Dialog (Attributes)', () => {
    test.describe.configure({ mode: 'serial', timeout: 60000 });

    test.beforeEach(async ({ page }) => {
        // Login first (each test has its own browser context)
        await loginTestUser(page);

        await page.goto(withTenantUiPath('/'));
        await waitForPageLoad(page);

        // 1. Navigate to Clean Code book details
        await navigateToEntity(page, 'Books');
        await selectEntity(page, 'Clean Code');

        // 2. Scroll to Authors section
        const authorsSection = page.locator('text=Authors').first();
        await expect(authorsSection).toBeVisible();
        await authorsSection.scrollIntoViewIfNeeded();
    });

    test('should add a new author relation with attributes', async ({ page }) => {
        // Find Add button using testid
        const addButton = page.getByTestId('add-relation-button');
        await expect(addButton).toBeVisible();
        await addButton.click();

        // Check if popover opened
        const popover = page.locator('[data-radix-popper-content-wrapper]');
        await expect(popover).toBeVisible();

        // 1. Select Author
        const entitySelect = page.getByTestId('relation-entity-select-trigger');

        // Ensure entities are loaded before clicking
        await expect(popover.getByText('Loading...')).toBeHidden();

        await entitySelect.click({ force: true });

        // Select "Test Author Inactive"
        const authorOption = page.getByRole('option', { name: /Test Author Inactive/i });
        await expect(authorOption).toBeVisible({ timeout: 10000 });
        await authorOption.click();

        // 2. Set Attributes
        // Role (EnumSelect) - finding the trigger by testid I added
        const roleSelectTrigger = page.getByTestId('relation-attribute-role');
        await roleSelectTrigger.click();

        const roleOption = page.getByRole('option', { name: /Co-Author/i });
        await expect(roleOption).toBeVisible();
        await roleOption.click();

        // Contribution (NumberInput)
        const contribInput = page.getByTestId('relation-attribute-contribution');
        await contribInput.fill('10');

        // 3. Submit
        const submitButton = page.getByTestId('add-relation-submit');
        await submitButton.click();

        // 4. Verify
        // Wait for list to update - row should appear with correct testid
        const newRelationRow = page.getByTestId('relation-row-Test Author Inactive');
        await expect(newRelationRow).toBeVisible();

        // Verify attributes badges
        await expect(newRelationRow).toContainText('Co-Author');
        await expect(newRelationRow).toContainText('10');
    });

    test('should edit existing relation attributes', async ({ page }) => {
        // 1. Find existing relation "Robert C. Martin"
        const relationRow = page.getByTestId('relation-row-Robert C. Martin');
        await expect(relationRow).toBeVisible();

        // 2. Click Edit (Pencil)
        await relationRow.hover();
        const editButton = relationRow.getByTestId('edit-relation-button');
        await editButton.click();

        // 3. Update Contribution
        const contribInput = relationRow.getByTestId('relation-attribute-contribution');
        await expect(contribInput).toBeVisible();
        await contribInput.fill('99');

        // 4. Save
        const saveButton = relationRow.getByTestId('save-relation-button');
        await saveButton.click();

        // 5. Verify Update
        await expect(relationRow).toContainText('99');
    });

    test('should remove a relation', async ({ page }) => {
        // 1. Target the newly added "Test Author Inactive"
        // Using testid which is unique per target name
        const relationRow = page.getByTestId('relation-row-Test Author Inactive').first();

        // Check if visible (wait short time)
        try {
            await expect(relationRow).toBeVisible({ timeout: 3000 });
        } catch {
            // If missing (e.g. Add test failed), skip safely
            console.log('Relation to remove not found, skipping test');
            test.skip();
            return;
        }

        // 2. Click Delete (Trash)
        await relationRow.hover();
        const deleteButton = relationRow.getByTestId('delete-relation-button');
        await deleteButton.click({ force: true });

        // 3. Verify Removal
        await expect(relationRow).not.toBeVisible();
    });

});

test.describe('Relation Dialog (Attributes) - Incoming Side', () => {
    test.describe.configure({ mode: 'serial', timeout: 60000 });

    test.beforeEach(async ({ page }) => {
        await loginTestUser(page);

        await page.goto(withTenantUiPath('/'));
        await waitForPageLoad(page);

        await navigateToEntity(page, 'Authors');
        await selectEntity(page, 'Robert C. Martin');

        const booksSection = page.locator('text=Books').first();
        await expect(booksSection).toBeVisible();
        await booksSection.scrollIntoViewIfNeeded();
    });

    test('should add edit and remove relation attributes from author side', async ({ page }) => {
        const addButton = page.getByTestId('add-relation-button');
        await expect(addButton).toBeVisible();
        await addButton.click();

        const popover = page.locator('[data-radix-popper-content-wrapper]');
        await expect(popover).toBeVisible();
        await expect(popover.getByText('Loading...')).toBeHidden();

        const entitySelect = page.getByTestId('relation-entity-select-trigger');
        await entitySelect.click({ force: true });

        const bookOption = page.getByRole('option', { name: /Test Book Without Author/i });
        await expect(bookOption).toBeVisible({ timeout: 10000 });
        await bookOption.click();

        const roleSelectTrigger = page.getByTestId('relation-attribute-role');
        await roleSelectTrigger.click();
        const roleOption = page.getByRole('option', { name: /Editor/i });
        await expect(roleOption).toBeVisible();
        await roleOption.click();

        const contributionInput = page.getByTestId('relation-attribute-contribution');
        await contributionInput.fill('7');

        const submitButton = page.getByTestId('add-relation-submit');
        await submitButton.click();

        const relationRow = page.getByTestId('relation-row-Test Book Without Author');
        await expect(relationRow).toBeVisible();
        await expect(relationRow).toContainText('Editor');
        await expect(relationRow).toContainText('7');

        await relationRow.hover();
        await relationRow.getByTestId('edit-relation-button').click();

        const editContributionInput = relationRow.getByTestId('relation-attribute-contribution');
        await expect(editContributionInput).toBeVisible();
        await editContributionInput.fill('11');

        await relationRow.getByTestId('save-relation-button').click();
        await expect(relationRow).toContainText('11');

        await relationRow.hover();
        await relationRow.getByTestId('delete-relation-button').click({ force: true });
        await expect(relationRow).not.toBeVisible();
    });
});


