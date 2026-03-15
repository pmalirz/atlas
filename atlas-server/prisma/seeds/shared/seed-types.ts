/**
 * Shared type definitions for the convention-based seed loader.
 *
 * These interfaces describe the shapes of JSON data files
 * found under each seed's `data/` directory.
 */

// ---------------------------------------------------------------------------
// Schema Definitions (metadata layer)
// ---------------------------------------------------------------------------

export interface TypeDefinitionData {
    typeKey: string;
    displayName: string;
    baseType: string;
    options: Array<{ key: string; displayName: string; description?: string }>;
}

export interface EntityDefinitionData {
    entityType: string;
    displayName: string;
    attributeSchema: Record<string, unknown>[];
}

export interface RelationDefinitionData {
    relationType: string;
    displayName: string;
    fromEntityType: string;
    toEntityType: string;
    attributeSchema?: Record<string, unknown>[];
}

// ---------------------------------------------------------------------------
// Instance Data (entity rows)
// ---------------------------------------------------------------------------

export interface EntityData {
    name: string;
    description: string;
    entityType: string;
    attributes: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Relation Instance Data (name-based resolution)
// ---------------------------------------------------------------------------

/**
 * A declarative relation record using entity **names** instead of IDs.
 * The seed loader resolves `fromEntityName` / `toEntityName` → UUID at runtime.
 */
export interface RelationData {
    relationType: string;
    fromEntityName: string;
    toEntityName: string;
    attributes?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// UI Configuration Data
// ---------------------------------------------------------------------------

export interface UIEntityConfigData {
    entityType: string;
    version: number;
    browseConfig: Record<string, unknown>;
    detailConfig: Record<string, unknown>;
}

export interface UIGlobalConfigData {
    items: Array<{
        entityType: string;
        displayName: string;
        icon: string;
        visible: boolean;
    }>;
}
