import { z } from 'zod';
import {
    AttributeDefinition,
    TypeDefinition,
    StringTypeValidator,
    NumberTypeValidator,
    BooleanTypeValidator,
    DateTypeValidator,
    EnumTypeValidator,
} from './type-validators';
import { ZodSchemaFactory } from './zod-schema-factory';

describe('ZodSchemaFactory', () => {
    let factory: ZodSchemaFactory;

    beforeEach(() => {
        factory = new ZodSchemaFactory();
        factory.registerValidator(new StringTypeValidator());
        factory.registerValidator(new NumberTypeValidator());
        factory.registerValidator(new BooleanTypeValidator());
        factory.registerValidator(new DateTypeValidator());
        factory.registerValidator(new EnumTypeValidator());
    });

    describe('String validation', () => {
        const fields: AttributeDefinition[] = [
            { key: 'title', displayName: 'Title', type: 'string', required: true },
            {
                key: 'code',
                displayName: 'Code',
                type: 'string',
                validation: { min: 3, max: 10, pattern: '^[A-Z]+$' }
            },
        ];

        it('should validate required string field', () => {
            const schema = factory.buildEntitySchema(fields, new Map(), new Map());

            const valid = schema.safeParse({ title: 'Hello' });
            expect(valid.success).toBe(true);

            const invalid = schema.safeParse({});
            expect(invalid.success).toBe(false);
        });

        it('should validate string with min/max length', () => {
            const schema = factory.buildEntitySchema(fields, new Map(), new Map());

            const valid = schema.safeParse({ title: 'Test', code: 'ABC' });
            expect(valid.success).toBe(true);

            const tooShort = schema.safeParse({ title: 'Test', code: 'AB' });
            expect(tooShort.success).toBe(false);

            const tooLong = schema.safeParse({ title: 'Test', code: 'ABCDEFGHIJKL' });
            expect(tooLong.success).toBe(false);
        });

        it('should validate string pattern', () => {
            const schema = factory.buildEntitySchema(fields, new Map(), new Map());

            const valid = schema.safeParse({ title: 'Test', code: 'ABC' });
            expect(valid.success).toBe(true);

            const invalid = schema.safeParse({ title: 'Test', code: 'abc' });
            expect(invalid.success).toBe(false);
        });
    });

    describe('Number validation', () => {
        const fields: AttributeDefinition[] = [
            {
                key: 'rating',
                displayName: 'Rating',
                type: 'number',
                required: true,
                validation: { min: 1, max: 5 }
            },
        ];

        it('should validate number with min/max', () => {
            const schema = factory.buildEntitySchema(fields, new Map(), new Map());

            const valid = schema.safeParse({ rating: 3 });
            expect(valid.success).toBe(true);

            const tooLow = schema.safeParse({ rating: 0 });
            expect(tooLow.success).toBe(false);

            const tooHigh = schema.safeParse({ rating: 6 });
            expect(tooHigh.success).toBe(false);
        });

        it('should reject non-number values', () => {
            const schema = factory.buildEntitySchema(fields, new Map(), new Map());

            const invalid = schema.safeParse({ rating: 'three' });
            expect(invalid.success).toBe(false);
        });
    });

    describe('Boolean validation', () => {
        const fields: AttributeDefinition[] = [
            { key: 'isActive', displayName: 'Is Active', type: 'boolean', required: true },
        ];

        it('should validate boolean values', () => {
            const schema = factory.buildEntitySchema(fields, new Map(), new Map());

            expect(schema.safeParse({ isActive: true }).success).toBe(true);
            expect(schema.safeParse({ isActive: false }).success).toBe(true);
            expect(schema.safeParse({ isActive: 'true' }).success).toBe(false);
        });
    });

    describe('Date validation', () => {
        const fields: AttributeDefinition[] = [
            { key: 'createdAt', displayName: 'Created At', type: 'date' },
            { key: 'updatedAt', displayName: 'Updated At', type: 'datetime' },
        ];

        it('should validate ISO date strings', () => {
            const schema = factory.buildEntitySchema(fields, new Map(), new Map());

            const valid = schema.safeParse({
                createdAt: '2024-01-15',
                updatedAt: '2024-01-15T10:30:00Z'
            });
            expect(valid.success).toBe(true);
        });

        it('should reject invalid date strings', () => {
            const schema = factory.buildEntitySchema(fields, new Map(), new Map());

            const invalid = schema.safeParse({ createdAt: 'not-a-date' });
            expect(invalid.success).toBe(false);
        });
    });

    describe('Enum validation (typeRef)', () => {
        const fields: AttributeDefinition[] = [
            { key: 'status', displayName: 'Status', typeRef: 'app_status', required: true },
        ];

        const typeDefinitions = new Map<string, TypeDefinition>([
            ['app_status', {
                typeKey: 'app_status',
                baseType: 'enum',
                options: ['active', 'deprecated', 'retired'],
                validation: null,
            }],
        ]);

        it('should validate enum values', () => {
            const schema = factory.buildEntitySchema(fields, typeDefinitions, new Map());

            expect(schema.safeParse({ status: 'active' }).success).toBe(true);
            expect(schema.safeParse({ status: 'deprecated' }).success).toBe(true);
        });

        it('should reject invalid enum values', () => {
            const schema = factory.buildEntitySchema(fields, typeDefinitions, new Map());

            const invalid = schema.safeParse({ status: 'unknown' });
            expect(invalid.success).toBe(false);
        });
    });

    describe('Array fields', () => {
        const fields: AttributeDefinition[] = [
            { key: 'tags', displayName: 'Tags', type: 'string', isArray: true },
        ];

        it('should validate array of strings', () => {
            const schema = factory.buildEntitySchema(fields, new Map(), new Map());

            expect(schema.safeParse({ tags: ['a', 'b', 'c'] }).success).toBe(true);
            expect(schema.safeParse({ tags: [] }).success).toBe(true);
        });

        it('should reject non-array values', () => {
            const schema = factory.buildEntitySchema(fields, new Map(), new Map());

            expect(schema.safeParse({ tags: 'not-an-array' }).success).toBe(false);
        });
    });

    describe('Strict mode (unknown fields)', () => {
        const fields: AttributeDefinition[] = [
            { key: 'title', displayName: 'Title', type: 'string', required: true },
        ];

        it('should reject unknown fields in strict mode (default)', () => {
            const schema = factory.buildEntitySchema(fields, new Map(), new Map(), { strictMode: true });

            const invalid = schema.safeParse({ title: 'Hello', unknownField: 'bad' });
            expect(invalid.success).toBe(false);
        });

        it('should allow unknown fields in passthrough mode', () => {
            const schema = factory.buildEntitySchema(fields, new Map(), new Map(), { strictMode: false });

            const valid = schema.safeParse({ title: 'Hello', unknownField: 'ok' });
            expect(valid.success).toBe(true);
        });
    });

    describe('Partial mode (updates)', () => {
        const fields: AttributeDefinition[] = [
            { key: 'title', displayName: 'Title', type: 'string', required: true },
            { key: 'status', displayName: 'Status', typeRef: 'app_status', required: true },
        ];

        const typeDefinitions = new Map<string, TypeDefinition>([
            ['app_status', {
                typeKey: 'app_status',
                baseType: 'enum',
                options: ['active', 'deprecated'],
                validation: null,
            }],
        ]);

        it('should allow missing required fields in partial mode', () => {
            const schema = factory.buildEntitySchema(fields, typeDefinitions, new Map(), { isPartial: true });

            // Only providing one field should be valid
            expect(schema.safeParse({ title: 'Updated Title' }).success).toBe(true);
            expect(schema.safeParse({ status: 'active' }).success).toBe(true);
            expect(schema.safeParse({}).success).toBe(true);
        });

        it('should still validate provided values in partial mode', () => {
            const schema = factory.buildEntitySchema(fields, typeDefinitions, new Map(), { isPartial: true });

            // Invalid enum value should still fail
            expect(schema.safeParse({ status: 'invalid' }).success).toBe(false);
        });
    });

    describe('Core fields filtering', () => {
        const fields: AttributeDefinition[] = [
            { key: 'name', displayName: 'Name', type: 'string', required: true },
            { key: 'description', displayName: 'Description', type: 'text' },
            { key: 'status', displayName: 'Status', type: 'string' },
        ];

        it('should skip name and description fields (handled by DTO)', () => {
            const schema = factory.buildEntitySchema(fields, new Map(), new Map());

            // name and description should not be in the schema
            // only status should be validated
            const result = schema.safeParse({ status: 'active' });
            expect(result.success).toBe(true);

            // Providing name should fail in strict mode because it's not in schema
            const withName = schema.safeParse({ name: 'Test', status: 'active' });
            expect(withName.success).toBe(false); // strict mode rejects unknown
        });
    });
});

