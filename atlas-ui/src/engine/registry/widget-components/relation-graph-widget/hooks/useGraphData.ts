/**
 * useGraphData Hook
 * Fetches and transforms entity relations into React Flow graph data
 * Supports interactive drill-down with node expansion
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRelationDefinitions } from '@/hooks/useRelations';
import { relationsApi } from '@/api/relations.api';
import type { Node, Edge } from '@xyflow/react';
import type { RelationGraphConfig } from '@/engine/schema/types';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface EntityNodeData {
    id: string;
    name: string;
    entityType: string;
    isCenterNode?: boolean;
    isExpandable?: boolean;
    isExpanded?: boolean;
    isLoading?: boolean;
    depth?: number;
    onExpand?: () => void;
    [key: string]: unknown;  // Index signature for React Flow compatibility
}

export interface RelationEdgeData {
    relationType: string;
    relationLabel: string;
    [key: string]: unknown;  // Index signature for React Flow compatibility
}

export interface GraphDataResult {
    nodes: Node<EntityNodeData>[];
    edges: Edge<RelationEdgeData>[];
    loading: boolean;
    error: Error | null;
    expandNode: (nodeId: string) => Promise<void>;
}

// Entity type to color mapping
// Generate consistent pastel color from string
export function getEntityColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // HSL:
    // Hue: 0-360 based on hash
    // Saturation: 70-90% (Vibrant)
    // Lightness: 80% (Pastel)
    const h = Math.abs(hash % 360);
    const s = 70 + (Math.abs(hash) % 20);
    const l = 80;

    return `hsl(${h}, ${s}%, ${l}%)`;
}

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export function useGraphData(
    entityId: string,
    entityType: string,
    entityName: string,
    config?: RelationGraphConfig
): GraphDataResult {
    const { definitions } = useRelationDefinitions();

    // Stabilize config values to prevent unnecessary re-renders
    const maxDepth = config?.maxDepth ?? 3;
    const rawExcludeRelations = config?.excludeRelations ?? [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const excludeRelations = useMemo(() => rawExcludeRelations, [rawExcludeRelations.join(',')]);

    // Track initialization to prevent multiple fetches
    const initializedRef = useRef(false);
    const currentEntityIdRef = useRef(entityId);

    // State for graph data
    const [nodesMap, setNodesMap] = useState<Map<string, Node<EntityNodeData>>>(new Map());
    const [edgesMap, setEdgesMap] = useState<Map<string, Edge<RelationEdgeData>>>(new Map());
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Memoized helper to get relation display name
    const getRelationLabel = useCallback((relationType: string): string => {
        const def = definitions.find(d => d.relationType === relationType);
        return def?.displayName || relationType.replace(/_/g, ' ');
    }, [definitions]);

    // Expand a node: fetch its relations and merge into graph
    const expandNode = useCallback(async (nodeId: string) => {
        if (expandedNodes.has(nodeId) || loadingNodes.has(nodeId)) {
            return;
        }

        // Check depth limit
        const currentNode = nodesMap.get(nodeId);
        const currentDepth = currentNode?.data?.depth ?? 0;
        if (currentDepth >= maxDepth) {
            console.log(`Max depth ${maxDepth} reached for node ${nodeId}`);
            return;
        }

        setLoadingNodes(prev => new Set([...prev, nodeId]));

        try {
            const relations = await relationsApi.getGraph(nodeId, {
                depth: 1,
                exclude: excludeRelations.length > 0 ? excludeRelations : undefined,
            });

            setNodesMap(prevNodes => {
                const newNodes = new Map(prevNodes);

                // Mark this node as expanded
                const existingNode = newNodes.get(nodeId);
                if (existingNode) {
                    newNodes.set(nodeId, {
                        ...existingNode,
                        data: {
                            ...existingNode.data,
                            isExpanded: true,
                            isLoading: false,
                        },
                    });
                }

                // Add new nodes from relations
                for (const rel of relations) {
                    const isFrom = rel.fromEntityId === nodeId;
                    const newEntityId = isFrom ? rel.toEntityId : rel.fromEntityId;
                    const newEntity = isFrom ? rel.toEntity : rel.fromEntity;

                    if (!newNodes.has(newEntityId)) {
                        newNodes.set(newEntityId, {
                            id: newEntityId,
                            type: 'entityNode',
                            position: { x: 0, y: 0 },
                            data: {
                                id: newEntityId,
                                name: newEntity?.name || newEntityId,
                                entityType: newEntity?.entityType || 'unknown',
                                isExpandable: true,
                                isExpanded: false,
                                depth: currentDepth + 1,
                            },
                        });
                    }
                }

                return newNodes;
            });

            setEdgesMap(prevEdges => {
                const newEdges = new Map(prevEdges);

                for (const rel of relations) {
                    if (!newEdges.has(rel.id)) {
                        newEdges.set(rel.id, {
                            id: rel.id,
                            source: rel.fromEntityId,
                            target: rel.toEntityId,
                            type: 'relationEdge',
                            data: {
                                relationType: rel.relationType,
                                relationLabel: getRelationLabel(rel.relationType),
                            },
                        });
                    }
                }

                return newEdges;
            });

            setExpandedNodes(prev => new Set([...prev, nodeId]));
        } catch (err) {
            console.error('Failed to expand node:', err);
            setError(err as Error);
        } finally {
            setLoadingNodes(prev => {
                const next = new Set(prev);
                next.delete(nodeId);
                return next;
            });
        }
    }, [nodesMap, expandedNodes, loadingNodes, maxDepth, getRelationLabel, excludeRelations]);

    // Initial load - only once per entityId
    useEffect(() => {
        // Skip if already initialized for this entity
        if (initializedRef.current && currentEntityIdRef.current === entityId) {
            return;
        }

        // Reset if entityId changed
        if (currentEntityIdRef.current !== entityId) {
            initializedRef.current = false;
            currentEntityIdRef.current = entityId;
        }

        async function loadInitialData() {
            setLoading(true);
            setError(null);

            try {
                const relations = await relationsApi.getGraph(entityId, {
                    depth: 1,
                    exclude: excludeRelations.length > 0 ? excludeRelations : undefined,
                });

                const initialNodes = new Map<string, Node<EntityNodeData>>();
                const initialEdges = new Map<string, Edge<RelationEdgeData>>();

                // Add center node
                initialNodes.set(entityId, {
                    id: entityId,
                    type: 'entityNode',
                    position: { x: 0, y: 0 },
                    data: {
                        id: entityId,
                        name: entityName || 'Current Entity',
                        entityType: entityType,
                        isCenterNode: true,
                        isExpanded: true,
                        depth: 0,
                    },
                });

                // Process relations
                for (const rel of relations) {
                    // Add nodes
                    const fromEntity = rel.fromEntity;
                    const toEntity = rel.toEntity;

                    if (!initialNodes.has(rel.fromEntityId) && fromEntity) {
                        initialNodes.set(rel.fromEntityId, {
                            id: rel.fromEntityId,
                            type: 'entityNode',
                            position: { x: 0, y: 0 },
                            data: {
                                id: rel.fromEntityId,
                                name: fromEntity.name || rel.fromEntityId,
                                entityType: fromEntity.entityType || 'unknown',
                                isExpandable: true,
                                isExpanded: false,
                                depth: 1,
                            },
                        });
                    }

                    if (!initialNodes.has(rel.toEntityId) && toEntity) {
                        initialNodes.set(rel.toEntityId, {
                            id: rel.toEntityId,
                            type: 'entityNode',
                            position: { x: 0, y: 0 },
                            data: {
                                id: rel.toEntityId,
                                name: toEntity.name || rel.toEntityId,
                                entityType: toEntity.entityType || 'unknown',
                                isExpandable: true,
                                isExpanded: false,
                                depth: 1,
                            },
                        });
                    }

                    // Add edge
                    initialEdges.set(rel.id, {
                        id: rel.id,
                        source: rel.fromEntityId,
                        target: rel.toEntityId,
                        type: 'relationEdge',
                        data: {
                            relationType: rel.relationType,
                            relationLabel: rel.relationType.replace(/_/g, ' '),
                        },
                    });
                }

                setNodesMap(initialNodes);
                setEdgesMap(initialEdges);
                setExpandedNodes(new Set([entityId]));
                initializedRef.current = true;
            } catch (err) {
                console.error('Failed to load graph data:', err);
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }

        loadInitialData();
    }, [entityId, entityType, entityName, excludeRelations]); // Minimal stable dependencies

    // Build final nodes with expand callbacks and loading state
    const nodes = useMemo(() => {
        return Array.from(nodesMap.values()).map(node => ({
            ...node,
            data: {
                ...node.data,
                isLoading: loadingNodes.has(node.id),
                isExpanded: expandedNodes.has(node.id),
                onExpand: () => expandNode(node.id),
            },
        }));
    }, [nodesMap, loadingNodes, expandedNodes, expandNode]);

    // Filter and transform edges based on excludeRelations
    const edges = useMemo(() => {
        const excludeSet = new Set(excludeRelations);
        return Array.from(edgesMap.values())
            .filter(edge => {
                const data = edge.data as RelationEdgeData;
                return !excludeSet.has(data.relationType);
            })
            .map(edge => {
                const data = edge.data as RelationEdgeData;
                return {
                    ...edge,
                    data: {
                        ...data,
                        relationLabel: getRelationLabel(data.relationType),
                    },
                };
            });
    }, [edgesMap, excludeRelations, getRelationLabel]);

    // Filter nodes to only show those connected by visible edges
    const visibleNodes = useMemo(() => {
        // Get all node IDs that are connected by visible edges
        const connectedNodeIds = new Set<string>();
        edges.forEach(edge => {
            connectedNodeIds.add(edge.source);
            connectedNodeIds.add(edge.target);
        });
        // Always include center node
        connectedNodeIds.add(entityId);

        return nodes.filter(node => connectedNodeIds.has(node.id));
    }, [nodes, edges, entityId]);

    return {
        nodes: visibleNodes,
        edges,
        loading,
        error,
        expandNode,
    };
}
