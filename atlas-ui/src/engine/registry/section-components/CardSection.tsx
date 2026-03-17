import type { SectionComponentProps } from '../component-registry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { testIds } from '../../utils/testIdUtils';

export function CardSection({ schema, children }: SectionComponentProps) {
    return (
        <Card data-testid={testIds.section(schema.id)}>
            {schema.title && (
                <CardHeader>
                    <CardTitle className="text-base">{schema.title}</CardTitle>
                    {schema.description && (
                        <CardDescription>{schema.description}</CardDescription>
                    )}
                </CardHeader>
            )}
            <CardContent className="space-y-4">{children}</CardContent>
        </Card>
    );
}

