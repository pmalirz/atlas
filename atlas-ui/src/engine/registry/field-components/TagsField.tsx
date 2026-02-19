import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { FieldComponentProps } from '../component-registry';

export function TagsField({
    value,
    onChange,
    fieldSchema,
    readonly,
    disabled
}: FieldComponentProps<string[]>) {
    const [inputValue, setInputValue] = useState('');
    const tags = value ?? [];

    const addTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }
        setInputValue('');
    };

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter((t) => t !== tagToRemove));
    };

    if (readonly) {
        if (tags.length === 0) {
            return <span className="text-muted-foreground">—</span>;
        }

        return (
            <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                        {tag}
                    </Badge>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Tag list */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="hover:text-destructive"
                                disabled={disabled}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Input for new tag */}
            <div className="flex gap-2">
                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag(inputValue);
                        }
                    }}
                    placeholder={`Add ${fieldSchema.displayName.toLowerCase()}`}
                    disabled={disabled}
                    className="flex-1"
                />
                <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => addTag(inputValue)}
                    disabled={disabled || !inputValue.trim()}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
