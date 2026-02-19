import { z, ZodTypeAny } from 'zod';
import {
    AttributeDefinition,
    TypeDefinitionResponse,
    RelationDefinitionResponse,
} from '../../../definitions/types';

// Re-export for convenience (validators use these types)
export type { AttributeDefinition };

/**
 * Enum option - can be simple string or rich object
 */
export type EnumOptionValue = string | { key: string; displayName?: string; description?: string };

/**
 * Type definition for validator context (simplified version of TypeDefinitionResponse)
 */
export interface TypeDefinition {
    typeKey: string;
    baseType: string;
    options: EnumOptionValue[] | null;
    validation: Record<string, unknown> | null;
}

/**
 * Relation definition for validator context (simplified version of RelationDefinitionResponse)
 */
export interface RelationDefinitionData {
    relationType: string;
    displayName: string;
    fromEntityType: string | null;
    toEntityType: string | null;
    isDirectional: boolean;
    attributeSchema: AttributeDefinition[] | null;
}

/**
 * Context for building Zod schema from attribute definition
 */
export interface ValidatorContext {
    field: AttributeDefinition;
    typeDef?: TypeDefinition | null;
    relationDef?: RelationDefinitionData | null;  // For type='relation' fields
    typeDefinitions?: Map<string, TypeDefinition>;  // All loaded types (for relation attr validation)
}

/**
 * Strategy interface for type-specific validation
 * Each validator is responsible for a specific attribute type or base type
 * 
 * @example
 * class StringTypeValidator implements TypeValidatorStrategy {
 *   supports(context) { return context.field.type === 'string'; }
 *   buildSchema(context) { return z.string(); }
 * }
 */
export interface TypeValidatorStrategy {
    /**
     * Determines if this strategy can handle the given field/type
     */
    supports(context: ValidatorContext): boolean;

    /**
     * Builds a Zod schema for this attribute type
     * The returned schema should NOT handle isArray or required - that's done by the factory
     */
    buildSchema(context: ValidatorContext): ZodTypeAny;

    /**
     * Priority for matching (higher = matched first)
     * TypeRef validators should have higher priority than type validators
     */
    readonly priority: number;
}

