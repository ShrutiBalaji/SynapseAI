"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import Link from "next/link";
import * as d3 from "d3";

interface GraphNode {
  id: string;
  type: 'problem' | 'conjecture' | 'criticism' | 'artifact' | 'conversation';
  label: string;
  x?: number;
  y?: number;
  data: any;
  connections: string[];
  fx?: number | null;
  fy?: number | null;
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'belongs_to' | 'criticizes' | 'supports' | 'discusses' | 'related_to';
}

export default function GraphPage() {
  const { problems, conjectures, criticisms, artifacts, conversations, fetchAllConjectures, fetchAllCriticisms, fetchAllArtifacts } = useApp();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);
  const generateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>('');

  // Load all data when component mounts (only once)
  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([
          fetchAllConjectures(),
          fetchAllCriticisms(),
          fetchAllArtifacts()
        ]);
        setDataLoaded(true);
      } catch (error) {
        console.error("Error loading data:", error);
        setDataLoaded(true); // Still set to true to prevent infinite loading
      }
    };
    loadAllData();
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    if (dataLoaded) {
      // Create a hash of the current data to check if it has actually changed
      const currentDataHash = JSON.stringify({
        problems: problems.length,
        conjectures: conjectures.length,
        criticisms: criticisms.length,
        artifacts: artifacts.length,
        conversations: conversations.length
      });
      
      // Only regenerate if data has actually changed
      if (currentDataHash !== lastDataRef.current) {
        lastDataRef.current = currentDataHash;
        
        // Clear any existing timeout
        if (generateTimeoutRef.current) {
          clearTimeout(generateTimeoutRef.current);
        }
        
        // Debounce the graph generation to prevent rapid re-renders
        generateTimeoutRef.current = setTimeout(() => {
    generateGraph();
        }, 100);
      }
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (generateTimeoutRef.current) {
        clearTimeout(generateTimeoutRef.current);
      }
    };
  }, [problems, conjectures, criticisms, artifacts, conversations, dataLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateGraph = useCallback(() => {
    setIsLoading(true);
    
    const newNodes: GraphNode[] = [];
    const newEdges: GraphEdge[] = [];
    
    // Create problem nodes (central nodes)
    problems.forEach((problem) => {
      newNodes.push({
        id: `problem-${problem.id}`,
        type: 'problem',
        label: `🎯 ${problem.title}`,
        data: problem,
        connections: []
      });
    });

    // Create conversation nodes
    conversations.forEach((conversation) => {
      newNodes.push({
        id: `conversation-${conversation.id}`,
        type: 'conversation',
        label: `💬 ${conversation.title}`,
        data: conversation,
        connections: []
      });

      // Link conversations to problems if they have a problem_id
      if (conversation.problem_id) {
        newEdges.push({
          source: `conversation-${conversation.id}`,
          target: `problem-${conversation.problem_id}`,
          type: 'discusses'
        });
      }
    });

    // Create conjecture nodes
    conjectures.forEach((conjecture) => {
      newNodes.push({
        id: `conjecture-${conjecture.id}`,
        type: 'conjecture',
        label: `💡 ${conjecture.content.substring(0, 25)}${conjecture.content.length > 25 ? '...' : ''}`,
        data: conjecture,
        connections: []
      });
      
      newEdges.push({
        source: `conjecture-${conjecture.id}`,
        target: `problem-${conjecture.problem_id}`,
        type: 'belongs_to'
      });
    });

    // Create criticism nodes
    criticisms.forEach((criticism) => {
      newNodes.push({
        id: `criticism-${criticism.id}`,
        type: 'criticism',
        label: `⚠️ ${criticism.content.substring(0, 25)}${criticism.content.length > 25 ? '...' : ''}`,
        data: criticism,
        connections: []
      });
      
      newEdges.push({
        source: `criticism-${criticism.id}`,
        target: `problem-${criticism.problem_id}`,
        type: 'criticizes'
      });
    });

    // Create deduplicated artifact nodes
    const artifactMap = new Map<string, { artifact: any, problemIds: number[] }>();
    
    artifacts.forEach((artifact) => {
      // Use filename as the key for deduplication
      const key = artifact.name.toLowerCase().trim();
      
      if (artifactMap.has(key)) {
        // Add this problem to the existing artifact
        artifactMap.get(key)!.problemIds.push(artifact.problem_id);
      } else {
        // Create new artifact entry
        artifactMap.set(key, {
          artifact,
          problemIds: [artifact.problem_id]
        });
      }
    });

    // Create nodes and edges for deduplicated artifacts
    artifactMap.forEach(({ artifact, problemIds }, key) => {
      const artifactNodeId = `artifact-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
      
      newNodes.push({
        id: artifactNodeId,
        type: 'artifact',
        label: `📎 ${artifact.name}`,
        data: {
          ...artifact,
          problemIds, // Store all problem IDs this artifact is connected to
          isDeduplicated: problemIds.length > 1
        },
        connections: []
      });
      
      // Create edges to all connected problems
      problemIds.forEach(problemId => {
      newEdges.push({
          source: artifactNodeId,
          target: `problem-${problemId}`,
        type: 'supports'
        });
      });
    });

    // Enhanced similarity detection for problems
    problems.forEach((problem, index) => {
      problems.slice(index + 1).forEach((otherProblem) => {
        const similarity = calculateEnhancedSimilarity(problem.title, otherProblem.title);
        if (similarity > 0.2) { // Lowered threshold for better connections
          newEdges.push({
            source: `problem-${problem.id}`,
            target: `problem-${otherProblem.id}`,
            type: 'related_to'
          });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setIsLoading(false);
  }, [problems, conjectures, criticisms, artifacts, conversations]);

  const calculateSimilarity = (str1: string, str2: string): number => {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  };

  const calculateEnhancedSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    // Check for exact match
    if (s1 === s2) return 1.0;
    
    // Check for substring matches (e.g., "chat disappearing" vs "where is the chat disappearing")
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Remove common words and check similarity
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must'];
    
    const words1 = s1.split(/\s+/).filter(word => !commonWords.includes(word) && word.length > 2);
    const words2 = s2.split(/\s+/).filter(word => !commonWords.includes(word) && word.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    const jaccardSimilarity = intersection.length / union.length;
    
    // Check for semantic similarity (e.g., "disappearing" vs "disappears")
    const semanticBonus = intersection.some(word => {
      const otherWords = words1.includes(word) ? words2 : words1;
      return otherWords.some(otherWord => 
        word.includes(otherWord) || otherWord.includes(word) ||
        (word.endsWith('ing') && otherWord.endsWith('s')) ||
        (word.endsWith('s') && otherWord.endsWith('ing'))
      );
    }) ? 0.2 : 0;
    
    return Math.min(1.0, jaccardSimilarity + semanticBonus);
  };

  useEffect(() => {
    if (nodes.length === 0 || !containerRef.current || !svgRef.current) return;

    const containerElement = containerRef.current;
    const width = containerElement.clientWidth;
    const height = containerElement.clientHeight;

    // Clear previous simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphEdge>(edges)
        .id((d: GraphNode) => d.id)
        .distance(100)
        .strength(0.1)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(20));

    simulationRef.current = simulation;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .style("background", "#0f1117");

    // Clear previous content
    svg.selectAll("*").remove();

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        svgContainer.attr("transform", event.transform.toString());
      });

    svg.call(zoom as any);

    // Create container for zoomable content
    const svgContainer = svg.append("g");

    // Create edges
    const link = svgContainer.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", (d: GraphEdge) => {
        switch (d.type) {
          case 'belongs_to': return '#22d3ee'; // Cyan for conjectures
          case 'criticizes': return '#f59e0b'; // Amber for criticisms
          case 'supports': return '#10b981'; // Emerald for artifacts
          case 'discusses': return '#a855f7'; // Purple for conversations
          case 'related_to': return '#6b7280'; // Gray for related problems
          default: return '#374151';
        }
      })
      .attr("stroke-opacity", 0.7)
      .attr("stroke-width", (d: GraphEdge) => {
        return d.type === 'related_to' ? 1 : 2; // Thicker lines for direct relationships
      });

    // Create nodes
    const node = svgContainer.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // Add circles to nodes
    node.append("circle")
      .attr("r", (d: GraphNode) => getNodeSize(d.type))
      .attr("fill", (d: GraphNode) => getNodeColor(d.type))
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 2)
      .on("mouseover", function(event: MouseEvent, d: GraphNode) {
        setHoveredNode(d);
        d3.select(this as SVGCircleElement)
          .transition()
          .duration(200)
          .attr("r", getNodeSize(d.type) * 1.3);
      })
      .on("mouseout", function(event: MouseEvent, d: GraphNode) {
        setHoveredNode(null);
        d3.select(this as SVGCircleElement)
          .transition()
          .duration(200)
          .attr("r", getNodeSize(d.type));
      })
      .on("click", function(event: MouseEvent, d: GraphNode) {
        setSelectedNode(d);
      });

    // Add labels to nodes
    node.append("text")
      .attr("dy", (d: GraphNode) => getNodeSize(d.type) + 15)
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", "10px")
      .attr("font-family", "system-ui, sans-serif")
      .text((d: GraphNode) => d.label.length > 20 ? d.label.substring(0, 20) + "..." : d.label)
      .style("pointer-events", "none");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: GraphEdge) => (d.source as unknown as GraphNode).x!)
        .attr("y1", (d: GraphEdge) => (d.source as unknown as GraphNode).y!)
        .attr("x2", (d: GraphEdge) => (d.target as unknown as GraphNode).x!)
        .attr("y2", (d: GraphEdge) => (d.target as unknown as GraphNode).y!);

      node
        .attr("transform", (d: GraphNode) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [nodes, edges]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'problem': return '#9ecbff'; // Light blue
      case 'conjecture': return '#22d3ee'; // Cyan
      case 'criticism': return '#f59e0b'; // Amber
      case 'artifact': return '#10b981'; // Emerald
      case 'conversation': return '#a855f7'; // Purple
      default: return '#94a3b8'; // Slate
    }
  };

  const getNodeSize = (type: string) => {
    switch (type) {
      case 'problem': return 12;
      case 'conjecture': return 8;
      case 'criticism': case 'artifact': case 'conversation': return 8;
      default: return 6;
    }
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#9ecbff] border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-[#94a3b8]">Generating knowledge graph...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0f1117]">
      {/* Header */}
      <div className="border-b border-white/10 p-3 bg-[#0f1117]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#e2e8f0] mb-1">Knowledge Graph</h1>
            <p className="text-xs text-[#94a3b8]">
              Interactive visualization of problems, conversations, conjectures, criticisms, and artifacts
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#9ecbff]"></div>
              <span className="text-[#94a3b8]">Problems ({problems.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#22d3ee]"></div>
              <span className="text-[#94a3b8]">Conjectures ({conjectures.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
              <span className="text-[#94a3b8]">Criticisms ({criticisms.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
              <span className="text-[#94a3b8]">Artifacts ({artifacts.length})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Visualization */}
      <div className="flex-1 relative" ref={containerRef}>
        <svg ref={svgRef} className="w-full h-full" />
        
        {/* Hover Tooltip */}
        {hoveredNode && (
          <div className="absolute pointer-events-none z-10 bg-[#1f2937] border border-white/20 rounded-lg p-3 shadow-lg max-w-xs">
            <div className="text-sm font-medium text-[#e2e8f0] mb-1 capitalize">
              {hoveredNode.type}
            </div>
            <div className="text-xs text-[#94a3b8]">
              {hoveredNode.label}
            </div>
            {hoveredNode.data && (
              <div className="text-xs text-[#9ecbff] mt-1">
                {hoveredNode.type === 'problem' && hoveredNode.data.description && 
                  hoveredNode.data.description.substring(0, 100) + (hoveredNode.data.description.length > 100 ? '...' : '')
                }
                {hoveredNode.type === 'conversation' && hoveredNode.data.title}
                {hoveredNode.type === 'conjecture' && 
                  `Conjecture: ${hoveredNode.data.content.substring(0, 80)}${hoveredNode.data.content.length > 80 ? '...' : ''}`
                }
                {hoveredNode.type === 'criticism' && 
                  `Criticism: ${hoveredNode.data.content.substring(0, 80)}${hoveredNode.data.content.length > 80 ? '...' : ''}`
                }
                {hoveredNode.type === 'artifact' && 
                  `${hoveredNode.data.name}${hoveredNode.data.isDeduplicated ? ` (shared across ${hoveredNode.data.problemIds.length} problems)` : ''}`
                }
              </div>
            )}
          </div>
        )}

        {/* Node Details Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 bg-[#1f2937] border border-white/20 rounded-lg p-4 shadow-lg z-20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-[#e2e8f0] capitalize">
                {selectedNode.type}
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[#94a3b8] hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-[#9ecbff] mb-1">Title</div>
                <div className="text-sm text-[#e2e8f0]">{selectedNode.label}</div>
              </div>
              
              {selectedNode.data && (
                <>
                  {selectedNode.type === 'problem' && (
                    <div>
                      <div className="text-sm font-medium text-[#9ecbff] mb-1">Description</div>
                      <div className="text-sm text-[#e2e8f0]">
                        {selectedNode.data.description || 'No description'}
                      </div>
                      <div className="text-xs text-[#94a3b8] mt-2">
                        Status: {selectedNode.data.status} • Priority: {selectedNode.data.priority}
                      </div>
                    </div>
                  )}
                  
                  {selectedNode.type === 'conversation' && (
                    <div>
                      <div className="text-sm font-medium text-[#9ecbff] mb-1">Created</div>
                      <div className="text-sm text-[#e2e8f0]">
                        {new Date(selectedNode.data.created_at).toLocaleDateString()}
                      </div>
                      {selectedNode.data.problem_id && (
                        <div className="text-xs text-[#94a3b8] mt-2">
                          Linked to Problem #{selectedNode.data.problem_id}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedNode.type === 'conjecture' && (
                    <div>
                      <div className="text-sm font-medium text-[#9ecbff] mb-1">Conjecture Content</div>
                      <div className="text-sm text-[#e2e8f0] mb-3">{selectedNode.data.content}</div>
                      <div className="text-xs text-[#94a3b8]">
                        Created: {new Date(selectedNode.data.created_at).toLocaleDateString()}
                      </div>
                      {selectedNode.data.profiles && (
                        <div className="text-xs text-[#94a3b8] mt-1">
                          By: {selectedNode.data.profiles.full_name || selectedNode.data.profiles.email}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedNode.type === 'criticism' && (
                    <div>
                      <div className="text-sm font-medium text-[#9ecbff] mb-1">Criticism Content</div>
                      <div className="text-sm text-[#e2e8f0] mb-3">{selectedNode.data.content}</div>
                      <div className="text-xs text-[#94a3b8]">
                        Created: {new Date(selectedNode.data.created_at).toLocaleDateString()}
                      </div>
                      {selectedNode.data.profiles && (
                        <div className="text-xs text-[#94a3b8] mt-1">
                          By: {selectedNode.data.profiles.full_name || selectedNode.data.profiles.email}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedNode.type === 'artifact' && (
                    <div>
                      <div className="text-sm font-medium text-[#9ecbff] mb-1">Name</div>
                      <div className="text-sm text-[#e2e8f0]">{selectedNode.data.name}</div>
                      {selectedNode.data.isDeduplicated && (
                        <div className="text-xs text-[#f59e0b] mt-1">
                          📎 Shared across {selectedNode.data.problemIds.length} problems
                        </div>
                      )}
                      <div className="text-sm font-medium text-[#9ecbff] mb-1 mt-2">URL</div>
                      <a
                        href={selectedNode.data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#22d3ee] hover:text-white break-all"
                      >
                        {selectedNode.data.url}
                      </a>
                    </div>
                  )}
                </>
              )}
              
              <div className="pt-3 border-t border-white/10">
                {selectedNode.type === 'problem' && (
                <Link
                    href={`/problems/${selectedNode.data.id}`}
                  className="block w-full text-center bg-gradient-to-tr from-[#6366f1] to-[#22d3ee] text-white py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    View Problem Details
                  </Link>
                )}
                
                {selectedNode.type === 'conjecture' && (
                  <div className="space-y-2">
                    <div className="text-xs text-[#94a3b8] mb-2">
                      Related to Problem #{selectedNode.data.problem_id}
                    </div>
                    <Link
                      href={`/problems/${selectedNode.data.problem_id}`}
                      className="block w-full text-center bg-gradient-to-tr from-[#22d3ee] to-[#10b981] text-white py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      View Related Problem
                    </Link>
                  </div>
                )}
                
                {selectedNode.type === 'criticism' && (
                  <div className="space-y-2">
                    <div className="text-xs text-[#94a3b8] mb-2">
                      Related to Problem #{selectedNode.data.problem_id}
                    </div>
                    <Link
                      href={`/problems/${selectedNode.data.problem_id}`}
                      className="block w-full text-center bg-gradient-to-tr from-[#f59e0b] to-[#ef4444] text-white py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      View Related Problem
                    </Link>
                  </div>
                )}
                
                {selectedNode.type === 'artifact' && (
                  <div className="space-y-2">
                    {selectedNode.data.isDeduplicated ? (
                      <>
                        <div className="text-xs text-[#94a3b8] mb-2">
                          Shared across {selectedNode.data.problemIds.length} problems
                        </div>
                        <div className="space-y-1">
                          {selectedNode.data.problemIds.slice(0, 3).map((problemId: number) => (
                            <Link
                              key={problemId}
                              href={`/problems/${problemId}`}
                              className="block w-full text-center bg-gradient-to-tr from-[#10b981] to-[#22d3ee] text-white py-1 rounded text-xs font-medium hover:opacity-90 transition-opacity"
                            >
                              Problem #{problemId}
                            </Link>
                          ))}
                          {selectedNode.data.problemIds.length > 3 && (
                            <div className="text-xs text-[#94a3b8] text-center">
                              +{selectedNode.data.problemIds.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs text-[#94a3b8] mb-2">
                          Related to Problem #{selectedNode.data.problem_id}
                        </div>
                        <Link
                          href={`/problems/${selectedNode.data.problem_id}`}
                          className="block w-full text-center bg-gradient-to-tr from-[#10b981] to-[#22d3ee] text-white py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          View Related Problem
                        </Link>
                      </>
                    )}
                  </div>
                )}
                
                {selectedNode.type === 'conversation' && (
                  <div className="space-y-2">
                    {selectedNode.data.problem_id && (
                      <div className="text-xs text-[#94a3b8] mb-2">
                        Linked to Problem #{selectedNode.data.problem_id}
                      </div>
                    )}
                    <Link
                      href={`/problems/${selectedNode.data.problem_id || selectedNode.data.id}`}
                      className="block w-full text-center bg-gradient-to-tr from-[#a855f7] to-[#6366f1] text-white py-2 rounded text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      {selectedNode.data.problem_id ? 'View Related Problem' : 'View Conversation'}
                </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
