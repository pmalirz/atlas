export const SKIP_RELATION_KEYS = [
    'id',
    'targetId',
    'name',
    'displayName',
    'entityType',
    'targetName',
    'targetEntityType'
] as const;

export type SkipRelationKey = typeof SKIP_RELATION_KEYS[number];

export function isSkipRelationKey(key: string): key is SkipRelationKey {
    return (SKIP_RELATION_KEYS as readonly string[]).includes(key);
}
