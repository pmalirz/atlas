import { USER_KEY } from '@/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions extends RequestInit {
    params?: Record<string, string>;
    skipAuth?: boolean; // For public endpoints (still sends cookies but won't redirect on 401)
    skipTenantPrefix?: boolean; // For platform-level endpoints that don't need slug
}

class ApiClient {
    private baseUrl: string;
    private tenantSlug: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    /**
     * Set the current tenant slug for API requests.
     * All subsequent requests will be prefixed with /{slug}/
     */
    setTenantSlug(slug: string | null): void {
        this.tenantSlug = slug;
    }

    /**
     * Get the current tenant slug
     */
    getTenantSlug(): string | null {
        return this.tenantSlug;
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { params, skipAuth, skipTenantPrefix, ...init } = options;

        // Prepend tenant slug to endpoint if available and not skipped
        const prefixedEndpoint = (!skipTenantPrefix && this.tenantSlug)
            ? `/${this.tenantSlug}${endpoint}`
            : endpoint;

        let url = `${this.baseUrl}${prefixedEndpoint}`;

        if (params) {
            const searchParams = new URLSearchParams(params);
            url += `?${searchParams.toString()}`;
        }

        // Build headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(init.headers as Record<string, string>),
        };

        const response = await fetch(url, {
            ...init,
            headers,
            credentials: 'include', // Always include HttpOnly cookies
        });

        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401 && !skipAuth) {
            // Clear local user state (cookie is already invalid/expired)
            localStorage.removeItem(USER_KEY);

            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                // Redirect to tenant-scoped login if slug is available
                const loginPath = this.tenantSlug ? `/${this.tenantSlug}/login` : '/login';
                window.location.href = loginPath;
            }

            throw new Error('Authentication required');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        // Handle 204 No Content or empty responses
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return undefined as T;
        }

        // Try to parse JSON, return undefined if empty
        const text = await response.text();
        if (!text) {
            return undefined as T;
        }

        return JSON.parse(text) as T;
    }

    async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET', params });
    }

    async post<T>(endpoint: string, data: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async patch<T>(endpoint: string, data: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async put<T>(endpoint: string, data: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);

/**
 * Helper to get the tenant slug for use in auth.api.ts (which uses raw fetch)
 */
export function getTenantSlug(): string | null {
    return apiClient.getTenantSlug();
}

/**
 * Helper to build a tenant-prefixed URL for raw fetch calls
 */
export function buildTenantUrl(path: string): string {
    const slug = apiClient.getTenantSlug();
    const prefix = slug ? `/${slug}` : '';
    return `${API_BASE_URL}${prefix}${path}`;
}
