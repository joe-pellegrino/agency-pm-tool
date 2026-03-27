import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

const NODE_WIDTHS: Record<string, number> = {
  planRoot: 220,
  planPillar: 200,
  planFocusArea: 180,
  planStrategy: 200,
  planInitiative: 200,
  planTask: 175,
  planGoal: 190,
  planOutcome: 190,
};

const NODE_HEIGHTS: Record<string, number> = {
  planRoot: 60,
  planPillar: 80,
  planFocusArea: 60,
  planStrategy: 70,
  planInitiative: 80,
  planTask: 65,
  planGoal: 70,
  planOutcome: 70,
};

export function layoutPlanGraph(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 70, nodesep: 30, marginx: 40, marginy: 40 });

  nodes.forEach(n => {
    const w = NODE_WIDTHS[n.type ?? ''] ?? 200;
    const h = NODE_HEIGHTS[n.type ?? ''] ?? 60;
    g.setNode(n.id, { width: w, height: h });
  });

  // Only use solid (non-dashed) edges for layout to avoid circular positioning
  edges
    .filter(e => !e.data?.dashed)
    .forEach(e => g.setEdge(e.source, e.target));

  dagre.layout(g);

  const laidOutNodes = nodes.map(n => {
    const pos = g.node(n.id);
    const w = NODE_WIDTHS[n.type ?? ''] ?? 200;
    const h = NODE_HEIGHTS[n.type ?? ''] ?? 60;
    return {
      ...n,
      position: {
        x: (pos?.x ?? 0) - w / 2,
        y: (pos?.y ?? 0) - h / 2,
      },
    };
  });

  return { nodes: laidOutNodes, edges };
}
