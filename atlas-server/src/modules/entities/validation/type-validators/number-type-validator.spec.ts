import { NumberTypeValidator } from './number-type-validator';
import { ValidatorContext } from './base-type-validator';

describe('NumberTypeValidator', () => {
    let validator: NumberTypeValidator;

    beforeEach(() => {
        validator = new NumberTypeValidator();
    });

    describe('supports()', () => {
        it('should support type: number', () => {
            const context: ValidatorContext = {
                field: { key: 'count', displayName: 'Count', type: 'number' },
            };
            expect(validator.supports(context)).toBe(true);
        });

        it('should support type: decimal', () => {
            const context: ValidatorContext = {
                field: { key: 'price', displayName: 'Price', type: 'decimal' },
            };
            expect(validator.supports(context)).toBe(true);
        });

        it('should not support string type', () => {
            const context: ValidatorContext = {
                field: { key: 'name', displayName: 'Name', type: 'string' },
            };
            expect(validator.supports(context)).toBe(false);
        });

        it('should not support undefined type', () => {
            const context: ValidatorContext = {
                field: { key: 'name', displayName: 'Name' },
            };
            expect(validator.supports(context)).toBe(false);
        });
    });

    describe('buildSchema() - number (integer)', () => {
        it('should validate integer values for number type', () => {
            const context: ValidatorContext = {
                field: { key: 'count', displayName: 'Count', type: 'number' },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse(0).success).toBe(true);
            expect(schema.safeParse(42).success).toBe(true);
            expect(schema.safeParse(-10).success).toBe(true);
        });

        it('should reject decimal values for number type (integer only)', () => {
            const context: ValidatorContext = {
                field: { key: 'count', displayName: 'Count', type: 'number' },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse(3.14).success).toBe(false);
            expect(schema.safeParse(99.99).success).toBe(false);
            expect(schema.safeParse(0.5).success).toBe(false);
        });

        it('should reject non-numeric values for number type', () => {
            const context: ValidatorContext = {
                field: { key: 'count', displayName: 'Count', type: 'number' },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse('42').success).toBe(false);
            expect(schema.safeParse(null).success).toBe(false);
            expect(schema.safeParse(undefined).success).toBe(false);
            expect(schema.safeParse('Ala Ma Kota').success).toBe(false);
        });

        it('should enforce min value for number type', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'rating',
                    displayName: 'Rating',
                    type: 'number',
                    validation: { min: 1 },
                },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse(1).success).toBe(true);
            expect(schema.safeParse(5).success).toBe(true);
            expect(schema.safeParse(0).success).toBe(false);
            expect(schema.safeParse(-1).success).toBe(false);
        });

        it('should enforce max value for number type', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'rating',
                    displayName: 'Rating',
                    type: 'number',
                    validation: { max: 5 },
                },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse(5).success).toBe(true);
            expect(schema.safeParse(0).success).toBe(true);
            expect(schema.safeParse(-10).success).toBe(true);
            expect(schema.safeParse(6).success).toBe(false);
            expect(schema.safeParse(100).success).toBe(false);
        });

        it('should enforce min and max together for number type', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'rating',
                    displayName: 'Rating',
                    type: 'number',
                    validation: { min: 1, max: 5 },
                },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse(1).success).toBe(true);
            expect(schema.safeParse(3).success).toBe(true);
            expect(schema.safeParse(5).success).toBe(true);
            expect(schema.safeParse(0).success).toBe(false);
            expect(schema.safeParse(6).success).toBe(false);
        });

        it('should allow min value of 0', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'count',
                    displayName: 'Count',
                    type: 'number',
                    validation: { min: 0 },
                },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse(0).success).toBe(true);
            expect(schema.safeParse(-1).success).toBe(false);
        });

        it('should provide meaningful error message for non-integer', () => {
            const context: ValidatorContext = {
                field: { key: 'count', displayName: 'Page Count', type: 'number' },
            };
            const schema = validator.buildSchema(context);
            const result = schema.safeParse(3.5);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('whole number');
            }
        });
    });

    describe('buildSchema() - decimal (floating-point)', () => {
        it('should validate decimal values for decimal type', () => {
            const context: ValidatorContext = {
                field: { key: 'price', displayName: 'Price', type: 'decimal' },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse(0).success).toBe(true);
            expect(schema.safeParse(42).success).toBe(true);
            expect(schema.safeParse(3.14).success).toBe(true);
            expect(schema.safeParse(99.99).success).toBe(true);
            expect(schema.safeParse(-10.5).success).toBe(true);
        });

        it('should reject non-numeric values for decimal type', () => {
            const context: ValidatorContext = {
                field: { key: 'price', displayName: 'Price', type: 'decimal' },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse('42.50').success).toBe(false);
            expect(schema.safeParse(null).success).toBe(false);
            expect(schema.safeParse(undefined).success).toBe(false);
            expect(schema.safeParse('invalid').success).toBe(false);
        });

        it('should enforce min and max for decimal type', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'price',
                    displayName: 'Price',
                    type: 'decimal',
                    validation: { min: 0, max: 1000 },
                },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse(0).success).toBe(true);
            expect(schema.safeParse(99.99).success).toBe(true);
            expect(schema.safeParse(1000).success).toBe(true);
            expect(schema.safeParse(-0.01).success).toBe(false);
            expect(schema.safeParse(1000.01).success).toBe(false);
        });

        it('should allow high precision decimals', () => {
            const context: ValidatorContext = {
                field: { key: 'rate', displayName: 'Rate', type: 'decimal' },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse(0.123456789).success).toBe(true);
            expect(schema.safeParse(1.0e-10).success).toBe(true);
        });
    });

    describe('error messages', () => {
        it('should provide meaningful error messages for min violation', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'rating',
                    displayName: 'Star Rating',
                    type: 'number',
                    validation: { min: 1, max: 5 },
                },
            };
            const schema = validator.buildSchema(context);
            const result = schema.safeParse(0);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Star Rating');
                expect(result.error.issues[0].message).toContain('1');
            }
        });

        it('should provide meaningful error messages for max violation', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'rating',
                    displayName: 'Star Rating',
                    type: 'number',
                    validation: { min: 1, max: 5 },
                },
            };
            const schema = validator.buildSchema(context);
            const result = schema.safeParse(10);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Star Rating');
                expect(result.error.issues[0].message).toContain('5');
            }
        });
    });

    describe('priority', () => {
        it('should have priority 10', () => {
            expect(validator.priority).toBe(10);
        });
    });
});

