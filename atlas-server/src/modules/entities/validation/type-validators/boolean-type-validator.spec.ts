import { BooleanTypeValidator } from './boolean-type-validator';
import { ValidatorContext } from './base-type-validator';

describe('BooleanTypeValidator', () => {
    let validator: BooleanTypeValidator;

    beforeEach(() => {
        validator = new BooleanTypeValidator();
    });

    describe('supports()', () => {
        it('should support type: boolean', () => {
            const context: ValidatorContext = {
                field: { key: 'isActive', displayName: 'Is Active', type: 'boolean' },
            };
            expect(validator.supports(context)).toBe(true);
        });

        it('should not support other types', () => {
            const testCases: unknown[] = ['string', 'number', 'text', 'date', undefined];
            testCases.forEach(type => {
                const context: ValidatorContext = {
                    field: { key: 'field', displayName: 'Field', type: type as any },
                };
                expect(validator.supports(context)).toBe(false);
            });
        });
    });

    describe('buildSchema()', () => {
        it('should validate true', () => {
            const context: ValidatorContext = {
                field: { key: 'isActive', displayName: 'Is Active', type: 'boolean' },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse(true).success).toBe(true);
        });

        it('should validate false', () => {
            const context: ValidatorContext = {
                field: { key: 'isActive', displayName: 'Is Active', type: 'boolean' },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse(false).success).toBe(true);
        });

        it('should reject string "true"', () => {
            const context: ValidatorContext = {
                field: { key: 'isActive', displayName: 'Is Active', type: 'boolean' },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse('true').success).toBe(false);
        });

        it('should reject string "false"', () => {
            const context: ValidatorContext = {
                field: { key: 'isActive', displayName: 'Is Active', type: 'boolean' },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse('false').success).toBe(false);
        });

        it('should reject numbers', () => {
            const context: ValidatorContext = {
                field: { key: 'isActive', displayName: 'Is Active', type: 'boolean' },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse(0).success).toBe(false);
            expect(schema.safeParse(1).success).toBe(false);
        });

        it('should reject null and undefined', () => {
            const context: ValidatorContext = {
                field: { key: 'isActive', displayName: 'Is Active', type: 'boolean' },
            };
            const schema = validator.buildSchema(context);

            expect(schema.safeParse(null).success).toBe(false);
            expect(schema.safeParse(undefined).success).toBe(false);
        });

        it('should provide meaningful error message', () => {
            const context: ValidatorContext = {
                field: { key: 'isEnabled', displayName: 'Feature Enabled', type: 'boolean' },
            };
            const schema = validator.buildSchema(context);
            const result = schema.safeParse('yes');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Feature Enabled');
                expect(result.error.issues[0].message).toContain('boolean');
            }
        });
    });

    describe('priority', () => {
        it('should have priority 10', () => {
            expect(validator.priority).toBe(10);
        });
    });
});
