/**
 * TextInput - Stateless text input primitive
 * Used by TextField and RelationDialogField.
 */

import { Input } from '@/components/ui/input';

export interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    onBlur?: () => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function TextInput({
    value,
    onChange,
    placeholder,
    className,
    disabled,
    autoFocus,
    onBlur,
    onKeyDown,
}: TextInputProps) {
    return (
        <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={className}
            disabled={disabled}
            autoFocus={autoFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
        />
    );
}
