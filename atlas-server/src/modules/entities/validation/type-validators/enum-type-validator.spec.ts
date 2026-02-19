import { EnumTypeValidator } from './enum-type-validator';
import { ValidatorContext, TypeDefinition, EnumOptionValue } from './base-type-validator';

describe('EnumTypeValidator', () => {
    let validator: EnumTypeValidator;

    beforeEach(() => {
        validator = new EnumTypeValidator();
    });

    // Helper for legacy string[] format
    const createEnumTypeDef = (options: string[]): TypeDefinition => ({
        typeKey: 'test_enum',
        baseType: 'enum',
        options,
        validation: null,
    });

    // Helper for new EnumOption[] format (rich objects)
    const createRichEnumTypeDef = (options: Array<{ key: string; displayName?: string; description?: string }>): TypeDefinition => ({
        typeKey: 'test_enum',
        baseType: 'enum',
        options,
        validation: null,
    });

    describe('supports()', () => {
        it('should support field with typeRef and enum typeDef', () => {
            const context: ValidatorContext = {
                field: { key: 'status', displayName: 'Status', typeRef: 'app_status' },
                typeDef: createEnumTypeDef(['active', 'inactive']),
            };
            expect(validator.supports(context)).toBe(true);
        });

        it('should not support field without typeRef', () => {
            const context: ValidatorContext = {
                field: { key: 'status', displayName: 'Status', type: 'string' },
            };
            expect(validator.supports(context)).toBe(false);
        });

        it('should not support field with typeRef but no typeDef', () => {
            const context: ValidatorContext = {
                field: { key: 'status', displayName: 'Status', typeRef: 'missing_type' },
                typeDef: null,
            };
            expect(validator.supports(context)).toBe(false);
        });

        it('should not support non-enum baseType', () => {
            const context: ValidatorContext = {
                field: { key: 'value', displayName: 'Value', typeRef: 'custom_type' },
                typeDef: {
                    typeKey: 'custom_type',
                    baseType: 'string', // not enum
                    options: null,
                    validation: null,
                },
            };
            expect(validator.supports(context)).toBe(false);
        });
    });

    describe('buildSchema()', () => {
        describe('valid enum values', () => {
            it('should accept values from options', () => {
                const context: ValidatorContext = {
                    field: { key: 'status', displayName: 'Status', typeRef: 'app_status' },
                    typeDef: createEnumTypeDef(['active', 'deprecated', 'retired']),
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse('active').success).toBe(true);
                expect(schema.safeParse('deprecated').success).toBe(true);
                expect(schema.safeParse('retired').success).toBe(true);
            });

            it('should be case-sensitive', () => {
                const context: ValidatorContext = {
                    field: { key: 'status', displayName: 'Status', typeRef: 'app_status' },
                    typeDef: createEnumTypeDef(['active', 'ACTIVE']),
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse('active').success).toBe(true);
                expect(schema.safeParse('ACTIVE').success).toBe(true);
                expect(schema.safeParse('Active').success).toBe(false);
            });
        });

        describe('invalid enum values', () => {
            it('should reject values not in options', () => {
                const context: ValidatorContext = {
                    field: { key: 'status', displayName: 'Status', typeRef: 'app_status' },
                    typeDef: createEnumTypeDef(['active', 'deprecated', 'retired']),
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse('unknown').success).toBe(false);
                expect(schema.safeParse('pending').success).toBe(false);
                expect(schema.safeParse('').success).toBe(false);
            });

            it('should reject non-string values', () => {
                const context: ValidatorContext = {
                    field: { key: 'status', displayName: 'Status', typeRef: 'app_status' },
                    typeDef: createEnumTypeDef(['active', 'inactive']),
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse(123).success).toBe(false);
                expect(schema.safeParse(true).success).toBe(false);
                expect(schema.safeParse(null).success).toBe(false);
                expect(schema.safeParse(undefined).success).toBe(false);
            });
        });

        describe('edge cases', () => {
            it('should handle single-option enum', () => {
                const context: ValidatorContext = {
                    field: { key: 'type', displayName: 'Type', typeRef: 'single_type' },
                    typeDef: createEnumTypeDef(['only-option']),
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse('only-option').success).toBe(true);
                expect(schema.safeParse('other').success).toBe(false);
            });

            it('should fallback to string when no options', () => {
                const context: ValidatorContext = {
                    field: { key: 'status', displayName: 'Status', typeRef: 'empty_enum' },
                    typeDef: {
                        typeKey: 'empty_enum',
                        baseType: 'enum',
                        options: [],
                        validation: null,
                    },
                };
                const schema = validator.buildSchema(context);

                // With empty options, falls back to string validation
                expect(schema.safeParse('anything').success).toBe(true);
            });

            it('should fallback to string when options is null', () => {
                const context: ValidatorContext = {
                    field: { key: 'status', displayName: 'Status', typeRef: 'null_enum' },
                    typeDef: {
                        typeKey: 'null_enum',
                        baseType: 'enum',
                        options: null,
                        validation: null,
                    },
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse('anything').success).toBe(true);
            });

            it('should handle options with special characters', () => {
                const context: ValidatorContext = {
                    field: { key: 'type', displayName: 'Type', typeRef: 'special_type' },
                    typeDef: createEnumTypeDef(['in-development', 'on-premise', 'public-cloud']),
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse('in-development').success).toBe(true);
                expect(schema.safeParse('on-premise').success).toBe(true);
                expect(schema.safeParse('in_development').success).toBe(false);
            });
        });

        describe('EnumOption[] format (rich objects)', () => {
            it('should accept keys from EnumOption objects', () => {
                const context: ValidatorContext = {
                    field: { key: 'status', displayName: 'Status', typeRef: 'app_status' },
                    typeDef: createRichEnumTypeDef([
                        { key: 'active', displayName: 'Active', description: 'In production' },
                        { key: 'deprecated', displayName: 'Deprecated' },
                        { key: 'retired' },
                    ]),
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse('active').success).toBe(true);
                expect(schema.safeParse('deprecated').success).toBe(true);
                expect(schema.safeParse('retired').success).toBe(true);
            });

            it('should reject displayName as value (only key allowed)', () => {
                const context: ValidatorContext = {
                    field: { key: 'status', displayName: 'Status', typeRef: 'app_status' },
                    typeDef: createRichEnumTypeDef([
                        { key: 'active', displayName: 'Active' },
                    ]),
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse('active').success).toBe(true);
                expect(schema.safeParse('Active').success).toBe(false);  // displayName not allowed
            });

            it('should handle mixed simple and rich options', () => {
                // This tests backward compatibility if both formats are mixed
                const context: ValidatorContext = {
                    field: { key: 'status', displayName: 'Status', typeRef: 'app_status' },
                    typeDef: {
                        typeKey: 'mixed_enum',
                        baseType: 'enum',
                        options: [
                            'simple-string',
                            { key: 'rich-option', displayName: 'Rich Option' },
                        ],
                        validation: null,
                    },
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse('simple-string').success).toBe(true);
                expect(schema.safeParse('rich-option').success).toBe(true);
            });
        });

        describe('error messages', () => {
            it('should list available options in error', () => {
                const context: ValidatorContext = {
                    field: { key: 'criticality', displayName: 'Criticality Level', typeRef: 'criticality' },
                    typeDef: createEnumTypeDef(['low', 'medium', 'high', 'critical']),
                };
                const schema = validator.buildSchema(context);
                const result = schema.safeParse('very-high');

                expect(result.success).toBe(false);
                if (!result.success) {
                    const message = result.error.issues[0].message;
                    expect(message).toContain('Criticality Level');
                    expect(message).toContain('low');
                    expect(message).toContain('high');
                }
            });
        });
    });

    describe('priority', () => {
        it('should have priority 20 (higher than type validators)', () => {
            expect(validator.priority).toBe(20);
        });

        it('should have higher priority than basic type validators', () => {
            // EnumTypeValidator priority should be > 10 to override string validator
            expect(validator.priority).toBeGreaterThan(10);
        });
    });
});

