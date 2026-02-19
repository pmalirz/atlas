import { ArrowLeft, Trash2, AlertCircle, Loader2, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SectionRenderer } from '@/engine/renderers/SectionRenderer';
import { useUIEntityConfig } from '@/hooks/useUIEntityConfig';
import { useEntitySchema } from '@/hooks/useEntitySchema';
import { useEntity, useUpdateEntity, useDeleteEntity } from '@/hooks/useEntities';
import type { DetailPageSchema, SectionSchema } from '@/engine/schema/types';
import { toast } from 'sonner';
import { useState } from 'react';

interface DynamicDetailPageProps {
    entityType: string;
    entityId: string;
}

export function DynamicDetailPage({ entityType, entityId }: DynamicDetailPageProps) {
    const navigate = useNavigate();

    // Fetch UI entity config from backend
    const { config: uiConfig, loading: uiConfigLoading, error: uiConfigError } = useUIEntityConfig(entityType);

    // Fetch Entity schema from backend (field definitions)
    const { schema: entitySchema, loading: entitySchemaLoading, error: entitySchemaError } = useEntitySchema(entityType);

    // Fetch entity from backend
    const { entity, loading: entityLoading, error: entityError } = useEntity(entityType, entityId);

    // Mutations
    const updateMutation = useUpdateEntity(entityType);
    const deleteMutation = useDeleteEntity(entityType);

    // Comprehensive loading state
    const loading = uiConfigLoading || entitySchemaLoading || entityLoading;

    const [pendingChanges, setPendingChanges] = useState<Record<string, unknown>>({});
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Get display name from config or fallback to capitalized entity type
    const entityDisplayName = uiConfig?.browse?.title?.replace(/s$/, '')
        || entityType.charAt(0).toUpperCase() + entityType.slice(1);

    const handleFieldUpdate = (field: string, value: unknown) => {
        setPendingChanges(prev => ({ ...prev, [field]: value }));

        // Optimistically update then sync with backend
        updateMutation.mutate(
            { id: entityId, data: { [field]: value } },
            {
                onSuccess: () => {
                    toast.success(`Updated ${field}`);
                },
                onError: (error) => {
                    toast.error(`Failed to update ${field}: ${error.message}`);
                },
            }
        );
    };

    const handleDelete = () => {
        deleteMutation.mutate(entityId, {
            onSuccess: () => {
                toast.success(`${entityDisplayName} deleted successfully`);
                setDeleteDialogOpen(false);
                navigate(`/${entityType}`);
            },
            onError: (error) => {
                toast.error(`Failed to delete: ${error.message}`);
            },
        });
    };

    // Get detail config with defaults
    const detailConfig: DetailPageSchema = uiConfig?.detail ?? {
        headerFields: ['name'],
        sections: [],
    };

    // Merge entity with pending changes
    // entity is already flattened by entities.api.ts
    const mergedEntity = entity ? { ...entity, ...pendingChanges } : null;

    // Error state
    if (uiConfigError || entitySchemaError || entityError) {
        const error = uiConfigError || entitySchemaError || entityError;
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-lg font-semibold">Failed to load</h2>
                <p className="text-muted-foreground mt-2">{error?.message}</p>
                <div className="flex gap-2 mt-4">
                    <Button variant="outline" asChild>
                        <Link to={`/${entityType}`}>Go Back</Link>
                    </Button>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading || !mergedEntity || !entitySchema) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96 mt-2" />
                    </div>
                </div>
                <Skeleton className="h-64" />
                <Skeleton className="h-48" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to={`/${entityType}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{mergedEntity.name as string}</h1>
                        <p className="text-muted-foreground capitalize">{entityType} Details</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        asChild
                    >
                        <Link to={`/${entityType}/create`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create
                        </Link>
                    </Button>
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                size="sm"
                                data-testid="delete-entity-btn"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete {entityDisplayName}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete <strong>"{mergedEntity.name as string}"</strong>?
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel data-testid="delete-cancel-btn">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    data-testid="delete-confirm-btn"
                                >
                                    {deleteMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-6">
                {detailConfig.sections.length > 0 ? (
                    detailConfig.sections.map((section: SectionSchema) => (
                        <SectionRenderer
                            key={section.id}
                            section={section}
                            entity={mergedEntity}
                            entitySchema={entitySchema}
                            onUpdate={handleFieldUpdate}
                        />
                    ))
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No sections configured for this entity type.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
