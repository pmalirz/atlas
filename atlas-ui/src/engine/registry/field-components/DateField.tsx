import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { FieldComponentProps } from '../component-registry';
import { cn, formatDate } from '@/lib/utils';
import { ReadOnlyField } from './shared/ReadOnlyField';

export function DateField({
    value,
    onChange,
    fieldSchema,
    readonly,
    disabled
}: FieldComponentProps<string | Date>) {
    const [open, setOpen] = useState(false);

    // Convert value to Date object
    const dateValue = value ? (typeof value === 'string' ? new Date(value) : value) : undefined;
    const isValidDate = dateValue && !isNaN(dateValue.getTime());

    if (readonly) {
        return (
            <ReadOnlyField>
                {isValidDate ? formatDate(dateValue) : '—'}
            </ReadOnlyField>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateValue && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {isValidDate ? format(dateValue, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={isValidDate ? dateValue : undefined}
                    onSelect={(date) => {
                        onChange(date?.toISOString() ?? '');
                        setOpen(false);
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}
