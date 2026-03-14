import { useState } from 'react';
import { ArrowLeft, Save, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTenant } from '@/auth';
import { useRbac } from '@/auth/RbacContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUIEntityConfig } from '@/hooks/useUIEntityConfig';
import { useCreateEntity } from '@/hooks/useEntities';
import { toast } from 'sonner';

interface DynamicCreatePageProps {
    entityType: string;
}

export function DynamicCreatePage({ entityType }: DynamicCreatePageProps) {
    const navigate = useNavigate();
    const { slug } = useTenant();

    // Fetch UI entity config from backend for display name
    const { config: uiConfig, loading: configLoading, error: configError } = useUIEntityConfig(entityType);

    // Create mutation
    const createMutation = useCreateEntity(entityType);

    // RBAC check
    const { hasPermission } = useRbac();
    const canCreate = hasPermission('entity', entityType, 'create');

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [nameError, setNameError] = useState('');

    // Get display name from config or fallback to capitalized entity type
    const entityDisplayName = uiConfig?.browse?.title?.replace(/s$/, '')
        || entityType.charAt(0).toUpperCase() + entityType.slice(1);

    const validateForm = (): boolean => {
        if (!name.trim()) {
            setNameError('Name is required');
            return false;
        }
        setNameError('');
        return true;
    };

    const handleSaveAndEdit = async () => {
        if (!validateForm()) return;

        createMutation.mutate(
            { name: name.trim(), description: description.trim() || undefined },
            {
                onSuccess: (newEntity) => {
                    toast.success(`${entityDisplayName} created successfully`);
                    navigate(`/${slug}/${entityType}/${newEntity.id}`);
                },
                onError: (error) => {
                    toast.error(`Failed to create: ${error.message}`);
                },
            }
        );
    };

    const handleSaveAndCreateNew = async () => {
        if (!validateForm()) return;

        createMutation.mutate(
            { name: name.trim(), description: description.trim() || undefined },
            {
                onSuccess: () => {
                    toast.success(`${entityDisplayName} created successfully`);
                    // Reset form
                    setName('');
                    setDescription('');
                    setNameError('');
                },
                onError: (error) => {
                    toast.error(`Failed to create: ${error.message}`);
                },
            }
        );
    };

    // RBAC Error state
    if (!canCreate) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-lg font-semibold">Access Denied</h2>
                <p className="text-muted-foreground mt-2">You do not have permission to create this entity type.</p>
                <div className="flex gap-2 mt-4">
                    <Button variant="outline" asChild>
                        <Link to={`/${slug}/${entityType}`}>Go Back</Link>
                    </Button>
                </div>
            </div>
        );
    }

    // Error state
    if (configError) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-lg font-semibold">Failed to load configuration</h2>
                <p className="text-muted-foreground mt-2">{configError.message}</p>
                <div className="flex gap-2 mt-4">
                    <Button variant="outline" asChild>
                        <Link to={`/${slug}/${entityType}`}>Go Back</Link>
                    </Button>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    // Loading state
    if (configLoading) {
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
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Create {entityDisplayName}</h1>
                        <p className="text-muted-foreground">
                            Add a new {entityDisplayName.toLowerCase()} to your inventory
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                        Provide the basic details for the new {entityDisplayName.toLowerCase()}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <Label htmlFor="entity-name" className="text-sm font-medium">
                            Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="entity-name"
                            data-testid="create-entity-name-input"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (nameError) setNameError('');
                            }}
                            placeholder={`Enter ${entityDisplayName.toLowerCase()} name`}
                            className={nameError ? 'border-destructive' : ''}
                            disabled={createMutation.isPending}
                        />
                        {nameError && (
                            <p className="text-sm text-destructive">{nameError}</p>
                        )}
                    </div>

                    {/* Description Field */}
                    <div className="space-y-2">
                        <Label htmlFor="entity-description" className="text-sm font-medium">
                            Description
                        </Label>
                        <Textarea
                            id="entity-description"
                            data-testid="create-entity-description-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={`Enter ${entityDisplayName.toLowerCase()} description (optional)`}
                            rows={4}
                            disabled={createMutation.isPending}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-3 justify-end">
                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={createMutation.isPending}
                >
                    Cancel
                </Button>
                <Button
                    variant="secondary"
                    onClick={handleSaveAndCreateNew}
                    disabled={createMutation.isPending}
                    data-testid="create-entity-save-and-new-btn"
                >
                    {createMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Plus className="h-4 w-4 mr-2" />
                    )}
                    Save & Create New
                </Button>
                <Button
                    onClick={handleSaveAndEdit}
                    disabled={createMutation.isPending}
                    data-testid="create-entity-save-and-edit-btn"
                >
                    {createMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Save & Edit
                </Button>
            </div>
        </div>
    );
}
