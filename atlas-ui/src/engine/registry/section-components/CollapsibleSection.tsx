import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SectionComponentProps } from '../component-registry';
import { cn } from '@/lib/utils';
import { testIds } from '../../utils/testIdUtils';

export function CollapsibleSection({ schema, children }: SectionComponentProps) {
    const [open, setOpen] = useState(true);

    return (
        <Card data-testid={testIds.section(schema.id)}>
            <button
                type="button"
                className="w-full text-left"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
            >
                <CardHeader className="cursor-pointer rounded-t-lg transition-colors hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{schema.title}</CardTitle>
                            {schema.description && (
                                <CardDescription className="hidden sm:inline">
                                    — {schema.description}
                                </CardDescription>
                            )}
                        </div>
                        <ChevronDown
                            className={cn(
                                "h-5 w-5 text-muted-foreground transition-transform",
                                open && "rotate-180"
                            )}
                        />
                    </div>
                </CardHeader>
            </button>

            {open && <CardContent className="space-y-4 pt-0">{children}</CardContent>}
        </Card>
    );
}

