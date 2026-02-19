// =============================================================================
// UI Schemas - Zod validation for UI configuration structures
// =============================================================================
// These schemas validate the JSON content stored in UIEntityConfig:
// - browseConfig: Browse page configuration (tile/table views)
// - detailConfig: Detail page configuration (sections, fields)
// And in UIGlobalConfig:
// - menuConfig: Global menu configuration
// =============================================================================

import { z } from 'zod';

// =============================================================================
// Shared Enums
// =============================================================================

/**
 * Format types for displaying field values in browse views.
 */
export const FormatTypeSchema = z.enum([
    'text',
    'number',
    'date',
    'datetime',
    'relative',  // "2 hours ago"
    'count',
    'badge',
]);
export type FormatType = z.infer<typeof FormatTypeSchema>;

/**
 * Section types determine the rendering component for detail page sections.
 */
export const SectionTypeSchema = z.enum([
    'card',        // Standard card with header
    'separator',   // Visual separator with optional title
    'tabs',        // Tabbed section container
    'collapsible', // Expandable/collapsible section
    'custom',      // Custom component from registry
    'widget',      // Non-field content (graphs, charts, etc.)
]);
export type SectionType = z.infer<typeof SectionTypeSchema>;

/**
 * Operator types for visibility conditions.
 */
export const ConditionOperatorSchema = z.enum([
    'eq',       // equals
    'neq',      // not equals
    'gt',       // greater than
    'lt',       // less than
    'contains', // string contains
    'exists',   // field has a value
]);
export type ConditionOperator = z.infer<typeof ConditionOperatorSchema>;

// =============================================================================
// Grid Layout Schema
// =============================================================================

/**
 * Grid layout configuration for sections and views.
 */
export const GridLayoutSchema = z.object({
    columns: z.number().min(1).max(12),
    gap: z.number().optional(),
    responsive: z.object({
        sm: z.number().min(1).max(12).optional(),
        md: z.number().min(1).max(12).optional(),
        lg: z.number().min(1).max(12).optional(),
    }).strict().optional(),
}).strict();
export type GridLayout = z.infer<typeof GridLayoutSchema>;

// =============================================================================
// Value Style Schema
// =============================================================================

/**
 * Styling for specific enum values (badges, status indicators).
 * Used to provide visual feedback for different values.
 */
export const ValueStyleSchema = z.object({
    label: z.string(),
    color: z.string(),  // Tailwind CSS classes
    icon: z.string().optional(),
    description: z.string().optional(),
}).strict();
export type ValueStyle = z.infer<typeof ValueStyleSchema>;

// =============================================================================
// Condition Schema
// =============================================================================

/**
 * Visibility condition for conditional rendering of sections/fields.
 */
export const ConditionSchema = z.object({
    field: z.string(),
    operator: ConditionOperatorSchema,
    value: z.unknown().optional(),
}).strict();
export type Condition = z.infer<typeof ConditionSchema>;

// =============================================================================
// Tile View Schema
// =============================================================================

/**
 * Tile/card role for browse tile view fields.
 */
export const TileFieldRoleSchema = z.enum([
    'title',       // Main heading
    'subtitle',    // Secondary text
    'description', // Body text
    'badge',       // Status/category badge
    'footer',      // Footer text (usually metadata)
    'custom',      // Custom rendering
]);
export type TileFieldRole = z.infer<typeof TileFieldRoleSchema>;

/**
 * Field configuration for tile view.
 */
export const TileFieldSchema = z.object({
    field: z.string(),
    role: TileFieldRoleSchema,
    icon: z.string().optional(),
    format: FormatTypeSchema.optional(),
}).strict();
export type TileField = z.infer<typeof TileFieldSchema>;

/**
 * Tile view configuration for browse pages.
 */
export const TileViewSchema = z.object({
    enabled: z.boolean(),
    layout: GridLayoutSchema,
    fields: z.array(TileFieldSchema),
}).strict();
export type TileView = z.infer<typeof TileViewSchema>;

// =============================================================================
// Table View Schema
// =============================================================================

/**
 * Column configuration for table view.
 */
export const TableColumnSchema = z.object({
    field: z.string(),
    header: z.string(),
    width: z.string().optional(),
    sortable: z.boolean().optional(),
    format: FormatTypeSchema.optional(),
}).strict();
export type TableColumn = z.infer<typeof TableColumnSchema>;

/**
 * Table view configuration for browse pages.
 */
export const TableViewSchema = z.object({
    enabled: z.boolean(),
    columns: z.array(TableColumnSchema),
}).strict();
export type TableView = z.infer<typeof TableViewSchema>;

// =============================================================================
// Filter Schema
// =============================================================================

/**
 * Filter types for browse page filtering.
 */
export const FilterTypeSchema = z.enum([
    'select',   // Dropdown select
    'search',   // Text search
    'range',    // Numeric range
    'boolean',  // Yes/No toggle
]);
export type FilterType = z.infer<typeof FilterTypeSchema>;

/**
 * Filter configuration for browse pages.
 */
export const FilterSchema = z.object({
    field: z.string(),
    type: FilterTypeSchema,
    label: z.string().optional(),
    placeholder: z.string().optional(),
}).strict();
export type Filter = z.infer<typeof FilterSchema>;

// =============================================================================
// Sort Schema
// =============================================================================

/**
 * Sort direction enum.
 */
export const SortDirectionSchema = z.enum(['asc', 'desc']);
export type SortDirection = z.infer<typeof SortDirectionSchema>;

/**
 * Default sort configuration.
 */
export const SortSchema = z.object({
    field: z.string(),
    direction: SortDirectionSchema,
}).strict();
export type Sort = z.infer<typeof SortSchema>;

// =============================================================================
// Browse Config Schema
// =============================================================================

/**
 * Complete browse page configuration.
 * Stored as JSON in UIEntityConfig.browseConfig.
 */
export const BrowseConfigSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    defaultView: z.enum(['tile', 'table']).optional(),
    allowCreate: z.boolean().optional(),
    createDialogFields: z.array(z.string()).optional(),
    views: z.object({
        tile: TileViewSchema.optional(),
        table: TableViewSchema.optional(),
    }).strict(),
    filters: z.array(FilterSchema).optional(),
    defaultSort: SortSchema.optional(),
}).strict();
export type BrowseConfig = z.infer<typeof BrowseConfigSchema>;

// =============================================================================
// Enum Render Mode Schema
// =============================================================================

/**
 * Render mode for enum/select fields.
 * When specified, overrides automatic component selection.
 */
export const EnumRenderModeSchema = z.enum([
    'select',   // Standard dropdown (default for single value)
    'chips',    // Chip/tag style (good for both single and multi)
    'radio',    // Radio buttons (single value only)
    'input',    // Text input (comma-separated for arrays)
]);
export type EnumRenderMode = z.infer<typeof EnumRenderModeSchema>;

// =============================================================================
// Field Placement Schema
// =============================================================================

/**
 * Field placement configuration in detail page sections.
 * Specifies where a field appears in the grid and how it renders.
 */
export const FieldPlacementSchema = z.object({
    field: z.string(),

    // Grid placement
    column: z.number().min(1),
    columnSpan: z.number().min(1).optional(),
    row: z.number().optional(),
    rowSpan: z.number().optional(),

    // Component override (registry key, e.g., 'field:star_rating')
    component: z.string().optional(),

    // Enum rendering mode (for enum/select fields)
    renderAs: EnumRenderModeSchema.optional(),

    // Display options
    label: z.string().optional(),
    placeholder: z.string().optional(),
    readonly: z.boolean().optional(),

    // Value styling for enums (maps value → style)
    valueStyles: z.record(z.string(), ValueStyleSchema).optional(),
}).strict();
export type FieldPlacement = z.infer<typeof FieldPlacementSchema>;

// =============================================================================
// Section Schema
// =============================================================================

/**
 * Section configuration for detail pages.
 * Sections are the building blocks of detail page layouts.
 */
export const SectionSchema = z.object({
    id: z.string(),

    // Title and description (optional for separators)
    title: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),

    // Section type determines rendering
    type: SectionTypeSchema,

    // Custom component override (registry key)
    component: z.string().optional(),

    // Widget-specific configuration (for type: 'widget')
    config: z.record(z.string(), z.unknown()).optional(),

    // Layout and fields
    layout: GridLayoutSchema,
    fields: z.array(FieldPlacementSchema),

    // Visibility conditions
    // Visibility conditions
    visibleWhen: ConditionSchema.optional(),
}).strict();
export type Section = z.infer<typeof SectionSchema>;

// =============================================================================
// Detail Config Schema
// =============================================================================

/**
 * Complete detail page configuration.
 * Stored as JSON in UIEntityConfig.detailConfig.
 */
export const DetailConfigSchema = z.object({
    headerFields: z.array(z.string()).optional(),
    sections: z.array(SectionSchema),
}).strict();
export type DetailConfig = z.infer<typeof DetailConfigSchema>;

// =============================================================================
// Form Config Schema
// =============================================================================

/**
 * Form configuration for create/edit dialogs.
 * Stored as JSON in UIEntityConfig.formConfig.
 */
export const FormConfigSchema = z.object({
    sections: z.array(SectionSchema).optional(),
}).strict();
export type FormConfig = z.infer<typeof FormConfigSchema>;

// =============================================================================
// Menu Config Schema
// =============================================================================

/**
 * Menu item configuration for the sidebar navigation.
 */
export const MenuItemSchema = z.object({
    entityType: z.string(),
    displayName: z.string(),
    icon: z.string().optional(),
    visible: z.boolean(),
}).strict();
export type MenuItem = z.infer<typeof MenuItemSchema>;

/**
 * Global menu configuration.
 * Stored as JSON in UIGlobalConfig.menuConfig.
 */
export const MenuConfigSchema = z.object({
    items: z.array(MenuItemSchema),
}).strict();
export type MenuConfig = z.infer<typeof MenuConfigSchema>;

// =============================================================================
// Complete UI Entity Config Schema
// =============================================================================

/**
 * Full UI entity configuration (for API responses).
 * Combines browse, detail, and form configs.
 */
export const UIEntityConfigDataSchema = z.object({
    entityType: z.string(),
    version: z.number().int().positive().optional(),
    browseConfig: BrowseConfigSchema,
    detailConfig: DetailConfigSchema,
    formConfig: FormConfigSchema.optional(),
}).strict();
export type UIEntityConfigData = z.infer<typeof UIEntityConfigDataSchema>;

// =============================================================================
// Widget Config Schemas
// =============================================================================

/**
 * Configuration for the RelationGraphWidget.
 * Passed via the `config` property in SectionSchema when type is 'widget'.
 */
export const RelationGraphConfigSchema = z.object({
    autoExpand: z.array(z.object({
        relationType: z.string(),
        throughRelation: z.string().optional(),
    })).optional(),
    maxDepth: z.number().int().min(1).max(10).optional(),
    excludeRelations: z.array(z.string()).optional(),
    direction: z.enum(['LR', 'TB']).optional(),
}).strict();
export type RelationGraphConfig = z.infer<typeof RelationGraphConfigSchema>;
