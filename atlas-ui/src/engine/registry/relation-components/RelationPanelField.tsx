/**
 * RelationPanelField - Full panel for external/incoming relations
 * 
 * Used for complex relations where the related entity "owns" the relation:
 * - ownedInterfaces (interface_owned_by) - incoming relation
 * 
 * This component provides a full panel UI for viewing incoming relations.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getTenantSlug } from '@/api/client';
import { Plus, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RelationComponentProps, RelationItem } from './relation-types';
import { getTargetEntityType, inferRelationDirection } from './relation-types';
import { useOutgoingRelations, useIncomingRelations } from '@/hooks/useRelations';

export function RelationPanelField({
    entityId,
    entityType,
    fieldSchema,
    relationDefinition,
    value: externalValue,
    onChange,
    readonly = false,
    disabled = false,
}: RelationComponentProps) {
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

    // For incoming relations, the linked entity type is the source
    const linkedEntityType = isIncoming
        ? (relationDefinition?.fromEntityType || targetEntityType)
        : targetEntityType;

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
        );
    }

    if (readonly) {
        // Read-only mode: show as a simple list
        if (value.length === 0) {
            return (
                <div className="text-sm text-muted-foreground py-4 text-center">
                    No {fieldSchema.displayName?.toLowerCase() || 'related items'} found.
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {value.map((item) => (
                    <div
                        key={item.id || item.targetId}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/30"
                    >
                        <div className="flex items-center gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{item.targetName}</span>
                                    {item.targetEntityType && (
                                        <Badge variant="outline" className="text-xs">
                                            {item.targetEntityType.replace(/_/g, ' ')}
                                        </Badge>
                                    )}
                                </div>
                                {item.attributes && Object.keys(item.attributes).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {Object.entries(item.attributes).map(([key, val]) => (
                                            <Badge key={key} variant="secondary" className="text-xs">
                                                {String(val).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <Link
                            to={`/${getTenantSlug()}/${linkedEntityType}/${item.targetId}`}
                            className="text-primary hover:text-primary/80"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                    </div>
                ))}
            </div>
        );
    }

    // For incoming relations, we show what exists and provide navigation
    // The actual creation/editing is done from the related entity's page

    return (
        <div className="space-y-4">
            {/* Header with count and potential action */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    {value.length} {fieldSchema.displayName?.toLowerCase() || 'items'}
                </span>

                {/* For incoming relations, navigate to create a new related entity */}
                {!disabled && linkedEntityType && (
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-1"
                    >
                        <Link to={`/${getTenantSlug()}/${linkedEntityType}/new?linkTo=${entityType}&linkToId=${entityId}`}>
                            <Plus className="h-4 w-4" />
                            Create New
                        </Link>
                    </Button>
                )}
            </div>

            {/* List of related items */}
            {value.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">
                        No {fieldSchema.displayName?.toLowerCase() || 'related items'} yet.
                    </p>
                    {linkedEntityType && (
                        <p className="text-xs mt-1">
                            Create a new {linkedEntityType.replace(/_/g, ' ')} to link it here.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {value.map((item) => (
                        <div
                            key={item.id || item.targetId}
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/30 hover:bg-accent/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            to={`/${getTenantSlug()}/${linkedEntityType}/${item.targetId}`}
                                            className="font-medium hover:underline"
                                        >
                                            {item.targetName}
                                        </Link>
                                        {item.targetEntityType && (
                                            <Badge variant="outline" className="text-xs">
                                                {item.targetEntityType.replace(/_/g, ' ')}
                                            </Badge>
                                        )}
                                    </div>
                                    {item.attributes && Object.keys(item.attributes).length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {Object.entries(item.attributes).map(([key, val]) => (
                                                <Badge key={key} variant="secondary" className="text-xs">
                                                    {String(val).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Link
                                to={`/${getTenantSlug()}/${linkedEntityType}/${item.targetId}`}
                                className="text-primary hover:text-primary/80"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
