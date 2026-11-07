import {useState, useCallback, useLayoutEffect} from 'react';
import {
    ReactFlow,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    ReactFlowProvider,
    Background,
    Panel,
    useNodesState, useEdgesState, useReactFlow, MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();
const elkOptions = {
    'elk.algorithm': 'layered',
    'elk.layered.spacing.nodeNodeBetweenLayers': '100',
    'elk.spacing.nodeNode': '80',
};

let NODE_WIDTH = 200;

const initialNodes = [
    { id: 'n1', data: { label: 'Node 1' } },
    { id: 'n2', data: { label: 'Node 2' } },
];
const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];

interface VisualizationProps {
    nodes: [];
    edges: [];
    deps: [];
}

const getLayoutedElements = (nodes, edges, options = {}) => {
    const isHorizontal = options?.['elk.direction'] === 'RIGHT';
    const graph = {
        id: 'root',
        layoutOptions: options,
        children: nodes.map((node) => ({
            ...node,
            // Adjust the target and source handle positions based on the layout
            // direction.
            targetPosition: isHorizontal ? 'left' : 'top',
            sourcePosition: isHorizontal ? 'right' : 'bottom',

            width: typeof node.style?.width === 'number' ? node.style.width : NODE_WIDTH,
            height: typeof node.style?.height === 'number' ? node.style.height : Object.keys(node.properties).length+50+20,
        })),
        edges: edges,
    };

    return elk
        .layout(graph)
        .then((layoutedGraph) => ({
            nodes: layoutedGraph.children.map((node) => ({
                ...node,
                // React Flow expects a position property on the node instead of `x`
                // and `y` fields.
                position: { x: node.x, y: node.y },
            })),

            edges: layoutedGraph.edges,
        }))
        .catch(console.error);
};

function LayoutFlow({nodes, edges}: VisualizationProps) {
    const [rfNodes, setNodes, onNodesChange] = useNodesState([]);
    const [rfEdges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView } = useReactFlow();



    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
    const onLayout = useCallback(
        ({ direction, useInitialNodes = false }) => {
            const parentNodes = nodes.filter((n) => !n.parentId);
            const childNodes = nodes.filter((n) => Boolean(n.parentId));

            const opts = { 'elk.direction': direction, ...elkOptions };
            const ns = useInitialNodes ? parentNodes : rfNodes;
            const es = useInitialNodes ? edges : rfEdges;

            getLayoutedElements(ns, es, opts).then(
                ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
                    setNodes([...layoutedNodes, ...childNodes]);
                    setEdges(layoutedEdges);
                    fitView();
                },
            );
        },
        [rfNodes, rfEdges],
    );

    // Calculate the initial layout on mount.
    useLayoutEffect(() => {
        onLayout({ direction: 'RIGHT', useInitialNodes: true });
    }, []);

    return (
        <div  style={{position: 'absolute',  left: '0', right: '500px', bottom: '0', height: '100%' }}>
        <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onConnect={onConnect}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            colorMode="system"
            onlyRenderVisibleElements={true}
        >
            {/*<Panel position="top-right">*/}
            {/*    <button*/}
            {/*        className="xy-theme__button"*/}
            {/*        onClick={() => onLayout({ direction: 'DOWN' })}*/}
            {/*    >*/}
            {/*        vertical layout*/}
            {/*    </button>*/}

            {/*    <button*/}
            {/*        className="xy-theme__button"*/}
            {/*        onClick={() => onLayout({ direction: 'RIGHT' })}*/}
            {/*    >*/}
            {/*        horizontal layout*/}
            {/*    </button>*/}
            {/*</Panel>*/}
            <MiniMap />

            <Background />
        </ReactFlow>
        </div>
    );
}

export default function Visualization({nodes, edges, deps}:VisualizationProps)  {
    let rfNodes = nodes.map((node) => (
        {
            id: String(node.id),
            data: {label: node.labels.join(", ")},
            style: {width: NODE_WIDTH, height: Object.keys(node.properties).length*30+20},
            position: {x: 0, y: 0},
            type: 'group',
        }
    ));
    rfNodes = rfNodes.concat(nodes.map((node) => {
        return (
            {
                id: `id${String(node.id)}`,
                data: {label: node.labels.join(", ")},
                parentId: String(node.id),
                extent: 'parent',
                style: {
                    height: 20,
                    margin: 0,
                    padding: 0,
                    width: NODE_WIDTH,
                    fontWeight: 'bold',
                },
                position: {x: 0, y: 0},
                draggable: false,
            }
        );
    }));
    nodes.forEach((node) => {
        let i = 0;
        Object.entries(node.properties).forEach(([key, value]) => {
            rfNodes.push({
                    id: `${String(node.id)}_${key}`,
                    data: {
                        label: `${key}: ${value}${i}`,
                    },
                    parentId: String(node.id),
                    style: {
                        height: 30,
                        width: NODE_WIDTH,
                    },
                    extent: 'parent',
                    position: { x: 0, y: 20 + (30*i) },
                    draggable: false,
            });
            i = i+1;
        });
    });
    let rfEdges = []

    return (
        <ReactFlowProvider>
            <LayoutFlow nodes={rfNodes} edges={rfEdges} />
        </ReactFlowProvider>
    );
}