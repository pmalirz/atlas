import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldComponentProps } from '../component-registry';
import { ReadOnlyField } from './shared/ReadOnlyField';

// Default labels for 1-5 scale if not provided
const DEFAULT_LABELS: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Excellent',
    5: 'Outstanding'
};

export function StarRatingField({
    value = 0,
    onChange,
    fieldSchema,
    readonly,
    disabled
}: FieldComponentProps<number>) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    // Get max from validation or default to 5
    const max = fieldSchema.validation?.max ?? 5;

    // Labels could ideally come from schema, but for now we use defaults for 1-5 scale
    const labels = DEFAULT_LABELS;

    const displayValue = hoverValue ?? value ?? 0;

    const handleMouseEnter = (index: number) => {
        if (!readonly && !disabled) {
            setHoverValue(index);
        }
    };

    const handleMouseLeave = () => {
        if (!readonly && !disabled) {
            setHoverValue(null);
        }
    };

    const handleClick = (index: number) => {
        if (!readonly && !disabled) {
            onChange(index);
        }
    };

    if (readonly) {
        return (
            <ReadOnlyField className="gap-1">
                {Array.from({ length: max }).map((_, i) => {
                    const index = i + 1;
                    const isFilled = index <= value;

                    return (
                        <Star
                            key={index}
                            className={cn(
                                "h-5 w-5",
                                isFilled
                                    ? "fill-[hsl(var(--star))] text-[hsl(var(--star-foreground))]"
                                    : "text-muted-foreground/30"
                            )}
                        />
                    );
                })}
                {(labels && value > 0) && (
                    <span className="ml-2 text-muted-foreground">{labels[value]}</span>
                )}
            </ReadOnlyField>
        );
    }

    return (
        <div className="flex flex-col items-start gap-2">
            <div
                className="flex items-center gap-1"
                onMouseLeave={handleMouseLeave}
            >
                {Array.from({ length: max }).map((_, i) => {
                    const index = i + 1;
                    const isFilled = index <= displayValue;

                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleClick(index)}
                            onMouseEnter={() => handleMouseEnter(index)}
                            className={cn(
                                "focus:outline-none transition-transform",
                                !readonly && !disabled && "hover:scale-110 cursor-pointer",
                                (readonly || disabled) && "cursor-default opacity-80"
                            )}
                            disabled={readonly || disabled}
                            aria-label={`${index} stars`}
                            title={labels[index]}
                        >
                            <Star
                                className={cn(
                                    "h-5 w-5 transition-colors",
                                    isFilled
                                        ? "fill-[hsl(var(--star))] text-[hsl(var(--star-foreground))]"
                                        : "text-muted-foreground/30"
                                )}
                            />
                        </button>
                    );
                })}
            </div>
            {(labels && displayValue > 0) && (
                <span className="text-sm font-medium text-muted-foreground">
                    {labels[displayValue]}
                </span>
            )}
        </div>
    );
}
