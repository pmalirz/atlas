// =============================================================================
// Auth Schemas
// =============================================================================
// Authentication-related types, DTOs, and validation schemas.
// =============================================================================

import { z } from 'zod';

// -----------------------------------------------------------------------------
// Auth Provider Types
// -----------------------------------------------------------------------------

/**
 * Supported authentication providers
 */
export const AuthProviderSchema = z.enum(['native', 'clerk', 'logto', 'sso']);
export type AuthProvider = z.infer<typeof AuthProviderSchema>;

/**
 * SSO protocol types (when using 'sso' provider)
 */
export const SsoProtocolSchema = z.enum(['oidc', 'saml']);
export type SsoProtocol = z.infer<typeof SsoProtocolSchema>;

// -----------------------------------------------------------------------------
// User Types
// -----------------------------------------------------------------------------

/**
 * Authenticated user data returned from auth operations
 */
export const AuthUserSchema = z.object({
    id: z.string().uuid(),
    externalId: z.string().nullish(),
    provider: AuthProviderSchema,
    email: z.string().email(),
    emailVerified: z.boolean().default(false),
    name: z.string().nullish(),
    avatarUrl: z.string().url().nullish(),
    tenantId: z.string().uuid(),
    createdAt: z.string().datetime().optional(),
    lastLoginAt: z.string().datetime().nullish(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

/**
 * Minimal user info for JWT token payload
 */
export const AuthTokenPayloadSchema = z.object({
    sub: z.string().uuid(), // User ID
    email: z.string().email(),
    tenantId: z.string().uuid(),
    provider: AuthProviderSchema,
    iat: z.number().optional(),
    exp: z.number().optional(),
});
export type AuthTokenPayload = z.infer<typeof AuthTokenPayloadSchema>;

// -----------------------------------------------------------------------------
// Request/Response DTOs
// -----------------------------------------------------------------------------

/**
 * Native login request
 */
export const LoginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    rememberMe: z.boolean().optional().default(false),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/**
 * Native registration request
 */
export const RegisterRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(255).optional(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

/**
 * Auth response containing token and user data
 */
export const AuthResponseSchema = z.object({
    accessToken: z.string(),
    expiresIn: z.number(), // seconds
    user: AuthUserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/**
 * Token refresh request
 */
export const RefreshTokenRequestSchema = z.object({
    refreshToken: z.string(),
});
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

/**
 * OAuth/SSO callback request
 */
export const AuthCallbackRequestSchema = z.object({
    code: z.string(),
    state: z.string().optional(),
    redirectUri: z.string().url().optional(),
});
export type AuthCallbackRequest = z.infer<typeof AuthCallbackRequestSchema>;

// -----------------------------------------------------------------------------
// Configuration Types
// -----------------------------------------------------------------------------

/**
 * Auth configuration for frontend
 */
export const AuthConfigSchema = z.object({
    provider: AuthProviderSchema,
    // Clerk-specific
    clerkPublishableKey: z.string().optional(),
    // Logto-specific
    logtoEndpoint: z.string().url().optional(),
    logtoAppId: z.string().optional(),
    // SSO-specific
    ssoProtocol: SsoProtocolSchema.optional(),
    ssoAuthorizationUrl: z.string().url().optional(),
});
export type AuthConfig = z.infer<typeof AuthConfigSchema>;

// -----------------------------------------------------------------------------
// Password Reset Types
// -----------------------------------------------------------------------------

/**
 * Forgot password request - initiates password reset flow
 */
export const ForgotPasswordRequestSchema = z.object({
    email: z.string().email(),
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

/**
 * Reset password request - completes password reset with token
 */
export const ResetPasswordRequestSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8),
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

// -----------------------------------------------------------------------------
// Email Verification Types
// -----------------------------------------------------------------------------

/**
 * Verify email request
 */
export const VerifyEmailRequestSchema = z.object({
    token: z.string().min(1),
});
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

/**
 * Generic message response
 */
export const MessageResponseSchema = z.object({
    message: z.string(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
