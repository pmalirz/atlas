import { z, ZodTypeAny } from 'zod';
import {
    TypeValidatorStrategy,
    ValidatorContext,
    AttributeDefinition
} from './base-type-validator';

/**
 * Validator for 'relation' field type
 * 
 * Validates arrays of relation objects with structure:
 * [{ targetId: string, ...attributeFields }]
 * 
 * The attributeFields are defined in RelationDefinition.attributeSchema
 * and validated using their respective validators (e.g., EnumTypeValidator for typeRef)
 * 
 * @example
 * Field: { key: 'ownerships', type: 'relation', relType: 'app_owned_by' }
 * RelationDefinition.attributeSchema: [{ key: 'ownershipRole', typeRef: 'ownership_role' }]
 * 
 * Expected input: [{ targetId: 'user-uuid', ownershipRole: 'owner' }]
 */
export class RelationTypeValidator implements TypeValidatorStrategy {
    // Higher priority than basic type validators to handle relType references
    readonly priority = 25;

    supports(context: ValidatorContext): boolean {
        return context.field.type === 'relation' && !!context.field.relType;
    }

    buildSchema(context: ValidatorContext): ZodTypeAny {
        const { field, relationDef, typeDefinitions } = context;

        // Base structure: always requires targetId (UUID of related entity)
        const relationObjectShape: Record<string, ZodTypeAny> = {
            targetId: z.string().uuid({
                message: `${field.displayName}: targetId must be a valid UUID`,
            }),
        };

        // Add attribute fields from RelationDefinition.attributeSchema
        if (relationDef?.attributeSchema && relationDef.attributeSchema.length > 0) {
            for (const attrField of relationDef.attributeSchema) {
                const attrSchema = this.buildAttributeSchema(attrField, typeDefinitions);

                // Apply required/optional
                if (attrField.required) {
                    relationObjectShape[attrField.key] = attrSchema;
                } else {
                    relationObjectShape[attrField.key] = attrSchema.optional().nullable();
                }
            }
        }

        // Return array of relation objects
        return z.array(z.object(relationObjectShape));
    }

    /**
     * Build schema for a single attribute field within the relation
     */
    private buildAttributeSchema(
        attrField: AttributeDefinition,
        typeDefinitions?: Map<string, unknown>
    ): ZodTypeAny {
        // If attribute has typeRef, resolve it (e.g., enum)
        if (attrField.typeRef && typeDefinitions) {
            const typeDef = typeDefinitions.get(attrField.typeRef) as {
                baseType: string;
                options?: string[];
            } | undefined;

            if (typeDef?.baseType === 'enum' && typeDef.options?.length) {
                const [first, ...rest] = typeDef.options;
                return z.enum([first, ...rest], {
                    error: `${attrField.displayName} must be one of: ${typeDef.options.join(', ')}`,
                });
            }
        }

        // Fallback based on type
        switch (attrField.type) {
            case 'string':
            case 'text':
                return z.string();
            case 'number':
            case 'decimal':
                return z.number();
            case 'boolean':
                return z.boolean();
            case 'date':
            case 'datetime':
                return z.string(); // ISO date string
            default:
                // For unknown types, accept any value
                return z.unknown();
        }
    }
}

