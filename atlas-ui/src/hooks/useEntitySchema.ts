import { useQuery } from '@tanstack/react-query';
import { definitionsApi } from '@/api/ui-schema.api';
import type { EntitySchema } from '@/engine/schema/types';

interface UseEntitySchemaResult {
    schema: EntitySchema | undefined;
    loading: boolean;
    error: Error | null;
}

/**
 * Hook to fetch and cache Entity Definition (field definitions) for an entity type
 */
export function useEntitySchema(entityType: string): UseEntitySchemaResult {
    const { data: schema, isLoading: loading, error } = useQuery({
        queryKey: ['entity-definition', entityType],
        queryFn: () => definitionsApi.getEntityDefinition(entityType),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!entityType,
    });

    return {
        schema,
        loading,
        error: error as Error | null
    };
}
