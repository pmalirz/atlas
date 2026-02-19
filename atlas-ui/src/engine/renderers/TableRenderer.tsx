import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TableViewSchema, EntitySchema, SortSchema } from '../schema/types';
import { Link } from 'react-router-dom';
import { testIds } from '../utils/testIdUtils';
import { formatCellValue } from '../utils/formatters';

interface TableRendererProps {
    entities: Record<string, unknown>[];
    schema: TableViewSchema;
    entitySchema: EntitySchema;
    entityType: string;
    sort?: SortSchema;
    onSortChange?: (sort: SortSchema) => void;
}

/**
 * TableRenderer
 *
 * Renders entities in a table format with sortable columns.
 */
export function TableRenderer({
    entities,
    schema,
    entitySchema,
    entityType,
    sort,
    onSortChange
}: TableRendererProps) {

    const handleSort = (field: string) => {
        if (!onSortChange) return;

        if (sort?.field === field) {
            onSortChange({
                field,
                direction: sort.direction === 'asc' ? 'desc' : 'asc',
            });
        } else {
            onSortChange({ field, direction: 'asc' });
        }
    };

    return (
        <table className="atlas-table">
            <thead className="atlas-table-header">
                <tr className="atlas-table-row">
                    {schema.columns.map(column => (
                        <th key={column.field} className="atlas-table-header-cell" style={{ width: column.width }}>
                            {column.sortable ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="-ml-3 h-8"
                                    onClick={() => handleSort(column.field)}
                                >
                                    {column.header}
                                    {sort?.field === column.field ? (
                                        sort.direction === 'asc' ? (
                                            <ArrowUp className="ml-2 h-4 w-4" />
                                        ) : (
                                            <ArrowDown className="ml-2 h-4 w-4" />
                                        )
                                    ) : (
                                        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                                    )}
                                </Button>
                            ) : (
                                column.header
                            )}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {entities.map(entity => (
                    <tr
                        key={entity.id as string}
                        className="atlas-table-row"
                        data-testid={testIds.tableRow(entityType, entity.id as string)}
                    >
                        {schema.columns.map((column, index) => (
                            <td
                                key={column.field}
                                className="atlas-table-cell"
                                data-testid={testIds.tableCell(entityType, column.field)}
                            >
                                {index === 0 ? (
                                    <Link
                                        to={`/${entityType}/${entity.id}`}
                                        className="font-medium hover:text-primary hover:underline"
                                    >
                                        {formatCellValue(entity, column, entitySchema)}
                                    </Link>
                                ) : (
                                    formatCellValue(entity, column, entitySchema)
                                )}
                            </td>
                        ))}
                    </tr>
                ))}
                {entities.length === 0 && (
                    <tr className="atlas-table-row">
                        <td colSpan={schema.columns.length} className="atlas-table-cell text-center py-8">
                            No items found
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}
