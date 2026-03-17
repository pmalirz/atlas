import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TableViewSchema, EntitySchema, SortSchema } from '../schema/types';
import { Link } from 'react-router-dom';
import { getTenantSlug } from '@/api/client';
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
    const slug = getTenantSlug();

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
        <Table>
            <TableHeader className="bg-muted/50">
                <TableRow>
                    {schema.columns.map(column => (
                        <TableHead key={column.field} style={{ width: column.width }}>
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
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {entities.map(entity => (
                    <TableRow
                        key={entity.id as string}
                        data-testid={testIds.tableRow(entityType, entity.id as string)}
                    >
                        {schema.columns.map((column, index) => (
                            <TableCell
                                key={column.field}
                                data-testid={testIds.tableCell(entityType, column.field)}
                            >
                                {index === 0 ? (
                                    <Link
                                        to={`/${slug}/${entityType}/${entity.id}`}
                                        className="font-medium hover:text-primary hover:underline"
                                    >
                                        {formatCellValue(entity, column, entitySchema)}
                                    </Link>
                                ) : (
                                    formatCellValue(entity, column, entitySchema)
                                )}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
                {entities.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={schema.columns.length} className="py-8 text-center">
                            No items found
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
