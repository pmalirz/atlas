import { useState } from 'react';
import { TextInput } from './inputs';
import type { FieldComponentProps } from '../component-registry';
import { ReadOnlyField } from './shared/ReadOnlyField';

export function TextField({
    value,
    onChange,
    fieldSchema,
    readonly
}: FieldComponentProps<string>) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value ?? '');

    if (readonly) {
        return (
            <ReadOnlyField multiline>
                {value || '—'}
            </ReadOnlyField>
        );
    }

    if (!editing) {
        return (
            <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-left hover:bg-accent/50 rounded px-2 py-1 -mx-2 -my-1 w-full"
            >
                {value || <span className="text-muted-foreground italic">Click to edit</span>}
            </button>
        );
    }

    const commitValue = () => {
        onChange(draft);
        setEditing(false);
    };

    const cancelEdit = () => {
        setDraft(value ?? '');
        setEditing(false);
    };

    return (
        <TextInput
            value={draft}
            onChange={setDraft}
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
