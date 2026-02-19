import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { entitiesApi, type Entity } from '@/api/entities.api';
import { NO_CACHE_QUERY_CONFIG } from '@/lib/query-config';

export interface UseEntitiesResult {
    entities: Entity[];
    total: number;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
}

export interface UseEntityResult {
    entity: Entity | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
}

/**
 * Helper to invalidate entity queries
 */
function invalidateEntityQueries(queryClient: QueryClient, entityType: string, id?: string) {
    queryClient.invalidateQueries({ queryKey: ['entities', entityType] });
    if (id) {
        queryClient.invalidateQueries({ queryKey: ['entity', entityType, id] });
    }
}

/**
 * Hook to fetch list of entities
 */
export function useEntities(entityType: string, options?: { search?: string; skip?: number; take?: number }): UseEntitiesResult {
    const query = useQuery({
        queryKey: ['entities', entityType, options?.search, options?.skip, options?.take],
        queryFn: () => entitiesApi.list(entityType, options),
        enabled: !!entityType, // Only fetch when entityType is provided
        ...NO_CACHE_QUERY_CONFIG,
    });

    return {
        entities: query.data?.data ?? [],
        total: query.data?.total ?? 0,
        loading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to fetch a single entity
 */
export function useEntity(entityType: string, entityId: string): UseEntityResult {
    const query = useQuery({
        queryKey: ['entity', entityType, entityId],
        queryFn: () => entitiesApi.get(entityType, entityId),
        enabled: !!entityId,
        ...NO_CACHE_QUERY_CONFIG,
    });

    return {
        entity: query.data ?? null,
        loading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
}

/**
 * Hook to create an entity
 */
export function useCreateEntity(entityType: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Record<string, unknown>) =>
            entitiesApi.create(entityType, data),
        onSuccess: () => {
            invalidateEntityQueries(queryClient, entityType);
        },
    });
}

/**
 * Hook to update an entity
 */
export function useUpdateEntity(entityType: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
            entitiesApi.update(entityType, id, data),
        onSuccess: (_, variables) => {
            invalidateEntityQueries(queryClient, entityType, variables.id);
        },
    });
}

/**
 * Hook to delete an entity
 */
export function useDeleteEntity(entityType: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => entitiesApi.delete(entityType, id),
        onSuccess: () => {
            invalidateEntityQueries(queryClient, entityType);
        },
    });
}
