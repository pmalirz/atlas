import { FieldPlacementSchema } from '../schema/types';
import { RelationItem } from '../registry/relation-components/relation-types';
import { EntityData } from '../schema/common';
import { cn } from '../../lib/utils';
import { isSkipRelationKey } from '@app-atlas/shared';

/**
 * Transform raw entity relation data to RelationItem[] format
 */
export function transformToRelationItems(rawValue: unknown): RelationItem[] {
    if (!rawValue || !Array.isArray(rawValue)) return [];

    return rawValue
        .map((item: unknown, index: number): RelationItem | null => {
            if (isEntityData(item)) {
                return {
                    id: getString(item, 'id') || `temp-${index}`,
                    targetId: getString(item, 'targetId') || getString(item, 'id') || '',
                    targetName: getString(item, 'targetName') || getString(item, 'name') || getString(item, 'displayName') || 'Unknown',
                    targetEntityType: getString(item, 'entityType'),
                    attributes: extractAttributes(item),
                };
            }
            // Handle simple ID references
            if (typeof item === 'string') {
                return {
                    id: `temp-${index}`,
                    targetId: item,
                    targetName: item,
                };
            }
            return null;
        })
        .filter((item): item is RelationItem => item !== null);
}

/**
 * Extract relation attributes from raw object
 */
export function extractAttributes(obj: EntityData): EntityData | undefined {
    const attrs: EntityData = {};

    for (const [key, value] of Object.entries(obj)) {
        if (!isSkipRelationKey(key) && value !== undefined) {
            attrs[key] = value;
        }
    }

    return Object.keys(attrs).length > 0 ? attrs : undefined;
}

/**
 * Get Tailwind grid classes from placement config
 */
export function getGridClasses(placement: FieldPlacementSchema): string {
    return cn(
        placement.column ? `col-start-${placement.column}` : undefined,
        (placement.columnSpan && placement.columnSpan > 1)
            ? `col-span-${placement.columnSpan}`
            : 'col-span-1',
        placement.row ? `row-start-${placement.row}` : undefined,
        (placement.rowSpan && placement.rowSpan > 1) ? `row-span-${placement.rowSpan}` : undefined
    );
}

/**
 * Type guard for EntityData-like objects
 */
function isEntityData(item: unknown): item is EntityData {
    return typeof item === 'object' && item !== null && !Array.isArray(item);
}

/**
 * Safe string getter
 */
function getString(obj: EntityData, key: string): string | undefined {
    const val = obj[key];
    return typeof val === 'string' ? val : undefined;
}
