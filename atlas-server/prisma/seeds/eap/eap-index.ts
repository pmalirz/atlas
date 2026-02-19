import { PrismaClient } from '@prisma/client';
import { seedModel } from './eap-model';
import { seedUI } from './eap-ui';

/**
 * Enterprise Application Portfolio (EAP) Seed
 * 
 * This seed combines:
 * - Entity Model (type definitions, schemas, relations, entities)
 * - UI Schemas (browse/detail configs for dynamic pages)
 */
export async function seed(prisma: PrismaClient) {
    console.log('🏢 Starting Enterprise Application Portfolio seed...\n');

    // Seed the entity model first (types, schemas, entities, relations)
    await seedModel(prisma);

    // Then seed the UI schemas
    await seedUI(prisma);

    console.log('\n✅ Enterprise Application Portfolio seed completed!');
}
