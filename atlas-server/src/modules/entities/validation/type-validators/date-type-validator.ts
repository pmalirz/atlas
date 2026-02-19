import { z, ZodTypeAny } from 'zod';
import { TypeValidatorStrategy, ValidatorContext } from './base-type-validator';

/**
 * Validator for 'date' and 'datetime' field types
 * Expects ISO 8601 date strings
 */
export class DateTypeValidator implements TypeValidatorStrategy {
    readonly priority = 10;

    supports(context: ValidatorContext): boolean {
        const type = context.field.type;
        return type === 'date' || type === 'datetime';
    }

    buildSchema(context: ValidatorContext): ZodTypeAny {
        const { field } = context;

        // Zod 4: Use error() and check() instead of refine()
        return z.string({
            error: `${field.displayName} must be a date string`,
        }).check(
            (ctx) => {
                if (isNaN(Date.parse(ctx.value))) {
                    ctx.issues.push({
                        code: 'custom',
                        message: `${field.displayName} must be a valid date`,
                        input: ctx.value,
                    });
                }
            }
        );
    }
}

