import { cn } from '@/lib/utils';
import type { LayoutComponentProps } from '../component-registry';

export function GridLayout({ layout, children }: LayoutComponentProps) {
    const { columns, gap = 6, responsive } = layout;

    const gridClasses = cn(
        'grid',
        `gap-${gap}`,
        // Default columns for different breakpoints
        `grid-cols-${responsive?.sm ?? 1}`,
        `md:grid-cols-${responsive?.md ?? columns}`,
        `lg:grid-cols-${responsive?.lg ?? columns}`,
    );

    return <div className={gridClasses}>{children}</div>;
}
