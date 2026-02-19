/**
 * RelationTagsField - Simple tag-based multi-select for relations
 * 
 * Used for relations without additional attributes:
 * - app_uses_technology
 * - app_manages_data
 * - app_supports_capability
 */

import { useState, useMemo, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type { RelationComponentProps, RelationItem } from './relation-types';
import { getTargetEntityType, inferRelationDirection } from './relation-types';
import { useEntities } from '@/hooks/useEntities';
import { useOutgoingRelations, useIncomingRelations, useCreateRelation, useDeleteRelation } from '@/hooks/useRelations';
import type { Entity } from '@/api/entities.api';

export function RelationTagsField({
    entityId,
    entityType,
    fieldSchema,
    relationDefinition,
    value: externalValue,
    onChange,
    readonly = false,
    disabled = false,
}: RelationComponentProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    // Determine target entity type for fetching available entities
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
    const deleteRelation = useDeleteRelation();

    // Fetch available entities to link to (with server-side search)
    const { entities: availableEntities = [], loading: entitiesLoading } = useEntities(
        targetEntityType || '',
        { search } // Pass search to server
    );

    // Filter out already-linked entities (server handles search, so we just filter specific IDs)
    const linkedIds = useMemo(() => new Set(value.map(v => v.targetId)), [value]);
    const filteredEntities = useMemo(() => {
        const unlinked = availableEntities.filter(e => !linkedIds.has(e.id));
        return unlinked.slice(0, 10);
    }, [availableEntities, linkedIds]);

    // Handle adding a new relation
    const handleAdd = async (entity: Entity) => {
        if (!entityId || !relationType) return;

        try {
            await createRelation.mutateAsync({
                relationType,
                fromEntityId: isIncoming ? entity.id : entityId,
                toEntityId: isIncoming ? entityId : entity.id,
            });
            setOpen(false);
            setSearch('');
        } catch (err) {
            console.error('Failed to create relation:', err);
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

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 p-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
        );
    }

    if (readonly) {
        // Read-only mode: show as simple badges
        if (value.length === 0) {
            return <span className="text-muted-foreground text-sm">—</span>;
        }

        return (
            <div className="flex flex-wrap gap-1.5">
                {value.map((item) => (
                    <Badge key={item.id || item.targetId} variant="secondary" className="text-xs">
                        {item.targetName}
                    </Badge>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Current relations as dismissible badges */}
            <div className="flex flex-wrap gap-1.5">
                {value.map((item) => (
                    <Badge
                        key={item.id || item.targetId}
                        variant="secondary"
                        className="text-xs pr-0.5 gap-1"
                    >
                        {item.targetName}
                        <button
                            type="button"
                            onClick={() => item.id && handleRemove(item.id)}
                            disabled={disabled || deleteRelation.isPending}
                            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                        >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove {item.targetName}</span>
                        </button>
                    </Badge>
                ))}

                {/* Add button with popover */}
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={disabled || !targetEntityType || createRelation.isPending}
                            className="h-6 gap-1 text-xs"
                        >
                            <Plus className="h-3 w-3" />
                            Add
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                        <div className="space-y-2">
                            <Input
                                placeholder={`Search ${fieldSchema.displayName?.toLowerCase() || 'items'}...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8"
                            />

                            <div className="max-h-48 overflow-y-auto">
                                {entitiesLoading ? (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredEntities.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No items found.
                                    </p>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredEntities.map((entity) => (
                                            <button
                                                key={entity.id}
                                                type="button"
                                                onClick={() => handleAdd(entity)}
                                                disabled={createRelation.isPending}
                                                className="w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                                            >
                                                {entity.name || 'Unnamed'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Empty state */}
            {value.length === 0 && (
                <p className="text-xs text-muted-foreground">
                    No {fieldSchema.displayName?.toLowerCase() || 'items'} linked yet.
                </p>
            )}
        </div>
    );
}
