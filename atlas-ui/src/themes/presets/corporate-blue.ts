/**
 * Corporate Blue Theme
 *
 * A professional blue-toned theme suitable for enterprise environments.
 */

import { AtlasTheme } from '../types';

const corporateBlue: AtlasTheme = {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Professional blue theme for enterprise use',

    colors: {
        light: {
            background: '210 20% 98%',
            foreground: '222 47% 11%',

            card: '0 0% 100%',
            cardForeground: '222 47% 11%',

            popover: '0 0% 100%',
            popoverForeground: '222 47% 11%',

            primary: '221 83% 53%',
            primaryForeground: '210 40% 98%',

            secondary: '210 40% 96%',
            secondaryForeground: '222 47% 11%',

            muted: '210 40% 96%',
            mutedForeground: '215 16% 47%',

            accent: '210 40% 96%',
            accentForeground: '222 47% 11%',

            destructive: '0 84% 60%',
            destructiveForeground: '210 40% 98%',

            border: '214 32% 91%',
            input: '214 32% 91%',
            ring: '221 83% 53%',

            sidebarBackground: '210 30% 96%',
            sidebarForeground: '222 47% 11%',
            sidebarPrimary: '221 83% 53%',
            sidebarPrimaryForeground: '210 40% 98%',
            sidebarAccent: '210 40% 90%',
            sidebarAccentForeground: '222 47% 11%',
            sidebarBorder: '214 32% 88%',
            sidebarRing: '221 83% 53%',

            star: '45 93% 58%',
            starForeground: '45 93% 47%',
        },

        dark: {
            background: '222 47% 11%',
            foreground: '210 40% 98%',

            card: '217 33% 17%',
            cardForeground: '210 40% 98%',

            popover: '217 33% 17%',
            popoverForeground: '210 40% 98%',

            primary: '217 91% 60%',
            primaryForeground: '222 47% 11%',

            secondary: '217 33% 17%',
            secondaryForeground: '210 40% 98%',

            muted: '217 33% 17%',
            mutedForeground: '215 20% 65%',

            accent: '217 33% 17%',
            accentForeground: '210 40% 98%',

            destructive: '0 62% 30%',
            destructiveForeground: '210 40% 98%',

            border: '217 33% 17%',
            input: '217 33% 17%',
            ring: '224 76% 48%',

            sidebarBackground: '222 47% 8%',
            sidebarForeground: '210 40% 98%',
            sidebarPrimary: '217 91% 60%',
            sidebarPrimaryForeground: '222 47% 11%',
            sidebarAccent: '217 33% 17%',
            sidebarAccentForeground: '210 40% 98%',
            sidebarBorder: '217 33% 20%',
            sidebarRing: '217 91% 60%',

            star: '217 91% 70%',
            starForeground: '217 91% 60%',
        },
    },

    sizing: {
        radius: '0.375rem',
    },

    shadows: {
        '2xs': '0 1px 2px 0px hsl(0 0% 0% / 0.03)',
        xs: '0 1px 2px 0px hsl(0 0% 0% / 0.05)',
        sm: '0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1)',
        md: '0 4px 6px -1px hsl(0 0% 0% / 0.1), 0 2px 4px -2px hsl(0 0% 0% / 0.1)',
        lg: '0 10px 15px -3px hsl(0 0% 0% / 0.1), 0 4px 6px -4px hsl(0 0% 0% / 0.1)',
        xl: '0 20px 25px -5px hsl(0 0% 0% / 0.1), 0 8px 10px -6px hsl(0 0% 0% / 0.1)',
        '2xl': '0 25px 50px -12px hsl(0 0% 0% / 0.25)',
    },
    gradients: {    
        light: {
            background: 'linear-gradient(to bottom right, hsl(210 20% 98%), hsl(210, 51%, 86%))',
            sidebarHeader: 'linear-gradient(to right, hsl(209, 100%, 95%), hsl(210 20% 94%))',
        },
        dark: {
            background: 'linear-gradient(to bottom right, hsl(222 47% 11%), hsl(222 47% 8%))',
            sidebarHeader: 'linear-gradient(to right, hsl(210 25% 12%), hsl(210 25% 10%))',
        },
    },
};

export default corporateBlue;
