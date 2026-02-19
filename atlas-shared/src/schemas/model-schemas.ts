// =============================================================================
// Model Schemas - Zod validation for core data model structures
// =============================================================================
// These schemas validate the JSON content stored in database columns:
// - EntityDefinition.attributeSchema (JSON array of AttributeDefinition)
// - RelationDefinition.attributeSchema (JSON array of AttributeDefinition)
// - TypeDefinition (options, validation)
// =============================================================================

import { z } from 'zod';

// =============================================================================
// Field/Attribute Types
// =============================================================================

/**
 * Available base types for attributes.
 * - string: Short text input
 * - text: Multi-line text area
 * - number: Integer numbers
 * - decimal: Floating point numbers
 * - boolean: True/false toggle
 * - date: Date only (YYYY-MM-DD)
 * - datetime: Full timestamp
 * - relation: Foreign key to another entity
 */
export const AttributeBaseTypeSchema = z.enum([
    'string',
    'text',
    'number',
    'decimal',
    'boolean',
    'date',
    'datetime',
    'relation',
]);
export type AttributeBaseType = z.infer<typeof AttributeBaseTypeSchema>;

// =============================================================================
// Attribute Value Types (Runtime Values)
// =============================================================================

/**
 * Primitive value types for attribute values.
 * These correspond to the base types in AttributeBaseType.
 * 
 * Mapping:
 * - 'string' | 'text' → string
 * - 'number' | 'decimal' → number
 * - 'boolean' → boolean
 * - 'date' | 'datetime' → Date | string (ISO format)
 * - null for optional/empty values
 */
export const AttributePrimitiveValueSchema = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.date(),
    z.null(),
]);
export type AttributePrimitiveValue = z.infer<typeof AttributePrimitiveValueSchema>;

/**
 * Single attribute value (primitive or array of primitives).
 * Used when isArray is true in AttributeDefinition.
 */
export const AttributeValueSchema = z.union([
    AttributePrimitiveValueSchema,
    z.array(AttributePrimitiveValueSchema),
]);
export type AttributeValue = z.infer<typeof AttributeValueSchema>;

/**
 * Type-safe attributes record for entity and relation instances.
 * Replaces Record<string, unknown> for better type safety.
 * 
 * Usage:
 * - Entity.attributes: AttributeValues
 * - Relation.attributes: AttributeValues
 * - CreateEntityDto.attributes: AttributeValues
 */
export const AttributeValuesSchema = z.record(z.string(), AttributeValueSchema);
export type AttributeValues = z.infer<typeof AttributeValuesSchema>;

// =============================================================================
// Validation Schema
// =============================================================================

/**
 * Validation rules for attribute values.
 * Applied during entity create/update operations.
 */
export const ValidationSchema = z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
}).strict().optional();
export type Validation = z.infer<typeof ValidationSchema>;

// =============================================================================
// Attribute Definition Schema
// =============================================================================

/**
 * Defines a single attribute/field in an entity or relation.
 * This is stored as JSON in EntityDefinition.fields and RelationDefinition.attributeSchema.
 * 
 * Key design decisions:
 * - `type` and `typeRef` are mutually exclusive: use `type` for primitives, `typeRef` for reusable types
 * - `relType` is required when type === 'relation'
 * - `side` disambiguates symmetric relations (same entity on both ends)
 * - `isArray` allows multiple values for primitives/enums (not relations)
 */
export const AttributeDefinitionSchema = z.object({
    // Required fields
    key: z.string().min(1, 'Attribute key is required'),
    displayName: z.string().min(1, 'Display name is required'),

    // Type specification (one of type or typeRef should be provided for non-relation fields)
    type: AttributeBaseTypeSchema.optional(),
    typeRef: z.string().optional(),  // Reference to TypeDefinition.typeKey

    // Relation-specific fields (when type === 'relation')
    relType: z.string().optional(),  // Reference to RelationDefinition.relationType
    side: z.enum(['from', 'to']).optional(),  // For symmetric relations only

    // Options (for inline enum, alternative to typeRef)
    options: z.array(z.string()).optional(),

    // Array support for primitives/enums
    isArray: z.boolean().optional(),

    // Validation and metadata
    required: z.boolean().optional(),
    isPersonalData: z.boolean().optional(),  // GDPR/privacy flag
    deprecated: z.boolean().optional(),
    group: z.string().optional(),  // UI grouping hint

    // Legacy field (prefer auto-detection from RelationDefinition)
    incoming: z.boolean().optional(),

    // Validation rules
    validation: ValidationSchema,
}).strict();  // Reject unknown properties
export type AttributeDefinition = z.infer<typeof AttributeDefinitionSchema>;

/**
 * Array of attribute definitions (for EntityDefinition.fields)
 */
export const AttributeDefinitionArraySchema = z.array(AttributeDefinitionSchema);
export type AttributeDefinitionArray = z.infer<typeof AttributeDefinitionArraySchema>;

/**
 * Base types for TypeDefinition.baseType.
 * These are the primitive types that can be extended with options/validation.
 */
export const TypeDefinitionBaseTypeSchema = z.enum([
    'string',
    'text',
    'number',
    'decimal',
    'date',
    'datetime',
    'enum',
]);
export type TypeDefinitionBaseType = z.infer<typeof TypeDefinitionBaseTypeSchema>;

/**
 * Rich enum option with display metadata.
 * Used when baseType === 'enum' to provide user-friendly labels.
 * 
 * The display priority is:
 * 1. UI valueStyles.label (if defined in UI config)
 * 2. option.displayName (if defined here)
 * 3. option.key (raw value, always present)
 */
export const EnumOptionSchema = z.object({
    key: z.string().min(1, 'Option key is required'),
    displayName: z.string().optional(),
    description: z.string().optional(),
}).strict();
export type EnumOption = z.infer<typeof EnumOptionSchema>;

/**
 * Reusable type definition (stored in TypeDefinition table).
 * Used for enums, custom validation rules, etc.
 * 
 * Example usage:
 * - Enum: { typeKey: 'application_status', baseType: 'enum', options: [{ key: 'active', displayName: 'Active' }] }
 * - Number with range: { typeKey: 'rating_1_5', baseType: 'number', validation: { min: 1, max: 5 } }
 */
export const TypeDefinitionDataSchema = z.object({
    typeKey: z.string().min(1, 'Type key is required'),
    displayName: z.string().min(1, 'Display name is required'),
    baseType: TypeDefinitionBaseTypeSchema,
    options: z.array(EnumOptionSchema).nullable().optional(),  // Rich enum options
    validation: z.record(z.string(), z.unknown()).nullable().optional(),  // Custom validation rules
}).strict();  // Reject unknown properties
export type TypeDefinitionData = z.infer<typeof TypeDefinitionDataSchema>;

// =============================================================================
// Relation Definition Schema
// =============================================================================

/**
 * Defines a relation type between entities.
 * Stored in the RelationDefinition table.
 * 
 * Key design decisions:
 * - fromEntityTypes/toEntityTypes are arrays to support polymorphic relations
 * - isDirectional: false means the relation is symmetric (A relates to B = B relates to A)
 * - attributeSchema defines additional properties on the relation instance
 */
export const RelationDefinitionDataSchema = z.object({
    relationType: z.string().min(1, 'Relation type is required'),
    displayName: z.string().min(1, 'Display name is required'),

    // Entity type constraints (null = any entity type allowed)
    fromEntityType: z.string().nullable().optional(),
    toEntityType: z.string().nullable().optional(),

    // Relation properties
    isDirectional: z.boolean().default(true),

    // Attributes on the relation itself (e.g., ownership role, direction)
    attributeSchema: z.array(AttributeDefinitionSchema).nullable().optional(),
}).strict();  // Reject unknown properties
export type RelationDefinitionData = z.infer<typeof RelationDefinitionDataSchema>;

// =============================================================================
// Entity Definition Schema
// =============================================================================

/**
 * Defines the schema/metadata for an entity type.
 * This is what's stored in EntityDefinition.fields as JSON.
 * 
 * The full entity definition record (id, entityType, displayName, etc.)
 * comes from the database model; this schema validates the fields JSON column.
 */
export const EntityDefinitionFieldsSchema = AttributeDefinitionArraySchema;
export type EntityDefinitionFields = z.infer<typeof EntityDefinitionFieldsSchema>;

// =============================================================================
// Helper: Parse with useful error messages
// =============================================================================

/**
 * Parse JSON content with a schema, throwing a formatted error on failure.
 * Useful for validating database content at read time.
 */
export function parseOrThrow<T>(schema: z.ZodSchema<T>, data: unknown, context: string): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        const issues = result.error.issues
            .map(i => `  - ${i.path.join('.')}: ${i.message}`)
            .join('\n');
        throw new Error(`Invalid ${context}:\n${issues}`);
    }
    return result.data;
}
