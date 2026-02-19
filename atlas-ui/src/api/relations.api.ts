import { apiClient } from './client';
import { AttributeValues } from '@app-atlas/shared';
import type { EnumOption } from '../engine/schema/types';

/**
 * Relation from the server
 */
export interface Relation {
    id: string;
    relationType: string;
    fromEntityId: string;
    toEntityId: string;
    attributes?: AttributeValues;
    fromEntity?: {
        id: string;
        name?: string;
        entityType?: string;
    };
    toEntity?: {
        id: string;
        name?: string;
        entityType?: string;
    };
}

/**
 * RelationDefinition from the server
 */
export interface RelationDefinition {
    id: string;
    relationType: string;
    displayName: string;
    fromEntityType?: string;
    toEntityType?: string;
    isDirectional: boolean;
    attributeSchema?: Array<{
        key: string;
        displayName: string;
        type?: string;
        typeRef?: string;
        required?: boolean;
        options?: EnumOption[];
    }>;
}

export const relationsApi = {
    /**
     * List relations with filters
     */
    list: async (filters: {
        entityId?: string;
        fromEntityId?: string;
        toEntityId?: string;
        relationType?: string;
    }): Promise<Relation[]> => {
        const params = new URLSearchParams();
        if (filters.entityId) params.set('entityId', filters.entityId);
        if (filters.fromEntityId) params.set('fromEntityId', filters.fromEntityId);
        if (filters.toEntityId) params.set('toEntityId', filters.toEntityId);
        if (filters.relationType) params.set('relationType', filters.relationType);

        const url = `/relations${params.toString() ? `?${params.toString()}` : ''}`;
        return apiClient.get<Relation[]>(url);
    },

    /**
     * Get a single relation by ID
     */
    get: async (id: string): Promise<Relation> => {
        return apiClient.get<Relation>(`/relations/${id}`);
    },

    /**
     * Create a new relation
     */
    create: async (data: {
        relationType: string;
        fromEntityId: string;
        toEntityId: string;
        attributes?: AttributeValues;
    }): Promise<Relation> => {
        return apiClient.post<Relation>('/relations', data);
    },

    /**
     * Update a relation
     */
    update: async (id: string, data: {
        attributes?: AttributeValues;
    }): Promise<Relation> => {
        return apiClient.patch<Relation>(`/relations/${id}`, data);
    },

    /**
     * Delete a relation
     */
    delete: async (id: string): Promise<void> => {
        return apiClient.delete(`/relations/${id}`);
    },

    /**
     * Get relations for graph visualization with depth traversal
     */
    getGraph: async (entityId: string, options?: {
        depth?: number;
        exclude?: string[];
    }): Promise<Relation[]> => {
        const params = new URLSearchParams();
        if (options?.depth) params.set('depth', String(options.depth));
        if (options?.exclude?.length) params.set('exclude', options.exclude.join(','));

        const queryString = params.toString();
        return apiClient.get(`/relations/graph/${entityId}${queryString ? `?${queryString}` : ''}`);
    },
};
export const relationDefinitionsApi = {
    /**
     * List all relation definitions
     */
    list: async (): Promise<RelationDefinition[]> => {
        return apiClient.get<RelationDefinition[]>('/definitions/relations');
    },

    /**
     * Get a single relation definition by type
     */
    getByType: async (relationType: string): Promise<RelationDefinition> => {
        return apiClient.get<RelationDefinition>(`/definitions/relations/${relationType}`);
    },
};
