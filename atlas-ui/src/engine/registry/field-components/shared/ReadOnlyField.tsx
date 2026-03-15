import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ReadOnlyFieldProps {
    children: ReactNode;
    className?: string;
    multiline?: boolean;
}

export function ReadOnlyField({ children, className, multiline = false }: ReadOnlyFieldProps) {
    return (
        <div
            className={cn(
                'w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground',
                multiline ? 'min-h-10' : 'min-h-10 flex items-center',
                className
            )}
            aria-readonly="true"
        >
            {children}
        </div>
    );
}
