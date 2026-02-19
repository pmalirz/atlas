import type { SectionComponentProps } from '../component-registry';
import { testIds } from '../../utils/testIdUtils';

export function CardSection({ schema, children }: SectionComponentProps) {
    return (
        <div className="atlas-section" data-testid={testIds.section(schema.id)}>
            {schema.title && (
                <div className="atlas-section-header">
                    <h3 className="atlas-section-title">{schema.title}</h3>
                    {schema.description && (
                        <p className="atlas-section-description">{schema.description}</p>
                    )}
                </div>
            )}
            <div className="atlas-section-content">{children}</div>
        </div>
    );
}

