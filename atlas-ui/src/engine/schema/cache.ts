import type { UIEntityConfig } from './types';

interface CacheEntry {
    schema: UIEntityConfig;
    fetchedAt: number;
}

class UIEntityConfigCache {
    private cache = new Map<string, CacheEntry>();
    private readonly TTL = 5 * 60 * 1000; // 5 minutes

    get(entityType: string): UIEntityConfig | null {
        const entry = this.cache.get(entityType);
        if (!entry) return null;
        if (Date.now() - entry.fetchedAt > this.TTL) {
            this.cache.delete(entityType);
            return null;
        }
        return entry.schema;
    }

    set(entityType: string, schema: UIEntityConfig): void {
        this.cache.set(entityType, { schema, fetchedAt: Date.now() });
    }

    invalidate(entityType: string): void {
        this.cache.delete(entityType);
    }

    clear(): void {
        this.cache.clear();
    }
}

export const schemaCache = new UIEntityConfigCache();
