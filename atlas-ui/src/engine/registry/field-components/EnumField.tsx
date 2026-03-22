import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { FieldComponentProps } from '../component-registry';
import { ReadOnlyField } from './shared/ReadOnlyField';
import { useAllowedTransitions } from '@/hooks/useWorkflows';

export function EnumField({
    value,
    onChange,
    fieldSchema,
    placement,
    valueStyles,
    readonly,
    disabled,
    entityContext
}: FieldComponentProps<string>) {
    // Determine allowed transitions
    const { data: allowedTransitionsMap } = useAllowedTransitions(entityContext?.type, entityContext?.id);
    const allowedForField = allowedTransitionsMap?.[fieldSchema.key];

    // Options filtered by workflow restrictions. Ensure current value is always visible 
    // so we don't break the UI rendering if it's not a valid 'To' state anymore.
    const rawOptions = fieldSchema.options ?? [];
    const options = allowedForField && !readonly
        ? rawOptions.filter(o => allowedForField.includes(o.key) || o.key === value)
        : rawOptions;

    // Get style for current value
    const currentStyle = value ? valueStyles?.[value] : undefined;

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
        if (!value) {
            return (
                <ReadOnlyField>
                    <span className="text-muted-foreground">—</span>
                </ReadOnlyField>
            );
        }

        const label = currentStyle?.label || getLabel(value);

        return (
            <ReadOnlyField>
                {currentStyle ? (
                    <Badge className={currentStyle.color} title={currentStyle.description}>
                        {currentStyle.label || label}
                    </Badge>
                ) : (
                    <span>{label}</span>
                )}
            </ReadOnlyField>
        );
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
