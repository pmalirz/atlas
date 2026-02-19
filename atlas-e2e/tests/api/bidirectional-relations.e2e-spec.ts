/**
 * Bidirectional Relations E2E API Tests
 * 
 * These tests call the REST API via HTTP only - no direct database access.
 * They rely on E2E seed data being present (book_written_by relations with attributes).
 */
import { createAuthenticatedApi } from './helpers/auth-helper';

const api = createAuthenticatedApi();

describe('Bidirectional Relations (e2e)', () => {
    beforeAll(async () => {
        await api.setup();
    });

    describe('Relation direction detection', () => {
        it('should correctly identify outgoing relations from book', async () => {
            // Get a book entity from E2E seed
            const booksResponse = await api.get('/api/entities/book').expect(200);

            // Find Clean Code which has a relation to author
            const cleanCode = booksResponse.body.data.find(
                (b: { name: string }) => b.name === 'Clean Code'
            );
            expect(cleanCode).toBeDefined();

            // Get relations for that entity
            const relationsResponse = await api
                .get(`/api/relations?entityId=${cleanCode.id}`)
                .expect(200);

            expect(Array.isArray(relationsResponse.body)).toBe(true);
            expect(relationsResponse.body.length).toBeGreaterThan(0);

            // Book -> Author is outgoing (fromEntityId = book.id)
            const outgoing = relationsResponse.body.filter(
                (r: { fromEntityId: string }) => r.fromEntityId === cleanCode.id
            );
            expect(outgoing.length).toBeGreaterThan(0);
        });

        it('should correctly identify incoming relations to author', async () => {
            // Get Robert C. Martin author from E2E seed
            const authorsResponse = await api.get('/api/entities/author').expect(200);

            const unclebob = authorsResponse.body.data.find(
                (a: { name: string }) => a.name === 'Robert C. Martin'
            );
            expect(unclebob).toBeDefined();

            // Get relations for that entity
            const relationsResponse = await api
                .get(`/api/relations?entityId=${unclebob.id}`)
                .expect(200);

            expect(Array.isArray(relationsResponse.body)).toBe(true);
            expect(relationsResponse.body.length).toBeGreaterThan(0);

            // Book -> Author means author receives incoming relation (toEntityId = author.id)
            const incoming = relationsResponse.body.filter(
                (r: { toEntityId: string }) => r.toEntityId === unclebob.id
            );
            expect(incoming.length).toBeGreaterThan(0);
        });
    });

    describe('Relation with multiple targets', () => {
        it('should find The Pragmatic Programmer with 2 co-authors', async () => {
            // Get The Pragmatic Programmer
            const booksResponse = await api.get('/api/entities/book').expect(200);

            const pragProg = booksResponse.body.data.find(
                (b: { name: string }) => b.name === 'The Pragmatic Programmer'
            );
            expect(pragProg).toBeDefined();

            // Get relations for that book
            const relationsResponse = await api
                .get(`/api/relations?entityId=${pragProg.id}`)
                .expect(200);

            // Should have 2 co-author relations
            const authorRelations = relationsResponse.body.filter(
                (r: { relationType: string }) => r.relationType === 'book_written_by'
            );
            expect(authorRelations.length).toBe(2);

            // Both should have co-author role
            for (const rel of authorRelations) {
                expect(rel.attributes.role).toBe('co-author');
                expect(rel.attributes.contribution).toBe(50);
            }
        });
    });

    describe('Relation Definitions Check', () => {
        it('should have book_written_by relation defined with attributes', async () => {
            const defsResponse = await api.get('/api/definitions/relations').expect(200);

            const writtenByDef = defsResponse.body.find(
                (d: { relationType: string }) => d.relationType === 'book_written_by'
            );

            expect(writtenByDef).toBeDefined();
            expect(writtenByDef.relationType).toBe('book_written_by');
            expect(writtenByDef.attributeSchema).toBeDefined();
            expect(writtenByDef.attributeSchema.length).toBeGreaterThan(0);
        });

        it('should have author_role type for relation attribute', async () => {
            const typesResponse = await api
                .get('/api/definitions/types/author_role')
                .expect(200);

            expect(typesResponse.body.typeKey).toBe('author_role');
            expect(typesResponse.body.options).toBeDefined();

            const roleKeys = typesResponse.body.options.map((o: { key: string }) => o.key);
            expect(roleKeys).toContain('main-author');
            expect(roleKeys).toContain('co-author');
        });
    });
});
