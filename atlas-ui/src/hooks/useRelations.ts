import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { relationsApi, type Relation, relationDefinitionsApi, type RelationDefinition } from '@/api/relations.api';
import { AttributeValues } from '@app-atlas/shared';
import { NO_CACHE_QUERY_CONFIG } from '@/lib/query-config';

/**
 * Hook to fetch relations for an entity
 * @param entityId The entity ID to fetch relations for
 * @param relationType Optional filter by relation type
 */
export function useRelations(entityId?: string, relationType?: string) {
    const query = useQuery({
        queryKey: ['relations', entityId, relationType],
        queryFn: () => relationsApi.list({ entityId, relationType }),
        enabled: !!entityId,
        ...NO_CACHE_QUERY_CONFIG,
    });

    return {
        relations: query.data ?? [],
        loading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to fetch outgoing relations (where entityId is the source)
 */
export function useOutgoingRelations(entityId?: string, relationType?: string) {
    const query = useQuery({
        queryKey: ['relations', 'outgoing', entityId, relationType],
        queryFn: () => relationsApi.list({ fromEntityId: entityId, relationType }),
        enabled: !!entityId,
        ...NO_CACHE_QUERY_CONFIG,
    });

    return {
        relations: query.data ?? [],
        loading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to fetch incoming relations (where entityId is the target)
 */
export function useIncomingRelations(entityId?: string, relationType?: string) {
    const query = useQuery({
        queryKey: ['relations', 'incoming', entityId, relationType],
        queryFn: () => relationsApi.list({ toEntityId: entityId, relationType }),
        enabled: !!entityId,
        ...NO_CACHE_QUERY_CONFIG,
    });

    return {
        relations: query.data ?? [],
        loading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to create a relation
 */
export function useCreateRelation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            relationType: string;
            fromEntityId: string;
            toEntityId: string;
            attributes?: AttributeValues;
        }) => relationsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['relations'],
                exact: false,
                refetchType: 'all'
            });
        },
    });
}

/**
 * Hook to update a relation
 */
export function useUpdateRelation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { attributes?: AttributeValues } }) =>
            relationsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['relations'],
                exact: false,
                refetchType: 'all'
            });
        },
    });
}

/**
 * Hook to delete a relation
 */
export function useDeleteRelation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => relationsApi.delete(id),
        onSuccess: () => {
            // Invalidate all relation queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: ['relations'] });
        },
    });
}

/**
 * Hook to fetch all relation definitions
 */
export function useRelationDefinitions() {
    const query = useQuery({
        queryKey: ['relation-definitions'],
        queryFn: () => relationDefinitionsApi.list(),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes (rarely changes)
    });

    return {
        definitions: query.data ?? [],
        loading: query.isLoading,
        error: query.error,
        getByType: (relationType: string) =>
            query.data?.find(d => d.relationType === relationType),
    };
}
