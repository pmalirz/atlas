import type { SectionType, FieldPlacementSchema, SectionSchema, GridLayoutSchema, ValueStyleSchema, FieldSchema, RelationComponentType, WidgetComponentProps } from '../schema/types';
import type { RelationComponentProps } from './relation-components/relation-types';
export type { FieldSchema };

type ComponentCategory = 'field' | 'section' | 'layout' | 'relation' | 'widget';

interface ComponentEntry<P = any> {
    component: React.ComponentType<P>;
    category: ComponentCategory;
    description?: string;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT PROPS INTERFACES
// ─────────────────────────────────────────────────────────────

export interface FieldComponentProps<T = unknown> {
    value: T;
    onChange: (value: T) => void;

    fieldSchema: FieldSchema;
    placement: FieldPlacementSchema;
    valueStyles?: Record<string, ValueStyleSchema>;

    readonly?: boolean;
    disabled?: boolean;
    error?: string;
}

export interface SectionComponentProps {
    schema: SectionSchema;
    children: React.ReactNode;
}

export interface LayoutComponentProps {
    layout: GridLayoutSchema;
    children: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT REGISTRY
// ─────────────────────────────────────────────────────────────

class ComponentRegistry {
    private components = new Map<string, ComponentEntry>();

    /**
     * Register a component with a key
     * @param key Unique identifier, e.g., "field:text", "section:card"
     */
    register<P>(key: string, entry: ComponentEntry<P>): void {
        this.components.set(key, entry as ComponentEntry);
    }

    /**
     * Get a component by key
     */
    get<P>(key: string): React.ComponentType<P> | null {
        return this.components.get(key)?.component as React.ComponentType<P> | null;
    }

    /**
     * Check if a component is registered
     */
    has(key: string): boolean {
        return this.components.has(key);
    }

    /**
     * Get field component by type, with fallback to text
     */
    getField(fieldType: string): React.ComponentType<FieldComponentProps> {
        const key = `field:${fieldType}`;
        const component = this.get<FieldComponentProps>(key);

        if (component) return component;

        // Fallback to text field
        const fallback = this.get<FieldComponentProps>('field:text');
        if (fallback) return fallback;

        // Ultimate fallback - return a placeholder
        return PlaceholderField;
    }

    /**
     * Get section component by type, with fallback to card
     */
    getSection(sectionType: SectionType | string): React.ComponentType<SectionComponentProps> {
        const key = typeof sectionType === 'string' && !sectionType.startsWith('section:')
            ? `section:${sectionType}`
            : sectionType;

        const component = this.get<SectionComponentProps>(key);
        if (component) return component;

        // Fallback to card section
        const fallback = this.get<SectionComponentProps>('section:card');
        if (fallback) return fallback;

        return PlaceholderSection;
    }

    /**
     * Get layout component
     */
    getLayout(): React.ComponentType<LayoutComponentProps> {
        const component = this.get<LayoutComponentProps>('layout:grid');
        if (component) return component;

        return PlaceholderLayout;
    }

    /**
     * Get relation component by type, with fallback to tags
     * @param componentType The relation component type (tags, dialog, panel, etc.)
     */
    getRelation(componentType: RelationComponentType | string): React.ComponentType<RelationComponentProps> {
        const key = typeof componentType === 'string' && !componentType.startsWith('relation:')
            ? `relation:${componentType}`
            : componentType;

        const component = this.get<RelationComponentProps>(key);
        if (component) return component;

        // Fallback to tags (simplest relation component)
        const fallback = this.get<RelationComponentProps>('relation:tags');
        if (fallback) return fallback;

        return PlaceholderRelation;
    }

    /**
     * Get widget component by key
     */
    getWidget(widgetKey: string): React.ComponentType<WidgetComponentProps> {
        const key = widgetKey.startsWith('widget:') ? widgetKey : `widget:${widgetKey}`;
        const component = this.get<WidgetComponentProps>(key);
        if (component) return component;
        return PlaceholderWidget;
    }

    /**
     * Override an existing component
     */
    override<P>(key: string, component: React.ComponentType<P>): void {
        const existing = this.components.get(key);
        if (existing) {
            this.components.set(key, { ...existing, component: component as React.ComponentType<any> });
        } else {
            console.warn(`Cannot override non-existent component: ${key}`);
        }
    }

    /**
     * List all registered component keys
     */
    list(category?: ComponentCategory): string[] {
        return Array.from(this.components.entries())
            .filter(([_, e]) => !category || e.category === category)
            .map(([k]) => k);
    }

    /**
     * Get component info
     */
    getInfo(key: string): { category: ComponentCategory; description?: string } | null {
        const entry = this.components.get(key);
        if (!entry) return null;
        return { category: entry.category, description: entry.description };
    }
}

// ─────────────────────────────────────────────────────────────
// PLACEHOLDER COMPONENTS (fallbacks)
// ─────────────────────────────────────────────────────────────

function PlaceholderField({ fieldSchema }: FieldComponentProps) {
    return (
        <div className="p-2 border border-dashed rounded text-sm text-muted-foreground" >
            [Field: {fieldSchema.key}]
        </div>
    );
}

function PlaceholderSection({ schema, children }: SectionComponentProps) {
    return (
        <div className="p-4 border border-dashed rounded" >
            {schema.title && <div className="text-sm text-muted-foreground mb-2"> [Section: {schema.title}] </div>}
            {children}
        </div>
    );
}

function PlaceholderLayout({ children }: LayoutComponentProps) {
    return <div className="space-y-4" > {children} </div>;
}

function PlaceholderRelation({ fieldSchema }: RelationComponentProps) {
    return (
        <div className="p-2 border border-dashed rounded text-sm text-muted-foreground">
            [Relation: {fieldSchema?.key || 'unknown'}]
        </div>
    );
}

function PlaceholderWidget({ schema }: WidgetComponentProps) {
    return (
        <div className="p-4 border border-dashed rounded text-sm text-muted-foreground text-center">
            [Widget: {schema.component || 'unknown'}]
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────

export const registry = new ComponentRegistry();
