import { z, ZodTypeAny } from 'zod';
import {
    AttributeDefinition,
    TypeDefinition,
    RelationDefinitionData,
    TypeValidatorStrategy,
    ValidatorContext
} from './type-validators';

// Use a looser type for the schema to avoid Zod 4 readonly issues
type DynamicZodSchema = ReturnType<typeof z.object>;

/**
 * Factory for building Zod schemas from field definitions
 * 
 * Uses the Strategy Pattern to delegate type-specific validation to individual validators.
 * Validators are matched by priority (higher first), allowing typeRef/relType validators 
 * to override simple type validators.
 */
export class ZodSchemaFactory {
    private validators: TypeValidatorStrategy[] = [];

    /**
     * Register a type validator
     * Validators are sorted by priority (highest first) after registration
     */
    registerValidator(validator: TypeValidatorStrategy): void {
        this.validators.push(validator);
        this.validators.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Build a complete Zod schema for an entity type from field definitions
     * 
     * @param fields - Field definitions from EntitySchema
     * @param typeDefinitions - Map of typeKey to TypeDefinition for resolving typeRef
     * @param relationDefinitions - Map of relType to RelationDefinition for resolving relation fields
     * @param options.isPartial - If true, all fields become optional (for updates)
     * @param options.strictMode - If true, reject unknown keys in the object
     * @param options.skipDeprecated - If true, deprecated fields are not included
     */
    buildEntitySchema(
        attributes: AttributeDefinition[],
        typeDefinitions: Map<string, TypeDefinition>,
        relationDefinitions: Map<string, RelationDefinitionData>,
        options: {
            isPartial?: boolean;
            strictMode?: boolean;
            skipDeprecated?: boolean;
        } = {}
    ): DynamicZodSchema {
        const { isPartial = false, strictMode = true, skipDeprecated = false } = options;

        const shape: Record<string, ZodTypeAny> = {};

        for (const field of attributes) {
            // Skip deprecated fields if requested
            if (skipDeprecated && field.deprecated) {
                continue;
            }

            // Skip core fields (name, description) as they're handled by DTO
            if (field.key === 'name' || field.key === 'description') {
                continue;
            }

            // Resolve type definition if field has typeRef
            const typeDef = field.typeRef
                ? typeDefinitions.get(field.typeRef) ?? null
                : null;

            // Resolve relation definition if field has relType
            const relationDef = field.relType
                ? relationDefinitions.get(field.relType) ?? null
                : null;

            const context: ValidatorContext = {
                field,
                typeDef,
                relationDef,
                typeDefinitions,  // Pass all type definitions for relation attribute validation
            };

            // Find matching validator and build schema
            let schema = this.buildFieldSchema(context);

            // Wrap in array if isArray (for primitive types, not relations - relations handle arrays internally)
            if (field.isArray && field.type !== 'relation') {
                schema = z.array(schema);
            }

            // Make required or optional based on field definition and isPartial mode
            if (isPartial || !field.required) {
                schema = schema.optional().nullable();
            }

            shape[field.key] = schema;
        }

        // Build the object schema
        let objectSchema = z.object(shape);

        // Apply strict mode if enabled (rejects unknown keys)
        if (strictMode) {
            objectSchema = objectSchema.strict();
        } else {
            objectSchema = objectSchema.passthrough();
        }

        return objectSchema;
    }

    /**
     * Build schema for a single field using registered validators
     */
    private buildFieldSchema(context: ValidatorContext): ZodTypeAny {
        // Find first matching validator (sorted by priority)
        for (const validator of this.validators) {
            if (validator.supports(context)) {
                return validator.buildSchema(context);
            }
        }

        // Fallback: if typeRef exists but no matching typeDef was found
        if (context.field.typeRef && !context.typeDef) {
            console.warn(
                `[SchemaValidator] No type definition found for typeRef: ${context.field.typeRef} ` +
                `in field: ${context.field.key}. Falling back to unknown validation.`
            );
        }

        // Fallback: if relType exists but no matching relationDef was found
        if (context.field.relType && !context.relationDef) {
            console.warn(
                `[SchemaValidator] No relation definition found for relType: ${context.field.relType} ` +
                `in field: ${context.field.key}. Falling back to unknown validation.`
            );
        }

        // Ultimate fallback: treat as unknown (accepts anything)
        return z.unknown();
    }

    /**
     * Get all registered validators (for debugging/testing)
     */
    getValidators(): readonly TypeValidatorStrategy[] {
        return this.validators;
    }
}

