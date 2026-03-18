import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserWithRoles } from '@app-atlas/shared/zod';
import { rbacApi } from '@/api/rbac.api';
import { useAuth } from './AuthContext';

interface RbacContextType {
    userWithRoles: UserWithRoles | null;
    isLoading: boolean;
    hasPermission: (resourceType: string, resourceName: string, action: 'create' | 'read' | 'update' | 'delete') => boolean;
    getReadableAttributes: (resourceType: string, resourceName: string) => Set<string> | null;
    getUpdatableAttributes: (resourceType: string, resourceName: string) => Set<string> | null;
}

const RbacContext = createContext<RbacContextType | undefined>(undefined);

export function RbacProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [userWithRoles, setUserWithRoles] = useState<UserWithRoles | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadRoles = async () => {
            if (!isAuthenticated) {
                if (isMounted) {
                    setUserWithRoles(null);
                    setIsLoading(false);
                }
                return;
            }

            if (isMounted) {
                setIsLoading(true);
            }

            try {
                const data = await rbacApi.getMyRoles();
                if (isMounted) setUserWithRoles(data);
            } catch (err) {
                console.error('Error fetching RBAC roles:', err);
                if (isMounted) setUserWithRoles(null);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadRoles();

        return () => { isMounted = false; };
    }, [isAuthenticated]);

    const hasPermission = (
        resourceType: string,
        resourceName: string,
        action: 'create' | 'read' | 'update' | 'delete'
    ): boolean => {
        if (!userWithRoles) return false; // No permissions = deny all (backend still enforces)


        for (const role of userWithRoles.roles) {
            const perm = role.permissions.find(
                (p) => p.resourceType === resourceType && (p.resourceName === resourceName || p.resourceName === '*')
            );
            
            if (perm) {
                let allowed = false;
                switch (action) {
                    case 'create': allowed = perm.canCreate; break;
                    case 'read': allowed = perm.canRead; break;
                    case 'update': allowed = perm.canUpdate; break;
                    case 'delete': allowed = perm.canDelete; break;
                }
                if (allowed) return true;
            }
        }
        return false;
    };

    const getReadableAttributes = (resourceType: string, resourceName: string): Set<string> | null => {
        if (!userWithRoles) return null; // No readable list means all attributes are visible

        let hasExplicitReadableList = false;
        const readable = new Set<string>();

        for (const role of userWithRoles.roles) {
            const perm = role.permissions.find(
                (p) => p.resourceType === resourceType && (p.resourceName === resourceName || p.resourceName === '*')
            );
            
            if (perm && perm.readableAttributes && Array.isArray(perm.readableAttributes)) {
                hasExplicitReadableList = true;
                perm.readableAttributes.forEach((attr: string) => readable.add(attr));
            }
        }

        return hasExplicitReadableList ? readable : null;
    };

    const getUpdatableAttributes = (resourceType: string, resourceName: string): Set<string> | null => {
        if (!userWithRoles) return null; // No updatable list means all attributes are updatable

        let hasExplicitUpdatableList = false;
        const updatable = new Set<string>();

        for (const role of userWithRoles.roles) {
            const perm = role.permissions.find(
                (p) => p.resourceType === resourceType && (p.resourceName === resourceName || p.resourceName === '*')
            );
            
            if (perm && perm.updatableAttributes && Array.isArray(perm.updatableAttributes)) {
                hasExplicitUpdatableList = true;
                perm.updatableAttributes.forEach((attr: string) => updatable.add(attr));
            }
        }

        return hasExplicitUpdatableList ? updatable : null;
    };

    const value: RbacContextType = {
        userWithRoles,
        isLoading,
        hasPermission,
        getReadableAttributes,
        getUpdatableAttributes
    };

    return (
        <RbacContext.Provider value={value}>
            {children}
        </RbacContext.Provider>
    );
}

export function useRbac(): RbacContextType {
    const context = useContext(RbacContext);
    if (context === undefined) {
        throw new Error('useRbac must be used within an RbacProvider');
    }
    return context;
}
