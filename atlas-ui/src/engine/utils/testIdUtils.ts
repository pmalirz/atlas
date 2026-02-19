/**
 * Test ID Utilities for Schema-Driven Components
 * 
 * Generates hierarchical, predictable data-testid attributes for UI testing.
 * Pattern: {type}-{sectionId?}-{key}-{entityId?}
 * 
 * @example
 * testIds.section('classification')           // → 'section-classification'
 * testIds.field('classification', 'status')   // → 'field-classification-status'
 * testIds.tile('application', 'uuid-123')     // → 'tile-application-uuid-123'
 */

/**
 * Build a test ID from parts, filtering out undefined/empty values.
 */
export function buildTestId(...parts: (string | undefined | null)[]): string {
    return parts.filter(Boolean).join('-');
}

/**
 * Pre-built test ID generators for consistent naming across components.
 */
export const testIds = {
    /** Section container: section-{sectionId} */
    section: (sectionId: string) => `section-${sectionId}`,

    /** Field wrapper: field-{sectionId}-{fieldKey} or field-{fieldKey} */
    field: (sectionId: string | undefined, fieldKey: string) =>
        sectionId ? `field-${sectionId}-${fieldKey}` : `field-${fieldKey}`,

    /** Tile/card in browse view: tile-{entityType}-{entityId} */
    tile: (entityType: string, entityId: string) => `tile-${entityType}-${entityId}`,

    /** Table row: row-{entityType}-{entityId} */
    tableRow: (entityType: string, entityId: string) => `row-${entityType}-${entityId}`,

    /** Table cell: cell-{entityType}-{fieldKey} */
    tableCell: (entityType: string, fieldKey: string) => `cell-${entityType}-${fieldKey}`,

    /** Widget inside section: widget-{sectionId}-{widgetType} */
    widget: (sectionId: string, widgetType: string) => `widget-${sectionId}-${widgetType}`,

    /** Tab trigger: tab-{sectionId}-{tabId} */
    tab: (sectionId: string, tabId: string) => `tab-${sectionId}-${tabId}`,

    /** Tab content panel: tabpanel-{sectionId}-{tabId} */
    tabPanel: (sectionId: string, tabId: string) => `tabpanel-${sectionId}-${tabId}`,
};
