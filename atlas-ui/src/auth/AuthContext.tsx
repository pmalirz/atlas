import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AuthUser, AuthConfig, LoginRequest, RegisterRequest } from '@app-atlas/shared';
import * as authApi from '@/api/auth.api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    authConfig: AuthConfig | null;
    login: (credentials: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// User storage key (for display purposes only, not security-sensitive)
// Token is now stored in HttpOnly cookie, managed by browser
export const USER_KEY = 'atlas_auth_user';

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        const stored = localStorage.getItem(USER_KEY);
        return stored ? JSON.parse(stored) : null;
    });
    const [isLoading, setIsLoading] = useState(true);
    const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);

    // Load auth config on mount
    useEffect(() => {
        authApi.getAuthConfig()
            .then(setAuthConfig)
            .catch(console.error);
    }, []);

    // Verify auth on mount by calling /auth/me (uses HttpOnly cookie)
    useEffect(() => {
        const verifyAuth = async () => {
            try {
                // If cookie is valid, this will succeed
                const currentUser = await authApi.getCurrentUser();
                setUser(currentUser);
                localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
            } catch {
                // Cookie is invalid/expired, clear local user state
                setUser(null);
                localStorage.removeItem(USER_KEY);
            } finally {
                setIsLoading(false);
            }
        };

        verifyAuth();
    }, []);

    const login = useCallback(async (credentials: LoginRequest) => {
        const response = await authApi.login(credentials);
        // Server sets HttpOnly cookie, we just store user for display
        setUser(response.user);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    }, []);

    const register = useCallback(async (data: RegisterRequest) => {
        const response = await authApi.register(data);
        // Server sets HttpOnly cookie, we just store user for display
        setUser(response.user);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    }, []);

    const logout = useCallback(async () => {
        try {
            // Server clears the HttpOnly cookie
            await authApi.logout();
        } catch {
            // Ignore logout errors
        }
        setUser(null);
        localStorage.removeItem(USER_KEY);
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        authConfig,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

