// =============================================================================
// Unit Tests for Model Schemas
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
    AttributeDefinitionSchema,
    AttributeDefinitionArraySchema,
    TypeDefinitionDataSchema,
    RelationDefinitionDataSchema,
    ValidationSchema,
} from './model-schemas';

// =============================================================================
// ValidationSchema Tests
// =============================================================================

describe('ValidationSchema', () => {
    it('should accept valid validation rules', () => {
        const valid = { min: 0, max: 100 };
        expect(() => ValidationSchema.parse(valid)).not.toThrow();
    });

    it('should accept empty object', () => {
        expect(() => ValidationSchema.parse({})).not.toThrow();
    });

    it('should accept undefined', () => {
        expect(() => ValidationSchema.parse(undefined)).not.toThrow();
    });

    it('should accept pattern validation', () => {
        const valid = { pattern: '^[a-z]+$' };
        expect(() => ValidationSchema.parse(valid)).not.toThrow();
    });

    it('should reject unknown properties', () => {
        const invalid = { min: 0, unknownProp: 'foo' };
        expect(() => ValidationSchema.parse(invalid)).toThrow(/unrecognized/i);
    });
});

// =============================================================================
// AttributeDefinitionSchema Tests
// =============================================================================

describe('AttributeDefinitionSchema', () => {
    const validAttribute = {
        key: 'status',
        displayName: 'Status',
        typeRef: 'application_status',
        group: 'basic',
    };

    it('should accept valid attribute definition', () => {
        expect(() => AttributeDefinitionSchema.parse(validAttribute)).not.toThrow();
    });

    it('should accept attribute with inline type', () => {
        const attr = {
            key: 'name',
            displayName: 'Name',
            type: 'string',
            required: true,
        };
        expect(() => AttributeDefinitionSchema.parse(attr)).not.toThrow();
    });

    it('should accept relation attribute', () => {
        const attr = {
            key: 'ownerships',
            displayName: 'Owners',
            type: 'relation',
            relType: 'app_owned_by',
            group: 'ownership',
        };
        expect(() => AttributeDefinitionSchema.parse(attr)).not.toThrow();
    });

    it('should accept attribute with validation rules', () => {
        const attr = {
            key: 'rating',
            displayName: 'Rating',
            type: 'number',
            validation: { min: 1, max: 5 },
        };
        expect(() => AttributeDefinitionSchema.parse(attr)).not.toThrow();
    });

    it('should accept attribute with isArray flag', () => {
        const attr = {
            key: 'tags',
            displayName: 'Tags',
            type: 'string',
            isArray: true,
        };
        expect(() => AttributeDefinitionSchema.parse(attr)).not.toThrow();
    });

    it('should reject missing key', () => {
        const invalid = { displayName: 'Status' };
        expect(() => AttributeDefinitionSchema.parse(invalid)).toThrow();
    });

    it('should reject missing displayName', () => {
        const invalid = { key: 'status' };
        expect(() => AttributeDefinitionSchema.parse(invalid)).toThrow();
    });

    it('should reject unknown properties (strict mode)', () => {
        const invalid = { ...validAttribute, unknownProp: 'foo' };
        expect(() => AttributeDefinitionSchema.parse(invalid)).toThrow(/unrecognized/i);
    });

    it('should reject invalid type value', () => {
        const invalid = { key: 'x', displayName: 'X', type: 'invalid_type' };
        expect(() => AttributeDefinitionSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid side value', () => {
        const invalid = { key: 'x', displayName: 'X', side: 'middle' };
        expect(() => AttributeDefinitionSchema.parse(invalid)).toThrow();
    });
});

// =============================================================================
// AttributeDefinitionArraySchema Tests
// =============================================================================

describe('AttributeDefinitionArraySchema', () => {
    it('should accept array of valid attributes', () => {
        const attrs = [
            { key: 'name', displayName: 'Name', type: 'string', required: true },
            { key: 'status', displayName: 'Status', typeRef: 'app_status' },
        ];
        expect(() => AttributeDefinitionArraySchema.parse(attrs)).not.toThrow();
    });

    it('should accept empty array', () => {
        expect(() => AttributeDefinitionArraySchema.parse([])).not.toThrow();
    });

    it('should reject array with invalid attribute', () => {
        const attrs = [
            { key: 'name', displayName: 'Name' },
            { displayName: 'Missing Key' }, // missing key
        ];
        expect(() => AttributeDefinitionArraySchema.parse(attrs)).toThrow();
    });
});

// =============================================================================
// TypeDefinitionDataSchema Tests
// =============================================================================

describe('TypeDefinitionDataSchema', () => {
    const validEnumType = {
        typeKey: 'application_status',
        displayName: 'Application Status',
        baseType: 'enum',
        options: [
            { key: 'active', displayName: 'Active', description: 'Application is live' },
            { key: 'deprecated', displayName: 'Deprecated' },
            { key: 'in-development' },  // displayName is optional
            { key: 'retired', displayName: 'Retired' },
        ],
    };

    it('should accept valid enum type definition with rich options', () => {
        expect(() => TypeDefinitionDataSchema.parse(validEnumType)).not.toThrow();
    });

    it('should accept option with only key (displayName and description are optional)', () => {
        const enumType = {
            typeKey: 'simple_enum',
            displayName: 'Simple Enum',
            baseType: 'enum',
            options: [{ key: 'value1' }, { key: 'value2' }],
        };
        expect(() => TypeDefinitionDataSchema.parse(enumType)).not.toThrow();
    });

    it('should accept number type with validation', () => {
        const numberType = {
            typeKey: 'rating_1_5',
            displayName: 'Rating (1-5)',
            baseType: 'number',
            validation: { min: 1, max: 5 },
        };
        expect(() => TypeDefinitionDataSchema.parse(numberType)).not.toThrow();
    });

    it('should accept string type', () => {
        const stringType = {
            typeKey: 'email',
            displayName: 'Email Address',
            baseType: 'string',
        };
        expect(() => TypeDefinitionDataSchema.parse(stringType)).not.toThrow();
    });

    it('should reject missing typeKey', () => {
        const invalid = { displayName: 'Status', baseType: 'enum' };
        expect(() => TypeDefinitionDataSchema.parse(invalid)).toThrow();
    });

    it('should reject option with missing key', () => {
        const invalid = {
            typeKey: 'test',
            displayName: 'Test',
            baseType: 'enum',
            options: [{ displayName: 'No Key' }],  // missing key
        };
        expect(() => TypeDefinitionDataSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid baseType', () => {
        const invalid = {
            typeKey: 'test',
            displayName: 'Test',
            baseType: 'invalid_base',
        };
        expect(() => TypeDefinitionDataSchema.parse(invalid)).toThrow();
    });

    it('should reject unknown properties in options (strict mode)', () => {
        const invalid = {
            ...validEnumType,
            options: [{ key: 'test', unknownProp: 'foo' }],
        };
        expect(() => TypeDefinitionDataSchema.parse(invalid)).toThrow(/unrecognized/i);
    });

    it('should reject unknown properties (strict mode)', () => {
        const invalid = { ...validEnumType, unknownProp: 'foo' };
        expect(() => TypeDefinitionDataSchema.parse(invalid)).toThrow(/unrecognized/i);
    });
});

// =============================================================================
// RelationDefinitionDataSchema Tests
// =============================================================================

describe('RelationDefinitionDataSchema', () => {
    const validRelation = {
        relationType: 'app_owned_by',
        displayName: 'Owned By',
        fromEntityType: 'application',
        toEntityType: 'user',
    };

    it('should accept valid relation definition', () => {
        expect(() => RelationDefinitionDataSchema.parse(validRelation)).not.toThrow();
    });

    it('should accept relation with attributeSchema', () => {
        const relation = {
            ...validRelation,
            attributeSchema: [
                {
                    key: 'ownershipRole',
                    displayName: 'Ownership Role',
                    typeRef: 'ownership_role',
                    required: true,
                },
            ],
        };
        expect(() => RelationDefinitionDataSchema.parse(relation)).not.toThrow();
    });

    it('should accept relation with null entity types (any-to-any)', () => {
        const relation = {
            relationType: 'generic_relates_to',
            displayName: 'Relates To',
            fromEntityType: null,
            toEntityType: null,
        };
        expect(() => RelationDefinitionDataSchema.parse(relation)).not.toThrow();
    });

    it('should reject missing relationType', () => {
        const invalid = { displayName: 'Test' };
        expect(() => RelationDefinitionDataSchema.parse(invalid)).toThrow();
    });

    it('should reject unknown properties (strict mode)', () => {
        const invalid = { ...validRelation, unknownProp: 'foo' };
        expect(() => RelationDefinitionDataSchema.parse(invalid)).toThrow(/unrecognized/i);
    });
});
