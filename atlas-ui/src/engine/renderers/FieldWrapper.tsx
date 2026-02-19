import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { testIds } from '../utils/testIdUtils';

interface FieldWrapperProps {
    fieldKey: string;
    sectionId?: string;
    label: string;
    required?: boolean;
    className?: string;
    children: React.ReactNode;
}

/**
 * FieldWrapper
 *
 * Standard wrapper for all field types.
 * Handles the container div with grid classes, test ID, and the field label.
 */
export function FieldWrapper({
    fieldKey,
    sectionId,
    label,
    required,
    className,
    children
}: FieldWrapperProps) {
    return (
        <div className={cn(className, 'atlas-field')} data-testid={testIds.field(sectionId, fieldKey)}>
            <Label className={cn('atlas-field-label', required && 'atlas-field-label--required')}>
                {label}
            </Label>
            {children}
        </div>
    );
}
