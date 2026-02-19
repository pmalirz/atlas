/**
 * EnumSelect - Stateless select primitive for enum options
 * Used by EnumField and RelationDialogField.
 */

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface EnumOption {
    key: string;
    /** Display name for the option (optional, defaults to key) */
    displayName?: string;
    /** Description/tooltip for the option (optional) */
    description?: string;
}

export interface EnumSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: EnumOption[];
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
    disabled?: boolean;
    'data-testid'?: string;
}


export function EnumSelect({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    className,
    triggerClassName,
    disabled,
    'data-testid': testId,
}: EnumSelectProps) {
    const getLabel = (option: EnumOption) => option.displayName || option.key;

    return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={triggerClassName} data-testid={testId}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className={className}>
                {options.map((option) => (
                    <SelectItem
                        key={option.key}
                        value={option.key}
                        title={option.description}
                    >
                        {getLabel(option)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
