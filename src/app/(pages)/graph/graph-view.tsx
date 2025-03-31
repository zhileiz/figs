import { useQuery } from "@tanstack/react-query";
import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { useNodes, useEdges, type DBNode, type DBEdge } from "@/lib/react-query/useGraph";

interface D3Node extends d3.SimulationNodeDatum {
    id: string;
    color: string;
    label: string;
    properties: Record<string, any>;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
    edgeId: string;
    type: string;
    properties: Record<string, any>;
}

interface NodeInfo {
    id: string;
    label: string;
    color: string;
    properties: Record<string, any>;
}

function InfoPanel({ node }: { node: NodeInfo }) {
    return (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-4 w-80 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 pb-2 border-b flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: node.color }} />
                {node.label}
            </h3>
            <div className="space-y-1">
                <div className="text-sm text-gray-500">
                    <span className="font-medium">ID:</span> {node.id}
                </div>
                {Object.entries(node.properties).map(([key, value]) => (
                    <div key={key} className="text-sm text-gray-500">
                        <span className="font-medium">{key}:</span>{' '}
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function GraphView({ width, height }: { width: number | null, height: number | null }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [selectedNodeInfo, setSelectedNodeInfo] = useState<NodeInfo | null>(null);
    const simulationRef = useRef<{
        simulation: d3.Simulation<D3Node, D3Link>;
        nodes: d3.Selection<SVGGElement, D3Node, SVGGElement, unknown>;
        links: d3.Selection<SVGLineElement, D3Link, SVGGElement, unknown>;
        d3Nodes: D3Node[];
        d3Links: D3Link[];
    } | null>(null);

    const { data: dbNodes, isLoading: nodesLoading } = useNodes();

    const { data: dbEdges, isLoading: edgesLoading } = useEdges();

    // Helper functions for community detection
    const isInSelectedCommunity = useCallback((nodeId: string) => {
        if (!selectedNode) return true;
        if (nodeId === selectedNode) return true;
        return simulationRef.current?.d3Links.some(
            link => {
                const sourceId = typeof link.source === 'string' ? link.source : (link.source as D3Node).id;
                const targetId = typeof link.target === 'string' ? link.target : (link.target as D3Node).id;
                return (sourceId === selectedNode && targetId === nodeId) ||
                    (targetId === selectedNode && sourceId === nodeId);
            }
        ) ?? false;
    }, [selectedNode]);

    const isEdgeInSelectedCommunity = useCallback((edge: D3Link) => {
        if (!selectedNode) return true;
        const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as D3Node).id;
        const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as D3Node).id;
        return sourceId === selectedNode || targetId === selectedNode;
    }, [selectedNode]);

    // Update visual properties based on selection
    const updateVisuals = useCallback(() => {
        if (!simulationRef.current) return;

        const { nodes, links } = simulationRef.current;

        // Update node visuals
        nodes.selectAll<SVGCircleElement, D3Node>("circle")
            .attr("opacity", d => selectedNode ? (isInSelectedCommunity(d.id) ? 1 : 0.2) : 1)
            .attr("stroke", d => d.id === selectedNode ? "#000" : "none");

        nodes.selectAll<SVGTextElement, D3Node>("text")
            .attr("opacity", d => selectedNode ? (isInSelectedCommunity(d.id) ? 1 : 0.2) : 1);

        // Update edge visuals
        links
            .attr("stroke-opacity", d => selectedNode ? (isEdgeInSelectedCommunity(d) ? 0.8 : 0.1) : 0.6)
            .attr("stroke-width", d => selectedNode ? (isEdgeInSelectedCommunity(d) ? 2 : 1) : 1);
    }, [selectedNode, isInSelectedCommunity, isEdgeInSelectedCommunity]);

    // Effect for selection changes
    useEffect(() => {
        updateVisuals();
    }, [selectedNode, updateVisuals]);

    // Effect for initial setup and data changes
    useEffect(() => {
        if (!dbNodes?.result || !dbEdges?.result || !width || !height || !svgRef.current) {
            return;
        }

        // Clear previous graph
        d3.select(svgRef.current).selectAll("*").remove();

        // Prepare data
        let selectedNodes: DBNode[] = dbNodes.result;
        let selectedEdges: DBEdge[] = dbEdges.result;

        // Limit edges if too many
        if (dbEdges.result.length > 500) {
            selectedEdges = dbEdges.result
                .sort(() => Math.random() - 0.5)
                .slice(0, 500);
            const nodeSet = new Set(selectedEdges.map(edge => edge.from).concat(selectedEdges.map(edge => edge.to)));
            selectedNodes = dbNodes.result.filter(node => nodeSet.has(node.id));
        }

        // Map data to D3 format
        const d3Nodes: D3Node[] = selectedNodes.map(node => ({
            id: node.id,
            color: node.color,
            label: node.label,
            properties: node.properties,
        }));

        const d3Links: D3Link[] = selectedEdges.map(edge => ({
            edgeId: edge.edgeId,
            source: edge.from,
            target: edge.to,
            type: edge.type,
            properties: edge.properties,
        }));

        // Create D3 force simulation
        const simulation = d3.forceSimulation<D3Node>()
            .force("link", d3.forceLink<D3Node, D3Link>().id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-1000))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(30))
            .force("x", d3.forceX(width / 2).strength(0.1))
            .force("y", d3.forceY(height / 2).strength(0.1));

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height].join(" "));

        // Create zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            });

        svg.call(zoom);

        const container = svg.append("g");

        // Create arrow marker for edges
        svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "-10 -10 20 20")
            .attr("refX", 20)
            .attr("refY", 0)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M-6.75,-6.75 L 0,0 L -6.75,6.75")
            .attr("fill", "#999");

        // Create edges
        const links = container.append("g")
            .selectAll<SVGLineElement, D3Link>("line")
            .data(d3Links)
            .join("line")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", 1)
            .attr("marker-end", "url(#arrowhead)");

        // Create nodes
        const nodes = container.append("g")
            .selectAll<SVGGElement, D3Node>("g")
            .data(d3Nodes)
            .join("g")
            .call(d3.drag<SVGGElement, D3Node>()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended) as any)
            .on("click", (event, d) => {
                event.stopPropagation();
                if (selectedNode === d.id) {
                    setSelectedNode(null);
                    setSelectedNodeInfo(null);
                } else {
                    setSelectedNode(d.id);
                    setSelectedNodeInfo({
                        id: d.id,
                        label: d.label,
                        color: d.color,
                        properties: d.properties
                    });
                }
            });

        // Add circles for nodes
        nodes.append("circle")
            .attr("r", 15)
            .attr("fill", d => d.color || "#2563EB");

        // Add labels
        nodes.append("text")
            .text(d => d.properties.name || d.properties.id || d.label)
            .attr("text-anchor", "middle")
            .attr("dy", 25)
            .attr("fill", "#666")
            .style("font-size", "12px");

        // Click on background to clear selection
        svg.on("click", () => {
            setSelectedNode(null);
            setSelectedNodeInfo(null);
        });

        // Update force simulation
        simulation
            .nodes(d3Nodes)
            .on("tick", () => {
                links
                    .attr("x1", d => (d.source as D3Node).x!)
                    .attr("y1", d => (d.source as D3Node).y!)
                    .attr("x2", d => {
                        const dx = (d.target as D3Node).x! - (d.source as D3Node).x!;
                        const dy = (d.target as D3Node).y! - (d.source as D3Node).y!;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        return (d.source as D3Node).x! + (dx / length) * (length - 20);
                    })
                    .attr("y2", d => {
                        const dx = (d.target as D3Node).x! - (d.source as D3Node).x!;
                        const dy = (d.target as D3Node).y! - (d.source as D3Node).y!;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        return (d.source as D3Node).y! + (dy / length) * (length - 20);
                    });

                nodes.attr("transform", d => `translate(${d.x},${d.y})`);
            });

        (simulation.force("link") as d3.ForceLink<D3Node, D3Link>)
            .links(d3Links);

        // Store references for updates
        simulationRef.current = {
            simulation,
            nodes,
            links,
            d3Nodes,
            d3Links
        };

        // Initial visual update
        updateVisuals();

        // Drag functions
        function dragstarted(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        // Cleanup
        return () => {
            simulation.stop();
            simulationRef.current = null;
        };
    }, [dbNodes, dbEdges, width, height]); // Removed selectedNode from dependencies

    if (nodesLoading || edgesLoading || !width || !height) {
        return <div>Loading... width: {width} height: {height}</div>;
    }

    return (
        <div className="w-full h-full overflow-hidden relative">
            <svg ref={svgRef} width="100%" height={height} style={{ display: 'block' }} />
            {selectedNodeInfo && <InfoPanel node={selectedNodeInfo} />}
        </div>
    );
}