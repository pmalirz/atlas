/**
 * RelationDialogField - Popover-based relation editor with attributes
 * 
 * Used for relations that have additional attributes defined in RelationDefinition.attributeSchema:
 * - app_owned_by (with ownershipRole attribute)
 * - interface_connects (with direction attribute)
 */

import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { NumberInput, EnumSelect, TextInput } from '../field-components/inputs';
import { AttributeValues } from '@app-atlas/shared';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import type { RelationComponentProps, RelationItem, RelationAttributeSchema } from './relation-types';
import { getTargetEntityType, inferRelationDirection } from './relation-types';
import { useEntities } from '@/hooks/useEntities';
import { useOutgoingRelations, useIncomingRelations, useCreateRelation, useUpdateRelation, useDeleteRelation, useRelationDefinitions } from '@/hooks/useRelations';
import { useTypeDefinitions } from '@/hooks/useTypeDefinitions';
import type { Entity } from '@/api/entities.api';

export function RelationDialogField({
    entityId,
    entityType,
    fieldSchema,
    relationDefinition: propRelationDef,
    value: externalValue,
    onChange,
    readonly = false,
    disabled = false,
}: RelationComponentProps) {
    const [addOpen, setAddOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedEntityId, setSelectedEntityId] = useState<string>('');
    const [attributes, setAttributes] = useState<AttributeValues>({});

    // Fetch relation definition for attribute schema (needed for direction inference)
    const { getByType } = useRelationDefinitions();
    const relationDefinition = propRelationDef || (fieldSchema.relType ? getByType(fieldSchema.relType) : undefined);

    // Determine target entity type and direction
    const targetEntityType = getTargetEntityType(fieldSchema, relationDefinition);
    const relationType = fieldSchema.relType;

    // Auto-detect direction from RelationDefinition
    const direction = inferRelationDirection(entityType, relationDefinition, fieldSchema);
    const isIncoming = direction === 'incoming';

    // Fetch relations from server
    const { relations: outgoingRels, loading: outgoingLoading } = useOutgoingRelations(
        !isIncoming ? entityId : undefined,
        relationType
    );
    const { relations: incomingRels, loading: incomingLoading } = useIncomingRelations(
        isIncoming ? entityId : undefined,
        relationType
    );

    const isLoading = outgoingLoading || incomingLoading;
    const serverRelations = isIncoming ? incomingRels : outgoingRels;

    // Convert server relations to RelationItem format
    const value = useMemo(() => {
        return serverRelations.map(rel => ({
            id: rel.id,
            targetId: isIncoming ? rel.fromEntityId : rel.toEntityId,
            targetName: isIncoming
                ? (rel.fromEntity?.name || 'Unknown')
                : (rel.toEntity?.name || 'Unknown'),
            targetEntityType: isIncoming
                ? rel.fromEntity?.entityType
                : rel.toEntity?.entityType,
            attributes: rel.attributes,
        }));
    }, [serverRelations, isIncoming]);

    // Mutations
    const createRelation = useCreateRelation();
    const updateRelation = useUpdateRelation();
    const deleteRelation = useDeleteRelation();

    // Fetch available entities
    const { entities: availableEntities = [], loading: entitiesLoading } = useEntities(targetEntityType || '');

    // Get attribute schema
    const rawAttributeSchema: RelationAttributeSchema[] = relationDefinition?.attributeSchema || [];

    // Fetch type definitions for all typeRefs in attribute schema
    const { types: typeDefinitions } = useTypeDefinitions();

    // Resolve typeRef to options dynamically from server
    const attributeSchema = useMemo<RelationAttributeSchema[]>(() => {
        return rawAttributeSchema.map(attr => {
            if (attr.options) {
                // Already has options, use them directly
                return attr;
            }
            if (attr.typeRef) {
                // Look up options from type definitions
                const typeDef = typeDefinitions.find(t => t.typeKey === attr.typeRef);
                if (typeDef?.options) {
                    return { ...attr, options: typeDef.options };
                }
            }
            return attr;
        });
    }, [rawAttributeSchema, typeDefinitions]);


    // Filter out already-linked entities
    const linkedIds = useMemo(() => new Set(value.map(v => v.targetId)), [value]);
    const selectableEntities = useMemo(
        () => availableEntities.filter(e => !linkedIds.has(e.id)),
        [availableEntities, linkedIds]
    );

    // Reset form state
    const resetForm = () => {
        setSelectedEntityId('');
        setAttributes({});
        setAddOpen(false);
        setEditingId(null);
    };

    // Open edit mode for an item
    const handleOpenEdit = (item: RelationItem) => {
        setEditingId(item.id);
        setSelectedEntityId(item.targetId);
        setAttributes(item.attributes || {});
    };

    // Submit add form
    const handleAdd = async () => {
        if (!selectedEntityId || !entityId || !relationType) return;

        try {
            await createRelation.mutateAsync({
                relationType,
                fromEntityId: isIncoming ? selectedEntityId : entityId,
                toEntityId: isIncoming ? entityId : selectedEntityId,
                attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
            });
            resetForm();
        } catch (err) {
            console.error('Failed to create relation:', err);
        }
    };

    // Submit edit form
    const handleSaveEdit = async () => {
        if (!editingId) return;

        try {
            await updateRelation.mutateAsync({
                id: editingId,
                data: {
                    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
                },
            });
            resetForm();
        } catch (err) {
            console.error('Failed to update relation:', err);
        }
    };

    // Handle removing a relation
    const handleRemove = async (relationId: string) => {
        if (!relationId) return;

        try {
            await deleteRelation.mutateAsync(relationId);
        } catch (err) {
            console.error('Failed to delete relation:', err);
        }
    };

    // Render attribute field dynamically using shared input primitives
    const renderAttributeField = (attr: RelationAttributeSchema) => {
        const currentValue = attributes[attr.key];

        const updateAttribute = (value: string | number | boolean | undefined) => {
            if (value === undefined || value === '') {
                const next = { ...attributes };
                delete next[attr.key];
                setAttributes(next);
            } else {
                setAttributes({ ...attributes, [attr.key]: value });
            }
        };

        // Enum fields (select)
        if (attr.options && attr.options.length > 0) {
            return (
                <div key={attr.key} className="space-y-1">
                    <Label className="text-xs">{attr.displayName}</Label>
                    <EnumSelect
                        value={(currentValue as string) || ''}
                        onChange={(v) => updateAttribute(v)}
                        options={attr.options}
                        placeholder="Select..."
                        triggerClassName="h-8"
                        data-testid={`relation-attribute-${attr.key}`}
                    />
                </div>
            );
        }

        // Number fields (integer)
        if (attr.type === 'number') {
            return (
                <div key={attr.key} className="space-y-1">
                    <Label className="text-xs">{attr.displayName}</Label>
                    <NumberInput
                        value={currentValue as number | undefined}
                        onChange={(v) => updateAttribute(v)}
                        step="1"
                        min={attr.validation?.min}
                        max={attr.validation?.max}
                        placeholder="0"
                        className="h-8"
                        data-testid={`relation-attribute-${attr.key}`}
                    />
                </div>
            );
        }

        // Decimal fields (floating-point)
        if (attr.type === 'decimal') {
            return (
                <div key={attr.key} className="space-y-1">
                    <Label className="text-xs">{attr.displayName}</Label>
                    <NumberInput
                        value={currentValue as number | undefined}
                        onChange={(v) => updateAttribute(v)}
                        step="0.01"
                        min={attr.validation?.min}
                        max={attr.validation?.max}
                        placeholder="0.00"
                        className="h-8"
                        data-testid={`relation-attribute-${attr.key}`}
                    />
                </div>
            );
        }

        // Default: text input
        return (
            <div key={attr.key} className="space-y-1">
                <Label className="text-xs">{attr.displayName}</Label>
                <TextInput
                    value={(currentValue as string) || ''}
                    onChange={(v) => updateAttribute(v)}
                    className="h-8"
                />
            </div>
        );
    };

    // Get display for attribute values
    const getAttributeDisplay = (item: RelationItem) => {
        if (!item.attributes || attributeSchema.length === 0) return null;

        return attributeSchema.map(attr => {
            const val = item.attributes?.[attr.key];
            if (val === undefined || val === null) return null;

            // Convert to string for display
            const strVal = String(val);

            // Find option for display name if available (only for string enum values)
            const option = typeof val === 'string' ? attr.options?.find(o => o.key === val) : undefined;
            const displayVal = option?.displayName || strVal.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

            return (
                <Badge key={attr.key} variant="outline" className="text-[10px] ml-1">
                    {displayVal}
                </Badge>
            );
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 p-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
        );
    }

    if (readonly) {
        if (value.length === 0) {
            return <span className="text-muted-foreground text-sm">—</span>;
        }

        return (
            <div className="space-y-2">
                {value.map((item) => (
                    <div key={item.id || item.targetId} className="flex items-center gap-2 p-2 rounded-md bg-accent/30">
                        <span className="text-sm font-medium">{item.targetName}</span>
                        {getAttributeDisplay(item)}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Current relations */}
            {value.length > 0 && (
                <div className="space-y-2">
                    {value.map((item) => (
                        <div
                            key={item.id || item.targetId}
                            className="flex items-center justify-between p-2 rounded-md bg-accent/30 group"
                            data-testid={`relation-row-${item.targetName}`}
                        >
                            {editingId === item.id ? (
                                // Edit mode - inline form
                                <div className="flex-1 space-y-2">
                                    <div className="text-sm font-medium">{item.targetName}</div>
                                    {attributeSchema.map(renderAttributeField)}
                                    <div className="flex gap-2 pt-1">
                                        <Button
                                            size="sm"
                                            className="h-7"
                                            onClick={handleSaveEdit}
                                            disabled={updateRelation.isPending}
                                            data-testid="save-relation-button"
                                        >
                                            <Check className="h-3 w-3 mr-1" /> Save
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-7" onClick={resetForm}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                // Display mode
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{item.targetName}</span>
                                        {getAttributeDisplay(item)}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {attributeSchema.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => handleOpenEdit(item)}
                                                disabled={disabled}
                                                data-testid="edit-relation-button"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => item.id && handleRemove(item.id)}
                                            disabled={disabled || deleteRelation.isPending}
                                            data-testid="delete-relation-button"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add button with popover */}
            <Popover open={addOpen} onOpenChange={setAddOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={disabled || !targetEntityType || createRelation.isPending}
                        data-testid="add-relation-button"
                    >
                        <Plus className="h-4 w-4" />
                        Add {fieldSchema.displayName?.replace(/s$/, '') || 'Item'}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="start">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Select {targetEntityType?.replace(/_/g, ' ') || 'Entity'}</Label>
                            {entitiesLoading ? (
                                <div className="flex items-center gap-2 py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm text-muted-foreground">Loading...</span>
                                </div>
                            ) : (
                                <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                                    <SelectTrigger className="h-8" data-testid="relation-entity-select-trigger">
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectableEntities.map((entity) => (
                                            <SelectItem key={entity.id} value={entity.id}>
                                                {entity.name || 'Unnamed'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Attribute fields */}
                        {attributeSchema.map(renderAttributeField)}

                        <div className="flex gap-2 pt-1">
                            <Button
                                size="sm"
                                className="h-7"
                                onClick={handleAdd}
                                disabled={!selectedEntityId || createRelation.isPending}
                                data-testid="add-relation-submit"
                            >
                                {createRelation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                Add
                            </Button>
                            <Button size="sm" variant="outline" className="h-7" onClick={resetForm}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Empty state */}
            {value.length === 0 && (
                <p className="text-xs text-muted-foreground">
                    No {fieldSchema.displayName?.toLowerCase() || 'items'} assigned yet.
                </p>
            )}
        </div>
    );
}
