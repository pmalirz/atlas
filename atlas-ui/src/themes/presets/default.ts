/**
 * Default Atlas Theme - "Chromatic Silver"
 *
 * A sophisticated, elegant theme featuring brushed silver, 
 * charcoal steel, and chromatic grays for a premium look.
 */

import { AtlasTheme } from '../types';

const defaultTheme: AtlasTheme = {
    id: 'default',
    name: 'Chromatic Silver',
    description: 'Sophisticated silver and charcoal steel tones',

    colors: {
        light: {
            background: '220 20% 97%',
            foreground: '220 25% 15%',

            card: '0 0% 100%',
            cardForeground: '220 25% 15%',

            popover: '220 20% 94%',
            popoverForeground: '220 25% 15%',

            primary: '220 15% 25%',
            primaryForeground: '220 10% 98%',

            secondary: '220 10% 90%',
            secondaryForeground: '220 25% 20%',

            muted: '220 15% 92%',
            mutedForeground: '220 10% 45%',

            accent: '220 20% 92%',
            accentForeground: '220 25% 30%',

            destructive: '0 72% 50%',
            destructiveForeground: '0 85% 97%',

            border: '220 15% 88%',
            input: '220 15% 88%',
            ring: '220 15% 25%',

            sidebarBackground: '220 15% 94%',
            sidebarForeground: '220 20% 20%',
            sidebarPrimary: '220 15% 25%',
            sidebarPrimaryForeground: '220 10% 98%',
            sidebarAccent: '220 20% 88%',
            sidebarAccentForeground: '220 25% 15%',
            sidebarBorder: '220 15% 85%',
            sidebarRing: '220 15% 25%',

            star: '45 93% 58%',
            starForeground: '45 93% 47%',
        },

        dark: {
            background: '220 15% 8%',
            foreground: '220 10% 95%',

            card: '220 10% 14%',
            cardForeground: '220 10% 95%',

            popover: '220 12% 16%',
            popoverForeground: '220 10% 95%',

            primary: '220 10% 85%',
            primaryForeground: '220 20% 10%',

            secondary: '220 10% 20%',
            secondaryForeground: '220 10% 95%',

            muted: '220 10% 22%',
            mutedForeground: '220 5% 70%',

            accent: '220 10% 25%',
            accentForeground: '220 10% 90%',

            destructive: '0 62% 40%',
            destructiveForeground: '0 85% 97%',

            border: '220 10% 20%',
            input: '220 10% 20%',
            ring: '220 10% 85%',

            sidebarBackground: '220 15% 6%',
            sidebarForeground: '220 10% 90%',
            sidebarPrimary: '220 10% 85%',
            sidebarPrimaryForeground: '220 20% 10%',
            sidebarAccent: '220 10% 18%',
            sidebarAccentForeground: '220 10% 95%',
            sidebarBorder: '220 10% 15%',
            sidebarRing: '220 10% 85%',

            star: '220 10% 85%',
            starForeground: '220 10% 75%',
        },
    },

    sizing: {
        radius: '0.4rem',
    },

    shadows: {
        '2xs': '0 1px 2px 0px hsl(220 30% 10% / 0.03)',
        xs: '0 1px 2px 0px hsl(220 30% 10% / 0.05)',
        sm: '0 1px 3px 0px hsl(220 25% 10% / 0.08), 0 1px 2px -1px hsl(220 25% 10% / 0.08)',
        md: '0 4px 6px -1px hsl(220 25% 10% / 0.08), 0 2px 4px -2px hsl(220 25% 10% / 0.08)',
        lg: '0 10px 15px -3px hsl(220 25% 10% / 0.08), 0 4px 6px -4px hsl(220 25% 10% / 0.08)',
        xl: '0 20px 25px -5px hsl(220 25% 10% / 0.1), 0 8px 10px -6px hsl(220 25% 10% / 0.1)',
        '2xl': '0 25px 50px -12px hsl(220 25% 10% / 0.15)',
    },

    gradients: {
        light: {
            // Elegant brushed silver-to-steel gradient
            primary: 'linear-gradient(135deg, hsl(220 15% 25%) 0%, hsl(220 10% 40%) 100%)',
            // Delicate chromatic background wash
            background: 'linear-gradient(to bottom right, hsl(220 20% 98%), hsl(220 15% 94%))',
            // Subtle silver sheen for headers
            sidebarHeader: 'linear-gradient(135deg, hsl(220 15% 97%) 0%, hsl(220 15% 92%) 100%)',
            // Soft vertical matte for sidebar
            sidebar: 'linear-gradient(to bottom, hsl(220 15% 95%) 0%, hsl(220 15% 92%) 100%)',
            // Subtle card gradient - almost white with a hint of cool gray
            card: 'linear-gradient(145deg, hsl(0 0% 100%) 0%, hsl(220 10% 97%) 100%)',
            // Metallic accent gradient
            accent: 'linear-gradient(135deg, hsl(220 20% 94%) 0%, hsl(220 15% 88%) 100%)',
        },
        dark: {
            // Bright chrome/silver gradient for dark mode primary
            primary: 'linear-gradient(135deg, hsl(220 10% 90%) 0%, hsl(220 5% 75%) 100%)',
            // Deep obsidian sheen for background
            background: 'linear-gradient(to bottom right, hsl(220 15% 9%), hsl(220 15% 6%))',
            // Deep metallic sidebar header
            sidebarHeader: 'linear-gradient(135deg, hsl(220 15% 10%) 0%, hsl(220 12% 7%) 100%)',
            // Dark matte sidebar
            sidebar: 'linear-gradient(to bottom, hsl(220 15% 7%) 0%, hsl(220 15% 5%) 100%)',
            // Dark brushed metal card effect
            card: 'linear-gradient(145deg, hsl(220 10% 15%) 0%, hsl(220 10% 11%) 100%)',
            // Dark steel accent
            accent: 'linear-gradient(135deg, hsl(220 10% 22%) 0%, hsl(220 10% 18%) 100%)',
        }
    },
    shaders: {
        dark: {
            mainBackground: 'aurora-veil',
        },
    },
};

export default defaultTheme;
