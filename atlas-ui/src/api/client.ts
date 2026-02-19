import { USER_KEY } from '@/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions extends RequestInit {
    params?: Record<string, string>;
    skipAuth?: boolean; // For public endpoints (still sends cookies but won't redirect on 401)
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { params, skipAuth, ...init } = options;

        let url = `${this.baseUrl}${endpoint}`;

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
                window.location.href = '/login';
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


