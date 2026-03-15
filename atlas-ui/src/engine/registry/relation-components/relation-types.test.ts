import { describe, it, expect } from 'vitest';
import {
    getTargetEntityType,
    inferRelationComponentType,
    inferRelationDirection,
    type RelationDefinition,
} from './relation-types';
import type { FieldSchema } from '../../schema/types';

function makeRelationField(overrides: Partial<FieldSchema> = {}): FieldSchema {
    return {
        key: 'books',
        type: 'relation',
        displayName: 'Books',
        relType: 'book_written_by',
        ...overrides,
    };
}

describe('relation-types helpers', () => {
    const directionalDef: RelationDefinition = {
        id: 'rel-def-1',
        relationType: 'book_written_by',
        displayName: 'Written By',
        fromEntityType: 'book',
        toEntityType: 'author',
        attributeSchema: [
            {
                key: 'role',
                displayName: 'Role',
                typeRef: 'author_role',
            },
        ],
    };

    describe('inferRelationDirection', () => {
        it('uses side override when provided', () => {
            expect(
                inferRelationDirection('author', directionalDef, makeRelationField({ side: 'from' }))
            ).toBe('outgoing');
            expect(
                inferRelationDirection('book', directionalDef, makeRelationField({ side: 'to' }))
            ).toBe('incoming');
        });

        it('infers incoming for target entity type', () => {
            const direction = inferRelationDirection('author', directionalDef, makeRelationField());
            expect(direction).toBe('incoming');
        });

        it('infers outgoing for source entity type', () => {
            const direction = inferRelationDirection('book', directionalDef, makeRelationField());
            expect(direction).toBe('outgoing');
        });
    });

    describe('inferRelationComponentType', () => {
        it('prefers explicit component override', () => {
            const field = makeRelationField({ relation: { componentType: 'panel' } });
            const componentType = inferRelationComponentType(field, directionalDef, 'author');
            expect(componentType).toBe('panel');
        });

        it('uses dialog for attributed relations from incoming side', () => {
            const componentType = inferRelationComponentType(makeRelationField(), directionalDef, 'author');
            expect(componentType).toBe('dialog');
        });

        it('uses panel for incoming relations without attributes', () => {
            const noAttributes: RelationDefinition = {
                ...directionalDef,
                attributeSchema: [],
            };
            const componentType = inferRelationComponentType(makeRelationField(), noAttributes, 'author');
            expect(componentType).toBe('panel');
        });

        it('defaults to tags when no direction and no attributes', () => {
            const componentType = inferRelationComponentType(makeRelationField(), undefined, 'book');
            expect(componentType).toBe('tags');
        });
    });

    describe('getTargetEntityType', () => {
        it('prefers explicit targetEntityType override', () => {
            const field = makeRelationField({ relation: { targetEntityType: 'technology' } });
            expect(getTargetEntityType(field, directionalDef, 'author')).toBe('technology');
        });

        it('returns source type when current entity is incoming side', () => {
            expect(getTargetEntityType(makeRelationField(), directionalDef, 'author')).toBe('book');
        });

        it('returns target type when current entity is outgoing side', () => {
            expect(getTargetEntityType(makeRelationField(), directionalDef, 'book')).toBe('author');
        });

        it('falls back to relation toEntityType when entity context is missing', () => {
            expect(getTargetEntityType(makeRelationField(), directionalDef)).toBe('author');
        });

        it('returns undefined when relation definition is missing', () => {
            expect(getTargetEntityType(makeRelationField(), undefined, 'book')).toBeUndefined();
        });
    });
});
