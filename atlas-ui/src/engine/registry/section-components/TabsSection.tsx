import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import type { SectionComponentProps } from '../component-registry';
import type { SectionSchema } from '../../schema/types';
import React from 'react';
import { testIds } from '../../utils/testIdUtils';

interface TabsSectionProps extends Omit<SectionComponentProps, 'children'> {
    tabs: TabDefinition[];
    children?: React.ReactNode;
}

interface TabDefinition {
    id: string;
    label: string;
    content: React.ReactNode;
}

/**
 * TabsSection
 * 
 * For use with TabsSection, pass tabs as children in format:
 * <TabsSection schema={schema} tabs={[{ id, label, content }]} />
 * 
 * Or use as a wrapper with children for simple tabbed content.
 */
export function TabsSection({ schema, tabs, children }: TabsSectionProps) {
    // If no tabs provided, render as simple card
    if (!tabs || tabs.length === 0) {
        return (
            <Card data-testid={testIds.section(schema.id)}>
                {schema.title && (
                    <div className="p-6 pb-4">
                        <h3 className="text-lg font-semibold">{schema.title}</h3>
                        {schema.description && (
                            <p className="text-sm text-muted-foreground">{schema.description}</p>
                        )}
                    </div>
                )}
                <CardContent>{children}</CardContent>
            </Card>
        );
    }

    return (
        <Card data-testid={testIds.section(schema.id)}>
            {schema.title && (
                <div className="p-6 pb-4">
                    <h3 className="text-lg font-semibold">{schema.title}</h3>
                    {schema.description && (
                        <p className="text-sm text-muted-foreground">{schema.description}</p>
                    )}
                </div>
            )}
            <CardContent className="pt-0">
                <Tabs defaultValue={tabs[0]?.id}>
                    <TabsList className="w-full justify-start">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                data-testid={testIds.tab(schema.id, tab.id)}
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {tabs.map((tab) => (
                        <TabsContent key={tab.id} value={tab.id} className="mt-4">
                            {tab.content}
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}

// Adapter for usage with standard SectionComponentProps
export function TabsSectionAdapter({ schema, children }: SectionComponentProps) {
    // Simple wrapper when used as standard section
    return (
        <TabsSection schema={schema} tabs={[]}>
            {children}
        </TabsSection>
    );
}
