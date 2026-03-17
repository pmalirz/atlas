/**
 * UI Entity Configuration Types
 * These types define the structure of UI configuration stored in the database
 */

import { EntityData, WidgetConfig } from './common';

// ─────────────────────────────────────────────────────────────
// MAIN UI ENTITY CONFIG
// ─────────────────────────────────────────────────────────────

export interface UIEntityConfig {
    entityType: string;
    version: number;
    updatedAt: string;

    browse: BrowsePageSchema;
    detail: DetailPageSchema;
}

// ─────────────────────────────────────────────────────────────
// BROWSE PAGE SCHEMA
// ─────────────────────────────────────────────────────────────

export interface BrowsePageSchema {
    title: string;
    description?: string;

    views: {
        tile: TileViewSchema;
        table: TableViewSchema;
    };
    defaultView: 'tile' | 'table';

    filters?: FilterSchema[];
    defaultSort?: SortSchema;

    allowCreate: boolean;
    createDialogFields?: string[];
}

export interface TileViewSchema {
    enabled: boolean;
    layout: GridLayoutSchema;
    fields: TileFieldSchema[];
}

export interface TableViewSchema {
    enabled: boolean;
    columns: TableColumnSchema[];
}

export interface TileFieldSchema {
    field: string;
    role: 'title' | 'subtitle' | 'description' | 'badge' | 'footer' | 'custom';
    icon?: string;
    format?: FormatType;
}

export interface TableColumnSchema {
    field: string;
    header: string;
    width?: string;
    sortable?: boolean;
    format?: FormatType;
}

export type FormatType =
    | 'text'
    | 'number'
    | 'date'
    | 'datetime'
    | 'relative'
    | 'count'
    | 'badge';

// ─────────────────────────────────────────────────────────────
// DETAIL PAGE SCHEMA
// ─────────────────────────────────────────────────────────────

export interface DetailPageSchema {
    headerFields: string[];
    sections: SectionSchema[];
}

export interface SectionSchema {
    id: string;

    // Title (optional - can be separator without title)
    title?: string;
    description?: string;
    icon?: string;

    // Section type determines rendering component
    type: SectionType;

    // Custom component override (registry key)
    component?: string;

    // Widget-specific configuration (passed to widget components)
    config?: WidgetConfig;

    // Layout and fields
    layout: GridLayoutSchema;
    fields: FieldPlacementSchema[];

    // Visibility conditions
    visibleWhen?: ConditionSchema;
}

export type SectionType =
    | 'card'
    | 'separator'
    | 'tabs'
    | 'collapsible'
    | 'custom'
    | 'widget';  // Non-field content sections (graphs, charts, etc.)

// ─────────────────────────────────────────────────────────────
// GRID LAYOUT SCHEMA
// ─────────────────────────────────────────────────────────────

export interface GridLayoutSchema {
    columns: number;
    gap?: number;

    responsive?: {
        sm?: number;
        md?: number;
        lg?: number;
    };
}

/**
 * Enum render mode for explicit control over enum field rendering.
 */
export type EnumRenderMode = 'select' | 'chips' | 'radio' | 'input';

export interface FieldPlacementSchema {
    field: string;

    // Grid placement (required)
    column: number;
    columnSpan?: number;
    row?: number;
    rowSpan?: number;

    // Component override (registry key)
    component?: string;

    // Enum rendering mode (for enum/select fields)
    renderAs?: EnumRenderMode;

    // Display options
    label?: string;
    placeholder?: string;
    readonly?: boolean;

    // Value styling for enums
    valueStyles?: Record<string, ValueStyleSchema>;
}

export interface ValueStyleSchema {
    label: string;
    color: string;
    icon?: string;
    description?: string;
}

// ─────────────────────────────────────────────────────────────
// FILTERS & SORTING
// ─────────────────────────────────────────────────────────────

export interface FilterSchema {
    field: string;
    type: 'select' | 'search' | 'range' | 'boolean';
    label?: string;
    placeholder?: string;
}

export interface SortSchema {
    field: string;
    direction: 'asc' | 'desc';
}

export const CONDITION_OPERATORS = {
    EQ: 'eq',
    NEQ: 'neq',
    GT: 'gt',
    LT: 'lt',
    CONTAINS: 'contains',
    EXISTS: 'exists',
} as const;

export type ConditionOperator = typeof CONDITION_OPERATORS[keyof typeof CONDITION_OPERATORS];

export interface ConditionSchema {
    field: string;
    operator: ConditionOperator;
    value?: unknown; // Value can be anything depending on the field type
}

// ─────────────────────────────────────────────────────────────
// ENTITY SCHEMA (from backend)
// ─────────────────────────────────────────────────────────────

export interface EntitySchema {
    entityType: string;
    displayName?: string;
    attributes: FieldSchema[];
}

/**
 * Rich enum option with display metadata.
 * Display priority: valueStyles.label → option.displayName → option.key
 */
export interface EnumOption {
    key: string;
    displayName?: string;
    description?: string;
}

export interface FieldSchema {
    key: string;
    type: string;               // Resolved type: 'enum', 'string', 'number', 'relation', etc.
    typeRef?: string;           // Original type reference, e.g., 'hosting_type', 'cia_rating'
    displayName: string;
    required?: boolean;
    options?: EnumOption[];     // Rich enum options (when type === 'enum')
    description?: string;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };

    // Relation-specific fields (when type === 'relation')
    relType?: string;           // Relation type key, e.g., 'app_uses_technology'
    side?: 'from' | 'to';       // Only for symmetric relations (same entity type on both sides)
    relation?: RelationFieldConfig;
}

// ─────────────────────────────────────────────────────────────
// RELATION TYPES
// ─────────────────────────────────────────────────────────────

/**
 * Component types for rendering relations in the UI.
 * Auto-detected based on relation characteristics when not specified:
 * - incoming relation (entity is in toEntityTypes) → 'panel'
 * - has attributeSchema → 'dialog'
 * - default → 'tags'
 */
export type RelationComponentType =
    | 'tags'        // Simple tag-based multi-select (no attributes)
    | 'chips'       // Inline chips with quick add/remove
    | 'list'        // Expandable list showing related entity cards
    | 'dialog'      // Popup dialog for relations with attributes
    | 'panel'       // Dedicated panel/section for complex relations
    | 'custom';     // Custom component from registry

/**
 * Configuration for relation field rendering.
 * Can be specified in EntitySchema.fields for explicit control.
 */
export interface RelationFieldConfig {
    componentType?: RelationComponentType;  // How to render this relation (auto-detected if not set)
    targetEntityType?: string;              // Target entity type, e.g., 'technology'
    allowCreate?: boolean;                  // Can create new related entities inline
    allowEdit?: boolean;                    // Can edit relation attributes (default: true)
    inline?: boolean;                       // Show in main section vs tabs
    cardComponent?: string;                 // Registry key for item card component
    dialogConfig?: {                        // Configuration for 'dialog' componentType
        title?: string;
        description?: string;
    };
}

/**
 * Attribute schema for relation definitions (from RelationDefinition.attributeSchema).
 * Defines fields that describe the relationship itself.
 */
export interface RelationAttributeSchema {
    key: string;
    displayName: string;
    type?: string;              // Field type, e.g., 'string', 'number', 'decimal'
    typeRef?: string;           // Reference to TypeDefinition
    required?: boolean;
    options?: EnumOption[];
    validation?: {
        min?: number;
        max?: number;
    };
}

// ─────────────────────────────────────────────────────────────
// WIDGET TYPES
// ─────────────────────────────────────────────────────────────

/**
 * Props for widget components (non-field sections like graphs, charts).
 * Widgets receive entity context but render their own content.
 */
export interface WidgetComponentProps {
    entityId: string;
    entityType: string;
    entity: EntityData;
    schema: SectionSchema;
    config?: WidgetConfig;  // Widget-specific configuration
}

/**
 * Configuration for the RelationGraphWidget.
 * Passed via the `config` property in SectionSchema.
 */
export interface RelationGraphConfig {
    /** Relations to auto-expand on load (show 2nd level) */
    autoExpand?: Array<{
        relationType: string;         // e.g., 'interface_connects_apps'
        throughRelation?: string;     // e.g., 'app_owns_interface'
    }>;

    /** Maximum depth for drill-down (default: 3) */
    maxDepth?: number;

    /** Relation types to hide from the graph */
    excludeRelations?: string[];

    /** Initial layout direction */
    direction?: 'LR' | 'TB';  // Left-Right or Top-Bottom
}
