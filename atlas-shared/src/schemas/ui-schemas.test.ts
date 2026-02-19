// =============================================================================
// Unit Tests for UI Schemas
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
    GridLayoutSchema,
    ValueStyleSchema,
    ConditionSchema,
    TileFieldSchema,
    TileViewSchema,
    TableColumnSchema,
    TableViewSchema,
    FilterSchema,
    SortSchema,
    BrowseConfigSchema,
    FieldPlacementSchema,
    EnumRenderModeSchema,
    SectionSchema,
    DetailConfigSchema,
    FormConfigSchema,
    MenuItemSchema,
    MenuConfigSchema,
    UIEntityConfigDataSchema,
} from './ui-schemas';

// =============================================================================
// GridLayoutSchema Tests
// =============================================================================

describe('GridLayoutSchema', () => {
    it('should accept valid grid layout', () => {
        const valid = { columns: 3, gap: 4 };
        expect(() => GridLayoutSchema.parse(valid)).not.toThrow();
    });

    it('should accept responsive grid layout', () => {
        const valid = {
            columns: 3,
            responsive: { sm: 1, md: 2, lg: 3 },
        };
        expect(() => GridLayoutSchema.parse(valid)).not.toThrow();
    });

    it('should reject columns less than 1', () => {
        const invalid = { columns: 0 };
        expect(() => GridLayoutSchema.parse(invalid)).toThrow();
    });

    it('should reject columns greater than 12', () => {
        const invalid = { columns: 13 };
        expect(() => GridLayoutSchema.parse(invalid)).toThrow();
    });

    it('should reject unknown properties (strict mode)', () => {
        const invalid = { columns: 2, unknownProp: 'foo' };
        expect(() => GridLayoutSchema.parse(invalid)).toThrow(/unrecognized/i);
    });
});

// =============================================================================
// ValueStyleSchema Tests
// =============================================================================

describe('ValueStyleSchema', () => {
    it('should accept valid value style', () => {
        const valid = {
            label: 'Active',
            color: 'bg-green-100 text-green-800',
        };
        expect(() => ValueStyleSchema.parse(valid)).not.toThrow();
    });

    it('should accept value style with icon', () => {
        const valid = {
            label: 'Critical',
            color: 'bg-red-100 text-red-800',
            icon: 'alert-circle',
            description: 'Requires immediate attention',
        };
        expect(() => ValueStyleSchema.parse(valid)).not.toThrow();
    });

    it('should reject missing label', () => {
        const invalid = { color: 'bg-red-100' };
        expect(() => ValueStyleSchema.parse(invalid)).toThrow();
    });

    it('should reject unknown properties (strict mode)', () => {
        const invalid = { label: 'Test', color: 'red', unknownProp: 'foo' };
        expect(() => ValueStyleSchema.parse(invalid)).toThrow(/unrecognized/i);
    });
});

// =============================================================================
// TileViewSchema Tests
// =============================================================================

describe('TileViewSchema', () => {
    const validTileView = {
        enabled: true,
        layout: { columns: 3 },
        fields: [
            { field: 'name', role: 'title' as const },
            { field: 'status', role: 'badge' as const, format: 'badge' as const },
        ],
    };

    it('should accept valid tile view', () => {
        expect(() => TileViewSchema.parse(validTileView)).not.toThrow();
    });

    it('should reject invalid role', () => {
        const invalid = {
            enabled: true,
            layout: { columns: 3 },
            fields: [{ field: 'name', role: 'invalid_role' }],
        };
        expect(() => TileViewSchema.parse(invalid)).toThrow();
    });
});

// =============================================================================
// TableViewSchema Tests
// =============================================================================

describe('TableViewSchema', () => {
    const validTableView = {
        enabled: true,
        columns: [
            { field: 'name', header: 'Name', sortable: true },
            { field: 'status', header: 'Status', format: 'badge' as const },
        ],
    };

    it('should accept valid table view', () => {
        expect(() => TableViewSchema.parse(validTableView)).not.toThrow();
    });

    it('should reject missing columns', () => {
        const invalid = { enabled: true };
        expect(() => TableViewSchema.parse(invalid)).toThrow();
    });
});

// =============================================================================
// BrowseConfigSchema Tests
// =============================================================================

describe('BrowseConfigSchema', () => {
    const validBrowseConfig = {
        title: 'Applications',
        description: 'Enterprise application portfolio',
        defaultView: 'tile' as const,
        allowCreate: true,
        views: {
            tile: {
                enabled: true,
                layout: { columns: 3 },
                fields: [{ field: 'name', role: 'title' as const }],
            },
            table: {
                enabled: true,
                columns: [{ field: 'name', header: 'Name' }],
            },
        },
    };

    it('should accept valid browse config', () => {
        expect(() => BrowseConfigSchema.parse(validBrowseConfig)).not.toThrow();
    });

    it('should accept minimal browse config', () => {
        const minimal = { views: {} };
        expect(() => BrowseConfigSchema.parse(minimal)).not.toThrow();
    });

    it('should reject invalid defaultView', () => {
        const invalid = { ...validBrowseConfig, defaultView: 'list' };
        expect(() => BrowseConfigSchema.parse(invalid)).toThrow();
    });

    it('should reject unknown properties (strict mode)', () => {
        const invalid = { ...validBrowseConfig, unknownProp: 'foo' };
        expect(() => BrowseConfigSchema.parse(invalid)).toThrow(/unrecognized/i);
    });
});

// =============================================================================
// EnumRenderModeSchema Tests
// =============================================================================

describe('EnumRenderModeSchema', () => {
    it('should accept valid render modes', () => {
        expect(() => EnumRenderModeSchema.parse('select')).not.toThrow();
        expect(() => EnumRenderModeSchema.parse('chips')).not.toThrow();
        expect(() => EnumRenderModeSchema.parse('radio')).not.toThrow();
        expect(() => EnumRenderModeSchema.parse('input')).not.toThrow();
    });

    it('should reject invalid render mode', () => {
        expect(() => EnumRenderModeSchema.parse('dropdown')).toThrow();
        expect(() => EnumRenderModeSchema.parse('textarea')).toThrow();
    });
});

// =============================================================================
// FieldPlacementSchema Tests
// =============================================================================

describe('FieldPlacementSchema', () => {
    it('should accept minimal field placement', () => {
        const valid = { field: 'name', column: 1 };
        expect(() => FieldPlacementSchema.parse(valid)).not.toThrow();
    });

    it('should accept field with renderAs option', () => {
        const valid = {
            field: 'status',
            column: 1,
            renderAs: 'chips' as const,
        };
        expect(() => FieldPlacementSchema.parse(valid)).not.toThrow();
    });

    it('should accept field with all options', () => {
        const valid = {
            field: 'criticality',
            column: 2,
            columnSpan: 2,
            renderAs: 'select' as const,
            label: 'Criticality Level',
            valueStyles: {
                low: { label: 'Low', color: 'bg-green-100' },
                high: { label: 'High', color: 'bg-red-100' },
            },
        };
        expect(() => FieldPlacementSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid renderAs value', () => {
        const invalid = {
            field: 'status',
            column: 1,
            renderAs: 'invalid_mode',
        };
        expect(() => FieldPlacementSchema.parse(invalid)).toThrow();
    });

    it('should reject unknown properties (strict mode)', () => {
        const invalid = { field: 'name', column: 1, unknownProp: 'foo' };
        expect(() => FieldPlacementSchema.parse(invalid)).toThrow(/unrecognized/i);
    });
});

// =============================================================================
// SectionSchema Tests
// =============================================================================

describe('SectionSchema', () => {
    const validSection = {
        id: 'basic',
        title: 'Basic Information',
        type: 'card' as const,
        layout: { columns: 2 },
        fields: [
            { field: 'name', column: 1 },
            { field: 'description', column: 1, columnSpan: 2 },
        ],
    };

    it('should accept valid section', () => {
        expect(() => SectionSchema.parse(validSection)).not.toThrow();
    });

    it('should accept widget section with config', () => {
        const widgetSection = {
            id: 'graph',
            title: 'Relations Graph',
            type: 'widget' as const,
            component: 'widget:relation_graph',
            config: { maxDepth: 3, direction: 'LR' },
            layout: { columns: 1 },
            fields: [],
        };
        expect(() => SectionSchema.parse(widgetSection)).not.toThrow();
    });

    it('should accept section with visibility condition', () => {
        const conditionalSection = {
            ...validSection,
            visibleWhen: {
                field: 'status',
                operator: 'eq' as const,
                value: 'active',
            },
        };
        expect(() => SectionSchema.parse(conditionalSection)).not.toThrow();
    });

    it('should reject invalid section type', () => {
        const invalid = { ...validSection, type: 'invalid_type' };
        expect(() => SectionSchema.parse(invalid)).toThrow();
    });

    it('should reject unknown properties (strict mode)', () => {
        const invalid = { ...validSection, unknownProp: 'foo' };
        expect(() => SectionSchema.parse(invalid)).toThrow(/unrecognized/i);
    });
});

// =============================================================================
// DetailConfigSchema Tests
// =============================================================================

describe('DetailConfigSchema', () => {
    const validDetailConfig = {
        headerFields: ['name', 'status'],
        sections: [
            {
                id: 'basic',
                title: 'Basic Info',
                type: 'card' as const,
                layout: { columns: 2 },
                fields: [{ field: 'name', column: 1 }],
            },
        ],
    };

    it('should accept valid detail config', () => {
        expect(() => DetailConfigSchema.parse(validDetailConfig)).not.toThrow();
    });

    it('should reject missing sections', () => {
        const invalid = { headerFields: ['name'] };
        expect(() => DetailConfigSchema.parse(invalid)).toThrow();
    });
});

// =============================================================================
// MenuConfigSchema Tests
// =============================================================================

describe('MenuConfigSchema', () => {
    const validMenuConfig = {
        items: [
            { entityType: 'application', displayName: 'Applications', icon: 'app-window', visible: true },
            { entityType: 'interface', displayName: 'Interfaces', icon: 'plug', visible: true },
        ],
    };

    it('should accept valid menu config', () => {
        expect(() => MenuConfigSchema.parse(validMenuConfig)).not.toThrow();
    });

    it('should accept empty items array', () => {
        expect(() => MenuConfigSchema.parse({ items: [] })).not.toThrow();
    });

    it('should reject missing visible flag', () => {
        const invalid = {
            items: [{ entityType: 'app', displayName: 'Apps' }],
        };
        expect(() => MenuConfigSchema.parse(invalid)).toThrow();
    });

    it('should reject unknown properties in menu item (strict mode)', () => {
        const invalid = {
            items: [
                { entityType: 'app', displayName: 'Apps', visible: true, unknownProp: 'foo' },
            ],
        };
        expect(() => MenuConfigSchema.parse(invalid)).toThrow(/unrecognized/i);
    });
});

// =============================================================================
// UIEntityConfigDataSchema Tests
// =============================================================================

describe('UIEntityConfigDataSchema', () => {
    const validUIConfig = {
        entityType: 'application',
        version: 1,
        browseConfig: {
            title: 'Applications',
            views: {},
        },
        detailConfig: {
            sections: [],
        },
    };

    it('should accept valid UI entity config', () => {
        expect(() => UIEntityConfigDataSchema.parse(validUIConfig)).not.toThrow();
    });

    it('should accept config with optional formConfig', () => {
        const withForm = {
            ...validUIConfig,
            formConfig: { sections: [] },
        };
        expect(() => UIEntityConfigDataSchema.parse(withForm)).not.toThrow();
    });

    it('should reject missing entityType', () => {
        const invalid = {
            browseConfig: { views: {} },
            detailConfig: { sections: [] },
        };
        expect(() => UIEntityConfigDataSchema.parse(invalid)).toThrow();
    });

    it('should reject unknown properties (strict mode)', () => {
        const invalid = { ...validUIConfig, unknownProp: 'foo' };
        expect(() => UIEntityConfigDataSchema.parse(invalid)).toThrow(/unrecognized/i);
    });
});
