import { describe, it, expect } from 'vitest';
import { evaluateCondition } from './conditions';
import { ConditionSchema } from '../schema/types';

describe('evaluateCondition', () => {
    it('should return true when no condition is provided', () => {
        // implicit testing of logic
    });

    it('should handle "eq" operator', () => {
        const condition: ConditionSchema = { field: 'status', operator: 'eq', value: 'active' };
        expect(evaluateCondition(condition, { status: 'active' })).toBe(true);
        expect(evaluateCondition(condition, { status: 'inactive' })).toBe(false);
    });

    it('should handle "neq" operator', () => {
        const condition: ConditionSchema = { field: 'status', operator: 'neq', value: 'active' };
        expect(evaluateCondition(condition, { status: 'inactive' })).toBe(true);
        expect(evaluateCondition(condition, { status: 'active' })).toBe(false);
    });

    it('should handle "gt" operator', () => {
        const condition: ConditionSchema = { field: 'age', operator: 'gt', value: 18 };
        expect(evaluateCondition(condition, { age: 20 })).toBe(true);
        expect(evaluateCondition(condition, { age: 18 })).toBe(false);
        expect(evaluateCondition(condition, { age: 15 })).toBe(false);
    });

    it('should handle "lt" operator', () => {
        const condition: ConditionSchema = { field: 'age', operator: 'lt', value: 18 };
        expect(evaluateCondition(condition, { age: 15 })).toBe(true);
        expect(evaluateCondition(condition, { age: 18 })).toBe(false);
        expect(evaluateCondition(condition, { age: 20 })).toBe(false);
    });

    it('should handle "contains" operator', () => {
        const condition: ConditionSchema = { field: 'tags', operator: 'contains', value: 'urgent' };
        // Test array inclusion
        expect(evaluateCondition(condition, { tags: ['urgent', 'work'] })).toBe(true);
        expect(evaluateCondition(condition, { tags: ['work', 'low'] })).toBe(false);

        // Test string inclusion
        const conditionStr: ConditionSchema = { field: 'title', operator: 'contains', value: 'Atlas' };
        expect(evaluateCondition(conditionStr, { title: 'App Atlas' })).toBe(true);
        expect(evaluateCondition(conditionStr, { title: 'Other App' })).toBe(false);
    });

    it('should handle "exists" operator', () => {
        const condition: ConditionSchema = { field: 'description', operator: 'exists', value: true };

        expect(evaluateCondition(condition, { description: 'Something' })).toBe(true);
        expect(evaluateCondition(condition, { description: '' })).toBe(false);
        expect(evaluateCondition(condition, { description: null })).toBe(false);
        expect(evaluateCondition(condition, { description: undefined })).toBe(false);
    });

    it('should return true for unknown operators', () => {
        const condition: ConditionSchema = { field: 'status', operator: 'unknown' as ConditionOperator, value: 'active' };
        expect(evaluateCondition(condition, { status: 'active' })).toBe(true);
    });
});
