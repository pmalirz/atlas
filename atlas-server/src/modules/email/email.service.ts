import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_PROVIDER, type IEmailProvider } from './providers';

/**
 * Email Service
 *
 * High-level service for sending application emails.
 * Uses the injected email provider for actual sending.
 */
@Injectable()
export class EmailService {
    private readonly appName: string;
    private readonly appUrl: string;

    constructor(
        @Inject(EMAIL_PROVIDER) private readonly emailProvider: IEmailProvider,
        private readonly configService: ConfigService,
    ) {
        this.appName = this.configService.get<string>('APP_NAME', 'Atlas');
        this.appUrl = this.configService.get<string>('APP_URL', 'http://localhost:5173');
    }

    /**
     * Check if email service is configured
     */
    isConfigured(): boolean {
        return this.emailProvider.isConfigured();
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email: string, token: string): Promise<void> {
        const resetUrl = `${this.appUrl}/reset-password?token=${token}`;
        const template = this.getPasswordResetTemplate(resetUrl);

        await this.emailProvider.sendEmail({
            to: email,
            subject: `Reset your ${this.appName} password`,
            text: template.text,
            html: template.html,
        });
    }

    /**
     * Send email verification email
     */
    async sendVerificationEmail(email: string, token: string): Promise<void> {
        const verifyUrl = `${this.appUrl}/verify-email?token=${token}`;
        const template = this.getVerificationTemplate(verifyUrl);

        await this.emailProvider.sendEmail({
            to: email,
            subject: `Verify your ${this.appName} email`,
            text: template.text,
            html: template.html,
        });
    }

    private getPasswordResetTemplate(resetUrl: string): { text: string; html: string } {
        return {
            text: `
Hello,

You requested to reset your password for ${this.appName}.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

Best regards,
The ${this.appName} Team
            `.trim(),
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Reset Your Password</h1>
        <p>Hello,</p>
        <p>You requested to reset your password for <strong>${this.appName}</strong>.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" class="button">Reset Password</a>
        <p>Or copy this link: <code>${resetUrl}</code></p>
        <p><em>This link will expire in 1 hour.</em></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <div class="footer">
            <p>Best regards,<br>The ${this.appName} Team</p>
        </div>
    </div>
</body>
</html>
            `.trim(),
        };
    }

    private getVerificationTemplate(verifyUrl: string): { text: string; html: string } {
        return {
            text: `
Hello,

Thank you for registering with ${this.appName}!

Please verify your email address by clicking the link below:
${verifyUrl}

This link will expire in 24 hours.

Best regards,
The ${this.appName} Team
            `.trim(),
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Verify Your Email</h1>
        <p>Hello,</p>
        <p>Thank you for registering with <strong>${this.appName}</strong>!</p>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" class="button">Verify Email</a>
        <p>Or copy this link: <code>${verifyUrl}</code></p>
        <p><em>This link will expire in 24 hours.</em></p>
        <div class="footer">
            <p>Best regards,<br>The ${this.appName} Team</p>
        </div>
    </div>
</body>
</html>
            `.trim(),
        };
    }
}
