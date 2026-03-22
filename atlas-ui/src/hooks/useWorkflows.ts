import { useQuery } from '@tanstack/react-query';
import { workflowsApi } from '@/api/workflows.api';

export function useAllowedTransitions(entityType?: string, entityId?: string) {
    return useQuery({
        queryKey: ['workflows', 'allowed-transitions', entityType, entityId],
        queryFn: () => workflowsApi.getAllowedTransitions(entityType!, entityId!),
        enabled: !!entityType && !!entityId,
        staleTime: 5000, // Deduplicate and keep fresh for 5 seconds
    });
}
