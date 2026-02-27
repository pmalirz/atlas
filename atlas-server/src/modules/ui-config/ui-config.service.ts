import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UIEntityConfig } from '@prisma/client';
import { TenantContextService } from '../../common/services/tenant-context.service';

// ─────────────────────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────────────────────

export interface UIEntityConfigResponse {
    id: string;
    entityType: string;
    version: number;
    browseConfig: BrowseConfig;
    detailConfig: DetailConfig;
    formConfig?: FormConfig;
    createdAt: Date;
    updatedAt: Date;
}

export interface BrowseConfig {
    title?: string;
    description?: string;
    defaultView?: 'tile' | 'table';
    allowCreate?: boolean;
    views: {
        tile?: TileViewConfig;
        table?: TableViewConfig;
    };
}

export interface TileViewConfig {
    enabled: boolean;
    layout: { columns: number };
    fields: TileFieldConfig[];
}

export interface TileFieldConfig {
    field: string;
    role: 'title' | 'subtitle' | 'description' | 'badge' | 'footer';
    format?: 'text' | 'badge' | 'date' | 'datetime' | 'relative' | 'count';
}

export interface TableViewConfig {
    enabled: boolean;
    columns: TableColumnConfig[];
}

export interface TableColumnConfig {
    field: string;
    header: string;
    sortable?: boolean;
    width?: string;
    format?: 'text' | 'badge' | 'date' | 'datetime' | 'relative' | 'count';
}

export interface DetailConfig {
    headerFields?: string[];
    sections: SectionConfig[];
}

export interface SectionConfig {
    id: string;
    title?: string;
    description?: string;
    type: 'card' | 'separator' | 'tabs' | 'collapsible';
    component?: string;
    layout: { columns: number };
    fields: FieldPlacement[];
    visibleWhen?: ConditionConfig;
}

export interface FieldPlacement {
    field: string;
    column?: number;
    columnSpan?: number;
    row?: number;
    rowSpan?: number;
    label?: string;
    readonly?: boolean;
    placeholder?: string;
    component?: string;
    valueStyles?: Record<string, ValueStyle>;
}

export interface ValueStyle {
    label?: string;
    color?: string;
    icon?: string;
    description?: string;
}

export interface ConditionConfig {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'exists';
    value?: unknown;
}

export interface FormConfig {
    sections?: SectionConfig[];
}

export interface MenuItem {
    entityType: string;
    displayName: string;
    icon?: string;
    visible: boolean;
}

export interface MenuConfig {
    items: MenuItem[];
}

export interface UIGlobalConfigResponse {
    id: string;
    version: number;
    menuConfig: MenuConfig;
    createdAt: Date;
    updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────

@Injectable()
export class UIConfigService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly tenantContext: TenantContextService,
    ) { }

    // ─────────────────────────────────────────────────────────────
    // UI Entity Configs
    // ─────────────────────────────────────────────────────────────

    async getAllUIEntityConfigs(): Promise<UIEntityConfigResponse[]> {
        const tenantId = this.tenantContext.getTenantId();
        const configs = await this.prisma.uIEntityConfig.findMany({
            where: { tenantId },
            orderBy: { entityType: 'asc' },
        });

        return configs.map((c: UIEntityConfig) => this.mapUIEntityConfig(c));
    }

    async getUIEntityConfig(entityType: string): Promise<UIEntityConfigResponse> {
        const tenantId = this.tenantContext.getTenantId();
        const config = await this.prisma.uIEntityConfig.findUnique({
            where: { ui_entity_config_type_tenant_unique: { entityType, tenantId } },
        });

        if (!config) {
            throw new NotFoundException(`UI configuration for "${entityType}" not found`);
        }

        return this.mapUIEntityConfig(config);
    }

    private mapUIEntityConfig(config: {
        id: string;
        entityType: string;
        version: number;
        browseConfig: unknown;
        detailConfig: unknown;
        formConfig: unknown | null;
        createdAt: Date;
        updatedAt: Date;
    }): UIEntityConfigResponse {
        return {
            id: config.id,
            entityType: config.entityType,
            version: config.version,
            browseConfig: (config.browseConfig as BrowseConfig) ?? { views: {} },
            detailConfig: (config.detailConfig as DetailConfig) ?? { sections: [] },
            formConfig: (config.formConfig as FormConfig) ?? undefined,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // Global Config
    // ─────────────────────────────────────────────────────────────

    async getGlobalConfig(): Promise<UIGlobalConfigResponse | null> {
        const tenantId = this.tenantContext.getTenantId();
        const config = await this.prisma.uIGlobalConfig.findFirst({
            where: { tenantId },
        });

        if (!config) {
            return null;
        }

        return {
            id: config.id,
            version: config.version,
            menuConfig: config.menuConfig as unknown as MenuConfig,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // Menu Configuration
    // ─────────────────────────────────────────────────────────────

    /**
     * Get menu configuration.
     * Falls back to building menu from UIEntityConfigs if no config exists.
     */
    async getMenuConfig(): Promise<MenuConfig> {
        // Try to get config from UIGlobalConfig (one per tenant)
        const tenantId = this.tenantContext.getTenantId();
        const config = await this.prisma.uIGlobalConfig.findFirst({
            where: { tenantId },
        });

        if (config?.menuConfig) {
            const menuConfig = config.menuConfig as { items?: MenuItem[] };
            if (menuConfig.items && menuConfig.items.length > 0) {
                return { items: menuConfig.items };
            }
        }

        // Fallback: Build menu from UIEntityConfigs
        const configs = await this.getAllUIEntityConfigs();
        const items: MenuItem[] = configs.map((c) => ({
            entityType: c.entityType,
            displayName: c.browseConfig?.title || c.entityType,
            visible: true,
        }));

        return { items };
    }
}
