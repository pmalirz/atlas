import { StringTypeValidator } from './string-type-validator';
import { AttributeDefinition, ValidatorContext } from './base-type-validator';

describe('StringTypeValidator', () => {
    let validator: StringTypeValidator;

    beforeEach(() => {
        validator = new StringTypeValidator();
    });

    describe('supports()', () => {
        it('should support type: string', () => {
            const context: ValidatorContext = {
                field: { key: 'name', displayName: 'Name', type: 'string' },
            };
            expect(validator.supports(context)).toBe(true);
        });

        it('should support type: text', () => {
            const context: ValidatorContext = {
                field: { key: 'desc', displayName: 'Description', type: 'text' },
            };
            expect(validator.supports(context)).toBe(true);
        });

        it('should support undefined type (defaults to string)', () => {
            const context: ValidatorContext = {
                field: { key: 'name', displayName: 'Name' },
            };
            expect(validator.supports(context)).toBe(true);
        });

        it('should not support other types', () => {
            const context: ValidatorContext = {
                field: { key: 'count', displayName: 'Count', type: 'number' },
            };
            expect(validator.supports(context)).toBe(false);
        });
    });

    describe('buildSchema()', () => {
        it('should validate string values', () => {
            const context: ValidatorContext = {
                field: { key: 'name', displayName: 'Name', type: 'string' },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse('hello').success).toBe(true);
            expect(schema.safeParse('').success).toBe(true);
            expect(schema.safeParse(123).success).toBe(false);
            expect(schema.safeParse(null).success).toBe(false);
            expect(schema.safeParse(undefined).success).toBe(false);
        });

        it('should enforce min length', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'code',
                    displayName: 'Code',
                    type: 'string',
                    validation: { min: 3 },
                },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse('abc').success).toBe(true);
            expect(schema.safeParse('abcd').success).toBe(true);
            expect(schema.safeParse('ab').success).toBe(false);
            expect(schema.safeParse('').success).toBe(false);
        });

        it('should enforce max length', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'code',
                    displayName: 'Code',
                    type: 'string',
                    validation: { max: 5 },
                },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse('abc').success).toBe(true);
            expect(schema.safeParse('abcde').success).toBe(true);
            expect(schema.safeParse('abcdef').success).toBe(false);
        });

        it('should enforce min and max length together', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'code',
                    displayName: 'Code',
                    type: 'string',
                    validation: { min: 2, max: 4 },
                },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse('a').success).toBe(false);
            expect(schema.safeParse('ab').success).toBe(true);
            expect(schema.safeParse('abcd').success).toBe(true);
            expect(schema.safeParse('abcde').success).toBe(false);
        });

        it('should enforce regex pattern', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'code',
                    displayName: 'Code',
                    type: 'string',
                    validation: { pattern: '^[A-Z]{3}$' },
                },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse('ABC').success).toBe(true);
            expect(schema.safeParse('XYZ').success).toBe(true);
            expect(schema.safeParse('abc').success).toBe(false);
            expect(schema.safeParse('ABCD').success).toBe(false);
            expect(schema.safeParse('AB').success).toBe(false);
        });

        it('should combine all validations', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'code',
                    displayName: 'Code',
                    type: 'string',
                    validation: { min: 2, max: 4, pattern: '^[A-Z]+$' },
                },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse('AB').success).toBe(true);
            expect(schema.safeParse('ABCD').success).toBe(true);
            expect(schema.safeParse('A').success).toBe(false);      // too short
            expect(schema.safeParse('ABCDE').success).toBe(false);  // too long
            expect(schema.safeParse('ab').success).toBe(false);     // wrong pattern
        });

        it('should provide meaningful error messages', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'code',
                    displayName: 'Product Code',
                    type: 'string',
                    validation: { min: 3 },
                },
            };
            const schema = validator.buildSchema(context);
            const result = schema.safeParse('AB');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Product Code');
                expect(result.error.issues[0].message).toContain('3');
            }
        });
    });

    describe('priority', () => {
        it('should have priority 10', () => {
            expect(validator.priority).toBe(10);
        });
    });
});

