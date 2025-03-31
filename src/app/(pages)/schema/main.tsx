'use client';

import { useEffect, useState, MouseEvent as ReactMouseEvent, useCallback } from 'react';
import { useQuery } from "@tanstack/react-query";
import { ReactFlow, Background, Controls, ControlButton, useNodesState, useEdgesState, useReactFlow, Panel, Position, useOnSelectionChange } from '@xyflow/react';
import type { Node, Edge, NodeMouseHandler, XYPosition, OnNodeDrag, OnNodesDelete, OnEdgesDelete } from '@xyflow/react'
import { Locate, Plus, Spline, X } from "lucide-react";
import { ConnectorNode, GraphNode, type GraphNodeData } from './nodes';
import { RelationshipEdge, SelfConnectingEdge } from './edges';
import { useMeasure } from "@uidotdev/usehooks";
import { cn } from "@/lib/utils";
import type { SelectNodeType, SelectEdgeType } from '@/lib/db/schema';
import NodeSelection from './nodes/node-selection';
import EdgeSelection from './edges/edge-selection';
import { useQueryClient } from '@tanstack/react-query';
import '@xyflow/react/dist/style.css';
import Empty from './empty';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNodeTypes, useEdgeTypes } from '@/lib/react-query/useSchema';

function SelectionDetails({ selectedEntityId, nodeTypes, edgeTypes, onUpdate }: { selectedEntityId: string | null, nodeTypes: SelectNodeType[], edgeTypes: SelectEdgeType[] | undefined, onUpdate: (prevId: string, newId: string) => void }) {
    if (!selectedEntityId) { return <></> }
    const selectedNodeType = nodeTypes.find((nodeType) => nodeType.name === selectedEntityId)
    const selectedEdgeType = edgeTypes?.find((edgeType) => edgeType.name === selectedEntityId)
    if (!selectedNodeType && !selectedEdgeType) { return <></> }
    else if (selectedEdgeType) {
        return <EdgeSelection edge={selectedEdgeType} onUpdate={onUpdate} />
    } else {
        return <NodeSelection node={selectedNodeType as SelectNodeType} onUpdate={onUpdate} />
    }
}

function genShortUid(): string {
    const length = 8
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}

const fitViewOptions = {
    maxZoom: 1.1,
    padding: 1.1,
};

export interface ConnectorState {
    connectionName: string;
    sourceNodeId: string
    sourceHandleId: string;
    targetNodeId: string | null;
    targetHandleId: string | null;
}

function layoutNodes(nodes: GraphNodeData[]): Node[] {
    // Step 1: Handle nodes with predefined positions
    const layout = nodes
        .filter((node) => node.x_pos !== null && node.y_pos !== null)
        .map((node) => ({
            id: node.name,
            type: 'graphNode',
            position: { x: node.x_pos!, y: node.y_pos! } as XYPosition,
            data: node,
        }));

    // Step 2: Handle nodes without predefined positions
    const unlayoutedNodes = nodes.filter((node) => node.x_pos === null || node.y_pos === null);
    const nodeRadius = 60; // Node radius
    const nodeDiameter = nodeRadius * 2; // 120 pixels
    const labelSpace = 250; // Estimated additional space for edge labels
    const minDistance = nodeDiameter + labelSpace; // Total minimum distance: 270 pixels

    // Step 3: Calculate the center based on existing nodes
    const existingXs = layout.map((n) => n.position.x);
    const existingYs = layout.map((n) => n.position.y);
    const centerX = existingXs.length > 0 ? (Math.min(...existingXs) + Math.max(...existingXs)) / 2 : 0;
    const centerY = existingYs.length > 0 ? (Math.min(...existingYs) + Math.max(...existingYs)) / 2 : 0;

    // Step 4: Initialize all nodes with positions and velocities
    const allNodes: Array<Node & { vx: number; vy: number }> = layout
        .map((node) => ({
            ...node,
            vx: 0, // Velocity x
            vy: 0, // Velocity y
        }))
        .concat(
            unlayoutedNodes.map((node) => ({
                id: node.name,
                type: 'graphNode',
                position: {
                    x: centerX + (Math.random() - 0.5) * 600, // Random initial spread
                    y: centerY + (Math.random() - 0.5) * 600,
                } as XYPosition,
                data: node,
                vx: 0,
                vy: 0,
            }))
        );

    // Step 5: Define force simulation parameters
    const repulsionForce = 30000; // Stronger repulsion to enforce wider spacing
    const attractionToCenter = 0.003; // Gentle pull to prevent excessive drift
    const friction = 0.85; // Dampening to stabilize the simulation

    // Step 6: Run the force simulation
    const simulate = () => {
        for (let i = 0; i < allNodes.length; i++) {
            const nodeA = allNodes[i];
            let fx = 0; // Force in x direction
            let fy = 0; // Force in y direction

            // Repulsion between nodes
            for (let j = 0; j < allNodes.length; j++) {
                if (i === j) continue; // Skip self
                const nodeB = allNodes[j];
                const dx = nodeA.position.x - nodeB.position.x;
                const dy = nodeA.position.y - nodeB.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 0.1; // Avoid division by zero

                if (distance < minDistance) {
                    const force = repulsionForce / (distance * distance);
                    fx += (dx / distance) * force;
                    fy += (dy / distance) * force;
                }
            }

            // Attraction to center
            const dxCenter = centerX - nodeA.position.x;
            const dyCenter = centerY - nodeA.position.y;
            fx += dxCenter * attractionToCenter;
            fy += dyCenter * attractionToCenter;

            // Update velocity and position (only for nodes without predefined positions)
            nodeA.vx = (nodeA.vx + fx) * friction;
            nodeA.vy = (nodeA.vy + fy) * friction;
            if (!layout.some((n) => n.id === nodeA.id)) {
                nodeA.position.x += nodeA.vx;
                nodeA.position.y += nodeA.vy;
            }
        }
    };

    // Step 7: Run simulation for 150 iterations
    const iterations = 150;
    for (let i = 0; i < iterations; i++) {
        simulate();
    }

    // Step 8: Return nodes without velocity properties
    return allNodes.map(({ vx, vy, ...node }) => node);
}

const nodeTypes = {
    graphNode: GraphNode,
    connector: ConnectorNode,
};

const edgeTypes = {
    relationship: RelationshipEdge,
    selfConnecting: SelfConnectingEdge,
};

export default function Main() {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const queryClient = useQueryClient();
    // Connection Mode
    const [isConnectionMode, setIsConnectionMode] = useState(false);
    const [connectorDrawingState, setConnectorDrawingState] = useState<ConnectorState | null>(null)
    // Measures
    const [ref, { width, height }] = useMeasure();
    const { fitView, screenToFlowPosition } = useReactFlow();

    const onChange = useCallback(({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
        console.log("NODES", nodes)
        console.log("EDGES", edges)
        if (nodes.length > 0 && nodes[0].type === 'graphNode') {
            setSelectedEntityId(nodes[0].id)
            return
        } else if (edges.length > 0 
            && (edges[0].type === 'relationship' 
                || edges[0].type === 'selfConnecting')) {
            setSelectedEntityId(edges[0].id)
            return
        }
        // setSelectedEntity(null)
    }, [nodes, edges]);

    useOnSelectionChange({
        onChange,
    });

    const { data: nodeTypesData, isLoading, error } = useNodeTypes()
    const { data: edgeTypesData } = useEdgeTypes(!!nodeTypesData)

    useEffect(() => {
        if (edgeTypesData && nodeTypesData) {
            const myNodes = layoutNodes(nodeTypesData.map((nodeType) => ({
                ...nodeType,
                color: nodeType.color || '#2563EB',
                sources: [],
                targets: [],
                loops: [],
            } as GraphNodeData)))
            const newNodes = myNodes.map((node) => {
                const nodeData = {
                    ...node.data,
                    sources: edgeTypesData.filter((edgeType) => edgeType.from === node.id && edgeType.to !== node.id).map((edgeType) => ({ name: edgeType.name, position: Position.Right })),
                    targets: edgeTypesData.filter((edgeType) => edgeType.to === node.id && edgeType.from !== node.id).map((edgeType) => ({ name: edgeType.name, position: Position.Left })),
                    loops: edgeTypesData.filter((edgeType) => edgeType.from === node.id && edgeType.to === node.id).map((edgeType) => ({ name: edgeType.name, srcPosition: Position.Right, targetPosition: Position.Right })),
                }
                return { ...node, data: nodeData }
            });
            setNodes(newNodes)
            setEdges(edgeTypesData.map((edgeType) => {
                if (edgeType.from === edgeType.to) {
                    return (
                        {
                            id: edgeType.name,
                            type: 'selfConnecting',
                            source: edgeType.from,
                            sourceHandle: `${edgeType.from}-source-${edgeType.name}`,
                            target: edgeType.to,
                            targetHandle: `${edgeType.to}-target-${edgeType.name}`,
                            data: edgeType,
                            animated: true,
                            interactionWidth: 0,
                        } as Edge
                    )
                } else {
                    return (
                        {
                            id: edgeType.name,
                            type: 'relationship',
                            source: edgeType.from,
                            sourceHandle: `${edgeType.from}-source-${edgeType.name}`,
                            target: edgeType.to,
                            targetHandle: `${edgeType.to}-target-${edgeType.name}`,
                            animated: true,
                            data: edgeType,
                            interactionWidth: 0,
                        } as Edge
                    )
                }
            }))
        }
    }, [nodeTypesData, edgeTypesData, setEdges, setNodes])

    useEffect(() => {
        if (width && height) {
            setTimeout(() => {
                fitView(fitViewOptions);
            }, 100);
        }
    }, [width, height, fitView]);

    if (isLoading) {
        return (
            <div className="w-full h-full bg-white p-6">
                <div className="animate-pulse text-gray-500">Loading node types...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full bg-white p-6">
                <div className="text-red-500">Error: {error instanceof Error ? error.message : 'An error occurred'}</div>
            </div>
        );
    }

    const handleNewConnection = () => {
        console.log('new connection');
        setIsConnectionMode(true);
    }

    const handleNodeMouseEnter: NodeMouseHandler<Node> = (event, node) => {
        if (node.type !== 'graphNode' || !isConnectionMode) { return }
        if (isConnectionMode) {
            setNodes((nodes) =>
                nodes.map((n) => {
                    if (n.id === node.id) {
                        return {
                            ...n,
                            data: { ...n.data, color: 'red' },
                            selectable: false,
                            draggable: false,
                            focusable: false,
                            connectable: false,
                            deletable: false,
                        }
                    }
                    return n
                })
            )
        }
    }

    const handleNodeMouseLeave: NodeMouseHandler<Node> = (event, node) => {
        if (node.type !== 'graphNode' || !isConnectionMode) { return }
        if (isConnectionMode) {
            setNodes((nodes) =>
                nodes.map((n) => {
                    if (n.id === node.id) {
                        return {
                            ...n,
                            data: { ...n.data, color: '#2563EB' },
                            selectable: true,
                            draggable: true,
                            focusable: true,
                            connectable: true,
                            deletable: true
                        };
                    }
                    return n;
                })
            );
        }
    }

    const drawOnMouseMove = (evt: ReactMouseEvent<HTMLDivElement>) => {
        if (!connectorDrawingState) { return }
        const position = screenToFlowPosition({ x: evt.clientX, y: evt.clientY });
        const nodePos: XYPosition = { x: position.x - 3, y: position.y - 3 }
        setNodes((nodes) =>
            nodes.map((n) => {
                if (n.id === `connector-${connectorDrawingState.connectionName}`) {
                    return {
                        ...n,
                        position: nodePos,
                        selected: false,
                    }
                }
                return n
            })
        );
    }


    const createConnectionFromNode = (node: Node<GraphNodeData, string>, position: XYPosition) => {
        const newConnectionName = genShortUid()
        const sourceHandleId = `${node.id}-source-${newConnectionName}`
        console.log("SOURCE HANDLE ID", sourceHandleId)
        const connectorNode: Node<any, string> = {
            id: `connector-${newConnectionName}`,
            type: 'connector',
            position: { x: position.x - 3.6, y: position.y - 3.6 },
            selected: false,
            data: {}
        }
        const newEdge: Edge = {
            id: newConnectionName,
            type: 'relationship',
            source: node.id,
            sourceHandle: sourceHandleId,
            target: connectorNode.id,
            animated: true,
            interactionWidth: 0,
        }
        setNodes((nodes) => {
            const res: Node<any, string>[] = nodes.map((n) => {
                if (n.id === node.id && n.type === 'graphNode') {
                    const newData: GraphNodeData = n.data as GraphNodeData
                    console.log("NEW DATA", newData)
                    return {
                        ...n,
                        data: {
                            ...newData,
                            sources: [...newData.sources, { name: newConnectionName, position: Position.Right }]
                        }
                    }
                }
                return ({ ...n, selected: false })
            })
            return res.concat([connectorNode])
        });
        setEdges((edges) =>
            edges.concat([newEdge])
        );
        setConnectorDrawingState({
            sourceNodeId: node.id,
            sourceHandleId: sourceHandleId,
            targetNodeId: null,
            targetHandleId: null,
            connectionName: newConnectionName,
        })
    }

    const finishConnectionAtNode = (node: Node<GraphNodeData, string>, drawingState: ConnectorState) => {
        console.log("END PIPE AT ", node.id)
        const realConnectionName = genShortUid()
        const newEdge: Edge = drawingState.sourceNodeId === node.id ? {
            id: realConnectionName,
            type: 'selfConnecting',
            source: drawingState.sourceNodeId,
            sourceHandle: `${drawingState.sourceNodeId}-source-${realConnectionName}`,
            target: node.id,
            targetHandle: `${node.id}-target-${realConnectionName}`,
            animated: true,
            interactionWidth: 0,
        } : {
            id: realConnectionName,
            type: 'relationship',
            source: drawingState.sourceNodeId,
            sourceHandle: `${drawingState.sourceNodeId}-source-${realConnectionName}`,
            target: node.id,
            targetHandle: `${node.id}-target-${realConnectionName}`,
            animated: true,
            interactionWidth: 0,
        }
        setEdges((edges) => edges.filter((e) => e.target !== drawingState.connectionName).concat([newEdge]))
        if (drawingState.sourceNodeId !== node.id) {
            setNodes((nodes) => nodes.filter((n) => n.id !== `connector-${drawingState.connectionName}`).map((n) => {
                if (n.id === node.id) {
                    const newData: GraphNodeData = n.data as GraphNodeData
                    return {
                        ...n,
                        data: {
                            ...newData,
                            targets: [...newData.targets, {
                                name: realConnectionName,
                                position: Position.Left
                            }]
                        }
                    }
                } else if (n.id === drawingState.sourceNodeId) {
                    const newData: GraphNodeData = nodes.find((n) => n.id === drawingState.sourceNodeId)?.data as GraphNodeData
                    return {
                        ...n,
                        data: {
                            ...newData,
                            sources: [...newData.sources.filter((s) => s.name !== drawingState.connectionName), {
                                name: realConnectionName,
                                position: Position.Right
                            }]
                        }
                    }
                }
                return n
            }))
        } else {
            setNodes((nodes) => nodes.filter((n) => n.id !== `connector-${drawingState.connectionName}`).map((n) => {
                if (n.id === node.id) {
                    const newData: GraphNodeData = n.data as GraphNodeData
                    return {
                        ...n,
                        data: {
                            ...newData,
                            sources: newData.sources.filter((s) => s.name !== drawingState.connectionName),
                            loops: [...newData.loops, {
                                name: realConnectionName,
                                srcPosition: Position.Right,
                                targetPosition: Position.Right
                            }]
                        }
                    }
                }
                return n
            }))
        }
        fetch('/api/schema/edge', {
            method: 'POST',
            body: JSON.stringify({
                name: realConnectionName,
                from: drawingState.sourceNodeId,
                to: node.id,
                schema: []
            }),
        }).then((res) => res.json()).then((data) => {
            console.log("EDGE TYPE CREATED", data)
        })
        setConnectorDrawingState(null)
    }

    const onNodeClick: NodeMouseHandler<Node> = (event, node) => {
        if (!isConnectionMode || node.type !== 'graphNode') { return }
        event.stopPropagation()
        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        if (connectorDrawingState?.connectionName) {
            finishConnectionAtNode(node as Node<GraphNodeData, string>, connectorDrawingState)
        } else {
            createConnectionFromNode(node as Node<GraphNodeData, string>, position)
        }
    }

    const updateNodePosition = async (id: string, x_pos: number, y_pos: number) => {
        await fetch('/api/schema/node?type=position', {
            method: 'PATCH',
            body: JSON.stringify({
                name: id,
                x_pos: x_pos,
                y_pos: y_pos,
            }),
        }).then((res) => res.json()).then((data) => {
            console.log("NODE POSITION UPDATED", data)
        })
    }

    const handleNodeDragStop: OnNodeDrag<Node> = async (event, node) => {
        console.log("NODE DRAGGED STOP at", node.position)
        await updateNodePosition(node.id, node.position.x, node.position.y)
        for (const n of nodes) {
            console.log("NODE DATA", n.id, n.type, n.data.x_pos, n.data.y_pos)
            if (n.type === 'graphNode' && n.data.x_pos === null && n.data.y_pos === null) {
                console.log("OTHER NODE", n.id, n.position.x, n.position.y)
                await updateNodePosition(n.id, n.position.x, n.position.y)
            }
        }
        queryClient.invalidateQueries({ queryKey: ['nodeTypes'] })
    }

    const handleCreateNewNode = async () => {
        const newNodeName = genShortUid().slice(0, 6);
        await fetch('/api/schema/node', {
            method: 'POST',
            body: JSON.stringify({
                name: newNodeName,
                color: "#2563EB",
                schema: [],
            }),
        }).then((res) => res.json()).then((data) => {
            console.log("NODE POSITION UPDATED", data)
            queryClient.invalidateQueries({ queryKey: ['nodeTypes'] })
        })
    }

    const onNodesDelete: OnNodesDelete<Node> = async(nodes) => {
        console.log("NODES DELETED", nodes)
        for (const node of nodes) {
            await fetch(`/api/schema/node?name=${node.id}`, {
                method: 'DELETE',
            }).then((res) => res.json()).then((data) => {
                queryClient.invalidateQueries({ queryKey: ['nodeTypes'] })
            })
        }
        queryClient.invalidateQueries({ queryKey: ['nodeTypes'] })
    }

    const onEdgesDelete: OnEdgesDelete<Edge> = async(edges) => {
        console.log("EDGES DELETED", edges)
        for (const edge of edges) {
            await fetch(`/api/schema/edge?name=${edge.id}`, {
                method: 'DELETE',
            }).then((res) => res.json()).then((data) => {
                console.log("EDGE DELETED", data)
            })
        }
        queryClient.invalidateQueries({ queryKey: ['edgeTypes'] })
    }

    return (
        <div className="w-full h-full bg-gray-50 flex items-center justify-center" ref={ref}>
            {!nodeTypesData?.length ? (
                <Empty onCreate={() => {
                    console.log("CREATE NEW NODE TYPE")
                }} />
            ) : (
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onNodesChange={onNodesChange}
                    onNodesDelete={onNodesDelete}
                    onEdgesDelete={onEdgesDelete}
                    onEdgesChange={onEdgesChange}
                    onMouseMove={drawOnMouseMove}
                    onNodeMouseEnter={handleNodeMouseEnter}
                    onNodeMouseLeave={handleNodeMouseLeave}
                    onNodeDragStop={handleNodeDragStop}
                    onNodeClick={onNodeClick}
                    fitView
                    fitViewOptions={fitViewOptions}
                >
                    <Background />
                    <Panel position={"top-right"}>
                        <div className={cn("flex flex-col gap-2 bg-primary opacity-75 px-4 py-2 rounded-md font-medium text-white", isConnectionMode ? "block" : "hidden")}>
                            Drawing Connection
                        </div>
                    </Panel>
                    <Panel position={"top-left"}>
                        <SelectionDetails selectedEntityId={selectedEntityId} nodeTypes={nodeTypesData} edgeTypes={edgeTypesData} onUpdate={(prevId, newId) => {
                            console.log("Selection changed from", prevId, "to", newId)
                            setSelectedEntityId(newId)
                        }} />
                    </Panel>
                    <Controls position={"bottom-left"} className="bg-white text-primary" showZoom={false} showInteractive={false} showFitView={false} style={{ padding: 0 }}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <ControlButton onClick={handleCreateNewNode} className="special-control-button">
                                    <Plus fillOpacity={0} className="w-4! h-4!" />
                                </ControlButton>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Create Node Type</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <ControlButton onClick={() => {
                                    if (isConnectionMode) {
                                        setIsConnectionMode(false)
                                    } else {
                                        handleNewConnection();
                                    }
                                }} className="special-control-button">
                                    {isConnectionMode ? (
                                        <X fillOpacity={0} className="w-4! h-4!" />
                                    ) : (
                                        <Spline fillOpacity={0} className="w-4! h-4!" />
                                    )}
                                </ControlButton>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Connect Edge Type</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <ControlButton onClick={() => fitView(fitViewOptions)} className="special-control-button">
                                    <Locate fillOpacity={0} className="w-4! h-4!" />
                                </ControlButton>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Center Canvas</p>
                            </TooltipContent>
                        </Tooltip>
                    </Controls>
                </ReactFlow>
            )}
        </div>
    );
}