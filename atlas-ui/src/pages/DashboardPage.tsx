import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ArrowRight, Boxes, Sparkles } from 'lucide-react';
import { entitiesApi, type Entity } from '@/api/entities.api';
import { menuConfigApi, type MenuItem } from '@/api/ui-schema.api';
import { useTenant } from '@/auth';
import { useRbac } from '@/auth/RbacContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatLabel, formatRelativeTime, toLucideIcon } from '@/lib/utils';

interface DashboardCountCard {
    entityType: string;
    displayName: string;
    icon?: string;
    total: number;
    loading: boolean;
}

interface RecentDashboardEntity {
    id: string;
    name: string;
    entityType: string;
    entityDisplayName: string;
    icon?: string;
    updatedAt?: string;
    createdAt?: string;
}

const SPARSE_DATA_THRESHOLD = 3;
const QUICK_ACTION_LIMIT = 6;
const RECENT_SOURCES_LIMIT = 4;
const RECENT_PER_TYPE_LIMIT = 3;
const RECENT_MAX_ITEMS = 6;

function getEntityTimestamp(entity: Pick<RecentDashboardEntity, 'updatedAt' | 'createdAt'>): number {
    const raw = entity.updatedAt ?? entity.createdAt;
    if (!raw) {
        return 0;
    }

    const time = new Date(raw).getTime();
    return Number.isNaN(time) ? 0 : time;
}

function getEntityDisplayName(entity: Entity): string {
    if (typeof entity.name === 'string' && entity.name.trim().length > 0) {
        return entity.name;
    }

    return `Entity ${entity.id.slice(0, 8)}`;
}

function toRecentEntity(entity: Entity, item: MenuItem): RecentDashboardEntity {
    return {
        id: entity.id,
        name: getEntityDisplayName(entity),
        entityType: item.entityType,
        entityDisplayName: item.displayName || formatLabel(item.entityType),
        icon: item.icon,
        updatedAt: typeof entity.updatedAt === 'string' ? entity.updatedAt : undefined,
        createdAt: typeof entity.createdAt === 'string' ? entity.createdAt : undefined,
    };
}

export function DashboardPage() {
    const { slug } = useTenant();
    const { hasPermission, isLoading: rbacLoading } = useRbac();

    const { data: menuConfig, isLoading: menuLoading } = useQuery({
        queryKey: ['menu-config'],
        queryFn: menuConfigApi.getMenuConfig,
        staleTime: Infinity,
    });

    const visibleItems = useMemo(
        () => menuConfig?.items.filter((item) => item.visible) ?? [],
        [menuConfig],
    );

    const countQueries = useQueries({
        queries: visibleItems.map((item) => ({
            queryKey: ['dashboard-entity-count', slug, item.entityType],
            queryFn: async () => {
                const response = await entitiesApi.list(item.entityType, { take: 1, skip: 0 });
                return response.total ?? 0;
            },
            enabled: Boolean(slug && item.entityType),
            staleTime: 60_000,
        })),
    });

    const countCards = useMemo<DashboardCountCard[]>(
        () =>
            visibleItems.map((item, index) => ({
                entityType: item.entityType,
                displayName: item.displayName || formatLabel(item.entityType),
                icon: item.icon,
                total: countQueries[index]?.data ?? 0,
                loading: countQueries[index]?.isLoading ?? false,
            })),
        [visibleItems, countQueries],
    );

    const totalEntities = useMemo(
        () => countCards.reduce((sum, card) => sum + card.total, 0),
        [countCards],
    );

    const createEnabledItems = useMemo(
        () => visibleItems.filter((item) => hasPermission('entity', item.entityType, 'create')),
        [visibleItems, hasPermission],
    );

    const quickActionItems = useMemo(
        () => createEnabledItems.slice(0, QUICK_ACTION_LIMIT),
        [createEnabledItems],
    );

    const recentSourceItems = useMemo(
        () => visibleItems.slice(0, RECENT_SOURCES_LIMIT),
        [visibleItems],
    );

    const recentQueries = useQueries({
        queries: recentSourceItems.map((item) => ({
            queryKey: ['dashboard-recent-entities', slug, item.entityType],
            queryFn: async () => {
                const response = await entitiesApi.list(item.entityType, { take: RECENT_PER_TYPE_LIMIT, skip: 0 });
                return (response.data ?? []).map((entity) => toRecentEntity(entity, item));
            },
            enabled: Boolean(slug && item.entityType),
            staleTime: 60_000,
        })),
    });

    const recentEntities = useMemo(
        () =>
            recentQueries
                .flatMap((query) => query.data ?? [])
                .sort((a, b) => getEntityTimestamp(b) - getEntityTimestamp(a))
                .slice(0, RECENT_MAX_ITEMS),
        [recentQueries],
    );

    const isCountsLoading = countQueries.some((query) => query.isLoading);
    const isRecentLoading = recentQueries.some((query) => query.isLoading);
    const hasSparseData = !isCountsLoading && totalEntities <= SPARSE_DATA_THRESHOLD;
    const hasNoEntityTypes = !menuLoading && visibleItems.length === 0;
    const firstCreateEntityType = createEnabledItems[0];

    return (
        <div className="space-y-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight font-display">Dashboard</h1>
                <p className="text-base text-muted-foreground">
                    Get a quick snapshot of your inventory and jump straight into your next action.
                </p>
            </header>

            {hasNoEntityTypes ? (
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle>No entity types available</CardTitle>
                        <CardDescription>
                            Your menu configuration does not expose any entity types yet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Add visible entity items in menu configuration to unlock dashboard insights.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {menuLoading
                            ? Array.from({ length: 4 }).map((_, index) => (
                                <Card key={`dashboard-card-skeleton-${index}`}>
                                    <CardHeader>
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-8 w-16" />
                                    </CardHeader>
                                </Card>
                            ))
                            : countCards.map((card) => {
                                const Icon = toLucideIcon(card.icon, Boxes);

                                return (
                                    <Card key={card.entityType} className="transition-shadow hover:shadow-md">
                                        <CardHeader className="pb-2">
                                            <CardDescription className="flex items-center justify-between gap-2">
                                                <span>{card.displayName}</span>
                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                            </CardDescription>
                                            <CardTitle className="text-3xl font-display">
                                                {card.loading ? <Skeleton className="h-8 w-14" /> : card.total}
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>
                                );
                            })}
                    </section>

                    <section className="grid gap-4 xl:grid-cols-3">
                        <Card className="xl:col-span-2">
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>Create records and manage your core inventory faster.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-3 sm:grid-cols-2">
                                {rbacLoading ? (
                                    Array.from({ length: 4 }).map((_, index) => (
                                        <Skeleton key={`quick-actions-skeleton-${index}`} className="h-12 w-full" />
                                    ))
                                ) : quickActionItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground sm:col-span-2">
                                        You do not currently have create permissions for visible entity types.
                                    </p>
                                ) : (
                                    quickActionItems.map((item) => {
                                        const Icon = toLucideIcon(item.icon, Boxes);
                                        const displayName = item.displayName || formatLabel(item.entityType);

                                        return (
                                            <Button key={item.entityType} asChild variant="outline" className="h-auto justify-between px-4 py-3">
                                                <Link to={`/${slug}/${item.entityType}/create`}>
                                                    <span className="flex items-center gap-2 text-sm font-medium">
                                                        <Icon className="h-4 w-4 text-primary" />
                                                        <span>Create {displayName}</span>
                                                    </span>
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                </Link>
                                            </Button>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Items</CardTitle>
                                <CardDescription>Most recently touched records across your key entity types.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {isRecentLoading ? (
                                    Array.from({ length: 4 }).map((_, index) => (
                                        <Skeleton key={`recent-item-skeleton-${index}`} className="h-12 w-full" />
                                    ))
                                ) : recentEntities.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No recent items yet.</p>
                                ) : (
                                    recentEntities.map((entity) => {
                                        const Icon = toLucideIcon(entity.icon, Boxes);

                                        return (
                                            <Link
                                                key={`${entity.entityType}-${entity.id}`}
                                                to={`/${slug}/${entity.entityType}/${entity.id}`}
                                                className="flex items-center justify-between rounded-md border px-3 py-2 transition-colors hover:bg-muted/40"
                                            >
                                                <div className="min-w-0 space-y-0.5">
                                                    <p className="truncate text-sm font-medium">{entity.name}</p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {entity.updatedAt || entity.createdAt
                                                            ? formatRelativeTime(entity.updatedAt || entity.createdAt || '')
                                                            : 'Recently created'}
                                                    </p>
                                                </div>
                                                <div className="ml-2 flex items-center gap-2">
                                                    <Badge variant="secondary" className="hidden sm:inline-flex">
                                                        {entity.entityDisplayName}
                                                    </Badge>
                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </Link>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    {hasSparseData && (
                        <Card className="overflow-hidden border-dashed">
                            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-2">
                                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Onboarding
                                    </p>
                                    <h2 className="text-2xl font-bold tracking-tight font-display">
                                        Your inventory is ready to grow.
                                    </h2>
                                    <p className="max-w-2xl text-sm text-muted-foreground">
                                        Start by adding your first records. Atlas will adapt your entity model dynamically while
                                        preserving auditability and governance controls.
                                    </p>
                                </div>

                                {firstCreateEntityType && (
                                    <Button asChild className="h-11 px-6">
                                        <Link to={`/${slug}/${firstCreateEntityType.entityType}/create`}>
                                            Create your first {firstCreateEntityType.displayName || formatLabel(firstCreateEntityType.entityType)}
                                        </Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}

