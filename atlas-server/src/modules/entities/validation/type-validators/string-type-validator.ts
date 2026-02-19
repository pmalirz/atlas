import { z, ZodTypeAny } from 'zod';
import { TypeValidatorStrategy, ValidatorContext } from './base-type-validator';

/**
 * Validator for 'string' and 'text' field types
 * Applies min/max length and pattern validation from field definition
 */
export class StringTypeValidator implements TypeValidatorStrategy {
    readonly priority = 10;

    supports(context: ValidatorContext): boolean {
        const type = context.field.type || 'string';
        return type === 'string' || type === 'text';
    }

    buildSchema(context: ValidatorContext): ZodTypeAny {
        const { field } = context;

        // Zod 4: Use error() for custom messages
        let schema = z.string({
            error: `${field.displayName} must be a string`,
        });

        if (field.validation) {
            if (field.validation.min !== undefined) {
                schema = schema.min(field.validation.min, {
                    message: `${field.displayName} must be at least ${field.validation.min} characters`,
                });
            }
            if (field.validation.max !== undefined) {
                schema = schema.max(field.validation.max, {
                    message: `${field.displayName} must be at most ${field.validation.max} characters`,
                });
            }
            if (field.validation.pattern) {
                schema = schema.regex(new RegExp(field.validation.pattern), {
                    message: `${field.displayName} has invalid format`,
                });
            }
        }

        return schema;
    }
}

