import { Injectable, Inject, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import type { AuthUser, LoginRequest, RegisterRequest, AuthResponse, AuthConfig, AuthProvider } from '@app-atlas/shared';
import { AUTH_PROVIDER, DEFAULT_TENANT_ID } from './constants';
import type { IAuthProvider } from './providers/auth-provider.interface';
import { PrismaService } from '../../database';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @Inject(AUTH_PROVIDER) private readonly authProvider: IAuthProvider,
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
    ) { }

    /**
     * Login with credentials (native provider)
     */
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        if (!this.authProvider.login) {
            throw new BadRequestException('Login not supported for this auth provider');
        }
        return this.authProvider.login(credentials);
    }

    /**
     * Register a new user (native provider)
     */
    async register(data: RegisterRequest): Promise<AuthResponse> {
        if (!this.authProvider.register) {
            throw new BadRequestException('Registration not supported for this auth provider');
        }
        const response = await this.authProvider.register(data);

        // Send verification email after registration
        try {
            await this.sendVerificationEmail(response.user.id);
        } catch (error) {
            // Log but don't fail registration if email fails
            this.logger.warn(`Failed to send verification email for user ${response.user.id}: ${error}`);
        }

        return response;
    }

    /**
     * Validate token and return user
     */
    async validateToken(token: string): Promise<AuthUser | null> {
        return this.authProvider.validateToken(token);
    }

    /**
     * Get current user by ID
     */
    async getCurrentUser(userId: string): Promise<AuthUser | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return null;
        }

        return {
            id: user.id,
            externalId: user.externalId,
            provider: user.provider as AuthProvider,
            email: user.email,
            emailVerified: user.emailVerified,
            name: user.name,
            avatarUrl: user.avatarUrl,
            tenantId: user.tenantId,
            createdAt: user.createdAt.toISOString(),
            lastLoginAt: user.lastLoginAt?.toISOString(),
        };
    }

    /**
     * Get or create user from external provider
     * Used by Clerk, Logto, SSO providers after external auth
     */
    async getOrCreateExternalUser(data: {
        externalId: string;
        provider: AuthProvider;
        email: string;
        name?: string;
        avatarUrl?: string;
        emailVerified?: boolean;
    }): Promise<AuthUser> {
        // Try to find existing user
        let user = await this.prisma.user.findFirst({
            where: {
                provider: data.provider,
                externalId: data.externalId,
            },
        });

        if (!user) {
            // Check if user exists with same email (for linking accounts)
            const existingByEmail = await this.prisma.user.findUnique({
                where: { email: data.email },
            });

            if (existingByEmail) {
                // Update existing user with external ID
                user = await this.prisma.user.update({
                    where: { id: existingByEmail.id },
                    data: {
                        externalId: data.externalId,
                        provider: data.provider,
                        name: data.name || existingByEmail.name,
                        avatarUrl: data.avatarUrl || existingByEmail.avatarUrl,
                        emailVerified: data.emailVerified ?? existingByEmail.emailVerified,
                        lastLoginAt: new Date(),
                    },
                });
            } else {
                // Create new user
                user = await this.prisma.user.create({
                    data: {
                        externalId: data.externalId,
                        provider: data.provider,
                        email: data.email,
                        name: data.name,
                        avatarUrl: data.avatarUrl,
                        emailVerified: data.emailVerified ?? false,
                        tenantId: DEFAULT_TENANT_ID,
                        lastLoginAt: new Date(),
                    },
                });
            }
        } else {
            // Update last login
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
        }

        return {
            id: user.id,
            externalId: user.externalId,
            provider: user.provider as AuthProvider,
            email: user.email,
            emailVerified: user.emailVerified,
            name: user.name,
            avatarUrl: user.avatarUrl,
            tenantId: user.tenantId,
            createdAt: user.createdAt.toISOString(),
            lastLoginAt: user.lastLoginAt?.toISOString(),
        };
    }

    /**
     * Get OAuth/SSO authorization URL
     */
    getAuthorizationUrl(redirectUri: string, state?: string): string {
        if (!this.authProvider.getAuthorizationUrl) {
            throw new BadRequestException('OAuth not supported for this auth provider');
        }
        return this.authProvider.getAuthorizationUrl(redirectUri, state);
    }

    /**
     * Handle OAuth/SSO callback
     */
    async handleCallback(code: string, redirectUri: string): Promise<AuthResponse> {
        if (!this.authProvider.handleCallback) {
            throw new BadRequestException('OAuth callback not supported for this auth provider');
        }

        const user = await this.authProvider.handleCallback(code, redirectUri);

        // Generate JWT for the user
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            provider: user.provider,
        };

        const accessToken = this.jwtService.sign(payload);
        const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
        const expiresInSeconds = this.parseExpiresIn(expiresIn);

        return {
            accessToken,
            expiresIn: expiresInSeconds,
            user,
        };
    }

    /**
     * Get auth configuration for frontend
     */
    getAuthConfig(): AuthConfig {
        const provider = this.configService.get<AuthProvider>('AUTH_PROVIDER', 'native');

        const config: AuthConfig = { provider };

        // Add provider-specific config
        if (this.authProvider.getClientConfig) {
            Object.assign(config, this.authProvider.getClientConfig());
        }

        return config;
    }

    /**
     * Parse expires in string to seconds
     */
    private parseExpiresIn(expiresIn: string): number {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) return 86400; // Default 1 day

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 3600;
            case 'd': return value * 86400;
            default: return 86400;
        }
    }

    // =========================================================================
    // Password Reset Methods
    // =========================================================================

    /**
     * Request password reset - creates token and sends email
     */
    async requestPasswordReset(email: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        // Don't reveal if user exists
        if (!user) {
            this.logger.log(`Password reset requested for non-existent email: ${email}`);
            return;
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Invalidate any existing tokens for this user
        await this.prisma.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() },
        });

        // Create new token
        await this.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });

        // Send email
        await this.emailService.sendPasswordResetEmail(email, token);
        this.logger.log(`Password reset email sent to: ${email}`);
    }

    /**
     * Reset password with token
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        const resetToken = await this.prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken) {
            throw new BadRequestException('Invalid password reset token');
        }

        if (resetToken.usedAt) {
            throw new BadRequestException('Password reset token has already been used');
        }

        if (resetToken.expiresAt < new Date()) {
            throw new BadRequestException('Password reset token has expired');
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        // Update password and mark token as used
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: resetToken.userId },
                data: { passwordHash },
            }),
            this.prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { usedAt: new Date() },
            }),
        ]);

        this.logger.log(`Password reset completed for user: ${resetToken.user.email}`);
    }

    // =========================================================================
    // Email Verification Methods
    // =========================================================================

    /**
     * Create and send verification email for a user
     */
    async sendVerificationEmail(userId: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.emailVerified) {
            throw new BadRequestException('Email is already verified');
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Invalidate any existing tokens
        await this.prisma.emailVerificationToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() },
        });

        // Create new token
        await this.prisma.emailVerificationToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            },
        });

        // Send email
        await this.emailService.sendVerificationEmail(user.email, token);
        this.logger.log(`Verification email sent to: ${user.email}`);
    }

    /**
     * Verify email with token
     */
    async verifyEmail(token: string): Promise<void> {
        const verifyToken = await this.prisma.emailVerificationToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!verifyToken) {
            throw new BadRequestException('Invalid verification token');
        }

        if (verifyToken.usedAt) {
            throw new BadRequestException('Verification token has already been used');
        }

        if (verifyToken.expiresAt < new Date()) {
            throw new BadRequestException('Verification token has expired');
        }

        // Mark email as verified and token as used
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: verifyToken.userId },
                data: { emailVerified: true },
            }),
            this.prisma.emailVerificationToken.update({
                where: { id: verifyToken.id },
                data: { usedAt: new Date() },
            }),
        ]);

        this.logger.log(`Email verified for user: ${verifyToken.user.email}`);
    }

    /**
     * Resend verification email
     */
    async resendVerificationEmail(userId: string): Promise<void> {
        await this.sendVerificationEmail(userId);
    }
}
