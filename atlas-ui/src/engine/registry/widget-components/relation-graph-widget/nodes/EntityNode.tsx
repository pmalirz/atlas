/**
 * EntityNode - Custom node for entity graph visualization
 * Supports interactive drill-down with expand button
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { getEntityColor, type EntityNodeData } from '../hooks/useGraphData';

// Define node type for React Flow
type EntityNode = Node<EntityNodeData, 'entityNode'>;

function EntityNodeComponent({ data }: NodeProps<EntityNode>) {
    const navigate = useNavigate();
    const bgColor = getEntityColor(data.entityType);

    const handleClick = () => {
        if (!data.isCenterNode) {
            // Navigate using absolute path with slug from current URL
            const slugMatch = window.location.pathname.match(/^\/([^/]+)/);
            const slug = slugMatch ? slugMatch[1] : '';
            navigate(`/${slug}/${data.entityType}/${data.id}`);
        }
    };

    const handleExpand = (e: React.MouseEvent) => {
        e.stopPropagation(); // Don't trigger navigation
        if (data.onExpand && !data.isExpanded && !data.isLoading) {
            data.onExpand();
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`
                relative px-4 py-3 rounded-lg shadow-lg border-2 min-w-[140px] max-w-[200px]
                transition-all duration-200 
                ${data.isCenterNode
                    ? 'border-primary ring-2 ring-primary/30 scale-110'
                    : 'border-border hover:border-primary/50 hover:shadow-xl cursor-pointer'
                }
                bg-card text-card-foreground
            `}
        >
            {/* Handles for edges */}
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-muted-foreground !w-2 !h-2"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!bg-muted-foreground !w-2 !h-2"
            />

            {/* Entity type badge */}
            <div
                className="text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 inline-block text-slate-900"
                style={{ backgroundColor: bgColor }}
            >
                {data.entityType.replace(/_/g, ' ')}
            </div>

            {/* Entity name */}
            <div className="font-medium text-sm leading-tight truncate" title={data.name}>
                {data.name}
            </div>

            {/* Center indicator */}
            {data.isCenterNode && (
                <div className="text-[10px] text-muted-foreground mt-1">
                    (current)
                </div>
            )}

            {/* Expand button - only show if node is expandable and not already expanded */}
            {data.isExpandable && !data.isCenterNode && (
                <button
                    onClick={handleExpand}
                    disabled={data.isLoading || data.isExpanded}
                    className={`
                        absolute -right-3 top-1/2 -translate-y-1/2
                        w-6 h-6 rounded-full flex items-center justify-center
                        transition-all duration-200 shadow-md
                        ${data.isExpanded
                            ? 'bg-green-500 text-white cursor-default'
                            : data.isLoading
                                ? 'bg-muted text-muted-foreground cursor-wait'
                                : 'bg-primary text-primary-foreground hover:scale-110 cursor-pointer'
                        }
                    `}
                    title={data.isExpanded ? 'Expanded' : 'Expand to see connections'}
                >
                    {data.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : data.isExpanded ? (
                        <CheckCircle2 className="w-4 h-4" />
                    ) : (
                        <PlusCircle className="w-4 h-4" />
                    )}
                </button>
            )}
        </div>
    );
}

export const EntityNode = memo(EntityNodeComponent);
