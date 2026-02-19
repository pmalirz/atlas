import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { FieldComponentProps } from '../component-registry';

export function EnumField({
    value,
    onChange,
    fieldSchema,
    placement,
    valueStyles,
    readonly,
    disabled
}: FieldComponentProps<string>) {
    const options = fieldSchema.options ?? [];

    // Get style for current value
    const currentStyle = value && valueStyles?.[value];

    /**
     * Get display label with fallback priority:
     * 1. valueStyles[val].label (UI config override)
     * 2. option.displayName (from type definition)
     * 3. option.key (raw value)
     */
    const getLabel = (val: string) => {
        if (valueStyles?.[val]?.label) return valueStyles[val].label;
        const option = options.find(o => o.key === val);
        return option?.displayName ?? val;
    };

    if (readonly) {
        if (!value) return <span className="text-muted-foreground">—</span>;

        if (currentStyle) {
            return (
                <Badge
                    className={currentStyle.color}
                    title={currentStyle.description}
                >
                    {currentStyle.label || getLabel(value)}
                </Badge>
            );
        }

        return <Badge variant="secondary">{getLabel(value)}</Badge>;
    }

    // Edit mode - use shadcn Select directly (EnumSelect is for simpler cases)
    // EnumField has more complex rendering with valueStyles color dots
    return (
        <Select
            value={value ?? ''}
            onValueChange={onChange}
            disabled={disabled}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placement.placeholder ?? `Select ${fieldSchema.displayName}`}>
                    {value && (
                        currentStyle ? (
                            <span className="flex items-center gap-2">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: currentStyle.color?.split(' ')[0]?.replace('bg-', '') }}
                                />
                                {currentStyle.label || getLabel(value)}
                            </span>
                        ) : (
                            getLabel(value)
                        )
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => {
                    const style = valueStyles?.[option.key];
                    return (
                        <SelectItem key={option.key} value={option.key}>
                            {style ? (
                                <span className="flex items-center gap-2">
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: style.color?.split(' ')[0]?.replace('bg-', '') }}
                                    />
                                    {style.label || getLabel(option.key)}
                                </span>
                            ) : (
                                getLabel(option.key)
                            )}
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
}
