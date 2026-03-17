import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';

export function AppLayout() {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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

                <main id="atlas-main-content" className="flex-1 overflow-auto animate-in fade-in duration-200">
                    <div className="atlas-content container mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

