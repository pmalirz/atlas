const DEFAULT_TENANT_SLUG = 'myatlas';

export const E2E_TENANT_SLUG = process.env.E2E_TENANT_SLUG || DEFAULT_TENANT_SLUG;

function ensureLeadingSlash(path: string): string {
    return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Build a tenant-scoped UI path (e.g. /myatlas/login).
 */
export function withTenantUiPath(path: string): string {
    const normalized = ensureLeadingSlash(path);
    if (normalized === `/${E2E_TENANT_SLUG}` || normalized.startsWith(`/${E2E_TENANT_SLUG}/`)) {
        return normalized;
    }
    if (normalized === '/') {
        return `/${E2E_TENANT_SLUG}`;
    }
    return `/${E2E_TENANT_SLUG}${normalized}`;
}

/**
 * Build a tenant-scoped API path while preserving the global /api prefix.
 * Accepts both /api/* and non-prefixed paths.
 */
export function withTenantApiPath(path: string): string {
    const normalized = ensureLeadingSlash(path);

    // Health endpoint remains global/non-tenant.
    if (normalized === '/api/health' || normalized.startsWith('/api/health?')) {
        return normalized;
    }

    if (normalized.startsWith(`/api/${E2E_TENANT_SLUG}/`) || normalized === `/api/${E2E_TENANT_SLUG}`) {
        return normalized;
    }

    if (normalized.startsWith('/api/')) {
        return `/api/${E2E_TENANT_SLUG}${normalized.slice('/api'.length)}`;
    }

    return `/api/${E2E_TENANT_SLUG}${normalized}`;
}
