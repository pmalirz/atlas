import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import { seedAuth } from './e2e-auth';
import { seedModel, seedUI } from '../shared/seed-loader';
import { seedDefaultTenant, seedDefaultRoles, DEFAULT_TENANT_ID } from '../default-tenant';

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
 *
 * All data is loaded from JSON files in ./data/ directory
 * via the shared convention-based seed loader.
 */

const DATA_DIR = path.join(__dirname, 'data');

export async function seed(prisma: PrismaClient) {
    console.log('🧪 Starting E2E Test seed...\n');

    // Seed the default tenant first
    await seedDefaultTenant(prisma);

    // Seed the entity model (types, schemas, entities, relations)
    // This will truncate all tables including users and roles
    await seedModel(prisma, DEFAULT_TENANT_ID, DATA_DIR);

    // Seed default roles for the tenant (AFTER seedModel)
    await seedDefaultRoles(prisma);

    // Seed auth user AFTER seedModel because it truncates the users table
    await seedAuth(prisma);

    // Then seed the UI schemas
    await seedUI(prisma, DEFAULT_TENANT_ID, DATA_DIR);

    console.log('\n✅ E2E Test seed completed!');
}
