import { z, ZodTypeAny } from 'zod';
import { TypeValidatorStrategy, ValidatorContext } from './base-type-validator';

/**
 * Validator for 'boolean' field type
 */
export class BooleanTypeValidator implements TypeValidatorStrategy {
    readonly priority = 10;

    supports(context: ValidatorContext): boolean {
        return context.field.type === 'boolean';
    }

    buildSchema(context: ValidatorContext): ZodTypeAny {
        const { field } = context;

        // Zod 4: Use error() for custom messages
        return z.boolean({
            error: `${field.displayName} must be a boolean`,
        });
    }
}

