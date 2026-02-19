import type { AuthUser, LoginRequest, RegisterRequest, AuthResponse } from '@app-atlas/shared';

/**
 * Interface for pluggable authentication providers
 * 
 * Each provider must implement token validation at minimum.
 * Login/register methods are optional (external providers don't use them).
 */
export interface IAuthProvider {
    /**
     * Validate an access token and return user data
     * @param token The JWT or session token to validate
     * @returns The authenticated user or null if invalid
     */
    validateToken(token: string): Promise<AuthUser | null>;

    /**
     * Login with credentials (native provider only)
     * @param credentials Email and password
     * @returns Auth response with token and user
     */
    login?(credentials: LoginRequest): Promise<AuthResponse>;

    /**
     * Register a new user (native provider only)
     * @param data Registration data
     * @returns Auth response with token and user
     */
    register?(data: RegisterRequest): Promise<AuthResponse>;

    /**
     * Get the authorization URL for OAuth/SSO flows
     * @param redirectUri The URI to redirect to after auth
     * @param state Optional state parameter for CSRF protection
     * @returns The authorization URL
     */
    getAuthorizationUrl?(redirectUri: string, state?: string): string;

    /**
     * Handle OAuth/SSO callback
     * @param code Authorization code from the provider
     * @param redirectUri The original redirect URI
     * @returns The authenticated user
     */
    handleCallback?(code: string, redirectUri: string): Promise<AuthUser>;

    /**
     * Get provider-specific configuration for the frontend
     * @returns Provider config to send to UI
     */
    getClientConfig?(): Record<string, unknown>;
}
