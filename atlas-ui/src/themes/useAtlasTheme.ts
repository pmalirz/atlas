/**
 * useAtlasTheme Hook
 *
 * Hook for accessing and managing the current Atlas theme.
 */

import { useContext } from 'react';
import { AtlasThemeContext } from './AtlasThemeProvider';
import { AtlasThemeContextValue } from './types';

/**
 * Hook to access the Atlas theme context.
 * Provides the current theme and ability to switch themes.
 *
 * @example
 * ```tsx
 * const { currentTheme, availableThemes, setTheme } = useAtlasTheme();
 *
 * // Switch to corporate blue theme
 * setTheme('corporate-blue');
 * ```
 */
export function useAtlasTheme(): AtlasThemeContextValue {
    const context = useContext(AtlasThemeContext);

    if (!context) {
        throw new Error('useAtlasTheme must be used within an AtlasThemeProvider');
    }

    return context;
}
