import { registry } from './component-registry';

// Field components
import { TextField } from './field-components/TextField';
import { NumberField } from './field-components/NumberField';
import { BooleanField } from './field-components/BooleanField';
import { EnumField } from './field-components/EnumField';
import { DateField } from './field-components/DateField';
import { RelationField } from './field-components/RelationField';
import { TagsField } from './field-components/TagsField';
import { StarRatingField } from './field-components/StarRatingField';

// Relation components
import { RelationTagsField } from './relation-components/RelationTagsField';
import { RelationDialogField } from './relation-components/RelationDialogField';
import { RelationPanelField } from './relation-components/RelationPanelField';

// Section components
import { CardSection } from './section-components/CardSection';
import { SeparatorSection } from './section-components/SeparatorSection';
import { CollapsibleSection } from './section-components/CollapsibleSection';
import { TabsSectionAdapter } from './section-components/TabsSection';

// Layout components
import { GridLayout } from './layout-components/GridLayout';

// Widget components
import { RelationGraphWidget } from './widget-components/relation-graph-widget/RelationGraphWidget';

export function registerDefaultComponents(): void {
    // ─────────────────────────────────────────────────────────────
    // FIELD COMPONENTS
    // ─────────────────────────────────────────────────────────────

    registry.register('field:text', { component: TextField, category: 'field', description: 'Basic text input' });
    registry.register('field:string', { component: TextField, category: 'field', description: 'String field' });
    registry.register('field:textarea', { component: TextField, category: 'field', description: 'Multi-line text' });
    registry.register('field:number', { component: NumberField, category: 'field', description: 'Numeric input' });
    registry.register('field:integer', { component: NumberField, category: 'field', description: 'Integer input' });
    registry.register('field:decimal', { component: NumberField, category: 'field', description: 'Decimal input' });
    registry.register('field:boolean', { component: BooleanField, category: 'field', description: 'Toggle switch' });
    registry.register('field:enum', { component: EnumField, category: 'field', description: 'Dropdown select' });
    registry.register('field:select', { component: EnumField, category: 'field', description: 'Select' });
    registry.register('field:date', { component: DateField, category: 'field', description: 'Date picker' });
    registry.register('field:datetime', { component: DateField, category: 'field', description: 'Date & time' });
    registry.register('field:relation', { component: RelationField, category: 'field', description: 'Related entity' });
    registry.register('field:tags', { component: TagsField, category: 'field', description: 'Array of tags' });
    registry.register('field:array', { component: TagsField, category: 'field', description: 'Array field' });
    registry.register('field:star_rating', { component: StarRatingField, category: 'field', description: 'Star rating (1-5)' });

    // ─────────────────────────────────────────────────────────────
    // RELATION COMPONENTS
    // ─────────────────────────────────────────────────────────────

    registry.register('relation:tags', { component: RelationTagsField, category: 'relation', description: 'Tag-based relation selector' });
    registry.register('relation:chips', { component: RelationTagsField, category: 'relation', description: 'Chip-style relation' });
    registry.register('relation:dialog', { component: RelationDialogField, category: 'relation', description: 'Dialog with attributes' });
    registry.register('relation:panel', { component: RelationPanelField, category: 'relation', description: 'Full panel for incoming relations' });
    registry.register('relation:list', { component: RelationPanelField, category: 'relation', description: 'List with cards' });

    // ─────────────────────────────────────────────────────────────
    // SECTION COMPONENTS
    // ─────────────────────────────────────────────────────────────

    registry.register('section:card', { component: CardSection, category: 'section', description: 'Card section' });
    registry.register('section:separator', { component: SeparatorSection, category: 'section', description: 'Separator' });
    registry.register('section:collapsible', { component: CollapsibleSection, category: 'section', description: 'Collapsible' });
    registry.register('section:tabs', { component: TabsSectionAdapter, category: 'section', description: 'Tabbed section' });

    // ─────────────────────────────────────────────────────────────
    // LAYOUT COMPONENTS
    // ─────────────────────────────────────────────────────────────

    registry.register('layout:grid', { component: GridLayout, category: 'layout', description: 'Grid layout' });

    // ─────────────────────────────────────────────────────────────
    // WIDGET COMPONENTS
    // ─────────────────────────────────────────────────────────────

    registry.register('widget:relation_graph', { component: RelationGraphWidget, category: 'widget', description: 'Entity relation graph visualization' });
}

