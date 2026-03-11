import { PrismaClient } from '@prisma/client';
import { seedModel } from './eap-model';
import { seedUI } from './eap-ui';
import { seedDefaultTenant, DEFAULT_TENANT_ID } from '../default-tenant';

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

    // Seed the entity model (types, schemas, entities, relations)
    await seedModel(prisma, DEFAULT_TENANT_ID);

    // Then seed the UI schemas
    await seedUI(prisma, DEFAULT_TENANT_ID);

    console.log('\n✅ Enterprise Application Portfolio seed completed!');
}
