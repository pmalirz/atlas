import { describe, it, expect } from 'vitest';
import { transformToRelationItems, getGridClasses } from './field-utils';
import { EntityData } from '../schema/common';
import { FieldPlacementSchema } from '../schema/types';

describe('transformToRelationItems', () => {
    it('should return empty array for null or undefined', () => {
        expect(transformToRelationItems(null)).toEqual([]);
        expect(transformToRelationItems(undefined)).toEqual([]);
    });

    it('should return empty array for non-array input', () => {
        expect(transformToRelationItems('string')).toEqual([]);
        expect(transformToRelationItems(123)).toEqual([]);
        expect(transformToRelationItems({})).toEqual([]);
    });

    it('should transform object array correctly', () => {
        const input = [
            { id: 'rel-1', targetId: 'target-1', targetName: 'Target 1', entityType: 'app' },
            { id: 'rel-2', targetId: 'target-2', targetName: 'Target 2' }
        ];

        const result = transformToRelationItems(input);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            id: 'rel-1',
            targetId: 'target-1',
            targetName: 'Target 1',
            targetEntityType: 'app',
            attributes: undefined
        });
        expect(result[1]).toEqual({
            id: 'rel-2',
            targetId: 'target-2',
            targetName: 'Target 2',
            targetEntityType: undefined,
            attributes: undefined
        });
    });

    it('should extract attributes correctly', () => {
        const input: EntityData[] = [{
            id: 'rel-1',
            targetId: 'target-1',
            targetName: 'Target 1',
            customAttr: 'value',
            anotherAttr: 123
        }];

        const result = transformToRelationItems(input);

        expect(result[0].attributes).toEqual({
            customAttr: 'value',
            anotherAttr: 123
        });
    });

    it('should handle string array (simple ID references)', () => {
        const input = ['target-1', 'target-2'];
        const result = transformToRelationItems(input);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            id: 'temp-0',
            targetId: 'target-1',
            targetName: 'target-1'
        });
        expect(result[1]).toEqual({
            id: 'temp-1',
            targetId: 'target-2',
            targetName: 'target-2'
        });
    });

    it('should filter out invalid items (null/undefined in array)', () => {
        const input = [
            { id: 'rel-1', targetId: 't1', targetName: 'T1' },
            null,
            undefined,
            123 // numbers are not handled, returns null internally
        ];

        const result = transformToRelationItems(input);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('rel-1');
    });
});

describe('getGridClasses', () => {
    it('should generate basic column start class', () => {
        const placement = {
            field: 'test',
            column: 1
        } as FieldPlacementSchema;

        expect(getGridClasses(placement)).toContain('col-start-1');
        expect(getGridClasses(placement)).toContain('col-span-1'); // Default
    });

    it('should handle column span', () => {
        const placement = {
            field: 'test',
            column: 1,
            columnSpan: 2
        } as FieldPlacementSchema;

        const classes = getGridClasses(placement);
        expect(classes).toContain('col-start-1');
        expect(classes).toContain('col-span-2');
        expect(classes).not.toContain('col-span-1');
    });

    it('should handle row placement', () => {
        const placement = {
            field: 'test',
            column: 1,
            row: 2,
            rowSpan: 3
        } as FieldPlacementSchema;

        const classes = getGridClasses(placement);
        expect(classes).toContain('row-start-2');
        expect(classes).toContain('row-span-3');
    });

    it('should ignore single row span', () => {
        const placement = {
            field: 'test',
            column: 1,
            rowSpan: 1
        } as FieldPlacementSchema;

        const classes = getGridClasses(placement);
        expect(classes).not.toContain('row-span-1');
    });
});
