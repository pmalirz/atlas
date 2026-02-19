import { Switch } from '@/components/ui/switch';
import type { FieldComponentProps } from '../component-registry';

export function BooleanField({
    value,
    onChange,
    readonly,
    disabled
}: FieldComponentProps<boolean>) {
    if (readonly) {
        return (
            <span className="text-foreground">
                {value ? 'Yes' : 'No'}
            </span>
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
