/**
 * Atlas Theme Provider
 *
 * Wraps next-themes and provides Atlas theme context.
 * Handles CSS variable injection on theme changes.
 */

import React, {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { AtlasTheme, AtlasThemeContextValue } from './types';
import { getAllThemes, getDefaultTheme, getTheme } from './registry';
import { applyThemeToDocument } from './apply-theme';

/**
 * Context for Atlas theme management.
 */
export const AtlasThemeContext = createContext<AtlasThemeContextValue | null>(
    null
);

interface AtlasThemeProviderProps {
    /** Default theme ID to use on initial load */
    defaultThemeId?: string;
    children: React.ReactNode;
}

/**
 * Internal component that handles theme application.
 * Must be inside ThemeProvider to access useTheme.
 */
function ThemeApplicator({
    atlasTheme,
    children,
}: {
    atlasTheme: AtlasTheme;
    children: React.ReactNode;
}) {
    const { resolvedTheme } = useTheme();

    // Apply theme whenever atlas theme or color scheme changes
    useEffect(() => {
        if (resolvedTheme) {
            const colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light';
            applyThemeToDocument(atlasTheme, colorScheme);
        }
    }, [atlasTheme, resolvedTheme]);

    return <>{children}</>;
}

/**
 * Atlas Theme Provider component.
 *
 * Wraps the application and provides:
 * - Theme context for accessing/switching themes
 * - Integration with next-themes for light/dark mode
 * - Automatic CSS variable injection
 *
 * @example
 * ```tsx
 * <AtlasThemeProvider defaultThemeId="corporate-blue">
 *   <App />
 * </AtlasThemeProvider>
 * ```
 */
export function AtlasThemeProvider({
    defaultThemeId = 'default',
    children,
}: AtlasThemeProviderProps) {
    // Initialize with stored theme or default
    const [currentTheme, setCurrentTheme] = useState<AtlasTheme>(() => {
        // Check localStorage for persisted theme preference
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('atlas-theme-id');
            if (stored) {
                const theme = getTheme(stored);
                if (theme) return theme;
            }
        }
        // Fall back to provided default or system default
        return getTheme(defaultThemeId) ?? getDefaultTheme();
    });

    const availableThemes = useMemo(() => getAllThemes(), []);

    const setTheme = useCallback((themeId: string) => {
        const theme = getTheme(themeId);
        if (theme) {
            setCurrentTheme(theme);
            // Persist preference
            localStorage.setItem('atlas-theme-id', themeId);
        } else {
            console.warn(`Theme "${themeId}" not found. Available themes:`, getAllThemes().map(t => t.id));
        }
    }, []);

    const contextValue = useMemo<AtlasThemeContextValue>(
        () => ({
            currentTheme,
            availableThemes,
            setTheme,
        }),
        [currentTheme, availableThemes, setTheme]
    );

    return (
        <AtlasThemeContext.Provider value={contextValue}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <ThemeApplicator atlasTheme={currentTheme}>{children}</ThemeApplicator>
            </ThemeProvider>
        </AtlasThemeContext.Provider>
    );
}
