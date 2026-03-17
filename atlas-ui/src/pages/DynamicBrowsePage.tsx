import { useState } from 'react';
import { LayoutGrid, Table as TableIcon, Plus, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTenant } from '@/auth';
import { useRbac } from '@/auth/RbacContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TileRenderer } from '@/engine/renderers/TileRenderer';
import { TableRenderer } from '@/engine/renderers/TableRenderer';
import { useUIEntityConfig } from '@/hooks/useUIEntityConfig';
import { useEntitySchema } from '@/hooks/useEntitySchema';
import { useEntities } from '@/hooks/useEntities';
import { cn, formatLabel, sortEntities } from '@/lib/utils';
import type { SortSchema, BrowsePageSchema, TileViewSchema, TableViewSchema } from '@/engine/schema/types';

interface DynamicBrowsePageProps {
    entityType: string;
}

const LG_TILE_COLUMN_CLASSES: Record<number, string> = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
};

export function DynamicBrowsePage({ entityType }: DynamicBrowsePageProps) {
    const { slug } = useTenant();
    // Fetch UI entity config from backend
    const { config: uiConfig, loading: configLoading, error: configError } = useUIEntityConfig(entityType);

    // Fetch Entity schema from backend
    const { schema: entitySchema, loading: entitySchemaLoading, error: entitySchemaError } = useEntitySchema(entityType);

    // Fetch entities from backend
    const { entities, loading: entitiesLoading, error: entitiesError } = useEntities(entityType);

    // RBAC logic
    const { hasPermission } = useRbac();
    const canCreate = hasPermission('entity', entityType, 'create');

    const loading = configLoading || entitiesLoading || entitySchemaLoading;

    const [viewModeByEntityType, setViewModeByEntityType] = useState<Partial<Record<string, 'tile' | 'table'>>>({});

    const [sort, setSort] = useState<SortSchema | undefined>();

    // Get browse config with defaults
    const browseConfig: BrowsePageSchema = uiConfig?.browse ?? {
        title: entityType.charAt(0).toUpperCase() + entityType.slice(1) + 's',
        defaultView: 'tile',
        allowCreate: true,
        views: {
            tile: { enabled: true, layout: { columns: 3 }, fields: [] },
            table: { enabled: true, columns: [] },
        },
    };

    // Sort entities
    const sortedEntities = sortEntities(entities, sort);

    // Error state
    if (configError || entitySchemaError || entitiesError) {
        const error = configError || entitySchemaError || entitiesError;
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-lg font-semibold">Failed to load page configuration</h2>
                <p className="text-muted-foreground mt-2">{error?.message}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    Try Again
                </Button>
            </div>
        );
    }

    // Loading state
    if (loading || !entitySchema) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    const tileConfig: TileViewSchema = browseConfig.views?.tile ?? {
        enabled: true,
        layout: { columns: 3 },
        fields: [],
    };

    const tableConfig: TableViewSchema = browseConfig.views?.table ?? {
        enabled: true,
        columns: [],
    };

    const defaultViewMode = browseConfig.defaultView ?? 'tile';
    const viewMode = viewModeByEntityType[entityType] ?? defaultViewMode;

    const handleViewModeChange = (nextViewMode: 'tile' | 'table') => {
        setViewModeByEntityType((previous) => ({
            ...previous,
            [entityType]: nextViewMode,
        }));
    };

    const tileColumns = tileConfig.layout?.columns ?? 3;
    const normalizedTileColumns = Math.min(Math.max(Math.round(tileColumns), 1), 6);
    const tileGridColumnsClass = LG_TILE_COLUMN_CLASSES[normalizedTileColumns] ?? LG_TILE_COLUMN_CLASSES[3];

    const entityDisplayName = browseConfig.title?.replace(/s$/, '') || formatLabel(entityType);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{browseConfig.title}</h1>
                    {browseConfig.description && (
                        <p className="text-muted-foreground">{browseConfig.description}</p>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* View toggle */}
                    <div className="flex items-center rounded-md border p-1" role="group" aria-label="View mode">
                        <Button
                            type="button"
                            variant={viewMode === 'tile' ? 'secondary' : 'ghost'}
                            size="icon"
                            aria-label="Tile view"
                            title="Tile view"
                            onClick={() => handleViewModeChange('tile')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                            size="icon"
                            aria-label="Table view"
                            title="Table view"
                            onClick={() => handleViewModeChange('table')}
                        >
                            <TableIcon className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Create button */}
                    {browseConfig.allowCreate && canCreate && (
                        <Button asChild data-testid="create-entity-btn">
                            <Link to={`/${slug}/${entityType}/create`}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create {entityDisplayName}
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            {viewMode === 'tile' ? (
                <div className={cn('grid gap-6 grid-cols-1 md:grid-cols-2', tileGridColumnsClass)}>
                    {sortedEntities.map((entity: Record<string, unknown>) => (
                        <TileRenderer
                            key={entity.id as string}
                            entity={entity}
                            schema={tileConfig}
                            entitySchema={entitySchema}
                            entityType={entityType}
                        />
                    ))}
                </div>
            ) : (
                <TableRenderer
                    entities={sortedEntities}
                    schema={tableConfig}
                    entitySchema={entitySchema}
                    entityType={entityType}
                    sort={sort}
                    onSortChange={setSort}
                />
            )}

            {/* Empty state */}
            {sortedEntities.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No {entityType}s found</p>
                    {browseConfig.allowCreate && canCreate && (
                        <Button variant="outline" className="mt-4" asChild data-testid="create-first-entity-btn">
                            <Link to={`/${slug}/${entityType}/create`}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create your first {entityDisplayName}
                            </Link>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
