/**
 * RelationEdge - Custom edge for relation graph visualization
 */

import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps, type Edge } from '@xyflow/react';
import type { RelationEdgeData } from '../hooks/useGraphData';

// Define edge type for React Flow
type RelationEdgeType = Edge<RelationEdgeData, 'relationEdge'>;

function RelationEdgeComponent({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    markerEnd,
}: EdgeProps<RelationEdgeType>) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1.5 }}
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="px-2 py-0.5 bg-background border border-border rounded text-[10px] text-muted-foreground shadow-sm"
                >
                    {data?.relationLabel || data?.relationType || 'relates to'}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

export const RelationEdge = memo(RelationEdgeComponent);
