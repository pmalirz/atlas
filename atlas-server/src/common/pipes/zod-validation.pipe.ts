import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema) { }

    transform(value: unknown, metadata: ArgumentMetadata) {
        // Only validate body
        if (metadata.type !== 'body') {
            return value;
        }

        try {
            return this.schema.parse(value);
        } catch (error) {
            if (error instanceof ZodError) {
                const zodError = error as ZodError;
                throw new BadRequestException({
                    message: 'Validation failed',
                    errors: zodError.issues,
                    statusCode: 400
                });
            }
            throw new BadRequestException('Validation failed');
        }
    }
}
