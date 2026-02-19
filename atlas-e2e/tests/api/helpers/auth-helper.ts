/**
 * Auth Helper for E2E Tests
 * 
 * Provides authentication utilities for API E2E tests.
 * Creates a test user and provides authenticated request helper.
 */
import request from 'supertest';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Test user credentials - unique per test run to avoid conflicts
const testEmail = `e2e-test-${Date.now()}@test.com`;
const testPassword = 'e2e-test-password-123';
const testName = 'E2E Test User';

let authToken: string | null = null;

/**
 * Get or create auth token for E2E tests.
 * Registers a new test user if needed.
 */
export async function getAuthToken(): Promise<string> {
    if (authToken) {
        return authToken;
    }

    console.log(`[Auth Helper] API_BASE_URL: ${API_BASE_URL}`);
    console.log(`[Auth Helper] Registering user: ${testEmail}`);

    // Try to register a new test user
    try {
        const registerResponse = await request(API_BASE_URL)
            .post('/api/auth/register')
            .send({
                email: testEmail,
                password: testPassword,
                name: testName,
            });

        console.log(`[Auth Helper] Register response status: ${registerResponse.status}`);

        if (registerResponse.status === 201) {
            authToken = registerResponse.body.accessToken;
            console.log(`[Auth Helper] Registered successfully, got token`);
            return authToken!;
        }

        console.log(`[Auth Helper] Register failed with body:`, registerResponse.body);
    } catch (error) {
        console.error(`[Auth Helper] Register request error:`, error);
    }

    // If user already exists, try to login
    try {
        console.log(`[Auth Helper] Trying login...`);
        const loginResponse = await request(API_BASE_URL)
            .post('/api/auth/login')
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
            return request(API_BASE_URL).get(url).set('Authorization', `Bearer ${token}`);
        },

        post(url: string) {
            return request(API_BASE_URL).post(url).set('Authorization', `Bearer ${token}`);
        },

        patch(url: string) {
            return request(API_BASE_URL).patch(url).set('Authorization', `Bearer ${token}`);
        },

        delete(url: string) {
            return request(API_BASE_URL).delete(url).set('Authorization', `Bearer ${token}`);
        },
    };
}

/**
 * Reset auth token (for test isolation if needed)
 */
export function resetAuthToken(): void {
    authToken = null;
}
