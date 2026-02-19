/**
 * Atlas Theme System
 *
 * Public exports for the theme system.
 */

// Provider and hook
export { AtlasThemeProvider, AtlasThemeContext } from './AtlasThemeProvider';
export { useAtlasTheme } from './useAtlasTheme';

// Registry functions
export { getAllThemes, getTheme, getDefaultTheme, hasTheme } from './registry';

// Types
export type {
    AtlasTheme,
    AtlasThemeContextValue,
    ColorTokens,
    ShadowTokens,
    SizingTokens,
    TypographyTokens,
} from './types';

// Presets (for direct access if needed)
export * from './presets';
