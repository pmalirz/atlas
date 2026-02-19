import { z, ZodTypeAny } from 'zod';
import { TypeValidatorStrategy, ValidatorContext, EnumOptionValue } from './base-type-validator';

/**
 * Extract key from an enum option (handles both string and object formats)
 */
function getOptionKey(option: EnumOptionValue): string {
    return typeof option === 'string' ? option : option.key;
}

/**
 * Validator for enum types (fields with typeRef pointing to enum TypeDefinition)
 * Has higher priority than type validators because typeRef takes precedence
 */
export class EnumTypeValidator implements TypeValidatorStrategy {
    readonly priority = 20; // Higher priority than type validators

    supports(context: ValidatorContext): boolean {
        return !!(
            context.field.typeRef &&
            context.typeDef &&
            context.typeDef.baseType === 'enum'
        );
    }

    buildSchema(context: ValidatorContext): ZodTypeAny {
        const { field, typeDef } = context;

        if (!typeDef || !typeDef.options || typeDef.options.length === 0) {
            // Fallback to string if no options defined
            return z.string({
                error: `${field.displayName} must be a string`,
            });
        }

        // Extract keys from options (handles both string[] and EnumOption[] formats)
        const optionKeys = typeDef.options.map(getOptionKey);

        // Create enum validator with the allowed option keys
        // Zod 4: z.enum() with error customization
        const [first, ...rest] = optionKeys;
        return z.enum([first, ...rest], {
            error: `${field.displayName} must be one of: ${optionKeys.join(', ')}`,
        });
    }
}

