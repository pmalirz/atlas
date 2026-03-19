import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cn, safeParseDate, formatDateTime, formatDate, formatRelativeTime, formatLabel, toLucideIcon, sortEntities } from './utils';
import { ArrowUpRight, LayoutDashboard, User } from 'lucide-react';

describe('cn', () => {
    it('should merge class names correctly', () => {
        expect(cn('btn', 'btn-primary')).toBe('btn btn-primary');
    });

    it('should handle conflicting classes with Tailwind merge', () => {
        expect(cn('p-2', 'p-4')).toBe('p-4');
    });

    it('should handle conditional classes', () => {
        expect(cn('btn', false && 'btn-primary', 'btn-secondary')).toBe('btn btn-secondary');
    });

    it('should handle empty inputs', () => {
        expect(cn()).toBe('');
        expect(cn('')).toBe('');
    });
});

describe('safeParseDate', () => {
    it('should parse valid date strings', () => {
        const result = safeParseDate('2023-01-01');
        expect(result).toBeInstanceOf(Date);
        expect(result?.getFullYear()).toBe(2023);
    });

    it('should return valid Date objects as-is', () => {
        const date = new Date('2023-01-01');
        const result = safeParseDate(date);
        expect(result).toBe(date);
    });

    it('should return null for invalid date strings', () => {
        expect(safeParseDate('invalid-date')).toBeNull();
    });

    it('should return null for invalid Date objects', () => {
        const invalidDate = new Date('invalid');
        expect(safeParseDate(invalidDate)).toBeNull();
    });
});

describe('formatDateTime', () => {
    it('should format valid dates correctly', () => {
        const result = formatDateTime('2023-01-01T12:30:00');
        expect(result).toBe('2023-01-01 12:30');
    });

    it('should handle Date objects', () => {
        const date = new Date('2023-01-01T12:30:00');
        const result = formatDateTime(date);
        expect(result).toBe('2023-01-01 12:30');
    });

    it('should return "Invalid date" for invalid dates', () => {
        expect(formatDateTime('invalid-date')).toBe('Invalid date');
    });
});

describe('formatDate', () => {
    it('should format dates to yyyy-MM-dd format', () => {
        const result = formatDate('2023-01-01T12:30:00');
        expect(result).toBe('2023-01-01');
    });

    it('should handle Date objects', () => {
        const date = new Date('2023-01-01T12:30:00');
        const result = formatDate(date);
        expect(result).toBe('2023-01-01');
    });

    it('should return "Invalid date" for invalid dates', () => {
        expect(formatDate('invalid-date')).toBe('Invalid date');
    });
});

describe('formatRelativeTime', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T12:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should format recent dates as relative time', () => {
        const oneHourAgo = new Date('2026-01-15T11:00:00.000Z');
        const result = formatRelativeTime(oneHourAgo);
        expect(result).toContain('ago');
    });

    it('should format dates older than 7 days as absolute date', () => {
        const eightDaysAgo = new Date('2026-01-07T12:00:00.000Z');
        const result = formatRelativeTime(eightDaysAgo);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return "Invalid date" for invalid dates', () => {
        expect(formatRelativeTime('invalid-date')).toBe('Invalid date');
    });
});

describe('formatLabel', () => {
    it('should convert kebab-case to Title Case', () => {
        expect(formatLabel('user-name')).toBe('User Name');
    });

    it('should convert snake_case to Title Case', () => {
        expect(formatLabel('user_name')).toBe('User Name');
    });

    it('should handle mixed separators', () => {
        expect(formatLabel('user-name_id')).toBe('User Name Id');
    });

    it('should handle empty strings', () => {
        expect(formatLabel('')).toBe('');
    });

    it('should handle single words', () => {
        expect(formatLabel('username')).toBe('Username');
    });
});

describe('toLucideIcon', () => {
    it('should return default icon when no name provided', () => {
        const result = toLucideIcon();
        expect(result).toBe(LayoutDashboard);
    });

    it('should return default icon when empty string provided', () => {
        const result = toLucideIcon('');
        expect(result).toBe(LayoutDashboard);
    });

    it('should convert kebab-case to PascalCase and find icon', () => {
        const result = toLucideIcon('arrow-up-right');
        // Use toEqual instead of toBe for component comparison
        expect(result).toEqual(ArrowUpRight);
    });

    it('should return default icon for unknown icon names', () => {
        const result = toLucideIcon('unknown-icon');
        expect(result).toBe(LayoutDashboard);
    });

    it('should use custom default icon', () => {
        const result = toLucideIcon('unknown-icon', User);
        expect(result).toBe(User);
    });
});

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

    it('should sort dates correctly', () => {
        const date1 = new Date('2023-01-01');
        const date2 = new Date('2023-01-02');
        const date3 = new Date('2022-12-31');
        const items = [{ val: date2 }, { val: date1 }, { val: date3 }];
        const sorted = sortEntities(items, { field: 'val', direction: 'asc' });
        expect(sorted).toEqual([{ val: date3 }, { val: date1 }, { val: date2 }]);
    });

    it('should sort descending correctly', () => {
        const items = [{ val: 'a' }, { val: 'b' }, { val: 'c' }];
        const sorted = sortEntities(items, { field: 'val', direction: 'desc' });
        expect(sorted).toEqual([{ val: 'c' }, { val: 'b' }, { val: 'a' }]);
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

    it('should return original array when no sort config provided', () => {
        const items = [{ val: 'b' }, { val: 'a' }];
        const sorted = sortEntities(items);
        expect(sorted).toEqual(items);
        // Should be a new array (not the same reference)
        expect(sorted).not.toBe(items);
    });

    it('should handle mixed types as strings fallback', () => {
        const items = [{ val: true }, { val: false }, { val: 'a' }];
        const sorted = sortEntities(items, { field: 'val', direction: 'asc' });
        // String comparison: 'a' < 'false' < 'true'
        expect(sorted[0].val).toBe('a');
        expect(sorted[1].val).toBe(false);
        expect(sorted[2].val).toBe(true);
    });

    it('should not mutate original array', () => {
        const items = [{ val: 'b' }, { val: 'a' }];
        const originalOrder = [...items];
        sortEntities(items, { field: 'val', direction: 'asc' });
        expect(items).toEqual(originalOrder);
    });
});
