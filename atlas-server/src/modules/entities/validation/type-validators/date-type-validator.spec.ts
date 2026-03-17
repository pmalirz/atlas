import { DateTypeValidator } from './date-type-validator';
import { ValidatorContext } from './base-type-validator';

describe('DateTypeValidator', () => {
    let validator: DateTypeValidator;

    beforeEach(() => {
        validator = new DateTypeValidator();
    });

    describe('supports()', () => {
        it('should support type: date', () => {
            const context: ValidatorContext = {
                field: { key: 'createdAt', displayName: 'Created At', type: 'date' },
            };
            expect(validator.supports(context)).toBe(true);
        });

        it('should support type: datetime', () => {
            const context: ValidatorContext = {
                field: { key: 'lastLogin', displayName: 'Last Login', type: 'datetime' },
            };
            expect(validator.supports(context)).toBe(true);
        });

        it('should not support other types', () => {
            const testCases: unknown[] = ['string', 'number', 'boolean', 'text', undefined];
            testCases.forEach(type => {
                const context: ValidatorContext = {
                    field: { key: 'field', displayName: 'Field', type: type as any },
                };
                expect(validator.supports(context)).toBe(false);
            });
        });
    });

    describe('buildSchema()', () => {
        describe('ISO 8601 date strings', () => {
            it('should accept date-only format (YYYY-MM-DD)', () => {
                const context: ValidatorContext = {
                    field: { key: 'date', displayName: 'Date', type: 'date' },
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse('2024-01-15').success).toBe(true);
                expect(schema.safeParse('2024-12-31').success).toBe(true);
                expect(schema.safeParse('1999-01-01').success).toBe(true);
            });

            it('should accept datetime with timezone (ISO 8601)', () => {
                const context: ValidatorContext = {
                    field: { key: 'timestamp', displayName: 'Timestamp', type: 'datetime' },
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse('2024-01-15T10:30:00Z').success).toBe(true);
                expect(schema.safeParse('2024-01-15T10:30:00.000Z').success).toBe(true);
                expect(schema.safeParse('2024-01-15T10:30:00+02:00').success).toBe(true);
            });

            it('should accept datetime without timezone', () => {
                const context: ValidatorContext = {
                    field: { key: 'timestamp', displayName: 'Timestamp', type: 'datetime' },
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse('2024-01-15T10:30:00').success).toBe(true);
            });
        });

        describe('invalid date formats', () => {
            it('should reject plain text', () => {
                const context: ValidatorContext = {
                    field: { key: 'date', displayName: 'Date', type: 'date' },
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse('not-a-date').success).toBe(false);
                expect(schema.safeParse('today').success).toBe(false);
                // Note: JS Date.parse is lenient and accepts 'January 15, 2024'
            });

            it('should reject invalid month values', () => {
                const context: ValidatorContext = {
                    field: { key: 'date', displayName: 'Date', type: 'date' },
                };
                const schema = validator.buildSchema(context);

                // JavaScript Date.parse is lenient with some invalid dates
                // Month 13 is rejected, but 02-30 may be adjusted
                expect(schema.safeParse('2024-13-01').success).toBe(false);
            });

            it('should reject non-string values', () => {
                const context: ValidatorContext = {
                    field: { key: 'date', displayName: 'Date', type: 'date' },
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse(12345).success).toBe(false);
                expect(schema.safeParse(new Date()).success).toBe(false);
                expect(schema.safeParse(null).success).toBe(false);
                expect(schema.safeParse(undefined).success).toBe(false);
            });

            it('should reject empty string', () => {
                const context: ValidatorContext = {
                    field: { key: 'date', displayName: 'Date', type: 'date' },
                };
                const schema = validator.buildSchema(context);

                expect(schema.safeParse('').success).toBe(false);
            });
        });

        describe('error messages', () => {
            it('should provide meaningful error for non-string', () => {
                const context: ValidatorContext = {
                    field: { key: 'startDate', displayName: 'Start Date', type: 'date' },
                };
                const schema = validator.buildSchema(context);
                const result = schema.safeParse(12345);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.issues[0].message).toContain('Start Date');
                }
            });

            it('should provide meaningful error for invalid date', () => {
                const context: ValidatorContext = {
                    field: { key: 'endDate', displayName: 'End Date', type: 'date' },
                };
                const schema = validator.buildSchema(context);
                const result = schema.safeParse('invalid-date');

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.issues[0].message).toContain('End Date');
                    expect(result.error.issues[0].message).toContain('valid date');
                }
            });
        });
    });

    describe('priority', () => {
        it('should have priority 10', () => {
            expect(validator.priority).toBe(10);
        });
    });
});
