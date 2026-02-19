/**
 * Theme Registry
 *
 * Central registry for all available themes.
 * Themes are registered at compile time from the presets folder.
 */

import { AtlasTheme } from './types';
import { defaultTheme, corporateBlue, violetDream } from './presets';

/**
 * Map of all registered themes by ID.
 */
const themes: Map<string, AtlasTheme> = new Map();

// Register built-in themes
[defaultTheme, corporateBlue, violetDream].forEach((theme) => {
    themes.set(theme.id, theme);
});

/**
 * Get a theme by its ID.
 * @param id Theme identifier
 * @returns The theme if found, undefined otherwise
 */
export function getTheme(id: string): AtlasTheme | undefined {
    return themes.get(id);
}

/**
 * Get all available themes.
 * @returns Array of all registered themes
 */
export function getAllThemes(): AtlasTheme[] {
    return Array.from(themes.values());
}

/**
 * Get the default theme.
 * @returns The default Atlas theme
 */
export function getDefaultTheme(): AtlasTheme {
    return defaultTheme;
}

/**
 * Check if a theme exists.
 * @param id Theme identifier
 * @returns True if theme is registered
 */
export function hasTheme(id: string): boolean {
    return themes.has(id);
}
