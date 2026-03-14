import { useState } from 'react';
import { NumberInput } from './inputs';
import type { FieldComponentProps } from '../component-registry';
import { ReadOnlyField } from './shared/ReadOnlyField';

export function NumberField({
    value,
    onChange,
    fieldSchema,
    readonly,
    disabled
}: FieldComponentProps<number>) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<number | undefined>(value);

    if (readonly) {
        return (
            <ReadOnlyField>
                {value ?? '—'}
            </ReadOnlyField>
        );
    }

    if (!editing) {
        return (
            <button
                type="button"
                onClick={() => !disabled && setEditing(true)}
                disabled={disabled}
                className="text-left hover:bg-accent/50 rounded px-2 py-1 -mx-2 -my-1 w-full disabled:opacity-50"
            >
                {value !== undefined && value !== null ? (
                    String(value)
                ) : (
                    <span className="text-muted-foreground italic">Click to edit</span>
                )}
            </button>
        );
    }

    const isDecimal = fieldSchema.type === 'decimal';
    const step = isDecimal ? 'any' : '1';

    const commitValue = () => {
        onChange(draft as number);
        setEditing(false);
    };

    const cancelEdit = () => {
        setDraft(value);
        setEditing(false);
    };

    return (
        <NumberInput
            value={draft}
            onChange={setDraft}
            step={step}
            placeholder={fieldSchema.displayName}
            autoFocus
            onBlur={commitValue}
            onKeyDown={(e) => {
                if (e.key === 'Enter') commitValue();
                if (e.key === 'Escape') cancelEdit();
            }}
        />
    );
}
