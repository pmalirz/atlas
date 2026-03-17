import { registry, type FieldSchema } from '../registry/component-registry';
import type { FieldPlacementSchema, EntitySchema } from '../schema/types';
import { inferRelationComponentType, type RelationItem } from '../registry/relation-components/relation-types';
import { useRelationDefinitions } from '@/hooks/useRelations';
import { transformToRelationItems } from '../utils/field-utils';
import { EntityData } from '../schema/common';
import { FieldWrapper } from './FieldWrapper';
import React from 'react';

interface RelationFieldRendererProps {
    fieldKey: string;
    sectionId?: string;
    entity: EntityData;
    entitySchema: EntitySchema;
    fieldSchema: FieldSchema;
    placement: FieldPlacementSchema;
    gridClasses: string;
    onUpdate: (field: string, value: unknown) => void;
}

/**
 * RelationFieldRenderer
 *
 * Wrapper component for relation fields
 * Handles auto-detection of component type and proper prop passing
 */
export function RelationFieldRenderer({
    fieldKey,
    sectionId,
    entity,
    entitySchema,
    fieldSchema,
    placement,
    gridClasses,
    onUpdate,
}: RelationFieldRendererProps) {
    // Fetch relation definitions to enable proper auto-detection
    const { getByType } = useRelationDefinitions();
    const relationType = fieldSchema.relType;
    const relationDefinition = relationType ? getByType(relationType) : undefined;

    // Determine component type via auto-detection
    // With relationDefinition and entityType, we can detect direction → panel for incoming
    const componentType = fieldSchema.relation?.componentType
        ?? inferRelationComponentType(fieldSchema, relationDefinition, entitySchema.entityType);

    // Get the relation component
    const relationComponent = registry.getRelation(componentType);

    // Transform raw value to RelationItem[] format
    const relationValue = transformToRelationItems(entity[fieldKey]);

    // Handle changes from relation component
    const handleRelationChange = (items: RelationItem[]) => {
        // Transform back to the format expected by the entity update
        // Simple format: array of {targetId} objects
        const updateValue = items.map(item => ({
            targetId: item.targetId,
            ...(item.attributes ? { ...item.attributes } : {}),
        }));
        onUpdate(fieldKey, updateValue);
    };

    return (
        <FieldWrapper
            fieldKey={fieldKey}
            sectionId={sectionId}
            label={placement.label ?? fieldSchema.displayName}
            required={fieldSchema.required}
            className={gridClasses}
        >
            {React.createElement(relationComponent, {
                entityId: entity.id as string,
                entityType: entitySchema.entityType,
                fieldSchema: fieldSchema,
                relationDefinition: relationDefinition,
                value: relationValue,
                onChange: handleRelationChange,
                readonly: placement.readonly
            })}
        </FieldWrapper>
    );
}
