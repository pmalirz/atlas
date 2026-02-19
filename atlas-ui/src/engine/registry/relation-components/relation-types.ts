/**
 * Relation Component Types
 * Types and interfaces for dynamic relation rendering components
 */

import type { FieldSchema, RelationComponentType, RelationAttributeSchema } from '../../schema/types';
import type { AttributeValues } from '@app-atlas/shared';

// Re-export for convenience
export type { RelationAttributeSchema };

// ─────────────────────────────────────────────────────────────
// RELATION ITEM TYPES
// ─────────────────────────────────────────────────────────────

/**
 * Represents a single relation item (link between entities).
 */
export interface RelationItem {
    id: string;                             // Relation ID
    targetId: string;                       // Related entity ID
    targetName: string;                     // Display name of related entity
    targetEntityType?: string;              // Type of the related entity
    attributes?: AttributeValues;   // Relation attributes (e.g., ownershipRole)
}

/**
 * Summary of an entity for selection in relation components.
 */
export interface EntitySummary {
    id: string;
    name: string;
    description?: string;
    entityType: string;
    attributes?: AttributeValues;
}

// ─────────────────────────────────────────────────────────────
// RELATION DEFINITION (from backend)
// ─────────────────────────────────────────────────────────────

/**
 * Relation definition from the database (RelationDefinition table).
 */
export interface RelationDefinition {
    id: string;
    relationType: string;
    displayName: string;
    fromEntityType?: string;
    toEntityType?: string;
    isDirectional: boolean;
    attributeSchema?: RelationAttributeSchema[];
}

// ─────────────────────────────────────────────────────────────
// RELATION COMPONENT PROPS
// ─────────────────────────────────────────────────────────────

/**
 * Props interface for all relation components.
 * Components receive entity context, field configuration, and change handlers.
 */
export interface RelationComponentProps {
    // Entity context
    entityId: string;
    entityType: string;

    // Field configuration (from EntitySchema)
    fieldSchema: FieldSchema;

    // Relation definition (from RelationDefinition table)
    relationDefinition?: RelationDefinition;

    // Current relation values
    value: RelationItem[];

    // Change handler - called when relations are added/removed/modified
    onChange: (value: RelationItem[]) => void;

    // State
    readonly?: boolean;
    disabled?: boolean;
    error?: string;
}

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Infer relation direction based on RelationDefinition and current entity type.
 *
 * Auto-detection logic:
 * 1. Check fieldSchema.side for explicit override (used for symmetric relations)
 * 2. Check if current entity type is in fromEntityTypes → 'outgoing'
 * 3. Check if current entity type is in toEntityTypes → 'incoming'
 * 4. Default to 'outgoing' with warning for symmetric relations
 */
export function inferRelationDirection(
    currentEntityType: string,
    relationDef?: RelationDefinition,
    fieldSchema?: FieldSchema
): 'outgoing' | 'incoming' {
    // 1. Explicit override via 'side' (for symmetric relations)
    if (fieldSchema?.side === 'from') return 'outgoing';
    if (fieldSchema?.side === 'to') return 'incoming';

    // If no relation definition, default to outgoing
    if (!relationDef) return 'outgoing';

    const isFrom = relationDef.fromEntityType === currentEntityType;
    const isTo = relationDef.toEntityType === currentEntityType;

    // Symmetric relation (entity type on both sides) without explicit side
    if (isFrom && isTo) {
        if (import.meta.env.DEV) {
            console.warn(
                `[Relation] Symmetric relation "${relationDef.relationType}" for entity type "${currentEntityType}" ` +
                `without explicit "side" attribute - defaulting to "from" (outgoing). ` +
                `Consider adding side: 'from' | 'to' to the field in EntitySchema.`
            );
        }
        return 'outgoing';
    }

    // Standard case: deduce from relation definition
    if (isTo && !isFrom) return 'incoming';
    return 'outgoing';
}

/**
 * Infer the component type for a relation based on its characteristics.
 * Uses auto-detection logic:
 * - incoming relation (entity is in toEntityTypes) → 'panel'
 * - has attributeSchema → 'dialog'
 * - default → 'tags'
 */
export function inferRelationComponentType(
    fieldSchema: FieldSchema,
    relationDef?: RelationDefinition,
    currentEntityType?: string
): RelationComponentType {
    // Explicit override takes precedence
    if (fieldSchema.relation?.componentType) {
        return fieldSchema.relation.componentType;
    }

    // Auto-detect direction and use panel for incoming
    if (
        currentEntityType &&
        relationDef &&
        inferRelationDirection(currentEntityType, relationDef, fieldSchema) === 'incoming'
    ) {
        return 'panel';
    }

    // Has attributes → dialog
    if (relationDef?.attributeSchema && relationDef.attributeSchema.length > 0) {
        return 'dialog';
    }

    // Simple relation → tags (default)
    return 'tags';
}

/**
 * Get the target entity type from field schema or relation definition.
 */
export function getTargetEntityType(
    fieldSchema: FieldSchema,
    relationDef?: RelationDefinition
): string | undefined {
    // Explicit config takes precedence
    if (fieldSchema.relation?.targetEntityType) {
        return fieldSchema.relation.targetEntityType;
    }

    // Infer from relation definition
    if (relationDef?.toEntityType) {
        return relationDef.toEntityType;
    }

    return undefined;
}
