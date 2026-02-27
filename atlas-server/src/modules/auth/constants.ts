/**
 * Auth module constants
 */

/**
 * Injection token for the active auth provider
 */
export const AUTH_PROVIDER = Symbol('AUTH_PROVIDER');

/**
 * Auth cookie name
 */
export const AUTH_COOKIE_NAME = 'atlas_auth_token';

/**
 * Cookie options for auth token
 * - httpOnly: Prevents JavaScript access (XSS protection)
 * - secure: Only sent over HTTPS (disabled in dev)
 * - sameSite: 'lax' allows top-level navigation with cookie, protects against CSRF
 * - path: '/' ensures cookie is sent for all API routes
 */
export const getAuthCookieOptions = (isProduction: boolean, maxAgeSeconds: number) => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds * 1000, // Convert to milliseconds
});
