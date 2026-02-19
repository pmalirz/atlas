
// ─────────────────────────────────────────────────────────────
// Core Type Definitions (Shared)
// ─────────────────────────────────────────────────────────────

import { AttributeDefinition } from '@app-atlas/shared';

// Re-export AttributeDefinition so it can be used by other modules
export { AttributeDefinition };

/**
 * Resolved attribute with expanded type references
 */
export interface ResolvedAttributeDefinition extends AttributeDefinition {
    resolvedOptions?: string[];
    resolvedBaseType?: string;
}

// ─────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────

export interface EntityDefinitionResponse {
    id: string;
    entityType: string;
    displayName: string;
    attributes: AttributeDefinition[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ResolvedEntityDefinition extends EntityDefinitionResponse {
    resolvedAttributes: ResolvedAttributeDefinition[];
}

export interface TypeDefinitionResponse {
    id: string;
    typeKey: string;
    displayName: string;
    baseType: string;
    options: string[] | null;
    validation: Record<string, unknown> | null;
}

export interface RelationDefinitionResponse {
    id: string;
    relationType: string;
    displayName: string;
    fromEntityType: string | null;
    toEntityType: string | null;
    isDirectional: boolean;
    attributeSchema: AttributeDefinition[] | null;
}
