/**
 * Email Helper for E2E Tests
 * 
 * Uses Mailpit API to read emails sent during tests.
 * Mailpit runs as a local SMTP server that captures all outgoing emails.
 */

import { request } from '@playwright/test';

// Mailpit API URL - different for Docker vs local dev
const MAILPIT_API_URL = process.env.MAILPIT_API_URL || 'http://localhost:8025/api/v1';

interface MailpitMessage {
    ID: string;
    MessageID: string;
    From: { Name: string; Address: string };
    To: Array<{ Name: string; Address: string }>;
    Subject: string;
    Created: string;
}

interface MailpitMessageDetail {
    ID: string;
    MessageID: string;
    From: { Name: string; Address: string };
    To: Array<{ Name: string; Address: string }>;
    Subject: string;
    Text: string;
    HTML: string;
}

/**
 * Wait for and get the latest email sent to a specific address
 */
export async function getLatestEmailTo(
    recipientEmail: string,
    options: { timeoutMs?: number; pollIntervalMs?: number } = {}
): Promise<MailpitMessageDetail> {
    const { timeoutMs = 10000, pollIntervalMs = 500 } = options;
    const startTime = Date.now();

    console.log(`[EmailHelper] Looking for email to: ${recipientEmail}`);
    console.log(`[EmailHelper] Mailpit API URL: ${MAILPIT_API_URL}`);

    const apiContext = await request.newContext();

    while (Date.now() - startTime < timeoutMs) {
        try {
            // Get list of messages - use full URL
            const response = await apiContext.get(`${MAILPIT_API_URL}/messages`);

            if (!response.ok()) {
                console.log(`[EmailHelper] API response not OK: ${response.status()} for URL: ${MAILPIT_API_URL}/messages`);
                await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
                continue;
            }

            const data = await response.json();
            console.log(`[EmailHelper] API response:`, JSON.stringify(data, null, 2).substring(0, 500));

            const messages: MailpitMessage[] = data.messages || [];
            console.log(`[EmailHelper] Found ${messages.length} total messages`);

            if (messages.length > 0) {
                console.log(`[EmailHelper] First message To:`, messages[0].To);
            }

            // Find email to the recipient
            const email = messages.find((msg) =>
                msg.To?.some((to) => to.Address.toLowerCase() === recipientEmail.toLowerCase())
            );

            if (email) {
                console.log(`[EmailHelper] Found matching email with ID: ${email.ID}`);
                // Get full message content
                const detailResponse = await apiContext.get(`${MAILPIT_API_URL}/message/${email.ID}`);
                const emailDetail: MailpitMessageDetail = await detailResponse.json();
                await apiContext.dispose();
                return emailDetail;
            } else {
                console.log(`[EmailHelper] No email matching ${recipientEmail} yet...`);
            }
        } catch (error) {
            // Mailpit might not be ready yet, continue polling
            console.log(`[EmailHelper] Error fetching emails:`, error);
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    await apiContext.dispose();
    throw new Error(`No email found for ${recipientEmail} after ${timeoutMs}ms`);
}

/**
 * Extract a URL/link from email HTML content
 */
export function extractLinkFromEmail(htmlContent: string, linkPattern: RegExp): string | null {
    const match = htmlContent.match(linkPattern);
    return match ? match[1] : null;
}

/**
 * Extract verification token from email
 */
export function extractVerificationToken(htmlContent: string): string | null {
    // Match: href="http://localhost:8081/verify-email?token=abc123"
    const linkPattern = /href="[^"]*\/verify-email\?token=([^"&]+)"/;
    const match = htmlContent.match(linkPattern);
    return match ? match[1] : null;
}

/**
 * Extract password reset token from email
 */
export function extractPasswordResetToken(htmlContent: string): string | null {
    // Match: href="http://localhost:8081/reset-password?token=abc123"
    const linkPattern = /href="[^"]*\/reset-password\?token=([^"&]+)"/;
    const match = htmlContent.match(linkPattern);
    return match ? match[1] : null;
}

/**
 * Extract full URL from email (for clicking in browser)
 * Returns just the path portion (e.g., /verify-email?token=...) for Playwright compatibility
 */
export function extractVerificationUrl(htmlContent: string): string | null {
    const linkPattern = /href="[^"]*?(\/verify-email\?token=[^"]+)"/;
    const match = htmlContent.match(linkPattern);
    return match ? match[1] : null;
}

export function extractPasswordResetUrl(htmlContent: string): string | null {
    const linkPattern = /href="[^"]*?(\/reset-password\?token=[^"]+)"/;
    const match = htmlContent.match(linkPattern);
    return match ? match[1] : null;
}

/**
 * Delete all emails in Mailpit (useful for test cleanup)
 */
export async function deleteAllEmails(): Promise<void> {
    const apiContext = await request.newContext();
    try {
        await apiContext.delete(`${MAILPIT_API_URL}/messages`);
    } catch (error) {
        // Ignore errors - mailpit might not be running
    }
    await apiContext.dispose();
}
