/**
 * Email Provider Interface
 * 
 * Abstract interface for email providers to allow pluggable implementations.
 * Default implementation: NodemailerProvider
 * Future options: SendGrid, Resend, AWS SES, etc.
 */

export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export interface IEmailProvider {
    /**
     * Send an email
     */
    sendEmail(options: EmailOptions): Promise<void>;

    /**
     * Check if the provider is configured and ready
     */
    isConfigured(): boolean;
}

export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
