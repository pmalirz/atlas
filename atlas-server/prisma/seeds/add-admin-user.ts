import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DEFAULT_TENANT_ID, seedDefaultTenant, seedDefaultRoles } from './default-tenant';

/**
 * Utility script to create a starting admin user with a specified email and password.
 * Usage: npx ts-node prisma/seeds/add-admin-user.ts <email> <password>
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length !== 2) {
        console.error('❌ Error: Missing required arguments.');
        console.error('Usage: npm run db:seed:addAdminUser <email> <password>');
        process.exit(1);
    }

    const [email, password] = args;
    const prisma = new PrismaClient();

    try {
        console.log(`🔐 Seeding Admin user with email: ${email}...`);

        // Ensure the default tenant exists first
        await seedDefaultTenant(prisma);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: {
                users_email_tenant_unique: { email, tenantId: DEFAULT_TENANT_ID }
            }
        });

        if (existingUser) {
            console.log(`ℹ️  User ${email} already exists. Updating password...`);
        } else {
            console.log(`ℹ️  Creating new user ${email}...`);
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Upsert the admin user
        const user = await prisma.user.upsert({
            where: {
                users_email_tenant_unique: { email, tenantId: DEFAULT_TENANT_ID }
            },
            update: {
                passwordHash,
                provider: 'native',
                emailVerified: true,
            },
            create: {
                email,
                passwordHash,
                name: 'Admin User',
                provider: 'native',
                emailVerified: true,
                tenantId: DEFAULT_TENANT_ID,
            },
        });

        // Seed default roles
        const roles = await seedDefaultRoles(prisma);

        // Assign Admin role to the user
        await prisma.userRole.upsert({
            where: {
                user_roles_user_role_unique: {
                    userId: user.id,
                    roleId: roles.adminRole.id,
                }
            },
            update: {},
            create: {
                userId: user.id,
                roleId: roles.adminRole.id,
                tenantId: DEFAULT_TENANT_ID,
            }
        });

        console.log(`✅ Successfully seeded admin user: ${user.email} with Admin role`);
    } catch (error) {
        console.error('❌ Failed to seed admin user:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
