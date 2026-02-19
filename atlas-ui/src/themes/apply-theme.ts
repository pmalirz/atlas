/**
 * Theme Application Utility
 *
 * Handles injecting theme CSS variables into the document.
 */

import { AtlasTheme, ColorTokens, GradientTokens, ShadowTokens, SizingTokens } from './types';
import { getDefaultTheme } from './registry';

/**
 * Converts camelCase to kebab-case for CSS property names.
 */
function camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Default shadow values (used when theme doesn't specify shadows).
 */
const DEFAULT_SHADOWS: ShadowTokens = {
    '2xs': '0 1px 3px 0px hsl(0 0% 0% / 0.05)',
    xs: '0 1px 3px 0px hsl(0 0% 0% / 0.05)',
    sm: '0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1)',
    md: '0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 2px 4px -1px hsl(0 0% 0% / 0.1)',
    lg: '0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 4px 6px -1px hsl(0 0% 0% / 0.1)',
    xl: '0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 8px 10px -1px hsl(0 0% 0% / 0.1)',
    '2xl': '0 1px 3px 0px hsl(0 0% 0% / 0.25)',
};

/**
 * Default sizing values.
 */
const DEFAULT_SIZING: SizingTokens = {
    radius: '0.5rem',
};

/**
 * Apply color tokens to CSS variables on the root element.
 */
function applyColorTokens(
    root: HTMLElement,
    tokens: ColorTokens,
    isDark: boolean
): void {
    // Map of token keys to CSS variable names
    const colorMap: Record<keyof ColorTokens, string> = {
        background: '--background',
        foreground: '--foreground',
        primary: '--primary',
        primaryForeground: '--primary-foreground',
        secondary: '--secondary',
        secondaryForeground: '--secondary-foreground',
        muted: '--muted',
        mutedForeground: '--muted-foreground',
        accent: '--accent',
        accentForeground: '--accent-foreground',
        destructive: '--destructive',
        destructiveForeground: '--destructive-foreground',
        border: '--border',
        input: '--input',
        ring: '--ring',
        card: '--card',
        cardForeground: '--card-foreground',
        popover: '--popover',
        popoverForeground: '--popover-foreground',
        sidebarBackground: '--sidebar-background',
        sidebarForeground: '--sidebar-foreground',
        sidebarPrimary: '--sidebar-primary',
        sidebarPrimaryForeground: '--sidebar-primary-foreground',
        sidebarAccent: '--sidebar-accent',
        sidebarAccentForeground: '--sidebar-accent-foreground',
        sidebarBorder: '--sidebar-border',
        sidebarRing: '--sidebar-ring',
        star: '--star',
        starForeground: '--star-foreground',
    };

    // Apply each color token
    for (const [key, cssVar] of Object.entries(colorMap)) {
        const value = tokens[key as keyof ColorTokens];
        if (value) {
            root.style.setProperty(cssVar, value);
        }
    }
}

/**
 * Apply shadow tokens to CSS variables.
 */
function applyShadowTokens(
    root: HTMLElement,
    shadows: Partial<ShadowTokens>
): void {
    const merged = { ...DEFAULT_SHADOWS, ...shadows };

    root.style.setProperty('--shadow-2xs', merged['2xs']);
    root.style.setProperty('--shadow-xs', merged.xs);
    root.style.setProperty('--shadow-sm', merged.sm);
    root.style.setProperty('--shadow-md', merged.md);
    root.style.setProperty('--shadow-lg', merged.lg);
    root.style.setProperty('--shadow-xl', merged.xl);
    root.style.setProperty('--shadow-2xl', merged['2xl']);
}

/**
 * Apply sizing tokens to CSS variables.
 */
function applySizingTokens(
    root: HTMLElement,
    sizing: Partial<SizingTokens>
): void {
    const merged = { ...DEFAULT_SIZING, ...sizing };
    root.style.setProperty('--radius', merged.radius);
}

/**
 * Apply gradient tokens to CSS variables.
 */
function applyGradientTokens(
    root: HTMLElement,
    gradients: Partial<GradientTokens>
): void {
    if (gradients.primary) {
        root.style.setProperty('--gradient-primary', gradients.primary);
    }
    if (gradients.background) {
        root.style.setProperty('--gradient-background', gradients.background);
    }
    if (gradients.accent) {
        root.style.setProperty('--gradient-accent', gradients.accent);
    }
    if (gradients.sidebar) {
        root.style.setProperty('--gradient-sidebar', gradients.sidebar);
    }
    if (gradients.card) {
        root.style.setProperty('--gradient-card', gradients.card);
    }
    if (gradients.sidebarHeader) {
        root.style.setProperty('--gradient-sidebar-header', gradients.sidebarHeader);
    }
}

/**
 * Apply a complete theme to the document.
 * This injects all CSS variables for the current color scheme.
 *
 * @param theme The theme to apply
 * @param colorScheme 'light' or 'dark' color scheme
 */
export function applyThemeToDocument(
    theme: AtlasTheme,
    colorScheme: 'light' | 'dark'
): void {
    const root = document.documentElement;
    const isDark = colorScheme === 'dark';
    const colors = isDark ? theme.colors.dark : theme.colors.light;

    // Apply color tokens
    applyColorTokens(root, colors, isDark);

    // Apply shadows
    applyShadowTokens(root, theme.shadows ?? {});

    // Apply sizing
    applySizingTokens(root, theme.sizing ?? {});

    // Apply gradients (if defined)
    const gradients = isDark ? theme.gradients?.dark : theme.gradients?.light;
    if (gradients) {
        applyGradientTokens(root, gradients);
    }
}

/**
 * Initialize theme on document load.
 * Applies the default theme immediately.
 */
export function initializeTheme(): void {
    const defaultTheme = getDefaultTheme();
    const isDark = document.documentElement.classList.contains('dark');
    applyThemeToDocument(defaultTheme, isDark ? 'dark' : 'light');
}
