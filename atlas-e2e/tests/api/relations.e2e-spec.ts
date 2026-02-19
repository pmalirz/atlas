/**
 * Relations E2E API Tests
 * 
 * These tests call the REST API via HTTP only - no direct database access.
 * They rely on E2E seed data being present (book, author entities with book_written_by relations).
 */
import { createAuthenticatedApi } from './helpers/auth-helper';

const api = createAuthenticatedApi();

describe('RelationsController (e2e)', () => {
  beforeAll(async () => {
    await api.setup();
  });

  describe('GET /api/relations', () => {
    it('should return all relations (from E2E seed)', async () => {
      const response = await api.get('/api/relations').expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      // E2E seed contains 4 book_written_by relations
      expect(response.body.length).toBeGreaterThanOrEqual(4);
    });

    it('should include relation attributes (role, contribution)', async () => {
      const response = await api.get('/api/relations').expect(200);

      // Find a relation with attributes
      const relationWithAttrs = response.body.find(
        (r: { attributes: Record<string, unknown> }) => r.attributes && r.attributes.role
      );

      expect(relationWithAttrs).toBeDefined();
      expect(relationWithAttrs.attributes.role).toBeDefined();
      expect(['main-author', 'co-author', 'editor', 'translator']).toContain(relationWithAttrs.attributes.role);
    });
  });

  describe('GET /api/relations?entityId=:entityId', () => {
    it('should return relations for a specific book', async () => {
      // First get a book that has relations (from E2E seed)
      const entitiesResponse = await api.get('/api/entities/book').expect(200);

      // Find Clean Code which has relations
      const cleanCode = entitiesResponse.body.data.find(
        (b: { name: string }) => b.name === 'Clean Code'
      );
      expect(cleanCode).toBeDefined();

      // Get relations for that entity
      const response = await api.get(`/api/relations?entityId=${cleanCode.id}`).expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Should have relation to author
      expect(response.body[0].relationType).toBe('book_written_by');
    });

    it('should return relations for a specific author', async () => {
      // Get Robert C. Martin who has relations to books
      const authorsResponse = await api.get('/api/entities/author').expect(200);

      const unclebob = authorsResponse.body.data.find(
        (a: { name: string }) => a.name === 'Robert C. Martin'
      );
      expect(unclebob).toBeDefined();

      // Get relations for that entity
      const response = await api.get(`/api/relations?entityId=${unclebob.id}`).expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Relation Attribute Validation', () => {
    let bookId: string;
    let authorId: string;

    beforeAll(async () => {
      // Get a book and author for creating test relations
      const booksRes = await api.get('/api/entities/book');
      bookId = booksRes.body.data[0]?.id;

      const authorsRes = await api.get('/api/entities/author');
      authorId = authorsRes.body.data.find(
        (a: { name: string }) => a.name === 'Test Author Inactive'
      )?.id;
    });

    it('should reject non-numeric value for contribution (number type)', async () => {
      const response = await api
        .post('/api/relations')
        .send({
          relationType: 'book_written_by',
          fromEntityId: bookId,
          toEntityId: authorId,
          attributes: {
            role: 'co-author',
            contribution: 'Ala Ma Kota', // Invalid: should be number
          },
        })
        .expect(400);

      expect(response.body.message).toContain('validation');
    });

    it('should reject decimal value for contribution (integer type)', async () => {
      const response = await api
        .post('/api/relations')
        .send({
          relationType: 'book_written_by',
          fromEntityId: bookId,
          toEntityId: authorId,
          attributes: {
            role: 'co-author',
            contribution: 50.5, // Invalid: should be integer, not decimal
          },
        })
        .expect(400);

      expect(response.body.message).toContain('validation');
    });

    it('should accept valid integer for contribution', async () => {
      // Find Clean Code book to safely update its relation
      const booksRes = await api.get('/api/entities/book');
      const cleanCode = booksRes.body.data.find(
        (b: { name: string }) => b.name === 'Clean Code'
      );

      const relationsRes = await api.get(`/api/relations?entityId=${cleanCode.id}`);

      const existingRelation = relationsRes.body.find(
        (r: { relationType: string }) => r.relationType === 'book_written_by'
      );

      if (existingRelation) {
        // Update existing relation with valid attributes
        const response = await api
          .patch(`/api/relations/${existingRelation.id}`)
          .send({
            attributes: {
              role: 'co-author',
              contribution: 75, // Valid integer
            },
          })
          .expect(200);

        expect(response.body.attributes.contribution).toBe(75);
      }
    });

    it('should reject contribution below min (0)', async () => {
      const relationsRes = await api.get('/api/relations');
      const existingRelation = relationsRes.body.find(
        (r: { relationType: string }) => r.relationType === 'book_written_by'
      );

      if (existingRelation) {
        const response = await api
          .patch(`/api/relations/${existingRelation.id}`)
          .send({
            attributes: {
              contribution: -10, // Invalid: below min
            },
          })
          .expect(400);

        expect(response.body.message).toContain('validation');
      }
    });

    it('should reject contribution above max (100)', async () => {
      const relationsRes = await api.get('/api/relations');
      const existingRelation = relationsRes.body.find(
        (r: { relationType: string }) => r.relationType === 'book_written_by'
      );

      if (existingRelation) {
        const response = await api
          .patch(`/api/relations/${existingRelation.id}`)
          .send({
            attributes: {
              contribution: 150, // Invalid: above max
            },
          })
          .expect(400);

        expect(response.body.message).toContain('validation');
      }
    });
  });

  describe('Relation Graph', () => {
    it('should return relation graph for a book', async () => {
      // Get the Clean Code book from E2E seed
      const entitiesResponse = await api.get('/api/entities/book').expect(200);

      const cleanCode = entitiesResponse.body.data.find(
        (b: { name: string }) => b.name === 'Clean Code'
      );
      expect(cleanCode).toBeDefined();

      // Get relation graph
      const response = await api.get(`/api/relations/graph/${cleanCode.id}`).expect(200);

      expect(response.body).toBeDefined();
    });

    it('should return relation graph for The Pragmatic Programmer (has 2 authors)', async () => {
      // Get The Pragmatic Programmer which has 2 co-authors
      const entitiesResponse = await api.get('/api/entities/book').expect(200);

      const pragProg = entitiesResponse.body.data.find(
        (b: { name: string }) => b.name === 'The Pragmatic Programmer'
      );
      expect(pragProg).toBeDefined();

      // Get relation graph
      const response = await api.get(`/api/relations/graph/${pragProg.id}`).expect(200);

      expect(response.body).toBeDefined();
    });
  });
});
