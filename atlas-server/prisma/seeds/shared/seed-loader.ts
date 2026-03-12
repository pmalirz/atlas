/**
 * Shared convention-based seed loader.
 *
 * Discovers JSON data files under a seed's `data/` directory by naming pattern:
 *
 *   type-definitions.json        → TypeDefinition upserts
 *   entity-definitions.json      → EntityDefinition upserts
 *   relation-definitions.json    → RelationDefinition upserts
 *   entity-*.json                → Entity creates (auto-discovered)
 *   relations.json               → Relation creates (name-based resolution)
 *   ui-entity-configs.json       → UIEntityConfig creates
 *   ui-global-config.json        → UIGlobalConfig + menu
 *
 * Usage from a seed index:
 *
 *   import { seedModel, seedUI } from '../shared/seed-loader';
 *   const dataDir = path.join(__dirname, 'data');
 *   await seedModel(prisma, tenantId, dataDir);
 *   await seedUI(prisma, tenantId, dataDir);
 */

import { PrismaClient, Entity, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import {
    TypeDefinitionDataSchema,
    AttributeDefinitionArraySchema,
    RelationDefinitionDataSchema,
    UIEntityConfigDataSchema,
    MenuConfigSchema,
} from 'atlas-shared/zod';
import type {
    TypeDefinitionData,
    EntityDefinitionData,
    RelationDefinitionData,
    EntityData,
    RelationData,
    UIEntityConfigData,
    UIGlobalConfigData,
} from './seed-types';

// ============================================================================
// JSON Loader
// ============================================================================

/**
 * Load and parse a JSON file from the given directory.
 * Returns `undefined` if the file does not exist (allows optional files).
 */
export function loadJson<T>(dataDir: string, filename: string): T | undefined {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) return undefined;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
}

/**
 * Load a JSON file – throws if not found (required file).
 */
function requireJson<T>(dataDir: string, filename: string): T {
    const data = loadJson<T>(dataDir, filename);
    if (data === undefined) {
        throw new Error(`Required seed file not found: ${path.join(dataDir, filename)}`);
    }
    return data;
}

/**
 * Discover all files matching a glob-like prefix in a directory.
 * Returns sorted filenames (for deterministic ordering).
 */
function discoverFiles(dataDir: string, prefix: string, extension: string, exclude: string[] = []): string[] {
    if (!fs.existsSync(dataDir)) return [];
    return fs
        .readdirSync(dataDir)
        .filter((f) => f.startsWith(prefix) && f.endsWith(extension) && !exclude.includes(f))
        .sort();
}

// ============================================================================
// Model Seeding
// ============================================================================

/**
 * Seed the full data model from JSON files in `dataDir`.
 *
 * Execution order:
 * 1. Clear existing data (TRUNCATE CASCADE)
 * 2. Type definitions
 * 3. Entity definitions
 * 4. Relation definitions
 * 5. Entity instances (auto-discovered `entity-*.json`)
 * 6. Relation instances (`relations.json`, name-based resolution)
 */
export async function seedModel(
    prisma: PrismaClient,
    tenantId: string,
    dataDir: string,
): Promise<void> {
    console.log('🌱 Seeding data model...\n');

    // 1. Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.$executeRawUnsafe(`
        TRUNCATE TABLE
            email_verification_tokens,
            password_reset_tokens,
            users,
            audit_events,
            relations,
            entities,
            entity_definitions,
            relation_definitions,
            type_definitions,
            ui_entity_config,
            ui_global_config
        CASCADE;
    `);
    console.log('✓ Data cleared\n');

    // 2. Type Definitions
    console.log('📋 Seeding type definitions...');
    const types = await seedTypeDefinitions(prisma, tenantId, dataDir);
    console.log(`   Created ${types.length} type definitions\n`);

    // 3. Entity Definitions
    console.log('📐 Seeding entity definitions...');
    const entityDefs = await seedEntityDefinitions(prisma, tenantId, dataDir);
    console.log(`   Created ${entityDefs.length} entity definitions\n`);

    // 4. Relation Definitions
    console.log('🔗 Seeding relation definitions...');
    const relDefs = await seedRelationDefinitions(prisma, tenantId, dataDir);
    console.log(`   Created ${relDefs.length} relation definitions\n`);

    // 5. Entity instances (auto-discover entity-*.json files)
    const allEntities = await discoverAndSeedEntities(prisma, tenantId, dataDir);

    // 6. Relation instances
    const relCount = await seedRelations(prisma, tenantId, dataDir, allEntities);
    console.log(`   Created ${relCount} relations\n`);

    // Summary
    const totalEntities = await prisma.entity.count();
    console.log('✅ Model seed completed!');
    console.log(`   Total entities: ${totalEntities}\n`);
}

// ============================================================================
// Schema Definition Seeders
// ============================================================================

export async function seedTypeDefinitions(
    prisma: PrismaClient,
    tenantId: string,
    dataDir: string,
) {
    const types = requireJson<TypeDefinitionData[]>(dataDir, 'type-definitions.json');

    return Promise.all(
        types.map((t) => {
            TypeDefinitionDataSchema.parse(t);
            return prisma.typeDefinition.upsert({
                where: { type_definitions_key_tenant_unique: { typeKey: t.typeKey, tenantId } },
                update: {
                    displayName: t.displayName,
                    baseType: t.baseType as string,
                    options: t.options,
                },
                create: {
                    typeKey: t.typeKey,
                    displayName: t.displayName,
                    baseType: t.baseType as string,
                    options: t.options,
                    tenantId,
                },
            });
        }),
    );
}

export async function seedEntityDefinitions(
    prisma: PrismaClient,
    tenantId: string,
    dataDir: string,
) {
    const definitions = requireJson<EntityDefinitionData[]>(dataDir, 'entity-definitions.json');

    return Promise.all(
        definitions.map((d) => {
            AttributeDefinitionArraySchema.parse(d.attributeSchema);
            return prisma.entityDefinition.upsert({
                where: { entity_definitions_type_tenant_unique: { entityType: d.entityType, tenantId } },
                update: {
                    displayName: d.displayName,
                    attributeSchema: d.attributeSchema as Prisma.InputJsonValue,
                },
                create: {
                    entityType: d.entityType,
                    displayName: d.displayName,
                    attributeSchema: d.attributeSchema as Prisma.InputJsonValue,
                    tenantId,
                },
            });
        }),
    );
}

export async function seedRelationDefinitions(
    prisma: PrismaClient,
    tenantId: string,
    dataDir: string,
) {
    const definitions = requireJson<RelationDefinitionData[]>(dataDir, 'relation-definitions.json');

    return Promise.all(
        definitions.map((d) => {
            RelationDefinitionDataSchema.parse(d);
            return prisma.relationDefinition.upsert({
                where: { relation_definitions_type_tenant_unique: { relationType: d.relationType, tenantId } },
                update: {
                    displayName: d.displayName,
                    fromEntityType: d.fromEntityType,
                    toEntityType: d.toEntityType,
                    isDirectional: d.isDirectional,
                    attributeSchema: (d.attributeSchema ?? []) as Prisma.InputJsonValue,
                },
                create: {
                    relationType: d.relationType,
                    displayName: d.displayName,
                    fromEntityType: d.fromEntityType,
                    toEntityType: d.toEntityType,
                    isDirectional: d.isDirectional,
                    attributeSchema: (d.attributeSchema ?? []) as Prisma.InputJsonValue,
                    tenantId,
                },
            });
        }),
    );
}

// ============================================================================
// Entity Instance Seeders
// ============================================================================

/**
 * Seed entities from a single `entity-*.json` file.
 */
export async function seedEntitiesFromFile(
    prisma: PrismaClient,
    tenantId: string,
    dataDir: string,
    filename: string,
): Promise<Entity[]> {
    const entities = requireJson<EntityData[]>(dataDir, filename);

    return Promise.all(
        entities.map((e) =>
            prisma.entity.create({
                data: {
                    name: e.name,
                    description: e.description,
                    entityType: e.entityType,
                    attributes: e.attributes as Prisma.InputJsonValue,
                    updatedBy: 'seed',
                    tenantId,
                },
            }),
        ),
    );
}

/**
 * Auto-discover and seed all `entity-*.json` files in `dataDir`.
 * Returns a flat array of all created entities (for relation resolution).
 */
export async function discoverAndSeedEntities(
    prisma: PrismaClient,
    tenantId: string,
    dataDir: string,
): Promise<Entity[]> {
    const entityFiles = discoverFiles(dataDir, 'entity-', '.json', ['entity-definitions.json']);
    const allEntities: Entity[] = [];

    for (const filename of entityFiles) {
        const label = filename.replace('entity-', '').replace('.json', '');
        console.log(`📦 Seeding ${label}...`);
        const created = await seedEntitiesFromFile(prisma, tenantId, dataDir, filename);
        console.log(`   Created ${created.length} ${label}\n`);
        allEntities.push(...created);
    }

    return allEntities;
}

// ============================================================================
// Relation Instance Seeder (Name-Based Resolution)
// ============================================================================

/**
 * Seed relations from `relations.json`.
 * Resolves entity names → IDs using the `allEntities` array from prior seeding.
 */
export async function seedRelations(
    prisma: PrismaClient,
    tenantId: string,
    dataDir: string,
    allEntities: Entity[],
): Promise<number> {
    const relations = loadJson<RelationData[]>(dataDir, 'relations.json');
    if (!relations || relations.length === 0) return 0;

    console.log('🔗 Seeding relations...');

    const findEntity = (name: string): Entity | undefined =>
        allEntities.find((e) => e.name === name);

    let count = 0;
    for (const rel of relations) {
        const fromEntity = findEntity(rel.fromEntityName);
        const toEntity = findEntity(rel.toEntityName);

        if (!fromEntity) {
            console.warn(`   ⚠️  Could not find entity: "${rel.fromEntityName}"`);
            continue;
        }
        if (!toEntity) {
            console.warn(`   ⚠️  Could not find entity: "${rel.toEntityName}"`);
            continue;
        }

        await prisma.relation.create({
            data: {
                relationType: rel.relationType,
                fromEntityId: fromEntity.id,
                toEntityId: toEntity.id,
                attributes: (rel.attributes ?? {}) as Prisma.InputJsonValue,
                updatedBy: 'seed',
                tenantId,
            },
        });
        count++;
    }

    return count;
}

// ============================================================================
// UI Seeding
// ============================================================================

/**
 * Seed UI configuration from JSON files in `dataDir`.
 *
 * Looks for:
 *   ui-entity-configs.json  → UIEntityConfig creates
 *   ui-global-config.json   → UIGlobalConfig + menu
 */
export async function seedUI(
    prisma: PrismaClient,
    tenantId: string,
    dataDir: string,
): Promise<void> {
    console.log('🎨 Seeding UI configuration...');

    // Cleanup UI configs
    await prisma.uIEntityConfig.deleteMany({});
    await prisma.uIGlobalConfig.deleteMany({});

    // Entity configs
    const uiConfigs = loadJson<UIEntityConfigData[]>(dataDir, 'ui-entity-configs.json');
    if (uiConfigs) {
        for (const config of uiConfigs) {
            UIEntityConfigDataSchema.parse(config);
            await prisma.uIEntityConfig.create({
                data: {
                    entityType: config.entityType,
                    version: config.version,
                    browseConfig: config.browseConfig as Prisma.InputJsonValue,
                    detailConfig: config.detailConfig as Prisma.InputJsonValue,
                    tenantId,
                },
            });
            console.log(`   ✓ Created UI config for ${config.entityType}`);
        }
    }

    // Global config (menu)
    const menuConfig = loadJson<UIGlobalConfigData>(dataDir, 'ui-global-config.json');
    if (menuConfig) {
        MenuConfigSchema.parse(menuConfig);
        await prisma.uIGlobalConfig.create({
            data: { menuConfig: menuConfig as unknown as Prisma.InputJsonValue, version: 1, tenantId },
        });
        console.log('   ✓ Created menu configuration');
    }

    console.log('\n✅ UI configuration completed!');
}
