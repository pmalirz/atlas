import { describe, it, expect } from 'vitest';
import { sortEntities } from './utils';

describe('sortEntities', () => {
    it('should sort strings correctly', () => {
        const items = [{ val: 'b' }, { val: 'a' }, { val: 'c' }];
        const sorted = sortEntities(items, { field: 'val', direction: 'asc' });
        expect(sorted).toEqual([{ val: 'a' }, { val: 'b' }, { val: 'c' }]);
    });

    it('should sort numbers correctly', () => {
        const items = [{ val: 2 }, { val: 1 }, { val: 3 }];
        const sorted = sortEntities(items, { field: 'val', direction: 'asc' });
        expect(sorted).toEqual([{ val: 1 }, { val: 2 }, { val: 3 }]);
    });

    it('should handle mixed nulls correctly', () => {
        const items = [
            { id: 1, val: null },
            { id: 2, val: null },
            { id: 3, val: 'a' }
        ];

        const sorted = sortEntities(items, { field: 'val', direction: 'asc' });

        // Expect 'a' first, then nulls
        expect(sorted[0].id).toBe(3);
        expect(sorted[1].val).toBeNull();
        expect(sorted[2].val).toBeNull();
    });

    it('should handle mixed null and undefined as equal', () => {
        const items = [
            { id: 1, val: null },
            { id: 2, val: undefined },
        ];

        const sorted = sortEntities(items, { field: 'val', direction: 'asc' });

        // Since they are equal, stable sort should preserve order [1, 2]
        expect(sorted[0].id).toBe(1);
        expect(sorted[1].id).toBe(2);
    });
});
