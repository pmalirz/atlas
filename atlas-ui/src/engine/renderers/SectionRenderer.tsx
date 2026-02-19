import { registry } from '../registry/component-registry';
import type { SectionSchema, EntitySchema } from '../schema/types';
import { evaluateCondition } from '../utils/conditions';
import { FieldRenderer } from './FieldRenderer';
import { EntityData } from '../schema/common';

interface SectionRendererProps {
    section: SectionSchema;
    entity: EntityData;
    entitySchema: EntitySchema;
    onUpdate: (field: string, value: any) => void;
}

/**
 * SectionRenderer
 *
 * Renders a section with its layout and fields.
 * Handles visibility conditions and component selection.
 */
export function SectionRenderer({
    section,
    entity,
    entitySchema,
    onUpdate
}: SectionRendererProps) {
    // Check visibility condition
    if (section.visibleWhen && !evaluateCondition(section.visibleWhen, entity)) {
        return null;
    }

    // Get section component
    const SectionComponent = registry.getSection(section.component ?? section.type);

    // Widget sections render their own content (no fields/layout)
    if (section.type === 'widget' && section.component) {
        const WidgetComponent = registry.getWidget(section.component);
        return (
            <SectionComponent schema={section}>
                <WidgetComponent
                    entityId={entity.id as string}
                    entityType={entitySchema.entityType}
                    entity={entity}
                    schema={section}
                />
            </SectionComponent>
        );
    }

    // Get layout component
    const LayoutComponent = registry.getLayout();

    return (
        <SectionComponent schema={section}>
            <LayoutComponent layout={section.layout}>
                {section.fields.map(fieldPlacement => (
                    <FieldRenderer
                        key={fieldPlacement.field}
                        fieldKey={fieldPlacement.field}
                        sectionId={section.id}
                        entity={entity}
                        entitySchema={entitySchema}
                        placement={fieldPlacement}
                        onUpdate={onUpdate}
                    />
                ))}
            </LayoutComponent>
        </SectionComponent>
    );
}
