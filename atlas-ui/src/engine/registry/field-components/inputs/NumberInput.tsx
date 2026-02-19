/**
 * NumberInput - Stateless number input primitive
 * Supports integer and decimal types with min/max validation.
 * Used by NumberField and RelationDialogField.
 */

import { Input } from '@/components/ui/input';

export interface NumberInputProps {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    /** Step for input: '1' for integer, '0.01' or 'any' for decimal */
    step?: string;
    min?: number;
    max?: number;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    onBlur?: () => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    'data-testid'?: string;
}


export function NumberInput({
    value,
    onChange,
    step = '1',
    min,
    max,
    placeholder,
    className,
    disabled,
    autoFocus,
    onBlur,
    onKeyDown,
    'data-testid': testId,
}: NumberInputProps) {
    const isDecimal = step !== '1';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '') {
            onChange(undefined);
        } else {
            const num = isDecimal ? parseFloat(val) : parseInt(val, 10);
            onChange(isNaN(num) ? undefined : num);
        }
    };

    return (
        <Input
            type="number"
            step={step}
            min={min}
            max={max}
            value={value !== undefined ? String(value) : ''}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
            disabled={disabled}
            autoFocus={autoFocus}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            data-testid={testId}
        />
    );
}
