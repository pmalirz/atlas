import { Badge } from '@/components/ui/badge';
import type { TableColumnSchema, EntitySchema } from '../schema/types';
import { formatRelativeTime } from '@/lib/utils';

/**
 * Format a cell value based on column configuration
 */
export function formatCellValue(
    entity: Record<string, unknown>,
    column: TableColumnSchema,
    _entitySchema: EntitySchema
): React.ReactNode {
    const value = entity[column.field];

    if (value === undefined || value === null) {
        return <span className="text-muted-foreground">—</span>;
    }

    switch (column.format) {
        case 'date':
            return new Date(String(value)).toLocaleDateString();
        case 'datetime':
            return new Date(String(value)).toLocaleString();
        case 'relative':
            return formatRelativeTime(String(value));
        case 'count':
            return Array.isArray(value) ? String(value.length) : String(value);
        case 'badge':
            return <Badge variant="secondary">{String(value)}</Badge>;
        default:
            return String(value);
    }
}
