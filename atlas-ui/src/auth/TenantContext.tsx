import React, { createContext, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/api/client';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface TenantContextType {
    /** Current tenant slug from URL (e.g. "myatlas") */
    slug: string;
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

interface TenantProviderProps {
    children: React.ReactNode;
}

/**
 * TenantProvider - Extracts the tenant slug from the URL (:slug param)
 * and syncs it with the API client so all requests are tenant-scoped.
 *
 * Must be rendered inside a Route with `:slug` parameter.
 */
export function TenantProvider({ children }: TenantProviderProps) {
    const { slug } = useParams<{ slug: string }>();

    // Sync slug with API client SYNCHRONOUSLY during render
    // (not in useEffect, which fires after children mount)
    // This ensures AuthProvider's useEffect has the slug available.
    if (slug) {
        apiClient.setTenantSlug(slug);
    }

    useEffect(() => {
        // Ensure slug is set in case of React Strict Mode remounts
        if (slug) {
            apiClient.setTenantSlug(slug);
        }
    }, [slug]);

    if (!slug) {
        // This shouldn't happen if routes are configured correctly
        return <div>Tenant not found</div>;
    }

    return (
        <TenantContext.Provider value={{ slug }}>
            {children}
        </TenantContext.Provider>
    );
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

/**
 * useTenant - Access the current tenant context.
 * Must be used within a TenantProvider.
 */
export function useTenant(): TenantContextType {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}
