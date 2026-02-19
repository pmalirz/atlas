import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * E2E Auth Seeder
 * 
 * Creates a test user for E2E tests with known credentials.
 * This allows tests to log in without going through registration each time.
 */

// Well-known test user credentials - used in tests
export const E2E_TEST_USER = {
    email: 'e2e-test@atlas.local',
    password: 'e2e-test-password-123',
    name: 'E2E Test User',
};

// Default tenant ID for E2E tests
const E2E_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export async function seedAuth(prisma: PrismaClient) {
    console.log('🔐 Seeding E2E Auth user...\n');

    // Delete existing test user if exists
    await prisma.user.deleteMany({
        where: { email: E2E_TEST_USER.email }
    });

    // Hash the password
    const passwordHash = await bcrypt.hash(E2E_TEST_USER.password, 10);

    // Create the test user
    const user = await prisma.user.create({
        data: {
            email: E2E_TEST_USER.email,
            passwordHash,
            name: E2E_TEST_USER.name,
            provider: 'native',
            emailVerified: true,
            tenantId: E2E_TENANT_ID,
        },
    });

    console.log(`   ✔ Created test user: ${user.email}`);
    console.log('');
}
