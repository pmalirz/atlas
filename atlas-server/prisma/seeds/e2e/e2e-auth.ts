import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DEFAULT_TENANT_ID, seedDefaultRoles } from '../default-tenant';

/**
 * E2E Auth Seeder
 * 
 * Creates a test user for E2E tests with known credentials.
 * This allows tests to log in without going through registration each time.
 */

// Well-known test user credentials - used in tests
export const E2E_ADMIN_USER = {
    email: 'e2e-admin@atlas.local',
    password: 'admin',
    name: 'E2E Admin',
};

export const E2E_READONLY_USER = {
    email: 'e2e-readonly-user@atlas.local',
    password: 'readonly',
    name: 'E2E Readonly User',
};

export const E2E_REGULAR_USER = {
    email: 'e2e-regular-user@atlas.local',
    password: 'regular',
    name: 'E2E Regular User',
};

// Backward-compatible alias used by existing tests/helpers
export const E2E_TEST_USER = E2E_ADMIN_USER;

async function createUserWithRole(
    prisma: PrismaClient,
    userDef: { email: string; password: string; name: string },
    roleId: string,
) {
    const passwordHash = await bcrypt.hash(userDef.password, 10);

    const user = await prisma.user.create({
        data: {
            email: userDef.email,
            passwordHash,
            name: userDef.name,
            provider: 'native',
            emailVerified: true,
            tenantId: DEFAULT_TENANT_ID,
        },
    });

    await prisma.userRole.create({
        data: {
            userId: user.id,
            roleId,
            tenantId: DEFAULT_TENANT_ID,
        },
    });

    return user;
}

export async function seedAuth(prisma: PrismaClient) {
    console.log('🔐 Seeding E2E Auth users...\n');

    // Delete existing test users if they exist
    await prisma.user.deleteMany({
        where: {
            email: {
                in: [
                    E2E_ADMIN_USER.email,
                    E2E_READONLY_USER.email,
                    E2E_REGULAR_USER.email,
                ],
            },
        },
    });

    // Seed roles to ensure we have Admin and Viewer
    const roles = await seedDefaultRoles(prisma);

    // E2E role with selective book-attribute write access
    const regularBookEditorRole = await prisma.role.upsert({
        where: {
            roles_name_tenant_unique: {
                name: 'E2E Book Attribute Editor',
                tenantId: DEFAULT_TENANT_ID,
            },
        },
        create: {
            name: 'E2E Book Attribute Editor',
            description: 'Can update only selected attributes on book entities for e2e RBAC tests',
            tenantId: DEFAULT_TENANT_ID,
        },
        update: {
            description: 'Can update only selected attributes on book entities for e2e RBAC tests',
        },
    });

    await prisma.rolePermission.upsert({
        where: {
            role_permissions_role_resource_unique: {
                roleId: regularBookEditorRole.id,
                resourceType: 'entity',
                resourceName: 'book',
            },
        },
        create: {
            roleId: regularBookEditorRole.id,
            resourceType: 'entity',
            resourceName: 'book',
            canCreate: false,
            canRead: true,
            canUpdate: true,
            canDelete: false,
            readableAttributes: Prisma.DbNull,
            updatableAttributes: ['status', 'tags', 'rating'],
        },
        update: {
            canCreate: false,
            canRead: true,
            canUpdate: true,
            canDelete: false,
            readableAttributes: Prisma.DbNull,
            updatableAttributes: ['status', 'tags', 'rating'],
        },
    });

    const adminUser = await createUserWithRole(prisma, E2E_ADMIN_USER, roles.adminRole.id);
    const readonlyUser = await createUserWithRole(prisma, E2E_READONLY_USER, roles.viewerRole.id);
    const regularUser = await createUserWithRole(prisma, E2E_REGULAR_USER, regularBookEditorRole.id);

    console.log(`   ✔ Created test user: ${adminUser.email} (Admin)`);
    console.log(`   ✔ Created test user: ${readonlyUser.email} (Viewer / Read-only)`);
    console.log(`   ✔ Created test user: ${regularUser.email} (E2E Book Attribute Editor)`);
    console.log('');
}
