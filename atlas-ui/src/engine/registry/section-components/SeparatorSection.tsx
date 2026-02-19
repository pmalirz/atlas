import { Separator } from '@/components/ui/separator';
import type { SectionComponentProps } from '../component-registry';

export function SeparatorSection({ schema, children }: SectionComponentProps) {
    return (
        <div className="py-6">
            {schema.title && (
                <div className="flex items-center gap-4 mb-4">
                    <Separator className="flex-1" />
                    <span className="text-sm text-muted-foreground font-medium">
                        {schema.title}
                    </span>
                    <Separator className="flex-1" />
                </div>
            )}
            {children}
        </div>
    );
}
