import { apiClient } from './client';

export const workflowsApi = {
    getAllowedTransitions: (entityType: string, entityId: string): Promise<Record<string, string[]>> =>
        apiClient.get(`/workflows/entities/${entityType}/${entityId}/allowed-transitions`),
};
