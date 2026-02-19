import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { SectionComponentProps } from '../component-registry';
import { cn } from '@/lib/utils';
import { testIds } from '../../utils/testIdUtils';

export function CollapsibleSection({ schema, children }: SectionComponentProps) {
    const [open, setOpen] = useState(true);

    return (
        <div className="atlas-section atlas-section--collapsible" data-testid={testIds.section(schema.id)}>
            <Collapsible open={open} onOpenChange={setOpen}>
                <CollapsibleTrigger className="w-full">
                    <div className="atlas-section-header cursor-pointer hover:bg-muted/50 transition-colors -m-4 p-4 rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="atlas-section-title">{schema.title}</h3>
                                {schema.description && (
                                    <span className="atlas-section-description hidden sm:inline">
                                        — {schema.description}
                                    </span>
                                )}
                            </div>
                            <ChevronDown
                                className={cn(
                                    "h-5 w-5 text-muted-foreground transition-transform",
                                    open && "rotate-180"
                                )}
                            />
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="atlas-section-content pt-4">{children}</div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}

