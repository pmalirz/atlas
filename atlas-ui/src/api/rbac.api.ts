import { apiClient } from './client';
import type { UserWithRoles } from '@app-atlas/shared/zod';

export const rbacApi = {
    /**
     * Get the current user's roles and permissions for the active tenant
     */
    async getMyRoles(): Promise<UserWithRoles> {
        try {
            const response = await apiClient.get<UserWithRoles>('/rbac/me');
            return response;
        } catch (error) {
            console.error('Failed to fetch user roles:', error);
            throw error;
        }
    }
};
