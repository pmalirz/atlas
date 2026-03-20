import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { ThemeShaderBackground } from '@/components/ui/theme-shader-background';
import { cn } from '@/lib/utils';
import { useAtlasTheme } from '@/themes';
import { getShaderPreset } from '@/themes/shaders';
import { Sidebar } from './Sidebar';

export function AppLayout() {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const { resolvedTheme } = useTheme();
    const { currentTheme } = useAtlasTheme();

    const colorMode = resolvedTheme === 'dark' ? 'dark' : 'light';
    const mainShaderId = currentTheme.shaders?.[colorMode]?.mainBackground;
    const mainShader = mainShaderId ? getShaderPreset(mainShaderId) : undefined;

    const closeMobileNav = () => {
        setIsMobileNavOpen(false);
    };

    return (
        <div className="atlas-page flex min-h-screen">
            <a
                href="#atlas-main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md"
            >
                Skip to main content
            </a>

            <aside className="hidden md:flex md:w-64 md:shrink-0">
                <Sidebar className="w-64" />
            </aside>

            <button
                type="button"
                className={cn(
                    'fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden',
                    isMobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
                onClick={closeMobileNav}
                aria-label="Close navigation menu"
                aria-hidden={!isMobileNavOpen}
            />

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 ease-out md:hidden',
                    isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
                )}
                aria-hidden={!isMobileNavOpen}
            >
                <Sidebar
                    className="h-full w-64"
                    onNavigate={closeMobileNav}
                    onRequestClose={closeMobileNav}
                    showMobileClose
                    data-testid="mobile-sidebar"
                />
            </aside>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="atlas-header flex items-center justify-between gap-3 md:hidden">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileNavOpen(true)}
                        aria-label="Open navigation"
                        data-testid="mobile-nav-open-btn"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <span className="text-base font-semibold">Atlas</span>
                    <div className="w-10" aria-hidden="true" />
                </header>

                <main id="atlas-main-content" className="relative flex-1 overflow-auto animate-in fade-in duration-200">
                    {mainShader ? (
                        <ThemeShaderBackground
                            shader={mainShader}
                            className="absolute inset-0 z-0 opacity-90"
                        />
                    ) : null}

                    <div className="atlas-content container relative z-10 mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

