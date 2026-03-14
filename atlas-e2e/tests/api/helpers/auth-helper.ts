/**
 * Auth Helper for E2E Tests
 * 
 * Provides authentication utilities for API E2E tests.
 * Creates a test user and provides authenticated request helper.
 */
import request from 'supertest';
import { withTenantApiPath } from '../../utils/tenant-paths';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Test user credentials - use the pre-seeded admin user
const testEmail = 'e2e-admin@atlas.local';
const testPassword = 'admin';

let authToken: string | null = null;

/**
 * Get auth token for E2E tests.
 * Uses the pre-seeded admin user for authentication.
 */
export async function getAuthToken(): Promise<string> {
    if (authToken) {
        return authToken;
    }

    console.log(`[Auth Helper] API_BASE_URL: ${API_BASE_URL}`);
    console.log(`[Auth Helper] Logging in user: ${testEmail}`);

    // Try to login with the pre-seeded admin user
    try {
        console.log(`[Auth Helper] Trying login...`);
        const loginResponse = await request(API_BASE_URL)
            .post(withTenantApiPath('/api/auth/login'))
            .send({
                email: testEmail,
                password: testPassword,
            });

        console.log(`[Auth Helper] Login response status: ${loginResponse.status}`);

        if (loginResponse.status === 200) {
            authToken = loginResponse.body.accessToken;
            console.log(`[Auth Helper] Login successful, got token`);
            return authToken!;
        }

        console.log(`[Auth Helper] Login failed with body:`, loginResponse.body);
    } catch (error) {
        console.error(`[Auth Helper] Login request error:`, error);
    }

    throw new Error('Failed to authenticate for E2E tests');
}

/**
 * Get the auth header object for use with supertest .set()
 */
export async function getAuthHeader(): Promise<{ Authorization: string }> {
    const token = await getAuthToken();
    return { Authorization: `Bearer ${token}` };
}

/**
 * Create authenticated request helpers bound to the API
 */
export function createAuthenticatedApi() {
    let token: string;

    return {
        async setup() {
            token = await getAuthToken();
        },

        get authHeader() {
            return { Authorization: `Bearer ${token}` };
        },

        get(url: string) {
            return request(API_BASE_URL).get(withTenantApiPath(url)).set('Authorization', `Bearer ${token}`);
        },

        post(url: string) {
            return request(API_BASE_URL).post(withTenantApiPath(url)).set('Authorization', `Bearer ${token}`);
        },

        patch(url: string) {
            return request(API_BASE_URL).patch(withTenantApiPath(url)).set('Authorization', `Bearer ${token}`);
        },

        delete(url: string) {
            return request(API_BASE_URL).delete(withTenantApiPath(url)).set('Authorization', `Bearer ${token}`);
        },
    };
}

/**
 * Reset auth token (for test isolation if needed)
 */
export function resetAuthToken(): void {
    authToken = null;
}
