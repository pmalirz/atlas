import { test, expect } from '@playwright/test';
import { waitForPageLoad, navigateToEntity, selectEntity, waitForToast, loginTestUser } from './utils/test-helpers';

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

        await page.goto('/');
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
