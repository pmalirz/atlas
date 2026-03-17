import { Link } from 'react-router-dom';
import { getTenantSlug } from '@/api/client';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { TileViewSchema, TileFieldSchema, EntitySchema } from '../schema/types';
import { formatRelativeTime } from '@/lib/utils';
import { testIds } from '../utils/testIdUtils';

interface TileRendererProps {
    entity: Record<string, unknown>;
    schema: TileViewSchema;
    entitySchema: EntitySchema;
    entityType: string;
}

/**
 * TileRenderer
 * 
 * Renders an entity as a tile/card in the browse page grid.
 */
export function TileRenderer({
    entity,
    schema,
    entitySchema,
    entityType
}: TileRendererProps) {
    const id = entity.id as string;
    const slug = getTenantSlug();

    // Extract fields by role
    const titleField = schema.fields.find(f => f.role === 'title');
    const subtitleField = schema.fields.find(f => f.role === 'subtitle');
    const descriptionField = schema.fields.find(f => f.role === 'description');
    const badgeFields = schema.fields.filter(f => f.role === 'badge');
    const footerFields = schema.fields.filter(f => f.role === 'footer');

    return (
        <Link
            to={`/${slug}/${entityType}/${id}`}
            className="group block"
            data-testid={testIds.tile(entityType, id)}
        >
            <Card className="h-full border-border transition-shadow duration-200 group-hover:shadow-md">
                <CardHeader className="mb-2 border-0 pb-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            {titleField && (
                                <CardTitle className="truncate text-lg group-hover:text-primary transition-colors">
                                    {formatFieldValue(entity, titleField, entitySchema)}
                                </CardTitle>
                            )}
                            {subtitleField && (
                                <p className="mt-1 truncate text-sm text-muted-foreground">
                                    {formatFieldValue(entity, subtitleField, entitySchema)}
                                </p>
                            )}
                        </div>
                        <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                </CardHeader>

                {(descriptionField || badgeFields.length > 0) && (
                    <CardContent className="space-y-4">
                        {descriptionField && (
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                                {formatFieldValue(entity, descriptionField, entitySchema)}
                            </p>
                        )}

                        {badgeFields.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {badgeFields.map(field => {
                                    const value = entity[field.field];
                                    if (!value) return null;

                                    return (
                                        <Badge key={field.field} variant="secondary">
                                            {String(value)}
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                )}

                {footerFields.length > 0 && (
                    <CardFooter className="mt-auto justify-start gap-4 border-t pt-3 text-xs text-muted-foreground">
                        {footerFields.map(field => (
                            <span key={field.field}>
                                {formatFieldValue(entity, field, entitySchema)}
                            </span>
                        ))}
                    </CardFooter>
                )}
            </Card>
        </Link>
    );
}

/**
 * Format a field value based on its schema and format type
 */
function formatFieldValue(
    entity: Record<string, unknown>,
    fieldConfig: TileFieldSchema,
    _entitySchema: EntitySchema
): string {
    const value = entity[fieldConfig.field];

    if (value === undefined || value === null) {
        return '—';
    }

    switch (fieldConfig.format) {
        case 'date':
        case 'datetime':
            return new Date(String(value)).toLocaleDateString();
        case 'relative':
            return formatRelativeTime(String(value));
        case 'count':
            return Array.isArray(value) ? String(value.length) : String(value);
        case 'badge':
            return String(value);
        default:
            return String(value);
    }
}
