/**
 * Violet Dream Theme
 *
 * A soft, elegant violet theme with gentle purple tones.
 */

import { AtlasTheme } from '../types';

const violetDream: AtlasTheme = {
    id: 'violet-dream',
    name: 'Violet Dream',
    description: 'Soft and elegant violet tones',

    colors: {
        light: {
            background: '270 30% 98%',
            foreground: '270 20% 15%',

            card: '0 0% 100%',
            cardForeground: '270 20% 15%',

            popover: '0 0% 100%',
            popoverForeground: '270 20% 15%',

            primary: '270 60% 55%',
            primaryForeground: '270 100% 98%',

            secondary: '280 20% 92%',
            secondaryForeground: '270 20% 20%',

            muted: '270 20% 94%',
            mutedForeground: '270 15% 45%',

            accent: '280 40% 94%',
            accentForeground: '270 60% 45%',

            destructive: '0 72% 50%',
            destructiveForeground: '0 85% 97%',

            border: '270 20% 88%',
            input: '270 20% 88%',
            ring: '270 60% 55%',

            sidebarBackground: '270 25% 96%',
            sidebarForeground: '270 20% 15%',
            sidebarPrimary: '270 60% 55%',
            sidebarPrimaryForeground: '270 100% 98%',
            sidebarAccent: '280 30% 90%',
            sidebarAccentForeground: '270 20% 20%',
            sidebarBorder: '270 20% 88%',
            sidebarRing: '270 60% 55%',

            star: '45 93% 58%',
            starForeground: '45 93% 47%',
        },

        dark: {
            background: '270 20% 10%',
            foreground: '270 10% 95%',

            card: '270 15% 15%',
            cardForeground: '270 10% 95%',

            popover: '270 15% 18%',
            popoverForeground: '270 10% 95%',

            primary: '270 70% 65%',
            primaryForeground: '270 30% 10%',

            secondary: '270 15% 20%',
            secondaryForeground: '270 10% 95%',

            muted: '270 15% 25%',
            mutedForeground: '270 10% 70%',

            accent: '280 40% 25%',
            accentForeground: '270 70% 75%',

            destructive: '0 62% 40%',
            destructiveForeground: '0 85% 97%',

            border: '270 15% 25%',
            input: '270 15% 25%',
            ring: '270 70% 65%',

            sidebarBackground: '270 20% 8%',
            sidebarForeground: '270 10% 95%',
            sidebarPrimary: '270 70% 65%',
            sidebarPrimaryForeground: '270 30% 10%',
            sidebarAccent: '280 30% 20%',
            sidebarAccentForeground: '270 10% 95%',
            sidebarBorder: '270 15% 20%',
            sidebarRing: '270 70% 65%',

            star: '280 80% 70%',
            starForeground: '280 80% 60%',
        },
    },

    sizing: {
        radius: '0.5rem',
    },

    shadows: {
        '2xs': '0 1px 2px 0px hsl(270 30% 50% / 0.03)',
        xs: '0 1px 2px 0px hsl(270 30% 50% / 0.05)',
        sm: '0 1px 3px 0px hsl(270 30% 50% / 0.08), 0 1px 2px -1px hsl(270 30% 50% / 0.08)',
        md: '0 4px 6px -1px hsl(270 30% 50% / 0.08), 0 2px 4px -2px hsl(270 30% 50% / 0.08)',
        lg: '0 10px 15px -3px hsl(270 30% 50% / 0.08), 0 4px 6px -4px hsl(270 30% 50% / 0.08)',
        xl: '0 20px 25px -5px hsl(270 30% 50% / 0.1), 0 8px 10px -6px hsl(270 30% 50% / 0.1)',
        '2xl': '0 25px 50px -12px hsl(270 30% 50% / 0.2)',
    },

    gradients: {
        light: {
            // Vibrant violet-to-magenta gradient for primary buttons
            primary: 'linear-gradient(135deg, hsl(270 65% 55%) 0%, hsl(300 55% 55%) 100%)',
            // Soft background gradient with subtle violet wash
            background: 'linear-gradient(180deg, hsl(270 40% 99%) 0%, hsl(280 30% 96%) 50%, hsl(260 25% 97%) 100%)',
            // Accent gradient for highlights
            accent: 'linear-gradient(135deg, hsl(280 50% 92%) 0%, hsl(260 45% 90%) 100%)',
            // Sidebar gradient with violet tint
            sidebar: 'linear-gradient(180deg, hsl(270 30% 97%) 0%, hsl(280 25% 94%) 100%)',
            // Card gradient - subtle border glow effect            
            card: 'linear-gradient(145deg, hsl(270 30% 100%) 0%, hsl(280 40% 95%) 100%)',
            // Sidebar header gradient - soft violet breeze
            sidebarHeader: 'linear-gradient(to right, hsl(270 50% 95%), hsl(280 40% 92%))'
        },
        dark: {
            // Rich violet gradient for dark mode primary
            primary: 'linear-gradient(135deg, hsl(270 75% 60%) 0%, hsl(300 65% 50%) 100%)',
            // Dark background with deep violet undertones
            background: 'linear-gradient(180deg, hsl(270 25% 10%) 0%, hsl(280 20% 7%) 50%, hsl(260 22% 9%) 100%)',
            // Dark accent gradient
            accent: 'linear-gradient(135deg, hsl(280 45% 28%) 0%, hsl(260 40% 22%) 100%)',
            // Dark sidebar gradient
            sidebar: 'linear-gradient(180deg, hsl(270 25% 7%) 0%, hsl(280 22% 5%) 100%)',
            // Dark card gradient
            card: 'linear-gradient(145deg, hsl(270 18% 16%) 0%, hsl(280 15% 13%) 100%)',
            // Dark sidebar header gradient - deep violet depth
            sidebarHeader: 'linear-gradient(to right, hsl(270 25% 12%), hsl(280 20% 10%))'
        },
    },
};

export default violetDream;

