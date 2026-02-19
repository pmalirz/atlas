/**
 * ThemeSwitcher Component
 *
 * Provides a light/dark mode toggle and theme selector for the sidebar.
 */

import { Moon, Sun, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAtlasTheme } from '@/themes';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export function ThemeSwitcher() {
    const { resolvedTheme, setTheme: setColorMode } = useTheme();
    const { currentTheme, availableThemes, setTheme } = useAtlasTheme();

    const isDark = resolvedTheme === 'dark';

    const toggleColorMode = () => {
        setColorMode(isDark ? 'light' : 'dark');
    };

    return (
        <div className="p-3 border-t border-sidebar-border space-y-3">
            {/* Theme Selector */}
            <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-sidebar-foreground/60 flex-shrink-0" />
                <Select value={currentTheme.id} onValueChange={setTheme}>
                    <SelectTrigger className="h-8 text-xs bg-transparent border-sidebar-border text-sidebar-foreground">
                        <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableThemes.map((theme) => (
                            <SelectItem key={theme.id} value={theme.id}>
                                {theme.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Light/Dark Toggle */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-sidebar-foreground/60">
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleColorMode}
                    className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                    {isDark ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle color mode</span>
                </Button>
            </div>
        </div>
    );
}
