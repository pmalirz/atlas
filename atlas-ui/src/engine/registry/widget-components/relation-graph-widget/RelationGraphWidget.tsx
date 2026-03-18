/**
 * RelationGraphWidget
 * Interactive graph visualization of entity relations using React Flow
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    ControlButton,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
    type Node,
    type Edge,
} from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';

import type { WidgetComponentProps, RelationGraphConfig } from '../../../schema/types';
import { useGraphData, type EntityNodeData, type RelationEdgeData, getEntityColor } from './hooks/useGraphData';
import { EntityNode } from './nodes/EntityNode';
import { RelationEdge } from './edges/RelationEdge';
import { Skeleton } from '@/components/ui/skeleton';
import { MultiSelect } from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRelationDefinitions } from '@/hooks/useRelations';
import { Network, AlertCircle, Filter, Maximize2, Minimize2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// CUSTOM NODE/EDGE TYPES
// ─────────────────────────────────────────────────────────────

const nodeTypes = {
    entityNode: EntityNode,
};

const edgeTypes = {
    relationEdge: RelationEdge,
};

// ─────────────────────────────────────────────────────────────
// DAGRE LAYOUT
// ─────────────────────────────────────────────────────────────

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;

function getLayoutedElements(
    nodes: Node<EntityNodeData>[],
    edges: Edge<RelationEdgeData>[],
    direction: 'TB' | 'LR' = 'LR'
): { nodes: Node<EntityNodeData>[]; edges: Edge<RelationEdgeData>[] } {
    if (nodes.length === 0) return { nodes, edges };

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 80,
        ranksep: 120,
        marginx: 50,
        marginy: 50,
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - NODE_WIDTH / 2,
                y: nodeWithPosition.y - NODE_HEIGHT / 2,
            },
            sourcePosition: isHorizontal ? 'right' : 'bottom',
            targetPosition: isHorizontal ? 'left' : 'top',
        } as Node<EntityNodeData>;
    });

    return { nodes: layoutedNodes, edges };
}

// ─────────────────────────────────────────────────────────────
// WIDGET COMPONENT
// ─────────────────────────────────────────────────────────────

export function RelationGraphWidget({
    entityId,
    entityType,
    entity,
    schema
}: WidgetComponentProps) {
    const entityName = (entity.name as string) || 'Entity';

    // Extract config from schema
    const schemaConfig = schema.config as RelationGraphConfig | undefined;

    // Fetch relation definitions for the filter
    const { definitions } = useRelationDefinitions();

    // State for visible relation types (inverse of excluded)
    const [visibleRelations, setVisibleRelations] = useState<string[]>(() => {
        if (definitions.length > 0) {
            const schemaExclusions = new Set(schemaConfig?.excludeRelations ?? []);
            return definitions
                .map(d => d.relationType)
                .filter(rt => !schemaExclusions.has(rt));
        }
        return [];
    });

    // We use state to track if we've initialized yet to handle async definitions loading.
    const [isInitialized, setIsInitialized] = useState(definitions.length > 0);

    // Fullscreen expand state (must be declared before any early returns)
    const [isExpanded, setIsExpanded] = useState(false);

    // Initialize visible relations when definitions load (only once)
    // using "adjusting state during render" pattern to avoid set-state-in-effect warning
    if (definitions.length > 0 && !isInitialized) {
        setIsInitialized(true);
        // Start with all relations visible, minus any schema-configured exclusions
        const schemaExclusions = new Set(schemaConfig?.excludeRelations ?? []);
        const initialVisible = definitions
            .map(d => d.relationType)
            .filter(rt => !schemaExclusions.has(rt));
        setVisibleRelations(initialVisible);
    }

    // Build options for MultiSelect
    const relationOptions = useMemo(() => {
        return definitions.map(def => ({
            value: def.relationType,
            label: def.displayName || def.relationType.replace(/_/g, ' '),
        }));
    }, [definitions]);

    // Compute excluded relations from visible state
    const excludedRelations = useMemo(() => {
        const visibleSet = new Set(visibleRelations);
        return definitions
            .map(d => d.relationType)
            .filter(rt => !visibleSet.has(rt));
    }, [definitions, visibleRelations]);

    // Merge schema config with dynamic exclusions
    const config: RelationGraphConfig = useMemo(() => ({
        ...schemaConfig,
        excludeRelations: excludedRelations,
    }), [schemaConfig, excludedRelations]);

    // Fetch graph data with expand capability
    const { nodes: rawNodes, edges: rawEdges, loading, error } = useGraphData(
        entityId,
        entityType,
        entityName,
        config
    );

    // Apply layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
        if (rawNodes.length === 0) return { nodes: [], edges: [] };

        // Add arrow markers to edges
        const edgesWithMarkers = rawEdges.map(edge => ({
            ...edge,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 15,
                height: 15,
                color: 'hsl(var(--muted-foreground))',
            },
        }));

        return getLayoutedElements(rawNodes, edgesWithMarkers, 'LR');
    }, [rawNodes, rawEdges]);

    // Track previous data to avoid infinite updates - use ID-based key for comparison
    const prevLayoutKeyRef = useRef<string>('');

    // React Flow state - use untyped hooks to avoid generic constraints
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Update nodes when layout changes (compare by node/edge IDs)
    useEffect(() => {
        // Create a stable key from node and edge IDs
        const nodeIds = layoutedNodes.map(n => n.id).sort().join(',');
        const edgeIds = layoutedEdges.map(e => e.id).sort().join(',');
        const layoutKey = `${nodeIds}|${edgeIds}`;

        // Only update if the key changed
        if (layoutKey !== prevLayoutKeyRef.current) {
            prevLayoutKeyRef.current = layoutKey;
            setNodes(layoutedNodes as unknown as Node[]);
            setEdges(layoutedEdges as unknown as Edge[]);
        }
    }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

    // Loading state
    if (loading) {
        return (
            <div className="h-[400px] flex items-center justify-center">
                <Skeleton className="w-full h-full" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2 text-destructive" />
                <p className="text-sm">Failed to load relations</p>
                <p className="text-xs">{error.message}</p>
            </div>
        );
    }

    // Empty state - show filter but with empty graph message
    const showEmptyState = nodes.length <= 1;

    // Shared graph props
    const graphProps = {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        nodeTypes,
        edgeTypes,
        fitView: true,
        fitViewOptions: { padding: 0.3 },
        minZoom: 0.1,
        maxZoom: 2,
        proOptions: { hideAttribution: true },
    };

    return (
        <>
            <div className="space-y-3">
                {/* Toolbar: Filter */}
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter relations:</span>
                    <MultiSelect
                        options={relationOptions}
                        value={visibleRelations}
                        onChange={setVisibleRelations}
                        placeholder="Select relations to show"
                        searchPlaceholder="Search relations..."
                        countLabel="visible"
                        className="w-[200px]"
                    />
                </div>

                {/* Graph Container or Empty State */}
                {showEmptyState ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                        <Network className="h-12 w-12 mb-3 opacity-30" />
                        <p className="text-sm font-medium">No visible relations</p>
                        <p className="text-xs">Adjust the filter to show connections</p>
                    </div>
                ) : (
                    <div className="h-[450px] border rounded-lg overflow-hidden bg-muted/20">
                        <ReactFlow {...graphProps}>
                            <Background color="hsl(var(--border))" gap={20} size={1} />
                            <Controls
                                showInteractive={false}
                                className="!bg-background !border-border !rounded-lg !shadow-md"
                            >
                                <ControlButton onClick={() => setIsExpanded(true)} title="Expand to fullscreen">
                                    <Maximize2 />
                                </ControlButton>
                            </Controls>
                            <MiniMap
                                nodeColor={(node) => getEntityColor((node.data as EntityNodeData)?.entityType || 'default')}
                                maskColor="hsl(var(--background) / 0.8)"
                                className="!bg-background !border-border !rounded-lg !shadow-md"
                                pannable
                                zoomable
                            />
                        </ReactFlow>
                    </div>
                )}
            </div>

            {/* Fullscreen Dialog */}
            <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
                <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <Network className="h-5 w-5" />
                            Relationship Map - {entityName}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 p-4 overflow-hidden" style={{ height: 'calc(90vh - 80px)' }}>
                        {/* Filter inside dialog */}
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Filter:</span>
                            <MultiSelect
                                options={relationOptions}
                                value={visibleRelations}
                                onChange={setVisibleRelations}
                                placeholder="Select relations"
                                searchPlaceholder="Search..."
                                countLabel="visible"
                                className="w-[200px]"
                            />
                        </div>
                        <div className="h-[calc(100%-60px)] border rounded-lg overflow-hidden bg-muted/20">
                            <ReactFlow {...graphProps}>
                                <Background color="hsl(var(--border))" gap={20} size={1} />
                                <Controls
                                    showInteractive={false}
                                    className="!bg-background !border-border !rounded-lg !shadow-md"
                                />
                                <MiniMap
                                    nodeColor={(node) => getEntityColor((node.data as EntityNodeData)?.entityType || 'default')}
                                    maskColor="hsl(var(--background) / 0.8)"
                                    className="!bg-background !border-border !rounded-lg !shadow-md"
                                    pannable
                                    zoomable
                                />
                            </ReactFlow>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
