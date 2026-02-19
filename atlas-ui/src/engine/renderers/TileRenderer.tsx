import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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

    // Extract fields by role
    const titleField = schema.fields.find(f => f.role === 'title');
    const subtitleField = schema.fields.find(f => f.role === 'subtitle');
    const descriptionField = schema.fields.find(f => f.role === 'description');
    const badgeFields = schema.fields.filter(f => f.role === 'badge');
    const footerFields = schema.fields.filter(f => f.role === 'footer');

    return (
        <Link
            to={`/${entityType}/${id}`}
            className="atlas-card block group"
            data-testid={testIds.tile(entityType, id)}
        >
            {/* Header */}
            <div className="atlas-card-header border-0 pb-0 mb-4">
                <div>
                    {titleField && (
                        <h3 className="atlas-card-title group-hover:text-primary transition-colors">
                            {formatFieldValue(entity, titleField, entitySchema)}
                        </h3>
                    )}
                    {subtitleField && (
                        <p className="atlas-card-description mt-1">
                            {formatFieldValue(entity, subtitleField, entitySchema)}
                        </p>
                    )}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            {/* Description */}
            {descriptionField && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {formatFieldValue(entity, descriptionField, entitySchema)}
                </p>
            )}

            {/* Badges */}
            {badgeFields.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {badgeFields.map(field => {
                        const value = entity[field.field];
                        if (!value) return null;

                        return (
                            <span key={field.field} className="atlas-badge-secondary">
                                {String(value)}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Footer */}
            {footerFields.length > 0 && (
                <div className="atlas-card-footer justify-start gap-4 text-xs border-t pt-3 mt-auto">
                    {footerFields.map(field => (
                        <span key={field.field}>
                            {formatFieldValue(entity, field, entitySchema)}
                        </span>
                    ))}
                </div>
            )}
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
