import { PrismaClient } from '@prisma/client';
import { seedAuth } from './e2e-auth';
import { seedModel } from './e2e-model';
import { seedUI } from './e2e-ui';
import { seedDefaultTenant, DEFAULT_TENANT_ID } from '../default-tenant';

/**
 * E2E Test Seed
 * 
 * This seed provides a controlled dataset for E2E testing:
 * - Default tenant (always seeded first)
 * - Auth User (for login without registration)
 * - Entity Model (Book, Author with all field types)
 * - Relations with attributes (book_written_by)
 * - UI Schemas (browse/detail configs for dynamic pages)
 * 
 * Unlike the EAP seed, this is specifically designed for testing
 * with predictable, known data that tests can reference by key.
 */
export async function seed(prisma: PrismaClient) {
    console.log('🧪 Starting E2E Test seed...\n');

    // Seed the default tenant first
    await seedDefaultTenant(prisma);

    // Seed auth user first (for login during tests)
    await seedAuth(prisma);

    // Seed the entity model (types, schemas, entities, relations)
    await seedModel(prisma, DEFAULT_TENANT_ID);

    // Then seed the UI schemas
    await seedUI(prisma, DEFAULT_TENANT_ID);

    console.log('\n✅ E2E Test seed completed!');
}
