import { PrismaClient, Prisma } from '@prisma/client';

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

/**
 * Seed default roles for a tenant.
 */
export async function seedDefaultRoles(prisma: PrismaClient, tenantId: string = DEFAULT_TENANT_ID) {
    // Admin Role
    const adminRole = await prisma.role.upsert({
        where: { roles_name_tenant_unique: { name: 'Admin', tenantId } },
        create: {
            name: 'Admin',
            description: 'Full administrative access',
            tenantId,
        },
        update: {
            description: 'Full administrative access',
        },
    });

    await prisma.rolePermission.upsert({
        where: { role_permissions_role_resource_unique: { roleId: adminRole.id, resourceType: 'entity', resourceName: '*' } },
        create: {
            roleId: adminRole.id,
            resourceType: 'entity',
            resourceName: '*',
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
            readableAttributes: Prisma.DbNull,
            updatableAttributes: Prisma.DbNull,
        },
        update: {
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
            readableAttributes: Prisma.DbNull,
            updatableAttributes: Prisma.DbNull,
        },
    });

    // Viewer Role
    const viewerRole = await prisma.role.upsert({
        where: { roles_name_tenant_unique: { name: 'Viewer', tenantId } },
        create: {
            name: 'Viewer',
            description: 'Read-only access',
            tenantId,
        },
        update: {
            description: 'Read-only access',
        },
    });

    await prisma.rolePermission.upsert({
        where: { role_permissions_role_resource_unique: { roleId: viewerRole.id, resourceType: 'entity', resourceName: '*' } },
        create: {
            roleId: viewerRole.id,
            resourceType: 'entity',
            resourceName: '*',
            canCreate: false,
            canRead: true,
            canUpdate: false,
            canDelete: false,
            readableAttributes: Prisma.DbNull,
            updatableAttributes: [],
        },
        update: {
            canCreate: false,
            canRead: true,
            canUpdate: false,
            canDelete: false,
            readableAttributes: Prisma.DbNull,
            updatableAttributes: [],
        },
    });

    console.log(`  ✓ Default roles seeded: Admin, Viewer`);
    return { adminRole, viewerRole };
}
