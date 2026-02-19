/**
 * Authentication Flow E2E Tests
 * 
 * Tests the complete authentication flows including:
 * - Registration with email verification
 * - Forgot password and password reset
 * - Login with new password
 */

import { test, expect } from '@playwright/test';
import {
    getLatestEmailTo,
    extractVerificationUrl,
    extractPasswordResetUrl,
    deleteAllEmails,
} from '../utils/email-helper';

// Generate unique email for each test run to avoid conflicts
const generateTestEmail = () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;

test.describe('Authentication Flows', () => {
    test.beforeEach(async () => {
        // Clean up emails before each test
        await deleteAllEmails().catch(() => { }); // Ignore if mailpit not available
    });

    test.describe('Registration and Email Verification', () => {
        test('should register a new user and receive verification email', async ({ page }) => {
            const testEmail = generateTestEmail();
            const testPassword = 'SecurePassword123!';
            const testName = 'Test User';

            // 1. Navigate to login page
            await page.goto('/login');
            await expect(page.getByTestId('auth-card')).toBeVisible();

            // 2. Switch to register mode
            await page.getByTestId('register-tab').click();

            // 3. Fill registration form
            await page.getByTestId('register-name-input').fill(testName);
            await page.getByTestId('auth-email-input').fill(testEmail);
            await page.getByTestId('auth-password-input').fill(testPassword);

            // 4. Submit registration
            await page.getByTestId('auth-submit-btn').click();

            // 5. Should be redirected to dashboard after successful registration
            await expect(page).toHaveURL('/');

            // 6. Wait for and verify the verification email was sent
            const email = await getLatestEmailTo(testEmail, { timeoutMs: 15000 });
            expect(email.Subject).toContain('Verify');
            expect(email.HTML).toContain('verify-email');

            // 7. Extract verification URL
            const verifyUrl = extractVerificationUrl(email.HTML);
            expect(verifyUrl).toBeTruthy();
        });

        test('should verify email using link from email', async ({ page }) => {
            const testEmail = generateTestEmail();
            const testPassword = 'SecurePassword123!';

            // 1. Register a new user
            await page.goto('/login');
            await page.getByTestId('register-tab').click();
            await page.getByTestId('register-name-input').fill('Verify Test User');
            await page.getByTestId('auth-email-input').fill(testEmail);
            await page.getByTestId('auth-password-input').fill(testPassword);
            await page.getByTestId('auth-submit-btn').click();

            // Wait for redirect to dashboard
            await expect(page).toHaveURL('/');

            // 2. Get verification email
            const email = await getLatestEmailTo(testEmail, { timeoutMs: 15000 });
            const verifyUrl = extractVerificationUrl(email.HTML);
            expect(verifyUrl).toBeTruthy();

            // 3. Visit the verification URL
            await page.goto(verifyUrl!);

            // 4. Should see success message
            await expect(page.getByText('Email Verified!')).toBeVisible({ timeout: 10000 });

            // 5. Click continue button
            await page.getByTestId('verify-email-continue-btn').click();

            // 6. Should be on homepage
            await expect(page).toHaveURL('/');
        });
    });

    test.describe('Password Reset Flow', () => {
        // Create a user before testing password reset
        let testEmail: string;
        const originalPassword = 'OriginalPassword123!';
        const newPassword = 'NewSecurePassword456!';

        test.beforeEach(async ({ page }) => {
            testEmail = generateTestEmail();

            // Register a user first
            await page.goto('/login');
            await page.getByTestId('register-tab').click();
            await page.getByTestId('register-name-input').fill('Reset Test User');
            await page.getByTestId('auth-email-input').fill(testEmail);
            await page.getByTestId('auth-password-input').fill(originalPassword);
            await page.getByTestId('auth-submit-btn').click();

            // Wait for registration to complete
            await expect(page).toHaveURL('/');

            // Logout
            await page.goto('/login'); // This might trigger logout if session exists
        });

        test('should request password reset and receive email', async ({ page }) => {
            // 1. Navigate to forgot password page
            await page.goto('/login');
            await page.getByTestId('forgot-password-link').click();
            await expect(page).toHaveURL('/forgot-password');

            // 2. Enter email and submit
            await page.getByTestId('forgot-password-email-input').fill(testEmail);
            await page.getByTestId('forgot-password-submit-btn').click();

            // 3. Should see success message
            await expect(page.getByText('Check Your Email')).toBeVisible({ timeout: 10000 });

            // 4. Verify email was received
            const email = await getLatestEmailTo(testEmail, { timeoutMs: 15000 });
            expect(email.Subject).toContain('Reset');
            expect(email.HTML).toContain('reset-password');

            // 5. Extract reset URL
            const resetUrl = extractPasswordResetUrl(email.HTML);
            expect(resetUrl).toBeTruthy();
        });

        test('should reset password using link from email', async ({ page }) => {
            // 1. Request password reset
            await page.goto('/forgot-password');
            await page.getByTestId('forgot-password-email-input').fill(testEmail);
            await page.getByTestId('forgot-password-submit-btn').click();
            await expect(page.getByText('Check Your Email')).toBeVisible({ timeout: 10000 });

            // 2. Get reset email
            const email = await getLatestEmailTo(testEmail, { timeoutMs: 15000 });
            const resetUrl = extractPasswordResetUrl(email.HTML);
            expect(resetUrl).toBeTruthy();

            // 3. Visit reset URL
            await page.goto(resetUrl!);
            await expect(page.getByTestId('reset-password-card')).toBeVisible();

            // 4. Enter new password
            await page.getByTestId('reset-password-new-input').fill(newPassword);
            await page.getByTestId('reset-password-confirm-input').fill(newPassword);
            await page.getByTestId('reset-password-submit-btn').click();

            // 5. Should see success message
            await expect(page.getByText('Password Reset!')).toBeVisible({ timeout: 10000 });

            // 6. Click go to login
            await page.getByTestId('reset-password-login-btn').click();
            await expect(page).toHaveURL('/login');
        });

        test('should login with new password after reset', async ({ page }) => {
            // 1. Reset password first
            await page.goto('/forgot-password');
            await page.getByTestId('forgot-password-email-input').fill(testEmail);
            await page.getByTestId('forgot-password-submit-btn').click();
            await expect(page.getByText('Check Your Email')).toBeVisible({ timeout: 10000 });

            const email = await getLatestEmailTo(testEmail, { timeoutMs: 15000 });
            const resetUrl = extractPasswordResetUrl(email.HTML);
            await page.goto(resetUrl!);

            await page.getByTestId('reset-password-new-input').fill(newPassword);
            await page.getByTestId('reset-password-confirm-input').fill(newPassword);
            await page.getByTestId('reset-password-submit-btn').click();
            await expect(page.getByText('Password Reset!')).toBeVisible({ timeout: 10000 });

            // 2. Now try to login with new password
            await page.goto('/login');

            await page.getByTestId('auth-email-input').fill(testEmail);
            await page.getByTestId('auth-password-input').fill(newPassword);
            await page.getByTestId('auth-submit-btn').click();

            // 3. Should be redirected to dashboard
            await expect(page).toHaveURL('/');
        });
    });

    test.describe('Login Validation', () => {
        test('should show error for invalid credentials', async ({ page }) => {
            await page.goto('/login');

            await page.getByTestId('auth-email-input').fill('nonexistent@example.com');
            await page.getByTestId('auth-password-input').fill('wrongpassword123');
            await page.getByTestId('auth-submit-btn').click();

            // Should show error message
            await expect(page.getByTestId('auth-error')).toBeVisible({ timeout: 5000 });
        });

        test('should navigate to forgot password from login page', async ({ page }) => {
            await page.goto('/login');

            await page.getByTestId('forgot-password-link').click();

            await expect(page).toHaveURL('/forgot-password');
            await expect(page.getByTestId('forgot-password-card')).toBeVisible();
        });
    });
});
