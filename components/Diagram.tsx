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

const nodeWidth = 200;
const nodeHeight = 80;

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
        <div className="px-6 py-4 shadow-[0_0_30px_rgba(99,102,241,0.1)] rounded-2xl bg-black/80 border border-indigo-500/40 min-w-[180px] text-center backdrop-blur-xl relative group transition-all duration-500 hover:border-indigo-400 hover:shadow-[0_0_50px_rgba(99,102,241,0.3)] hover:scale-105">
            <Handle type="target" position={Position.Top} className="!bg-white !w-2 !h-2 !-top-1 !border-none transition-all group-hover:bg-indigo-400" />
            <div className="font-bold text-white text-sm tracking-wide">{data.label}</div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none" />
            <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-2 !h-2 !-bottom-1 !border-none" />
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
            style: { stroke: '#6366f1', strokeWidth: 1.5 },
            labelStyle: { fill: '#a5b4fc', fontWeight: 600, fontSize: 10 },
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
        <div className="w-full h-[600px] mt-6 bg-black/40 border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl animate-in fade-in zoom-in-95 duration-700">
            {data.title && (
                <div className="absolute top-4 left-4 z-10 bg-neutral-900/80 backdrop-blur border border-white/10 px-4 py-2 rounded-xl">
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
                attributionPosition="bottom-right"
            >
                <Background color="#6366f1" gap={40} size={1} className="opacity-5" />
                <Controls className="bg-neutral-800 border-white/10 fill-white text-white rounded-lg overflow-hidden" showInteractive={false} />
            </ReactFlow>

            <div className="absolute bottom-4 left-4 pointer-events-none text-[10px] text-neutral-600 font-mono tracking-widest">
                NEURAL_MAP // v1.0
            </div>
        </div>
    );
}