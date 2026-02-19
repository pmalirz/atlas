import { z, ZodTypeAny } from 'zod';
import { TypeValidatorStrategy, ValidatorContext } from './base-type-validator';

/**
 * Validator for 'number' and 'decimal' field types
 * - 'number' = integer (whole numbers only)
 * - 'decimal' = floating-point (allows decimals)
 * Applies min/max value validation from field definition
 */
export class NumberTypeValidator implements TypeValidatorStrategy {
    readonly priority = 10;

    supports(context: ValidatorContext): boolean {
        const type = context.field.type;
        return type === 'number' || type === 'decimal';
    }

    buildSchema(context: ValidatorContext): ZodTypeAny {
        const { field } = context;
        const isInteger = field.type === 'number';

        // Zod 4: Use error() for custom messages
        let schema = z.number({
            error: `${field.displayName} must be a ${isInteger ? 'whole number' : 'number'}`,
        });

        // For 'number' type, enforce integer (whole numbers only)
        if (isInteger) {
            schema = schema.int({
                message: `${field.displayName} must be a whole number (no decimals)`,
            });
        }

        if (field.validation) {
            if (field.validation.min !== undefined) {
                schema = schema.min(field.validation.min, {
                    message: `${field.displayName} must be at least ${field.validation.min}`,
                });
            }
            if (field.validation.max !== undefined) {
                schema = schema.max(field.validation.max, {
                    message: `${field.displayName} must be at most ${field.validation.max}`,
                });
            }
        }

        return schema;
    }
}

