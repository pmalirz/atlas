import { useQuery, useQueryClient } from '@tanstack/react-query';
import { uiEntityConfigApi } from '@/api/ui-schema.api';
import type { UIEntityConfig } from '@/engine/schema/types';

interface UseUIEntityConfigResult {
    config: UIEntityConfig | undefined;
    loading: boolean;
    error: Error | null;
    invalidate: () => void;
}

/**
 * Hook to fetch and cache UI Entity Config for an entity type
 */
export function useUIEntityConfig(entityType: string): UseUIEntityConfigResult {
    const queryClient = useQueryClient();
    const queryKey = ['ui-entity-config', entityType];

    const { data: config, isLoading: loading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            return await uiEntityConfigApi.get(entityType);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!entityType,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey });
    };

    return {
        config,
        loading,
        error: error as Error | null,
        invalidate
    };
}
