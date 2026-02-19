import { z } from 'zod';
import { RelationTypeValidator } from './relation-type-validator';
import {
    AttributeDefinition,
    TypeDefinition,
    RelationDefinitionData,
    ValidatorContext,
} from './base-type-validator';

describe('RelationTypeValidator', () => {
    let validator: RelationTypeValidator;

    beforeEach(() => {
        validator = new RelationTypeValidator();
    });

    describe('supports()', () => {
        it('should return true for relation type with relType', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'ownerships',
                    displayName: 'Owners',
                    type: 'relation',
                    relType: 'app_owned_by',
                },
            };

            expect(validator.supports(context)).toBe(true);
        });

        it('should return false for relation type without relType', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'ownerships',
                    displayName: 'Owners',
                    type: 'relation',
                },
            };

            expect(validator.supports(context)).toBe(false);
        });

        it('should return false for non-relation type', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'name',
                    displayName: 'Name',
                    type: 'string',
                },
            };

            expect(validator.supports(context)).toBe(false);
        });

        it('should return false for relation type with relType but no type', () => {
            const context: ValidatorContext = {
                field: {
                    key: 'ownerships',
                    displayName: 'Owners',
                    relType: 'app_owned_by',
                },
            };

            expect(validator.supports(context)).toBe(false);
        });
    });

    describe('priority', () => {
        it('should have priority 25 (higher than enum which is 20)', () => {
            expect(validator.priority).toBe(25);
        });
    });

    describe('buildSchema()', () => {
        const ownershipRoleTypeDef: TypeDefinition = {
            typeKey: 'ownership_role',
            baseType: 'enum',
            options: ['owner', 'business-owner', 'technical-owner', 'delegate'],
            validation: null,
        };

        const typeDefinitions = new Map<string, TypeDefinition>([
            ['ownership_role', ownershipRoleTypeDef],
        ]);

        describe('basic relation without attributes', () => {
            it('should validate array of objects with targetId only', () => {
                const relationDef: RelationDefinitionData = {
                    relationType: 'app_uses_technology',
                    displayName: 'Uses Technology',
                    fromEntityType: 'application',
                    toEntityType: 'technology',
                    isDirectional: true,
                    attributeSchema: null,
                };

                const context: ValidatorContext = {
                    field: {
                        key: 'technologies',
                        displayName: 'Technologies',
                        type: 'relation',
                        relType: 'app_uses_technology',
                    },
                    relationDef,
                    typeDefinitions,
                };

                const schema = validator.buildSchema(context);

                // Valid: array with targetId
                const valid = schema.safeParse([
                    { targetId: '550e8400-e29b-41d4-a716-446655440000' },
                    { targetId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
                ]);
                expect(valid.success).toBe(true);

                // Valid: empty array
                expect(schema.safeParse([]).success).toBe(true);
            });

            it('should reject invalid targetId', () => {
                const relationDef: RelationDefinitionData = {
                    relationType: 'app_uses_technology',
                    displayName: 'Uses Technology',
                    fromEntityType: 'application',
                    toEntityType: 'technology',
                    isDirectional: true,
                    attributeSchema: null,
                };

                const context: ValidatorContext = {
                    field: {
                        key: 'technologies',
                        displayName: 'Technologies',
                        type: 'relation',
                        relType: 'app_uses_technology',
                    },
                    relationDef,
                    typeDefinitions,
                };

                const schema = validator.buildSchema(context);

                // Invalid: not a UUID
                const invalidUuid = schema.safeParse([{ targetId: 'not-a-uuid' }]);
                expect(invalidUuid.success).toBe(false);

                // Invalid: missing targetId
                const missingId = schema.safeParse([{}]);
                expect(missingId.success).toBe(false);

                // Invalid: not an array
                const notArray = schema.safeParse({ targetId: '550e8400-e29b-41d4-a716-446655440000' });
                expect(notArray.success).toBe(false);
            });
        });

        describe('relation with enum attribute', () => {
            const relationDef: RelationDefinitionData = {
                relationType: 'app_owned_by',
                displayName: 'Owned By',
                fromEntityType: 'application',
                toEntityType: 'user',
                isDirectional: true,
                attributeSchema: [
                    {
                        key: 'ownershipRole',
                        displayName: 'Ownership Role',
                        typeRef: 'ownership_role',
                        required: true,
                    },
                ],
            };

            it('should validate relation with valid enum attribute', () => {
                const context: ValidatorContext = {
                    field: {
                        key: 'ownerships',
                        displayName: 'Owners',
                        type: 'relation',
                        relType: 'app_owned_by',
                    },
                    relationDef,
                    typeDefinitions,
                };

                const schema = validator.buildSchema(context);

                const valid = schema.safeParse([
                    {
                        targetId: '550e8400-e29b-41d4-a716-446655440000',
                        ownershipRole: 'owner',
                    },
                    {
                        targetId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                        ownershipRole: 'delegate',
                    },
                ]);

                expect(valid.success).toBe(true);
            });

            it('should reject invalid enum value', () => {
                const context: ValidatorContext = {
                    field: {
                        key: 'ownerships',
                        displayName: 'Owners',
                        type: 'relation',
                        relType: 'app_owned_by',
                    },
                    relationDef,
                    typeDefinitions,
                };

                const schema = validator.buildSchema(context);

                const invalid = schema.safeParse([
                    {
                        targetId: '550e8400-e29b-41d4-a716-446655440000',
                        ownershipRole: 'invalid-role',
                    },
                ]);

                expect(invalid.success).toBe(false);
            });

            it('should reject missing required attribute', () => {
                const context: ValidatorContext = {
                    field: {
                        key: 'ownerships',
                        displayName: 'Owners',
                        type: 'relation',
                        relType: 'app_owned_by',
                    },
                    relationDef,
                    typeDefinitions,
                };

                const schema = validator.buildSchema(context);

                const invalid = schema.safeParse([
                    {
                        targetId: '550e8400-e29b-41d4-a716-446655440000',
                        // missing ownershipRole
                    },
                ]);

                expect(invalid.success).toBe(false);
            });
        });

        describe('relation with optional attribute', () => {
            const relationDef: RelationDefinitionData = {
                relationType: 'app_owned_by',
                displayName: 'Owned By',
                fromEntityType: 'application',
                toEntityType: 'user',
                isDirectional: true,
                attributeSchema: [
                    {
                        key: 'ownershipRole',
                        displayName: 'Ownership Role',
                        typeRef: 'ownership_role',
                        required: false, // optional
                    },
                    {
                        key: 'notes',
                        displayName: 'Notes',
                        type: 'string',
                        required: false,
                    },
                ],
            };

            it('should allow missing optional attributes', () => {
                const context: ValidatorContext = {
                    field: {
                        key: 'ownerships',
                        displayName: 'Owners',
                        type: 'relation',
                        relType: 'app_owned_by',
                    },
                    relationDef,
                    typeDefinitions,
                };

                const schema = validator.buildSchema(context);

                const valid = schema.safeParse([
                    {
                        targetId: '550e8400-e29b-41d4-a716-446655440000',
                        // no ownershipRole or notes - both optional
                    },
                ]);

                expect(valid.success).toBe(true);
            });

            it('should allow null for optional attributes', () => {
                const context: ValidatorContext = {
                    field: {
                        key: 'ownerships',
                        displayName: 'Owners',
                        type: 'relation',
                        relType: 'app_owned_by',
                    },
                    relationDef,
                    typeDefinitions,
                };

                const schema = validator.buildSchema(context);

                const valid = schema.safeParse([
                    {
                        targetId: '550e8400-e29b-41d4-a716-446655440000',
                        ownershipRole: null,
                        notes: null,
                    },
                ]);

                expect(valid.success).toBe(true);
            });
        });

        describe('relation with multiple attribute types', () => {
            const relationDef: RelationDefinitionData = {
                relationType: 'complex_relation',
                displayName: 'Complex Relation',
                fromEntityType: 'application',
                toEntityType: 'user',
                isDirectional: true,
                attributeSchema: [
                    { key: 'role', displayName: 'Role', typeRef: 'ownership_role', required: true },
                    { key: 'priority', displayName: 'Priority', type: 'number', required: false },
                    { key: 'isPrimary', displayName: 'Is Primary', type: 'boolean', required: false },
                    { key: 'assignedDate', displayName: 'Assigned Date', type: 'date', required: false },
                    { key: 'comments', displayName: 'Comments', type: 'text', required: false },
                ],
            };

            it('should validate all attribute types correctly', () => {
                const context: ValidatorContext = {
                    field: {
                        key: 'complexRelations',
                        displayName: 'Complex Relations',
                        type: 'relation',
                        relType: 'complex_relation',
                    },
                    relationDef,
                    typeDefinitions,
                };

                const schema = validator.buildSchema(context);

                const valid = schema.safeParse([
                    {
                        targetId: '550e8400-e29b-41d4-a716-446655440000',
                        role: 'owner',
                        priority: 1,
                        isPrimary: true,
                        assignedDate: '2024-01-15',
                        comments: 'Primary owner',
                    },
                ]);

                expect(valid.success).toBe(true);
            });

            it('should reject wrong types for attributes', () => {
                const context: ValidatorContext = {
                    field: {
                        key: 'complexRelations',
                        displayName: 'Complex Relations',
                        type: 'relation',
                        relType: 'complex_relation',
                    },
                    relationDef,
                    typeDefinitions,
                };

                const schema = validator.buildSchema(context);

                // priority should be number, not string
                const invalid = schema.safeParse([
                    {
                        targetId: '550e8400-e29b-41d4-a716-446655440000',
                        role: 'owner',
                        priority: 'high', // should be number
                    },
                ]);

                expect(invalid.success).toBe(false);
            });
        });

        describe('edge cases', () => {
            it('should handle missing relationDef gracefully', () => {
                const context: ValidatorContext = {
                    field: {
                        key: 'ownerships',
                        displayName: 'Owners',
                        type: 'relation',
                        relType: 'app_owned_by',
                    },
                    relationDef: null,
                    typeDefinitions,
                };

                const schema = validator.buildSchema(context);

                // Should still require targetId
                const valid = schema.safeParse([
                    { targetId: '550e8400-e29b-41d4-a716-446655440000' },
                ]);

                expect(valid.success).toBe(true);
            });

            it('should handle empty attributeSchema', () => {
                const relationDef: RelationDefinitionData = {
                    relationType: 'simple_relation',
                    displayName: 'Simple Relation',
                    fromEntityType: 'application',
                    toEntityType: 'user',
                    isDirectional: true,
                    attributeSchema: [],
                };

                const context: ValidatorContext = {
                    field: {
                        key: 'simpleRelations',
                        displayName: 'Simple Relations',
                        type: 'relation',
                        relType: 'simple_relation',
                    },
                    relationDef,
                    typeDefinitions,
                };

                const schema = validator.buildSchema(context);

                const valid = schema.safeParse([
                    { targetId: '550e8400-e29b-41d4-a716-446655440000' },
                ]);

                expect(valid.success).toBe(true);
            });

            it('should handle attribute with missing typeRef gracefully', () => {
                const relationDef: RelationDefinitionData = {
                    relationType: 'app_owned_by',
                    displayName: 'Owned By',
                    fromEntityType: 'application',
                    toEntityType: 'user',
                    isDirectional: true,
                    attributeSchema: [
                        {
                            key: 'unknownType',
                            displayName: 'Unknown Type',
                            typeRef: 'non_existent_type', // doesn't exist in typeDefinitions
                            required: false,
                        },
                    ],
                };

                const context: ValidatorContext = {
                    field: {
                        key: 'ownerships',
                        displayName: 'Owners',
                        type: 'relation',
                        relType: 'app_owned_by',
                    },
                    relationDef,
                    typeDefinitions,
                };

                const schema = validator.buildSchema(context);

                // Should use z.unknown() fallback and accept any value
                const valid = schema.safeParse([
                    {
                        targetId: '550e8400-e29b-41d4-a716-446655440000',
                        unknownType: 'anything',
                    },
                ]);

                expect(valid.success).toBe(true);
            });
        });
    });
});

