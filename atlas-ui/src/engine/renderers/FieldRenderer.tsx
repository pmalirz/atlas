import { registry, type FieldSchema } from '../registry/component-registry';
import type { FieldPlacementSchema, EntitySchema } from '../schema/types';
import { getGridClasses } from '../utils/field-utils';
import { EntityData } from '../schema/common';
import { RelationFieldRenderer } from './RelationFieldRenderer';
import { FieldWrapper } from './FieldWrapper';

interface FieldRendererProps {
    fieldKey: string;
    sectionId?: string;
    entity: EntityData;
    entitySchema: EntitySchema;
    placement: FieldPlacementSchema;
    onUpdate: (field: string, value: any) => void;
}

/**
 * FieldRenderer
 *
 * Renders a single field based on its schema and placement configuration.
 * Automatically selects the appropriate component from the registry.
 * Special handling for relation fields to use relation components.
 */
export function FieldRenderer({
    fieldKey,
    sectionId,
    entity,
    entitySchema,
    placement,
    onUpdate
}: FieldRendererProps) {
    // Find field definition in entity schema
    const fieldSchema = entitySchema.attributes.find(f => f.key === fieldKey);


    if (!fieldSchema) {
        if (import.meta.env.DEV) {
            console.warn(`Field not found in schema: ${fieldKey}`);
        }
        return null;
    }

    // Check if this is a relation field
    const isRelationField = fieldSchema.type === 'relation';

    // Calculate grid placement classes
    const gridClasses = getGridClasses(placement);

    // Handle relation fields with special rendering
    if (isRelationField) {
        return (
            <RelationFieldRenderer
                fieldKey={fieldKey}
                sectionId={sectionId}
                entity={entity}
                entitySchema={entitySchema}
                fieldSchema={fieldSchema as FieldSchema}
                placement={placement}
                gridClasses={gridClasses}
                onUpdate={onUpdate}
            />
        );
    }

    // Standard field rendering
    const componentKey = placement.component ?? `field:${fieldSchema.type}`;
    const Component = registry.getField(componentKey.replace('field:', ''));

    return (
        <FieldWrapper
            fieldKey={fieldKey}
            sectionId={sectionId}
            label={placement.label ?? fieldSchema.displayName}
            required={fieldSchema.required}
            className={gridClasses}
        >
            {Component ? (
                <Component
                    value={entity[fieldKey] as never}
                    onChange={(value) => onUpdate(fieldKey, value)}
                    fieldSchema={fieldSchema}
                    placement={placement}
                    valueStyles={placement.valueStyles}
                    readonly={placement.readonly}
                />
            ) : (
                <div className="atlas-field-error border border-destructive p-2 rounded">
                    Unknown component type: {placement.component ?? fieldSchema.type}
                </div>
            )}
        </FieldWrapper>
    );
}
