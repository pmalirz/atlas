/**
 * Auth API - Client-side auth service
 * Uses HttpOnly cookies for secure token storage
 */
import type { AuthConfig, AuthResponse, LoginRequest, RegisterRequest, AuthUser } from '@app-atlas/shared';
import { buildTenantUrl } from './client';

/**
 * Get auth configuration from server
 */
export async function getAuthConfig(): Promise<AuthConfig> {
    const response = await fetch(buildTenantUrl('/auth/config'), {
        credentials: 'include', // Include cookies
    });
    if (!response.ok) {
        throw new Error('Failed to fetch auth config');
    }
    return response.json();
}

/**
 * Login with email and password
 * Server sets HttpOnly cookie on success
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(buildTenantUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include', // Receive HttpOnly cookie
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(error.message || 'Login failed');
    }

    return response.json();
}

/**
 * Register a new user
 * Server sets HttpOnly cookie on success
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(buildTenantUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include', // Receive HttpOnly cookie
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(error.message || 'Registration failed');
    }

    return response.json();
}

/**
 * Get current user (uses HttpOnly cookie automatically)
 */
export async function getCurrentUser(): Promise<AuthUser> {
    const response = await fetch(buildTenantUrl('/auth/me'), {
        credentials: 'include', // Send HttpOnly cookie
    });

    if (!response.ok) {
        throw new Error('Failed to get current user');
    }

    return response.json();
}

/**
 * Logout - Server clears HttpOnly cookie
 */
export async function logout(): Promise<void> {
    await fetch(buildTenantUrl('/auth/logout'), {
        method: 'POST',
        credentials: 'include', // Send cookie to clear it
    });
}

// =========================================================================
// Password Reset API
// =========================================================================

/**
 * Request password reset email
 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(buildTenantUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || 'Failed to send reset email');
    }

    return response.json();
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(buildTenantUrl('/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Reset failed' }));
        throw new Error(error.message || 'Failed to reset password');
    }

    return response.json();
}

// =========================================================================
// Email Verification API
// =========================================================================

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<{ message: string }> {
    const response = await fetch(buildTenantUrl('/auth/verify-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Verification failed' }));
        throw new Error(error.message || 'Failed to verify email');
    }

    return response.json();
}

/**
 * Resend verification email
 */
export async function resendVerification(): Promise<{ message: string }> {
    const response = await fetch(buildTenantUrl('/auth/resend-verification'), {
        method: 'POST',
        credentials: 'include', // Requires auth
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || 'Failed to resend verification email');
    }

    return response.json();
}
