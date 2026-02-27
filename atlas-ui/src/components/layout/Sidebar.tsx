import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { menuConfigApi } from '@/api/ui-schema.api';
import { cn, toLucideIcon } from '@/lib/utils';
import { LayoutDashboard, LogOut, User } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useAuth, useTenant } from '@/auth';
import { Button } from '@/components/ui/button';

export function Sidebar() {
    const { user, logout } = useAuth();
    const { slug } = useTenant();
    const { data: menuConfig, isLoading } = useQuery({
        queryKey: ['menu-config'],
        queryFn: menuConfigApi.getMenuConfig,
        staleTime: Infinity, // Menu config rarely changes
    });

    // Filter visible items
    const visibleItems = menuConfig?.items.filter((item) => item.visible) ?? [];

    const handleLogout = async () => {
        await logout();
    };

    return (
        <aside className="atlas-sidebar w-64 flex flex-col" data-testid="sidebar">
            <div className="atlas-sidebar-header">
                <h1 className="text-2xl font-bold text-sidebar-foreground font-['Tektur']">Atlas</h1>
            </div>

            <nav className="atlas-sidebar-content flex-1 space-y-1">
                <NavLink
                    to={`/${slug}`}
                    className={({ isActive }) =>
                        cn(
                            "atlas-sidebar-item",
                            isActive && "atlas-sidebar-item--active"
                        )
                    }
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                </NavLink>

                <div className="pt-4 pb-2">
                    <h2 className="px-3 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                        Entities
                    </h2>
                </div>

                {isLoading ? (
                    <div className="px-3 py-2 text-sm text-sidebar-foreground/60">Loading...</div>
                ) : (
                    visibleItems.map((item) => {
                        const Icon = toLucideIcon(item.icon);
                        return (
                            <NavLink
                                key={item.entityType}
                                to={`/${slug}/${item.entityType}`}
                                className={({ isActive }) =>
                                    cn(
                                        "atlas-sidebar-item",
                                        isActive && "atlas-sidebar-item--active"
                                    )
                                }
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.displayName}</span>
                            </NavLink>
                        );
                    })
                )}
            </nav>

            {/* User info and logout */}
            {user && (
                <div className="px-3 py-3 border-t border-sidebar-border">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                            <User className="h-4 w-4 text-sidebar-accent-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sidebar-foreground truncate">
                                {user.name || user.email}
                            </p>
                            {user.name && (
                                <p className="text-xs text-sidebar-foreground/60 truncate">
                                    {user.email}
                                </p>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground"
                        onClick={handleLogout}
                        data-testid="logout-btn"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                    </Button>
                </div>
            )}

            {/* Theme controls at bottom */}
            <ThemeSwitcher />
        </aside>
    );
}


