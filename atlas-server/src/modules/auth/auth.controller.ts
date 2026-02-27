import { Controller, Post, Get, Body, Query, Res, HttpCode, HttpStatus, UsePipes } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Public } from './decorators';
import { CurrentUser } from './decorators';
import { RegisterRequest, RegisterRequestSchema, type AuthUser, type LoginRequest, type AuthResponse, type AuthConfig, type AuthCallbackRequest, type ForgotPasswordRequest, type ResetPasswordRequest, type VerifyEmailRequest, type MessageResponse, ForgotPasswordRequestSchema, ResetPasswordRequestSchema, VerifyEmailRequestSchema } from '@app-atlas/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from './constants';

@ApiTags('auth')
@Controller(':slug/auth')
export class AuthController {
    private readonly isProduction: boolean;

    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {
        this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    }

    /**
     * Set auth cookie on response
     */
    private setAuthCookie(res: Response, token: string, expiresIn: number): void {
        const cookieOptions = getAuthCookieOptions(this.isProduction, expiresIn);
        res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
    }

    /**
     * Clear auth cookie on response
     */
    private clearAuthCookie(res: Response): void {
        res.clearCookie(AUTH_COOKIE_NAME, {
            httpOnly: true,
            secure: this.isProduction,
            sameSite: 'lax',
            path: '/',
        });
    }

    /**
     * Get auth configuration for frontend
     */
    @Public()
    @Get('config')
    @ApiOperation({ summary: 'Get auth configuration for frontend' })
    @ApiResponse({ status: 200, description: 'Auth configuration' })
    getConfig(): AuthConfig {
        return this.authService.getAuthConfig();
    }

    /**
     * Login with email and password (native provider only)
     */
    @Public()
    @Throttle({ auth: {} })  // Uses 'auth' named throttler from config
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(
        @Body() credentials: LoginRequest,
        @Res({ passthrough: true }) res: Response,
    ): Promise<AuthResponse> {
        const authResponse = await this.authService.login(credentials);
        // Use rememberMe to determine cookie duration: 30 days if checked, 1 day otherwise
        const cookieMaxAge = credentials.rememberMe
            ? 30 * 24 * 60 * 60  // 30 days
            : 24 * 60 * 60;       // 1 day
        this.setAuthCookie(res, authResponse.accessToken, cookieMaxAge);
        return authResponse;
    }

    /**
     * Register a new user (native provider only)
     */
    @Public()
    @Throttle({ auth: {} })  // Uses 'auth' named throttler from config
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'Registration successful' })
    @ApiResponse({ status: 400, description: 'User already exists or invalid data' })
    @UsePipes(new ZodValidationPipe(RegisterRequestSchema))
    async register(
        @Body() data: RegisterRequest,
        @Res({ passthrough: true }) res: Response,
    ): Promise<AuthResponse> {
        const authResponse = await this.authService.register(data);
        this.setAuthCookie(res, authResponse.accessToken, authResponse.expiresIn);
        return authResponse;
    }

    /**
     * Get current authenticated user
     */
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user' })
    @ApiResponse({ status: 200, description: 'Current user data' })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    async getCurrentUser(@CurrentUser() user: AuthUser): Promise<AuthUser> {
        // Fetch fresh user data
        const freshUser = await this.authService.getCurrentUser(user.id);
        if (!freshUser) {
            throw new Error('User not found');
        }
        return freshUser;
    }

    /**
     * Get OAuth/SSO authorization URL
     */
    @Public()
    @Get('authorize')
    @ApiOperation({ summary: 'Get OAuth authorization URL' })
    @ApiResponse({ status: 200, description: 'Authorization URL' })
    getAuthorizationUrl(
        @Query('redirect_uri') redirectUri: string,
        @Query('state') state?: string,
    ): { url: string } {
        const url = this.authService.getAuthorizationUrl(redirectUri, state);
        return { url };
    }

    /**
     * Handle OAuth/SSO callback
     */
    @Public()
    @Post('callback')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Handle OAuth callback' })
    @ApiResponse({ status: 200, description: 'Authentication successful' })
    async handleCallback(
        @Body() data: AuthCallbackRequest,
        @Res({ passthrough: true }) res: Response,
    ): Promise<AuthResponse> {
        const authResponse = await this.authService.handleCallback(data.code, data.redirectUri || '');
        this.setAuthCookie(res, authResponse.accessToken, authResponse.expiresIn);
        return authResponse;
    }

    /**
     * Logout - clear HttpOnly cookie
     */
    @Post('logout')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Logout (invalidate session)' })
    @ApiResponse({ status: 204, description: 'Logged out successfully' })
    async logout(@Res({ passthrough: true }) res: Response): Promise<void> {
        this.clearAuthCookie(res);
        // This endpoint can be extended for:
        // - Token blacklisting
        // - Audit logging
    }

    // =========================================================================
    // Password Reset Endpoints
    // =========================================================================

    /**
     * Request password reset - sends email with reset link
     */
    @Public()
    @Throttle({ auth: {} })  // Uses 'auth' named throttler from config
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ZodValidationPipe(ForgotPasswordRequestSchema))
    @ApiOperation({ summary: 'Request password reset email' })
    @ApiResponse({ status: 200, description: 'If email exists, reset link sent' })
    async forgotPassword(@Body() data: ForgotPasswordRequest): Promise<MessageResponse> {
        await this.authService.requestPasswordReset(data.email);
        // Always return success to prevent email enumeration
        return { message: 'If your email is registered, you will receive a password reset link.' };
    }

    /**
     * Reset password with token
     */
    @Public()
    @Throttle({ auth: {} })  // Uses 'auth' named throttler from config
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ZodValidationPipe(ResetPasswordRequestSchema))
    @ApiOperation({ summary: 'Reset password using token from email' })
    @ApiResponse({ status: 200, description: 'Password reset successful' })
    @ApiResponse({ status: 400, description: 'Invalid or expired token' })
    async resetPassword(@Body() data: ResetPasswordRequest): Promise<MessageResponse> {
        await this.authService.resetPassword(data.token, data.newPassword);
        return { message: 'Password has been reset successfully. You can now log in.' };
    }

    // =========================================================================
    // Email Verification Endpoints
    // =========================================================================

    /**
     * Verify email with token
     */
    @Public()
    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ZodValidationPipe(VerifyEmailRequestSchema))
    @ApiOperation({ summary: 'Verify email address using token' })
    @ApiResponse({ status: 200, description: 'Email verified successfully' })
    @ApiResponse({ status: 400, description: 'Invalid or expired token' })
    async verifyEmail(@Body() data: VerifyEmailRequest): Promise<MessageResponse> {
        await this.authService.verifyEmail(data.token);
        return { message: 'Email verified successfully!' };
    }

    /**
     * Resend verification email
     */
    @Throttle({ auth: {} })  // Uses 'auth' named throttler from config
    @Post('resend-verification')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Resend email verification link' })
    @ApiResponse({ status: 200, description: 'Verification email sent' })
    async resendVerification(@CurrentUser() user: AuthUser): Promise<MessageResponse> {
        await this.authService.resendVerificationEmail(user.id);
        return { message: 'Verification email sent. Please check your inbox.' };
    }
}
