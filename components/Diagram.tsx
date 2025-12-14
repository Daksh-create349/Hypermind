import React, { useMemo, useEffect } from 'react';
import ReactFlow, { 
    Handle, 
    Position, 
    useNodesState, 
    useEdgesState, 
    Background, 
    Controls, 
    MarkerType,
    Node,
    Edge
} from 'reactflow';
import dagre from 'dagre';
import { cn } from '../lib/utils';
import { Maximize2 } from 'lucide-react';

interface DiagramProps {
    data: {
        title?: string;
        nodes: { id: string; label: string; type?: string }[];
        edges: { id: string; source: string; target: string; label?: string }[];
    };
}

const nodeWidth = 180;
const nodeHeight = 60;

// Auto Layout function using Dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
        return node;
    });

    return { nodes, edges };
};

// Custom Node Component
const CustomNode = ({ data }: any) => {
    return (
        <div className="px-4 py-3 shadow-xl rounded-xl bg-neutral-900 border-2 border-indigo-500/50 min-w-[150px] text-center backdrop-blur-md relative group transition-all hover:border-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-3 !h-3 !-top-1.5" />
            <div className="font-bold text-white text-xs">{data.label}</div>
            <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-3 !h-3 !-bottom-1.5" />
        </div>
    );
};

export function Diagram({ data }: DiagramProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

    useEffect(() => {
        if (!data) return;

        // Transform simplified data to ReactFlow format
        const initialNodes: Node[] = data.nodes.map(n => ({
            id: n.id,
            type: 'custom',
            data: { label: n.label },
            position: { x: 0, y: 0 } // Position calculated by dagre
        }));

        const initialEdges: Edge[] = data.edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
            labelStyle: { fill: '#a5b4fc', fontWeight: 700 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#6366f1',
            },
        }));

        const layouted = getLayoutedElements(initialNodes, initialEdges);
        setNodes(layouted.nodes);
        setEdges(layouted.edges);
    }, [data, setNodes, setEdges]);

    if (!data) return null;

    return (
        <div className="w-full h-[500px] mt-6 bg-black/40 border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl">
            {data.title && (
                <div className="absolute top-4 left-4 z-10 bg-neutral-900/80 backdrop-blur border border-white/10 px-3 py-1.5 rounded-lg">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest">{data.title}</h3>
                </div>
            )}
            
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                className="bg-transparent"
                minZoom={0.5}
                maxZoom={2}
            >
                <Background color="#6366f1" gap={30} size={1} className="opacity-10" />
                <Controls className="bg-neutral-800 border-white/10 fill-white text-white" />
            </ReactFlow>

            <div className="absolute bottom-4 right-4 pointer-events-none text-[10px] text-neutral-600 font-mono">
                INTERACTIVE DIAGRAM // DRAG TO PAN
            </div>
        </div>
    );
}