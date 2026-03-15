import { Switch } from '@/components/ui/switch';
import type { FieldComponentProps } from '../component-registry';
import { ReadOnlyField } from './shared/ReadOnlyField';

export function BooleanField({
    value,
    onChange,
    readonly,
    disabled
}: FieldComponentProps<boolean>) {
    if (readonly) {
        return (
            <ReadOnlyField>
                {value ? 'Yes' : 'No'}
            </ReadOnlyField>
        );
    }

    return (
        <div>
            <Switch
                checked={value ?? false}
                onCheckedChange={onChange}
                disabled={disabled}
            />
        </div>
    );
}
