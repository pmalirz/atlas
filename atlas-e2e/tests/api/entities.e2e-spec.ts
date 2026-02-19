/**
 * Entities E2E API Tests
 * 
 * These tests call the REST API via HTTP only - no direct database access.
 * They rely on E2E seed data being present (book, author entities).
 */
import request from 'supertest';
import { createAuthenticatedApi } from './helpers/auth-helper';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const api = createAuthenticatedApi();

describe('EntitiesController (e2e)', () => {
  // Track entities created during tests for cleanup
  const createdEntityIds: string[] = [];

  beforeAll(async () => {
    await api.setup();
  });

  afterAll(async () => {
    // Clean up entities created during tests
    for (const id of createdEntityIds) {
      try {
        await api.delete(`/api/entities/book/${id}`);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('GET /api/entities/:entityType', () => {
    it('should return 400 for unknown entity type', async () => {
      const response = await api.get('/api/entities/unknown_type').expect(400);
      expect(response.body.message).toContain('Unknown entity type');
    });

    it('should return list of books (from E2E seed)', async () => {
      const response = await api.get('/api/entities/book').expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      // E2E seed contains 4 books
      expect(response.body.data.length).toBeGreaterThanOrEqual(4);
    });

    it('should return list of authors (from E2E seed)', async () => {
      const response = await api.get('/api/entities/author').expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      // E2E seed contains 4 authors
      expect(response.body.data.length).toBeGreaterThanOrEqual(4);
    });

    it('should find known book by name - Clean Code', async () => {
      const response = await api.get('/api/entities/book').expect(200);

      const cleanCode = response.body.data.find(
        (b: { name: string }) => b.name === 'Clean Code'
      );
      expect(cleanCode).toBeDefined();
      expect(cleanCode.attributes.isbn).toBe('978-0132350884');
      expect(cleanCode.attributes.genre).toBe('non-fiction');
    });

    it('should find known author by name - Robert C. Martin', async () => {
      const response = await api.get('/api/entities/author').expect(200);

      const unclebob = response.body.data.find(
        (a: { name: string }) => a.name === 'Robert C. Martin'
      );
      expect(unclebob).toBeDefined();
      expect(unclebob.attributes.nationality).toBe('American');
      expect(unclebob.attributes.isVerified).toBe(true);
    });
  });

  describe('CRUD Operations', () => {
    it('should create a new book', async () => {
      const createDto = {
        name: 'E2E Test Book',
        description: 'Created via e2e test',
        attributes: {
          genre: 'fiction',
          status: 'available',
          language: 'en',
          pageCount: 200,
          isAvailable: true,
        },
      };

      const response = await api.post('/api/entities/book').send(createDto).expect(201);

      expect(response.body.name).toBe(createDto.name);
      expect(response.body.description).toBe(createDto.description);
      expect(response.body.entityType).toBe('book');
      expect(response.body.attributes.genre).toBe('fiction');
      expect(response.body.id).toBeDefined();

      createdEntityIds.push(response.body.id);
    });

    it('should get book by ID', async () => {
      // First create an entity
      const createResponse = await api
        .post('/api/entities/book')
        .send({
          name: 'Get Test Book',
          attributes: { genre: 'science', status: 'available' },
        })
        .expect(201);

      const entityId = createResponse.body.id;
      createdEntityIds.push(entityId);

      // Then fetch it
      const response = await api.get(`/api/entities/book/${entityId}`).expect(200);

      expect(response.body.id).toBe(entityId);
      expect(response.body.name).toBe('Get Test Book');
    });

    it('should update book', async () => {
      // Create entity
      const createResponse = await api
        .post('/api/entities/book')
        .send({
          name: 'Update Test Book',
          attributes: { genre: 'fiction', status: 'available' },
        })
        .expect(201);

      const entityId = createResponse.body.id;
      createdEntityIds.push(entityId);

      // Update it
      const updateResponse = await api
        .patch(`/api/entities/book/${entityId}`)
        .send({
          name: 'Updated Book Title',
          attributes: { status: 'borrowed' },
        })
        .expect(200);

      expect(updateResponse.body.name).toBe('Updated Book Title');
      expect(updateResponse.body.attributes.status).toBe('borrowed');
    });

    it('should delete book', async () => {
      // Create entity
      const createResponse = await api
        .post('/api/entities/book')
        .send({
          name: 'Delete Test Book',
          attributes: { genre: 'fiction', status: 'available' },
        })
        .expect(201);

      const entityId = createResponse.body.id;

      // Delete it
      await api.delete(`/api/entities/book/${entityId}`).expect(204);

      // Verify it's gone
      await api.get(`/api/entities/book/${entityId}`).expect(404);
    });
  });

  describe('Validation', () => {
    it('should reject book with missing required name', async () => {
      const response = await api
        .post('/api/entities/book')
        .send({
          description: 'No name provided',
          attributes: { genre: 'fiction', status: 'available' },
        })
        .expect(400);

      const message = response.body.message;
      if (Array.isArray(message)) {
        expect(message.some((m: string) => m.includes('name'))).toBe(true);
      } else {
        expect(message).toContain('name');
      }
    });

    it('should reject book with invalid enum value', async () => {
      const response = await api
        .post('/api/entities/book')
        .send({
          name: 'Invalid Genre Book',
          attributes: { genre: 'invalid_genre', status: 'available' },
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('Field Types Verification', () => {
    it('should handle all field types correctly', async () => {
      const createDto = {
        name: 'All Fields Test Book',
        description: 'Testing all field types',
        attributes: {
          // String
          isbn: '123-4567890123',
          publisher: 'Test Publisher',
          // Enum (single select)
          genre: 'science',
          language: 'pl',
          status: 'reserved',
          // Array (multi-select)
          tags: ['test', 'e2e', 'automation'],
          // Date
          publicationDate: '2024-06-15',
          // Number
          pageCount: 500,
          price: 39.99,
          rating: 4,
          // Boolean
          isAvailable: false,
          isEbook: true,
        },
      };

      const response = await api.post('/api/entities/book').send(createDto).expect(201);

      createdEntityIds.push(response.body.id);

      // Verify all field types are stored correctly
      expect(response.body.attributes.isbn).toBe('123-4567890123');
      expect(response.body.attributes.genre).toBe('science');
      expect(response.body.attributes.tags).toEqual(['test', 'e2e', 'automation']);
      expect(response.body.attributes.publicationDate).toBe('2024-06-15');
      expect(response.body.attributes.pageCount).toBe(500);
      expect(response.body.attributes.price).toBe(39.99);
      expect(response.body.attributes.isAvailable).toBe(false);
      expect(response.body.attributes.isEbook).toBe(true);
    });
  });
});
