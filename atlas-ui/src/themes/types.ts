/**
 * Atlas Theme System - Type Definitions
 *
 * Comprehensive theme interface covering all Look & Feel aspects:
 * colors (light/dark), typography, sizing, radii, and shadows.
 */

/**
 * Color tokens for a single color scheme (light or dark).
 * Values are HSL components without the hsl() wrapper (e.g., "240 5% 10%").
 */
export interface ColorTokens {
    // Core colors
    background: string;
    foreground: string;

    // Primary action color
    primary: string;
    primaryForeground: string;

    // Secondary color
    secondary: string;
    secondaryForeground: string;

    // Muted elements
    muted: string;
    mutedForeground: string;

    // Accent highlights
    accent: string;
    accentForeground: string;

    // Destructive actions
    destructive: string;
    destructiveForeground: string;

    // Borders and inputs
    border: string;
    input: string;
    ring: string;

    // Card component
    card: string;
    cardForeground: string;

    // Popover component
    popover: string;
    popoverForeground: string;

    // Sidebar-specific colors
    sidebarBackground: string;
    sidebarForeground: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    sidebarAccent: string;
    sidebarAccentForeground: string;
    sidebarBorder: string;
    sidebarRing: string;

    // Star rating colors
    star: string;
    starForeground: string;
}

/**
 * Shadow definitions for elevated components.
 * Values are full CSS shadow definitions.
 */
export interface ShadowTokens {
    '2xs': string;
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
}

/**
 * Sizing and spacing tokens.
 */
export interface SizingTokens {
    /** Base border radius (e.g., "0.5rem") */
    radius: string;
}

/**
 * Gradient definitions for backgrounds and accents.
 * Values are full CSS gradient definitions.
 */
export interface GradientTokens {
    /** Primary gradient for buttons, headers, etc. */
    primary?: string;
    /** Subtle background gradient */
    background?: string;
    /** Accent gradient for highlights */
    accent?: string;
    /** Sidebar gradient */
    sidebar?: string;
    /** Card gradient */
    card?: string;
    /** Sidebar header gradient */
    sidebarHeader?: string;
}

/**
 * Typography configuration.
 */
export interface TypographyTokens {
    /** Sans-serif font stack */
    sans?: string[];
    /** Serif font stack */
    serif?: string[];
    /** Monospace font stack */
    mono?: string[];
}

/**
 * Available shader slots that UI surfaces can consume.
 */
export interface ThemeShaderSlots {
    /** Shader rendered behind the authenticated app main content area. */
    mainBackground?: string;
}

/**
 * Complete Atlas theme definition.
 */
export interface AtlasTheme {
    /** Unique theme identifier (used for switching) */
    id: string;

    /** Human-readable theme name */
    name: string;

    /** Optional description for theme pickers */
    description?: string;

    /** Color palettes for light and dark modes */
    colors: {
        light: ColorTokens;
        dark: ColorTokens;
    };

    /** Typography configuration (optional - uses defaults if not specified) */
    fonts?: TypographyTokens;

    /** Sizing tokens (optional - uses defaults if not specified) */
    sizing?: Partial<SizingTokens>;

    /** Shadow definitions (optional - uses defaults if not specified) */
    shadows?: Partial<ShadowTokens>;

    /** Gradient definitions (optional - for themes with gradient accents) */
    gradients?: {
        light?: Partial<GradientTokens>;
        dark?: Partial<GradientTokens>;
    };

    /**
     * Optional theme-bound shader assignments by color mode.
     * Values reference IDs from the shader registry.
     */
    shaders?: {
        light?: ThemeShaderSlots;
        dark?: ThemeShaderSlots;
    };
}

/**
 * Context value for theme management.
 */
export interface AtlasThemeContextValue {
    /** Currently active theme */
    currentTheme: AtlasTheme;

    /** All available themes */
    availableThemes: AtlasTheme[];

    /** Switch to a different theme by ID */
    setTheme: (themeId: string) => void;
}
