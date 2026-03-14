import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserWithRoles } from '@app-atlas/shared/zod';
import { rbacApi } from '@/api/rbac.api';
import { useAuth } from './AuthContext';

interface RbacContextType {
    userWithRoles: UserWithRoles | null;
    isLoading: boolean;
    hasPermission: (resourceType: string, resourceName: string, action: 'create' | 'read' | 'update' | 'delete') => boolean;
    getAllowedAttributes: (resourceType: string, resourceName: string) => Set<string> | null;
    getDeniedAttributes: (resourceType: string, resourceName: string) => Set<string>;
}

const RbacContext = createContext<RbacContextType | undefined>(undefined);

export function RbacProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [userWithRoles, setUserWithRoles] = useState<UserWithRoles | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            setUserWithRoles(null);
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        setIsLoading(true);

        rbacApi.getMyRoles()
            .then(data => {
                if (isMounted) setUserWithRoles(data);
            })
            .catch(err => {
                console.error('Error fetching RBAC roles:', err);
                if (isMounted) setUserWithRoles(null);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => { isMounted = false; };
    }, [isAuthenticated]);

    const hasPermission = (
        resourceType: string,
        resourceName: string,
        action: 'create' | 'read' | 'update' | 'delete'
    ): boolean => {
        if (!userWithRoles) return !isLoading; // While loading, default to allow (backend still enforces)


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

    const getAllowedAttributes = (resourceType: string, resourceName: string): Set<string> | null => {
        if (!userWithRoles) return null; // No allow-list means all attributes are visible

        let hasExplicitAllowList = false;
        const allowed = new Set<string>();

        for (const role of userWithRoles.roles) {
            const perm = role.permissions.find(
                (p) => p.resourceType === resourceType && (p.resourceName === resourceName || p.resourceName === '*')
            );
            
            if (perm && perm.allowedAttributes && Array.isArray(perm.allowedAttributes)) {
                hasExplicitAllowList = true;
                perm.allowedAttributes.forEach((attr: string) => allowed.add(attr));
            }
        }

        return hasExplicitAllowList ? allowed : null; // returns null if no role defines an allow list (meaning all allowed logically if no denies exist)
    };

    const getDeniedAttributes = (resourceType: string, resourceName: string): Set<string> => {
        const denied = new Set<string>();
        if (!userWithRoles) return denied;

        for (const role of userWithRoles.roles) {
            const perm = role.permissions.find(
                (p) => p.resourceType === resourceType && (p.resourceName === resourceName || p.resourceName === '*')
            );
            
            if (perm && perm.deniedAttributes && Array.isArray(perm.deniedAttributes)) {
                perm.deniedAttributes.forEach((attr: string) => denied.add(attr));
            }
        }

        return denied;
    };

    const value: RbacContextType = {
        userWithRoles,
        isLoading,
        hasPermission,
        getAllowedAttributes,
        getDeniedAttributes
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
