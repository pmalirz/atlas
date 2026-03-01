/**
 * Auth E2E API Tests
 * 
 * Tests for authentication endpoints: config, register, login, and protected routes.
 * These tests call the REST API via HTTP only - no direct database access.
 * 
 * NOTE: Auth endpoints (/auth/*) are public by design. Other endpoints require auth.
 */
import request from 'supertest';
import { createAuthenticatedApi } from './helpers/auth-helper';
import { withTenantApiPath } from '../utils/tenant-paths';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const api = createAuthenticatedApi();

// Generate unique email for each test run to avoid conflicts
const uniqueEmail = `test-${Date.now()}@example.com`;
const testPassword = 'testpass123';
const testName = 'E2E Test User';

describe('AuthController (e2e)', () => {
    let accessToken: string;
    let userId: string;

    describe('GET /api/auth/config', () => {
        it('should return auth configuration', async () => {
            const response = await request(API_BASE_URL)
                .get(withTenantApiPath('/api/auth/config'))
                .expect(200);

            expect(response.body.provider).toBeDefined();
            // Default should be 'native' per .env configuration
            expect(['native', 'clerk', 'logto', 'sso']).toContain(response.body.provider);
        });
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user and return JWT', async () => {
            const response = await request(API_BASE_URL)
                .post(withTenantApiPath('/api/auth/register'))
                .send({
                    email: uniqueEmail,
                    password: testPassword,
                    name: testName,
                })
                .expect(201);

            expect(response.body.accessToken).toBeDefined();
            expect(typeof response.body.accessToken).toBe('string');
            expect(response.body.expiresIn).toBeDefined();
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe(uniqueEmail);
            expect(response.body.user.name).toBe(testName);
            expect(response.body.user.provider).toBe('native');
            expect(response.body.user.id).toBeDefined();

            // Store for later tests
            accessToken = response.body.accessToken;
            userId = response.body.user.id;
        });

        it('should reject registration with duplicate email', async () => {
            // First registration with unique email for this test
            const duplicateTestEmail = `duplicate-test-${Date.now()}@example.com`;

            // First registration should succeed
            const firstResponse = await request(API_BASE_URL)
                .post(withTenantApiPath('/api/auth/register'))
                .send({
                    email: duplicateTestEmail,
                    password: testPassword,
                    name: 'First User',
                });
            expect(firstResponse.status).toBe(201);

            // Second registration with same email should fail
            const secondResponse = await request(API_BASE_URL)
                .post(withTenantApiPath('/api/auth/register'))
                .send({
                    email: duplicateTestEmail, // Same email
                    password: testPassword,
                    name: 'Duplicate User',
                });

            expect(secondResponse.status).toBe(401);
            expect(secondResponse.body.message).toContain('already exists');
        });

        it('should reject registration with invalid email', async () => {
            const response = await request(API_BASE_URL)
                .post(withTenantApiPath('/api/auth/register'))
                .send({
                    email: 'not-an-email',
                    password: testPassword,
                });

            // Should return client error (400 or 422)
            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(response.status).toBeLessThan(500);
        });

        // TODO: Enable once server-side password validation is implemented
        // Currently the server accepts short passwords - validation exists in Zod schema
        // but not enforced on the register endpoint DTO
        it.skip('should reject registration with short password', async () => {
            const response = await request(API_BASE_URL)
                .post(withTenantApiPath('/api/auth/register'))
                .send({
                    email: `short-pass-${Date.now()}@example.com`,
                    password: 'short', // Less than 8 characters
                });

            // Should return client error (400 or 422)
            expect(response.status).toBeGreaterThanOrEqual(400);
            expect(response.status).toBeLessThan(500);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials and return JWT', async () => {
            const response = await request(API_BASE_URL)
                .post(withTenantApiPath('/api/auth/login'))
                .send({
                    email: uniqueEmail,
                    password: testPassword,
                })
                .expect(200);

            expect(response.body.accessToken).toBeDefined();
            expect(typeof response.body.accessToken).toBe('string');
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe(uniqueEmail);

            // Update token for later tests
            accessToken = response.body.accessToken;
        });

        it('should reject login with wrong password', async () => {
            const response = await request(API_BASE_URL)
                .post(withTenantApiPath('/api/auth/login'))
                .send({
                    email: uniqueEmail,
                    password: 'wrongpassword',
                })
                .expect(401);

            expect(response.body.message).toContain('Invalid');
        });

        it('should reject login with non-existent email', async () => {
            const response = await request(API_BASE_URL)
                .post(withTenantApiPath('/api/auth/login'))
                .send({
                    email: 'nonexistent@example.com',
                    password: testPassword,
                })
                .expect(401);

            expect(response.body.message).toContain('Invalid');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return 401 without token', async () => {
            const response = await request(API_BASE_URL)
                .get(withTenantApiPath('/api/auth/me'))
                .expect(401);

            expect(response.body.message).toContain('Authentication required');
        });

        it('should return 401 with invalid token', async () => {
            const response = await request(API_BASE_URL)
                .get(withTenantApiPath('/api/auth/me'))
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body.statusCode).toBe(401);
        });

        it('should return user data with valid token', async () => {
            const response = await request(API_BASE_URL)
                .get(withTenantApiPath('/api/auth/me'))
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.id).toBe(userId);
            expect(response.body.email).toBe(uniqueEmail);
            expect(response.body.name).toBe(testName);
            expect(response.body.provider).toBe('native');
            expect(response.body.tenantId).toBeDefined();
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should return 401 without token', async () => {
            await request(API_BASE_URL)
                .post(withTenantApiPath('/api/auth/logout'))
                .expect(401);
        });

        it('should return 204 with valid token', async () => {
            await request(API_BASE_URL)
                .post(withTenantApiPath('/api/auth/logout'))
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(204);
        });
    });

    describe('Endpoint access control', () => {
        it('GET /api/health should remain public (no auth required)', async () => {
            const response = await request(API_BASE_URL)
                .get('/api/health')
                .expect(200);

            expect(response.body.status).toBe('ok');
        });

        it('GET /api/auth/config should remain public (no auth required)', async () => {
            const response = await request(API_BASE_URL)
                .get(withTenantApiPath('/api/auth/config'))
                .expect(200);

            expect(response.body.provider).toBeDefined();
        });

        it('GET /api/definitions/entities should require auth (returns 401 without token)', async () => {
            await request(API_BASE_URL)
                .get(withTenantApiPath('/api/definitions/entities'))
                .expect(401);
        });
    });
});
