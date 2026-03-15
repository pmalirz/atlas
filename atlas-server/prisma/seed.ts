import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const seedArgIndex = args.indexOf('--seed');
  const seedName = seedArgIndex !== -1 ? args[seedArgIndex + 1] : undefined;

  console.log('🌱 Seed runner started');

  if (!seedName) {
    console.log('ℹ️  No specific seed provided.');
    console.log('   Usage: npx prisma db seed -- --seed <name>');
    console.log('   Ensure latest migrations are applied before seeding.');

    const seedsDir = path.join(__dirname, 'seeds');
    if (fs.existsSync(seedsDir)) {
      console.log('   Available seeds:');
      const files = fs.readdirSync(seedsDir).filter((f) => f.endsWith('.ts'));
      files.forEach((f) => console.log(`   - ${f.replace('.ts', '')}`));
    }
    return;
  }

  const seedPath = path.join(__dirname, 'seeds', `${seedName}.ts`);

  if (!fs.existsSync(seedPath)) {
    console.error(`❌ Seed file not found: ${seedName}`);
    console.error(`   Looking for: ${seedPath}`);
    process.exit(1);
  }

  console.log(`🚀 Running seed: ${seedName}...`);
  console.log('ℹ️  Seeding expects the latest Prisma schema and migrations.');

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const seedModule = require(seedPath);
    if (typeof seedModule.seed === 'function') {
      await seedModule.seed(prisma);
      console.log(`✅ Seed ${seedName} completed successfully.`);
    } else {
      console.error(`❌ Seed file ${seedName} does not export a 'seed' function.`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error running seed ${seedName}:`, error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
