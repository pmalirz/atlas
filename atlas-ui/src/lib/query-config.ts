/**
 * Standard query configuration for non-cached queries.
 * Useful for entities and lists that need to always be fresh.
 */
export const NO_CACHE_QUERY_CONFIG = {
    staleTime: 0,
    gcTime: 0,
};
