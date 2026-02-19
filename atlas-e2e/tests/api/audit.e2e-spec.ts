/**
 * Audit System E2E API Tests
 *
 * Verifies that application actions correctly generate audit log entries
 * in the database.
 */
import { createAuthenticatedApi } from './helpers/auth-helper';
import { closeDbClient, getLatestAuditEventForEntity, getLatestAuditEventForEntityAndAction, query } from './helpers/db-helper';

const api = createAuthenticatedApi();

describe('Audit System (e2e)', () => {
    // Track entities created during tests for cleanup
    const createdEntityIds: string[] = [];
    let userId: string;

    beforeAll(async () => {
        await api.setup();
        const meResponse = await api.get('/api/auth/me');
        userId = meResponse.body.id;
        console.log(`[Audit Test] Current User ID: ${userId}`);
    });

    afterAll(async () => {
        // Clean up entities created during tests
        for (const id of createdEntityIds) {
            try {
                // Hard delete might be needed if soft delete is used, but API delete is fine for now.
                // If soft delete, audit log for delete should still appear.
                await api.delete(`/api/entities/book/${id}`);
            } catch {
                // Ignore cleanup errors
            }
        }
        await closeDbClient();
    });

    describe('Entity Lifecycle Audit', () => {
        it('should create audit log for entity creation', async () => {
            const createDto = {
                name: 'Audit Test Book',
                description: 'Created for audit log test',
                attributes: {
                    genre: 'non-fiction',
                    status: 'available',
                },
            };

            const response = await api.post('/api/entities/book').send(createDto).expect(201);
            const entityId = response.body.id;
            createdEntityIds.push(entityId);

            // Verify Entity Created
            expect(entityId).toBeDefined();

            // Check Audit Log
            // Wait a moment for async triggers if any (though usually synchronous in same transaction)
            // But here we are outside the transaction, so it should be immediate.
            const auditEvent = await getLatestAuditEventForEntity(entityId);

            expect(auditEvent).toBeDefined();
            expect(auditEvent.object_id).toBe(entityId);
            expect(auditEvent.object_kind).toBe('entity');
            expect(auditEvent.object_type).toBe('book');
            // Check action - tolerating flexible case or 'create'/'insert' terminology
            const action = auditEvent.action.toLowerCase();
            expect(['insert', 'create']).toContain(action);

            // Verify Source and Actor
            expect(auditEvent.source).toBe('application');
            expect(auditEvent.actor).toBe(userId);

            // Verify Data
            expect(auditEvent.after).toBeDefined();
            expect(auditEvent.after.name).toBe(createDto.name);
            expect(auditEvent.before).toBeNull();
        });

        it('should create audit log for entity update', async () => {
            // 1. Create
            const createResponse = await api.post('/api/entities/book').send({
                name: 'Audit Update Book',
                attributes: { genre: 'fiction' }
            }).expect(201);
            const entityId = createResponse.body.id;
            createdEntityIds.push(entityId);

            // 2. Update
            const updateDto = {
                name: 'Audit Update Book - Revised',
                attributes: { genre: 'science' }
            };
            await api.patch(`/api/entities/book/${entityId}`).send(updateDto).expect(200);

            // 3. Check Audit Log for Update
            // We want specifically the UPDATE action
            const auditEvent = await getLatestAuditEventForEntityAndAction(entityId, 'UPDATE');
            // Note: If trigger uses TG_OP it is usually uppercase. If mapped, could be lowercase.
            // Let's try case insensitive matching in helper or just get latest and check action.

            const latestEvent = await getLatestAuditEventForEntity(entityId);

            expect(latestEvent).toBeDefined();
            expect(latestEvent.object_id).toBe(entityId);

            const action = latestEvent.action.toLowerCase();
            expect(['update']).toContain(action);

            // Verify Changes
            expect(latestEvent.before).toBeDefined();
            expect(latestEvent.after).toBeDefined();

            expect(latestEvent.before.name).toBe('Audit Update Book');
            expect(latestEvent.after.name).toBe('Audit Update Book - Revised');

            expect(latestEvent.before.attributes.genre).toBe('fiction');
            expect(latestEvent.after.attributes.genre).toBe('science');
        });

        it('should create audit log for entity deletion', async () => {
            // 1. Create
            const createResponse = await api.post('/api/entities/book').send({
                name: 'Audit Delete Book',
                attributes: { genre: 'fiction' }
            }).expect(201);
            const entityId = createResponse.body.id;
            // Don't push to createdEntityIds for cleanup as we will delete it

            // 2. Delete
            await api.delete(`/api/entities/book/${entityId}`).expect(204);

            // 3. Check Audit Log for Delete
            const latestEvent = await getLatestAuditEventForEntity(entityId);

            expect(latestEvent).toBeDefined();
            expect(latestEvent.object_id).toBe(entityId);

            // Soft delete usually is an UPDATE setting deleted_at.
            // Hard delete is DELETE.
            // Rules say "Soft delete", so likely it's an UPDATE.
            // Let's check if it was an update or delete.
            // If soft delete, action is UPDATE. If Hard delete, action is DELETE.

            // The entity model has `deletedAt`.
            // `RecycleBin` usually implies soft delete.

            // If strictly soft delete, the audit log will show an UPDATE where `deleted_at` changed from null to timestamp.

            const action = latestEvent.action.toLowerCase();

            if (action === 'update') {
                // Verify it was a soft delete
                expect(latestEvent.before.deleted_at).toBeNull();
                expect(latestEvent.after.deleted_at).not.toBeNull();
            } else {
                expect(['delete']).toContain(action);
                expect(latestEvent.after).toBeNull();
            }
        });

        it('should create audit log for direct SQL update (mimicking admin/migration)', async () => {
            // 1. Create entity via API
            const createResponse = await api.post('/api/entities/book').send({
                name: 'Direct SQL Test Book',
                attributes: { genre: 'science' }
            }).expect(201);
            const entityId = createResponse.body.id;
            createdEntityIds.push(entityId);

            // 2. Perform Direct SQL Update (bypassing application logic/Prisma extension)
            // We use the db-helper to run a raw SQL update.
            // This runs outside the Prisma/Service context, so no app.current_user_id is set.
            await query(
                `UPDATE entities SET name = $1 WHERE id = $2`,
                ['Direct SQL Updated Name', entityId]
            );

            // 3. Verify Audit Log
            const auditEvent = await getLatestAuditEventForEntity(entityId);

            expect(auditEvent).toBeDefined();
            expect(auditEvent.object_id).toBe(entityId);

            // Action should be UPDATE
            expect(auditEvent.action.toLowerCase()).toBe('update');

            // Source should be 'direct_sql'
            expect(auditEvent.source).toBe('direct_sql');

            // Actor should be the DB user (db:atlas or similar)
            // In Docker/Test environment, user is 'atlas'
            expect(auditEvent.actor).toMatch(/^db:/);

            // Verify content change captured
            expect(auditEvent.before.name).toBe('Direct SQL Test Book');
            expect(auditEvent.after.name).toBe('Direct SQL Updated Name');
        });
    });
});
