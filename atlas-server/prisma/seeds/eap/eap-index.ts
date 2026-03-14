import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import { seedDefaultTenant, seedDefaultRoles, DEFAULT_TENANT_ID } from '../default-tenant';
import { seedModel, seedUI } from '../shared/seed-loader';

/**
 * Enterprise Application Portfolio (EAP) Seed
 * 
 * This seed combines:
 * - Default tenant (always seeded first)
 * - Entity Model (type definitions, schemas, relations, entities)
 * - UI Schemas (browse/detail configs for dynamic pages)
 */
export async function seed(prisma: PrismaClient) {
    console.log('🏢 Starting Enterprise Application Portfolio seed...\n');

    // Seed the default tenant first
    await seedDefaultTenant(prisma);

    // Get the path to the EAP seed data directory
    const dataDir = path.join(__dirname, 'data');

    // Seed the entity model (types, schemas, entities, relations)
    await seedModel(prisma, DEFAULT_TENANT_ID, dataDir);

    // Seed default roles for the tenant (AFTER seedModel)
    await seedDefaultRoles(prisma);

    // Then seed the UI schemas
    await seedUI(prisma, DEFAULT_TENANT_ID, dataDir);

    console.log('\n✅ Enterprise Application Portfolio seed completed!');
}
