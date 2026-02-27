import { PrismaClient } from '@prisma/client';

/**
 * Default tenant ID — shared constant for all seeds.
 * Using a well-known UUID so that seeds and tests can reference it.
 */
export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const DEFAULT_TENANT_SLUG = 'myatlas';
export const DEFAULT_TENANT_NAME = 'MyAtlas';

/**
 * Seed the default tenant.
 * This is idempotent — upserts by ID.
 */
export async function seedDefaultTenant(prisma: PrismaClient) {
    const tenant = await prisma.tenant.upsert({
        where: { id: DEFAULT_TENANT_ID },
        create: {
            id: DEFAULT_TENANT_ID,
            name: DEFAULT_TENANT_NAME,
            displayName: 'My Atlas Workspace',
            description: 'Default Atlas tenant workspace',
            slug: DEFAULT_TENANT_SLUG,
            isActive: true,
        },
        update: {
            name: DEFAULT_TENANT_NAME,
            displayName: 'My Atlas Workspace',
            slug: DEFAULT_TENANT_SLUG,
        },
    });

    console.log(`  ✓ Default tenant seeded: ${tenant.name} (slug: ${tenant.slug})`);
    return tenant;
}
