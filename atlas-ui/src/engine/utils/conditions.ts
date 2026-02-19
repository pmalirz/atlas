import { ConditionSchema, CONDITION_OPERATORS, ConditionOperator } from '../schema/types';
import { EntityData } from '../schema/common';

const OPERATOR_STRATEGIES: Record<ConditionOperator, (value: any, conditionValue: any) => boolean> = {
    [CONDITION_OPERATORS.EQ]: (value, conditionValue) => value === conditionValue,
    [CONDITION_OPERATORS.NEQ]: (value, conditionValue) => value !== conditionValue,
    [CONDITION_OPERATORS.GT]: (value, conditionValue) => typeof value === 'number' && typeof conditionValue === 'number' && value > conditionValue,
    [CONDITION_OPERATORS.LT]: (value, conditionValue) => typeof value === 'number' && typeof conditionValue === 'number' && value < conditionValue,
    [CONDITION_OPERATORS.CONTAINS]: (value, conditionValue) => {
        if (Array.isArray(value)) {
            return value.includes(conditionValue);
        }
        return typeof value === 'string' && typeof conditionValue === 'string' && value.includes(conditionValue);
    },
    [CONDITION_OPERATORS.EXISTS]: (value) => value !== undefined && value !== null && value !== '',
};

/**
 * Evaluate a visibility condition against entity data
 */
export function evaluateCondition(condition: ConditionSchema, entity: EntityData): boolean {
    const value = entity[condition.field];
    const strategy = OPERATOR_STRATEGIES[condition.operator];
    return strategy ? strategy(value, condition.value) : true;
}
