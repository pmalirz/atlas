import { apiClient } from './client';
import type { UIEntityConfig, EntitySchema, EnumOption, BrowsePageSchema, DetailPageSchema } from '@/engine/schema/types';

interface APIUIEntityConfig {
    id: string;
    entityType: string;
    version: number;
    browseConfig: BrowsePageSchema;
    detailConfig: DetailPageSchema;
    createdAt: string;
    updatedAt: string;
}

/**
 * Normalize options to EnumOption[] format.
 * Supports both legacy string[] and new EnumOption[] formats from server.
 */
function normalizeOptions(
    options: Array<string | { key: string; displayName?: string; description?: string }> | undefined
): EnumOption[] | undefined {
    if (!options) return undefined;
    return options.map(opt =>
        typeof opt === 'string'
            ? { key: opt }  // Convert simple string to EnumOption
            : opt           // Already EnumOption format
    );
}

// ─────────────────────────────────────────────────────────────
// Definitions API (Entity, Type, Relation Definitions)
// ─────────────────────────────────────────────────────────────

export const definitionsApi = {
    /**
     * Get entity definition (field definitions) for a specific entity type
     */
    getEntityDefinition: async (entityType: string): Promise<EntitySchema> => {
        interface APIEntityDefinition {
            id: string;
            entityType: string;
            displayName: string;
            attributes: Array<Record<string, unknown>>; // Raw attributes (ignore)
            resolvedAttributes: Array<{
                key: string;
                displayName: string;
                type?: string;
                typeRef?: string;
                resolvedBaseType?: string;    // Resolved base type: 'enum', 'string', etc.
                required?: boolean;
                group?: string;
                relType?: string;             // Relation type for relation fields
                side?: 'from' | 'to';         // Only for symmetric relations
                resolvedOptions?: Array<string | { key: string; displayName?: string; description?: string }>;  // Rich or simple
                options?: Array<string | { key: string; displayName?: string; description?: string }>;
                validation?: {
                    min?: number;
                    max?: number;
                    pattern?: string;
                };
            }>;
        }

        const apiDef = await apiClient.get<APIEntityDefinition>(`/definitions/entities/${entityType}/resolved`);

        // Map to frontend EntitySchema format using resolvedAttributes
        // Priority for type: resolvedBaseType (for enums) > type > fallback to 'string'
        return {
            entityType: apiDef.entityType,
            attributes: (apiDef.resolvedAttributes ?? []).map(f => ({
                key: f.key,
                displayName: f.displayName,
                type: f.resolvedBaseType ?? f.type ?? 'string',
                typeRef: f.typeRef,           // Keep for reference (e.g., 'hosting_type')
                required: f.required,
                options: normalizeOptions(f.resolvedOptions ?? f.options),
                validation: f.validation,
                group: f.group,
                relType: f.relType,           // Pass through relation type
                side: f.side,                 // Pass through side (for symmetric relations)
            })),
        };
    },
};

// ─────────────────────────────────────────────────────────────
// UI Config API (UI Entity Configs, Menu)
// ─────────────────────────────────────────────────────────────

export const uiConfigApi = {
    /**
     * Get UI entity config for a specific entity type
     */
    getUIEntityConfig: async (entityType: string): Promise<UIEntityConfig> => {
        const data = await apiClient.get<APIUIEntityConfig>(`/ui-config/entities/${entityType}`);
        return {
            entityType: data.entityType,
            version: data.version,
            updatedAt: data.updatedAt,
            browse: data.browseConfig,
            detail: data.detailConfig,
        };
    },

    /**
     * List all available UI entity configs
     */
    listUIEntityConfigs: async (): Promise<UIEntityConfig[]> => {
        const list = await apiClient.get<APIUIEntityConfig[]>('/ui-config/entities');
        return list.map(data => ({
            entityType: data.entityType,
            version: data.version,
            updatedAt: data.updatedAt,
            browse: data.browseConfig,
            detail: data.detailConfig,
        }));
    },
};

// Convenience export for UI entity config access
export const uiEntityConfigApi = {
    get: uiConfigApi.getUIEntityConfig,
    list: uiConfigApi.listUIEntityConfigs,
};

// ─────────────────────────────────────────────────────────────
// Menu Configuration API
// ─────────────────────────────────────────────────────────────

export interface MenuItem {
    entityType: string;
    displayName: string;
    icon?: string;
    visible: boolean;
}

export interface MenuConfig {
    items: MenuItem[];
}

export const menuConfigApi = {
    /**
     * Get menu configuration with fallback to UIEntityConfigs
     */
    getMenuConfig: async (): Promise<MenuConfig> => {
        return apiClient.get<MenuConfig>('/ui-config/menu');
    },
};

// Legacy export for backward compatibility (deprecated)
export const schemasApi = {
    getEntitySchema: definitionsApi.getEntityDefinition,
    getUIEntityConfig: uiConfigApi.getUIEntityConfig,
    listUIEntityConfigs: uiConfigApi.listUIEntityConfigs,
};
