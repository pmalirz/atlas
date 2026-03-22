/**
 * Workflows Engine E2E API Tests
 *
 * Verifies server-side Workflow enforcement for:
 * - Allowed transitions endpoint (returns options based on conditions)
 * - Actual field updates (blocked if workflow rule is violated)
 */
import { createAuthenticatedApi } from './helpers/auth-helper';

const adminApi = createAuthenticatedApi('admin');
const regularApi = createAuthenticatedApi('regular');

describe('Workflows API (e2e)', () => {
    let testBookId: string;

    beforeAll(async () => {
        await adminApi.setup();
        await regularApi.setup();

        const createResponse = await adminApi
            .post('/api/entities/book')
            .send({
                name: 'Workflow Rule Test Book',
                description: 'Book for Workflow E2E tests',
                attributes: {
                    isbn: '222-2222222222',
                    publisher: 'Workflow Test Publisher',
                    genre: 'fiction',
                    language: 'en',
                    status: 'available', // Starting state for the book status workflow
                    tags: ['workflow', 'seeded'],
                    publicationDate: '2024-01-01',
                    pageCount: 200,
                    price: 20.99,
                    rating: 5,
                    isAvailable: true,
                    isEbook: true,
                },
            })
            .expect(201);

        testBookId = createResponse.body.id as string;
    });

    afterAll(async () => {
        if (testBookId) {
            try {
                await adminApi.delete(`/api/entities/book/${testBookId}`);
            } catch {
                // ignore cleanup errors
            }
        }
    });

    it('should show "borrowed" but NOT "archived" transition for regular user', async () => {
        // Fetch allowed transitions for the "status" field on the target entity
        const response = await regularApi.get(`/api/workflows/entities/book/${testBookId}/allowed-transitions`).expect(200);

        // The endpoint returns a map: Record<string, string[]> (field -> allowed target states)
        expect(response.body).toBeDefined();
        const allowedStatuses = response.body['status'];
        
        expect(allowedStatuses).toBeDefined();
        expect(Array.isArray(allowedStatuses)).toBe(true);
        
        // Regular user should see "borrowed"
        expect(allowedStatuses).toContain('borrowed');
        
        // Regular user should NOT see "archived"
        expect(allowedStatuses).not.toContain('archived');
    });

    it('should show both "borrowed" and "archived" transitions for admin user', async () => {
        const response = await adminApi.get(`/api/workflows/entities/book/${testBookId}/allowed-transitions`).expect(200);

        const allowedStatuses = response.body['status'];
        
        expect(allowedStatuses).toBeDefined();
        expect(allowedStatuses).toContain('borrowed');
        expect(allowedStatuses).toContain('archived');
    });

    it('should allow regular user to transition status to "borrowed"', async () => {
        const response = await regularApi
            .patch(`/api/entities/book/${testBookId}`)
            .send({
                attributes: {
                    status: 'borrowed',
                },
            })
            .expect(200);

        expect(response.body.attributes.status).toBe('borrowed');
    });

    it('should block regular user from transitioning status from "borrowed" to "archived"', async () => {
        const response = await regularApi
            .patch(`/api/entities/book/${testBookId}`)
            .send({
                attributes: {
                    status: 'archived',
                },
            })
            .expect(403);

        expect(response.body.message).toContain('Update denied: You do not have permission');
    });

    it('should allow admin user to transition status from "borrowed" to "archived"', async () => {
        const response = await adminApi
            .patch(`/api/entities/book/${testBookId}`)
            .send({
                attributes: {
                    status: 'archived',
                },
            })
            .expect(200);

        expect(response.body.attributes.status).toBe('archived');
    });
});
