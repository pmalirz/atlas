/**
 * Auth Helper for E2E Tests
 * 
 * Provides authentication utilities for API E2E tests.
 * Creates a test user and provides authenticated request helper.
 */
import request from 'supertest';
import { withTenantApiPath } from '../../utils/tenant-paths';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

export type E2ETestUserKey = 'admin' | 'readonly' | 'regular';

const TEST_USERS: Record<E2ETestUserKey, { email: string; password: string }> = {
    admin: {
        email: 'e2e-admin@atlas.local',
        password: 'admin',
    },
    readonly: {
        email: 'e2e-readonly-user@atlas.local',
        password: 'readonly',
    },
    regular: {
        email: 'e2e-regular-user@atlas.local',
        password: 'regular',
    },
};

const authTokens: Partial<Record<E2ETestUserKey, string>> = {};

/**
 * Get auth token for E2E tests.
 * Uses pre-seeded users for authentication.
 */
export async function getAuthToken(user: E2ETestUserKey = 'admin'): Promise<string> {
    const cached = authTokens[user];
    if (cached) {
        return cached;
    }

    const credentials = TEST_USERS[user];
    console.log(`[Auth Helper] API_BASE_URL: ${API_BASE_URL}`);
    console.log(`[Auth Helper] Logging in user: ${credentials.email}`);

    // Try to login with the pre-seeded user
    try {
        console.log(`[Auth Helper] Trying login...`);
        const loginResponse = await request(API_BASE_URL)
            .post(withTenantApiPath('/api/auth/login'))
            .send({
                email: credentials.email,
                password: credentials.password,
            });

        console.log(`[Auth Helper] Login response status: ${loginResponse.status}`);

        if (loginResponse.status === 200) {
            authTokens[user] = loginResponse.body.accessToken;
            console.log(`[Auth Helper] Login successful, got token`);
            return authTokens[user]!;
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
export async function getAuthHeader(user: E2ETestUserKey = 'admin'): Promise<{ Authorization: string }> {
    const token = await getAuthToken(user);
    return { Authorization: `Bearer ${token}` };
}

/**
 * Create authenticated request helpers bound to the API
 */
export function createAuthenticatedApi(user: E2ETestUserKey = 'admin') {
    let token: string;

    return {
        async setup() {
            token = await getAuthToken(user);
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
    for (const user of Object.keys(authTokens) as E2ETestUserKey[]) {
        delete authTokens[user];
    }
}
