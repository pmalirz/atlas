import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { IEmailProvider, EmailOptions } from './email-provider.interface';

/**
 * Nodemailer Email Provider
 * 
 * Default email provider using Nodemailer with SMTP.
 * Configuration via environment variables:
 * - SMTP_HOST: SMTP server hostname
 * - SMTP_PORT: SMTP server port (default: 587)
 * - SMTP_SECURE: Use TLS (default: false for port 587)
 * - SMTP_USER: SMTP username
 * - SMTP_PASS: SMTP password
 * - SMTP_FROM: Default from address
 */
@Injectable()
export class NodemailerProvider implements IEmailProvider {
    private readonly logger = new Logger(NodemailerProvider.name);
    private transporter: Transporter | null = null;
    private readonly fromAddress: string;
    private readonly configured: boolean;

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('SMTP_HOST');
        const port = this.configService.get<number>('SMTP_PORT', 587);
        // Parse SMTP_SECURE as string since env vars are strings
        const secureStr = this.configService.get<string>('SMTP_SECURE', 'false');
        const secure = secureStr === 'true' || secureStr === '1';
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');
        this.fromAddress = this.configService.get<string>('SMTP_FROM', 'noreply@atlas.local');

        // Only configure if SMTP_HOST is set
        if (host) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: user && pass ? { user, pass } : undefined,
            });
            this.configured = true;
            this.logger.log(`Email provider configured with SMTP: ${host}:${port}`);
        } else {
            this.configured = false;
            this.logger.warn('Email provider not configured - SMTP_HOST not set. Email features will be disabled.');
        }
    }

    isConfigured(): boolean {
        return this.configured;
    }

    async sendEmail(options: EmailOptions): Promise<void> {
        if (!this.transporter) {
            this.logger.warn(`Email not sent (provider not configured): ${options.subject} -> ${options.to}`);
            // In development, log the email instead of failing
            if (this.configService.get<string>('NODE_ENV') !== 'production') {
                this.logger.debug(`[DEV] Email content: ${options.text || options.html}`);
            }
            return;
        }

        try {
            await this.transporter.sendMail({
                from: this.fromAddress,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            });
            this.logger.log(`Email sent: ${options.subject} -> ${options.to}`);
        } catch (error) {
            this.logger.error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
        }
    }
}
