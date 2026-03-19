/**
 * AuthBrandingPanel — Reusable right-side branding panel for auth pages.
 *
 * Uses theme CSS variables so the panel adapts to theme and dark mode changes.
 */

import { ParticlesBackground } from '@/components/ui/particles-background';

interface AuthBrandingPanelProps {
    /** Per-page tagline displayed below the Atlas Platform heading. */
    subtitle: React.ReactNode;
}

export function AuthBrandingPanel({ subtitle }: AuthBrandingPanelProps) {
    return (
        <div
            className="hidden lg:flex relative h-full w-full items-center justify-center p-12 overflow-hidden"
            style={{ background: 'var(--gradient-background, hsl(var(--background)))' }}
            data-testid="auth-branding-panel"
        >
            {/* Solid background layer */}
            <div className="absolute inset-0 w-full h-full bg-muted/20 z-0" />

            {/* Animated Particles Background — uses theme primary color */}
            <ParticlesBackground
                className="absolute inset-0 z-0"
                particleColor="hsl(var(--primary) / 0.25)"
                lineColor="hsl(var(--primary) / 0.12)"
                particleCount={80}
            />

            {/* Subtle grid overlay */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] z-0" />

            {/* Content */}
            <div className="relative z-10 max-w-lg text-center space-y-6">
                <h2 className="text-5xl font-bold tracking-tighter text-white font-display">
                    Atlas Platform
                </h2>
                <p className="text-xl text-gray-200 font-light leading-relaxed">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}
