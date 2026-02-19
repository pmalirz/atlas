import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { FieldComponentProps } from '../component-registry';

interface RelationValue {
    id: string;
    displayName?: string;
    name?: string;
}

export function RelationField({
    value,
    fieldSchema,
    readonly
}: FieldComponentProps<RelationValue | RelationValue[]>) {
    if (!value) {
        return <span className="text-muted-foreground">—</span>;
    }

    // Handle array of relations
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return <span className="text-muted-foreground">—</span>;
        }

        return (
            <div className="flex flex-wrap gap-1">
                {value.map((item, index) => (
                    <RelationLink key={item.id || index} item={item} fieldSchema={fieldSchema} />
                ))}
            </div>
        );
    }

    // Handle single relation
    return <RelationLink item={value} fieldSchema={fieldSchema} />;
}

interface RelationLinkProps {
    item: RelationValue;
    fieldSchema: { key: string; type: string; displayName: string };
}

function RelationLink({ item, fieldSchema }: RelationLinkProps) {
    const label = item.displayName || item.name || item.id;

    // Extract entity type from field schema or key
    // e.g., "ownerApp" -> "application", "interfaces" -> "interface"
    const entityType = fieldSchema.type?.replace('relation:', '') ||
        fieldSchema.key.replace(/s$/, '').toLowerCase();

    return (
        <Link
            to={`/${entityType}/${item.id}`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
            {label}
            <ExternalLink className="h-3 w-3" />
        </Link>
    );
}
