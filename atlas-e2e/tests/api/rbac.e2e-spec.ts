/**
 * RBAC E2E API Tests
 *
 * Verifies server-side RBAC enforcement for:
 * - entity-level update denial (readonly user)
 * - attribute-level readable/updatable permissions (regular user)
 */
import { createAuthenticatedApi } from './helpers/auth-helper';

const adminApi = createAuthenticatedApi('admin');
const readonlyApi = createAuthenticatedApi('readonly');
const regularApi = createAuthenticatedApi('regular');

describe('RBAC API permissions (e2e)', () => {
    let testBookId: string;

    beforeAll(async () => {
        await adminApi.setup();
        await readonlyApi.setup();
        await regularApi.setup();

        const createResponse = await adminApi
            .post('/api/entities/book')
            .send({
                name: 'RBAC Attribute Test Book',
                description: 'Book for RBAC API E2E tests',
                attributes: {
                    isbn: '111-1111111111',
                    publisher: 'RBAC Test Publisher',
                    genre: 'fiction',
                    language: 'en',
                    status: 'available',
                    tags: ['rbac', 'seeded'],
                    publicationDate: '2024-01-01',
                    pageCount: 150,
                    price: 10.99,
                    rating: 3,
                    isAvailable: true,
                    isEbook: false,
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

    it('should deny readonly user when updating book entity', async () => {
        const response = await readonlyApi
            .patch(`/api/entities/book/${testBookId}`)
            .send({
                attributes: {
                    status: 'borrowed',
                },
            })
            .expect(403);

        expect(response.body.message).toContain('No update permission for entity type book');
    });

    it('should allow regular user to update permitted book attributes', async () => {
        const response = await regularApi
            .patch(`/api/entities/book/${testBookId}`)
            .send({
                attributes: {
                    status: 'borrowed',
                    rating: 4,
                    tags: ['rbac', 'allowed-update'],
                },
            })
            .expect(200);

        expect(response.body.attributes.status).toBe('borrowed');
        expect(response.body.attributes.rating).toBe(4);
        expect(response.body.attributes.tags).toEqual(['rbac', 'allowed-update']);
    });

    it('should reject regular user when updating non-updatable attributes', async () => {
        const response = await regularApi
            .patch(`/api/entities/book/${testBookId}`)
            .send({
                attributes: {
                    price: 99.99,
                },
            })
            .expect(403);

        expect(response.body.message).toContain('You do not have permission to modify attributes');
        expect(response.body.message).toContain('price');
    });

    it('should reject regular user when updating attributes outside updatable list', async () => {
        const response = await regularApi
            .patch(`/api/entities/book/${testBookId}`)
            .send({
                attributes: {
                    language: 'pl',
                },
            })
            .expect(403);

        expect(response.body.message).toContain('You do not have permission to modify attributes');
        expect(response.body.message).toContain('language');
    });

    it('should allow regular user to read attributes that are not updatable', async () => {
        const response = await regularApi.get(`/api/entities/book/${testBookId}`).expect(200);

        expect(response.body.attributes).toMatchObject({
            price: 10.99,
            isbn: '111-1111111111',
            publisher: 'RBAC Test Publisher',
            status: 'borrowed',
        });
    });

    it('should not apply partial update when payload mixes updatable and non-updatable attributes', async () => {
        await regularApi
            .patch(`/api/entities/book/${testBookId}`)
            .send({
                attributes: {
                    status: 'reserved',
                    publisher: 'Forbidden Publisher',
                },
            })
            .expect(403);

        const verifyResponse = await adminApi.get(`/api/entities/book/${testBookId}`).expect(200);
        expect(verifyResponse.body.attributes.status).toBe('borrowed');
        expect(verifyResponse.body.attributes.publisher).toBe('RBAC Test Publisher');
    });
});
