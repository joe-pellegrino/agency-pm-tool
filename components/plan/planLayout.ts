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

/** Nodes that belong to the vertical execution tree (fed into dagre). */
const VERTICAL_TREE_TYPES = new Set([
  'planRoot',
  'planStrategy',
  'planPillar',
  'planFocusArea',
  'planInitiative',
  'planTask',
]);

/** Nodes placed manually to the left of the strategy node. */
const GOAL_COLUMN_TYPES = new Set(['planGoal', 'planOutcome']);

export function layoutPlanGraph(
  nodes: Node[],
  edges: Edge[],
  goalParentMap: Map<string, string>, // goalId → parentGoalId (for outcomes)
): { nodes: Node[]; edges: Edge[] } {

  // ── Pass 1: Dagre layout for the vertical execution tree ─────────────────
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 70, nodesep: 30, marginx: 40, marginy: 40 });

  // Only add vertical-tree nodes to dagre
  const treeNodes = nodes.filter(n => VERTICAL_TREE_TYPES.has(n.type ?? ''));
  const goalNodes = nodes.filter(n => GOAL_COLUMN_TYPES.has(n.type ?? ''));

  treeNodes.forEach(n => {
    const w = NODE_WIDTHS[n.type ?? ''] ?? 200;
    const h = NODE_HEIGHTS[n.type ?? ''] ?? 60;
    g.setNode(n.id, { width: w, height: h });
  });

  // Only solid (non-dashed) edges between tree nodes feed into dagre
  edges
    .filter(e => !e.data?.dashed && !e.data?.crossRef)
    .forEach(e => {
      const srcIsTree = VERTICAL_TREE_TYPES.has(nodes.find(n => n.id === e.source)?.type ?? '');
      const tgtIsTree = VERTICAL_TREE_TYPES.has(nodes.find(n => n.id === e.target)?.type ?? '');
      if (srcIsTree && tgtIsTree) {
        g.setEdge(e.source, e.target);
      }
    });

  dagre.layout(g);

  // Apply dagre positions to tree nodes
  const treeNodeMap = new Map<string, Node>();
  treeNodes.forEach(n => {
    const pos = g.node(n.id);
    const w = NODE_WIDTHS[n.type ?? ''] ?? 200;
    const h = NODE_HEIGHTS[n.type ?? ''] ?? 60;
    const laid: Node = {
      ...n,
      position: {
        x: (pos?.x ?? 0) - w / 2,
        y: (pos?.y ?? 0) - h / 2,
      },
    };
    treeNodeMap.set(n.id, laid);
  });

  // ── Pass 2: Manual positioning for goal column ────────────────────────────
  // Find the active strategy node (the one that has a source-left handle)
  const activeStrategyNode = treeNodes.find(
    n => n.type === 'planStrategy' && !(n.data as Record<string, unknown>)?.dimmed,
  );

  const stratPos = activeStrategyNode
    ? treeNodeMap.get(activeStrategyNode.id)?.position ?? { x: 0, y: 200 }
    : { x: 0, y: 200 };

  const GOAL_COLUMN_X_OFFSET = 380; // px to the left of strategy node
  const GOAL_SPACING = 90; // vertical spacing between goals
  const OUTCOME_SPACING = 80; // vertical spacing between outcomes below their goal

  // Separate goals from outcomes
  const topLevelGoals = goalNodes.filter(n => n.type === 'planGoal');
  const outcomeNodes = goalNodes.filter(n => n.type === 'planOutcome');

  const goalNodeMap = new Map<string, Node>();
  const goalW = NODE_WIDTHS['planGoal'] ?? 190;
  const outcomeW = NODE_WIDTHS['planOutcome'] ?? 190;
  const outcomeH = NODE_HEIGHTS['planOutcome'] ?? 70;

  // Position goals in a column to the LEFT of the strategy node
  let currentY = stratPos.y;

  topLevelGoals.forEach((goalNode, idx) => {
    const goalH = NODE_HEIGHTS['planGoal'] ?? 70;
    const positioned: Node = {
      ...goalNode,
      position: {
        x: stratPos.x - GOAL_COLUMN_X_OFFSET,
        y: currentY + idx * GOAL_SPACING,
      },
    };
    goalNodeMap.set(goalNode.id, positioned);

    // Position outcomes below this goal
    const parentGoalId = goalNode.id; // e.g. "goal-abc123"
    const childOutcomes = outcomeNodes.filter(
      o => goalParentMap.get(o.id) === parentGoalId,
    );
    childOutcomes.forEach((outcomeNode, oIdx) => {
      const outcomeY = currentY + idx * GOAL_SPACING + goalH + 20 + oIdx * OUTCOME_SPACING;
      goalNodeMap.set(outcomeNode.id, {
        ...outcomeNode,
        position: {
          x: stratPos.x - GOAL_COLUMN_X_OFFSET + (goalW - outcomeW) / 2,
          y: outcomeY,
        },
      });
    });

    // Advance currentY by outcomes height if any
    if (childOutcomes.length > 0) {
      currentY += childOutcomes.length * OUTCOME_SPACING + outcomeH;
    }
  });

  // ── Merge all positioned nodes ────────────────────────────────────────────
  const laidOutNodes = nodes.map(n => {
    return treeNodeMap.get(n.id) ?? goalNodeMap.get(n.id) ?? n;
  });

  return { nodes: laidOutNodes, edges };
}
