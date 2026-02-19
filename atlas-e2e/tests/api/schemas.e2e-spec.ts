/**
 * Schemas/Definitions E2E API Tests
 * 
 * These tests call the REST API via HTTP only - no direct database access.
 * They rely on E2E seed data being present (book, author entity definitions).
 */
import { createAuthenticatedApi } from './helpers/auth-helper';

const api = createAuthenticatedApi();

describe('SchemasController (e2e)', () => {
  beforeAll(async () => {
    await api.setup();
  });

  describe('Entity Definitions', () => {
    it('GET /api/definitions/entities - should return all entity definitions', async () => {
      const response = await api.get('/api/definitions/entities').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // E2E seed contains entity definitions for: book, author
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      // Verify book definition exists
      const bookDef = response.body.find((d: { entityType: string }) => d.entityType === 'book');
      expect(bookDef).toBeDefined();
      expect(bookDef.displayName).toBe('Book');
    });

    it('GET /api/definitions/entities/:entityType - should return book entity definition', async () => {
      const response = await api.get('/api/definitions/entities/book').expect(200);

      expect(response.body.entityType).toBe('book');
      expect(response.body.displayName).toBe('Book');
      expect(response.body.attributes).toBeDefined();
      expect(Array.isArray(response.body.attributes)).toBe(true);
    });

    it('GET /api/definitions/entities/:entityType - should return author entity definition', async () => {
      const response = await api.get('/api/definitions/entities/author').expect(200);

      expect(response.body.entityType).toBe('author');
      expect(response.body.displayName).toBe('Author');
    });

    it('GET /api/definitions/entities/:entityType - should return 404 for unknown type', async () => {
      await api.get('/api/definitions/entities/nonexistent').expect(404);
    });

    it('book definition should contain all field types', async () => {
      const response = await api.get('/api/definitions/entities/book').expect(200);

      const schema = response.body.attributes;

      // String fields
      expect(schema.find((f: { key: string }) => f.key === 'name')).toBeDefined();
      expect(schema.find((f: { key: string }) => f.key === 'isbn')).toBeDefined();

      // Text field
      expect(schema.find((f: { key: string }) => f.key === 'description')).toBeDefined();

      // Enum fields (typeRef)
      const genreField = schema.find((f: { key: string }) => f.key === 'genre');
      expect(genreField).toBeDefined();
      expect(genreField.typeRef).toBe('book_genre');

      // Array field (string[])
      const tagsField = schema.find((f: { key: string }) => f.key === 'tags');
      expect(tagsField).toBeDefined();
      expect(tagsField.isArray).toBe(true);

      // Date field
      expect(schema.find((f: { key: string }) => f.key === 'publicationDate')).toBeDefined();

      // Number fields
      expect(schema.find((f: { key: string }) => f.key === 'pageCount')).toBeDefined();
      expect(schema.find((f: { key: string }) => f.key === 'price')).toBeDefined();

      // Boolean fields
      expect(schema.find((f: { key: string }) => f.key === 'isAvailable')).toBeDefined();
      expect(schema.find((f: { key: string }) => f.key === 'isEbook')).toBeDefined();

      // Relation field
      const authorsField = schema.find((f: { key: string }) => f.key === 'authors');
      expect(authorsField).toBeDefined();
      expect(authorsField.type).toBe('relation');
    });
  });

  describe('Type Definitions', () => {
    it('GET /api/definitions/types - should return all type definitions', async () => {
      const response = await api.get('/api/definitions/types').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // E2E seed contains: book_genre, book_language, book_status, author_role, author_status
      expect(response.body.length).toBeGreaterThanOrEqual(5);
    });

    it('GET /api/definitions/types/:typeKey - should return book_genre type', async () => {
      const response = await api.get('/api/definitions/types/book_genre').expect(200);

      expect(response.body.typeKey).toBe('book_genre');
      expect(response.body.displayName).toBe('Book Genre');
      expect(response.body.options).toBeDefined();
      expect(Array.isArray(response.body.options)).toBe(true);

      // Should have expected genres
      const genres = response.body.options.map((o: { key: string }) => o.key);
      expect(genres).toContain('fiction');
      expect(genres).toContain('non-fiction');
      expect(genres).toContain('science');
    });

    it('GET /api/definitions/types/:typeKey - should return author_role type for relations', async () => {
      const response = await api.get('/api/definitions/types/author_role').expect(200);

      expect(response.body.typeKey).toBe('author_role');
      expect(response.body.options).toBeDefined();

      // Should have expected roles
      const roles = response.body.options.map((o: { key: string }) => o.key);
      expect(roles).toContain('main-author');
      expect(roles).toContain('co-author');
      expect(roles).toContain('editor');
      expect(roles).toContain('translator');
    });
  });

  describe('Relation Definitions', () => {
    it('GET /api/definitions/relations - should return all relation definitions', async () => {
      const response = await api.get('/api/definitions/relations').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // E2E seed contains book_written_by relation definition
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/definitions/relations/for-entity/book - should return relations for book', async () => {
      const response = await api.get('/api/definitions/relations/for-entity/book').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Should include book_written_by
      const writtenBy = response.body.find(
        (r: { relationType: string }) => r.relationType === 'book_written_by'
      );
      expect(writtenBy).toBeDefined();
      expect(writtenBy.fromEntityType).toBe('book');
      expect(writtenBy.toEntityType).toBe('author');
    });

    it('book_written_by relation should have attribute schema', async () => {
      const response = await api.get('/api/definitions/relations').expect(200);

      const writtenBy = response.body.find(
        (r: { relationType: string }) => r.relationType === 'book_written_by'
      );
      expect(writtenBy).toBeDefined();
      expect(writtenBy.attributeSchema).toBeDefined();
      expect(Array.isArray(writtenBy.attributeSchema)).toBe(true);

      // Should have role attribute
      const roleAttr = writtenBy.attributeSchema.find(
        (a: { key: string }) => a.key === 'role'
      );
      expect(roleAttr).toBeDefined();
      expect(roleAttr.typeRef).toBe('author_role');

      // Should have contribution attribute
      const contributionAttr = writtenBy.attributeSchema.find(
        (a: { key: string }) => a.key === 'contribution'
      );
      expect(contributionAttr).toBeDefined();
      expect(contributionAttr.type).toBe('number');
    });
  });
});
