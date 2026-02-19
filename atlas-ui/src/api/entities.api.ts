import { apiClient } from './client';
import { AttributeValues } from '@app-atlas/shared';

export interface Entity {
    id: string;
    name?: string;
    description?: string;
    entityType?: string;
    attributes?: AttributeValues;
    [key: string]: unknown;
}

// Backend returns paginated response
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    skip: number;
    take: number;
}

// Core entity fields that are NOT stored in attributes
const CORE_FIELDS = ['id', 'name', 'description', 'entityType', 'createdAt', 'updatedAt', 'deletedAt', 'tenantId', 'updatedBy', 'deletedBy'];

/**
 * Flatten entity - merge attributes into top level for easy field access
 * { id, name, attributes: { status, dept } } -> { id, name, status, dept }
 */
function flattenEntity(entity: Entity): Entity {
    if (!entity) return entity;

    const { attributes, ...rest } = entity;
    return {
        ...rest,
        ...(attributes ?? {}),
        // Keep original attributes for reference
        _attributes: attributes,
    };
}

/**
 * Transform flat field updates to backend DTO format
 * Backend expects: { name?, description?, attributes?: {...} }
 */
function transformToUpdateDto(data: Record<string, unknown>): Record<string, unknown> {
    const dto: Record<string, unknown> = {};
    const attributes: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
        if (key === 'name' || key === 'description') {
            dto[key] = value;
        } else if (!CORE_FIELDS.includes(key) && !key.startsWith('_')) {
            // All other fields go into attributes
            attributes[key] = value;
        }
    }

    if (Object.keys(attributes).length > 0) {
        dto.attributes = attributes;
    }

    return dto;
}

export const entitiesApi = {
    /**
     * List entities of a specific type (extracts data from paginated response and flattens)
     */
    list: async (entityType: string, options?: { search?: string; skip?: number; take?: number }): Promise<PaginatedResponse<Entity>> => {
        const params = new URLSearchParams();
        if (options?.search) {
            params.set('search', options.search);
        }
        if (options?.skip !== undefined) {
            params.set('skip', options.skip.toString());
        }
        if (options?.take !== undefined) {
            params.set('take', options.take.toString());
        }

        const response = await apiClient.get<PaginatedResponse<Entity>>(`/entities/${entityType}${params.toString() ? `?${params.toString()}` : ''}`);

        return {
            ...response,
            data: (response.data ?? []).map(flattenEntity),
        };
    },

    /**
     * Get a single entity by ID (flattened for easy field access)
     */
    get: async (entityType: string, id: string): Promise<Entity> => {
        const entity = await apiClient.get<Entity>(`/entities/${entityType}/${id}`);
        return flattenEntity(entity);
    },

    /**
     * Create a new entity
     */
    create: async (entityType: string, data: Record<string, unknown>): Promise<Entity> => {
        const entity = await apiClient.post<Entity>(`/entities/${entityType}`, transformToUpdateDto(data));
        return flattenEntity(entity);
    },

    /**
     * Update an existing entity
     * Transforms flat field updates to { name?, description?, attributes?: {...} } format
     */
    update: async (entityType: string, id: string, data: Record<string, unknown>): Promise<Entity> => {
        const entity = await apiClient.patch<Entity>(`/entities/${entityType}/${id}`, transformToUpdateDto(data));
        return flattenEntity(entity);
    },

    /**
     * Delete an entity
     */
    delete: async (entityType: string, id: string): Promise<void> => {
        return apiClient.delete(`/entities/${entityType}/${id}`);
    },
};
