'use client';

import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type {
  ClientPillar,
  ClientPillarKpi,
  FocusArea,
  Strategy,
  Project,
  Task,
  ClientGoal,
  GoalPillarLink,
  Outcome,
  StrategyGoalLink,
} from '@/lib/data';
import { layoutPlanGraph } from './planLayout';

interface PlanGraphInput {
  clientId: string;
  clientName: string;
  year: number;
  CLIENT_PILLARS: ClientPillar[];
  CLIENT_PILLAR_KPIS: ClientPillarKpi[];
  FOCUS_AREAS: FocusArea[];
  STRATEGIES: Strategy[];
  PROJECTS: Project[];
  TASKS: Task[];
  CLIENT_GOALS: ClientGoal[];
  GOAL_PILLAR_LINKS: GoalPillarLink[];
  STRATEGY_GOAL_LINKS: StrategyGoalLink[];
  OUTCOMES: Outcome[];
}

function makeEdge(
  source: string,
  target: string,
  color: string,
  dashed = false,
  options?: {
    sourceHandle?: string;
    targetHandle?: string;
    crossRef?: boolean;
  },
): Edge {
  return {
    id: `${source}->${target}${options?.sourceHandle ? `-${options.sourceHandle}` : ''}`,
    source,
    target,
    sourceHandle: options?.sourceHandle,
    targetHandle: options?.targetHandle,
    type: 'smoothstep',
    animated: !dashed,
    style: {
      stroke: dashed ? '#94a3b8' : color,
      strokeWidth: dashed ? 1.5 : 2,
      strokeDasharray: dashed ? '5 4' : undefined,
    },
    data: { dashed, crossRef: options?.crossRef ?? false },
  };
}

const STRATEGY_STATUS_ORDER: Record<string, number> = {
  active: 0,
  queued: 1,
  draft: 2,
  complete: 3,
};

export function usePlanGraph({
  clientId,
  clientName,
  year,
  CLIENT_PILLARS,
  CLIENT_PILLAR_KPIS,
  FOCUS_AREAS,
  STRATEGIES,
  PROJECTS,
  TASKS,
  CLIENT_GOALS,
  GOAL_PILLAR_LINKS,
  STRATEGY_GOAL_LINKS,
  OUTCOMES,
}: PlanGraphInput): { nodes: Node[]; edges: Edge[] } {
  return useMemo(() => {
    const nodes: Node[] = [];
    // Collect edges in two buckets:
    // - treeEdges: solid edges that participate in layout
    // - crossRefEdges: dashed horizontal edges added AFTER layout
    const treeEdges: Edge[] = [];
    const crossRefEdges: Edge[] = [];

    // goalParentMap: maps outcome node id → parent goal node id
    // (used by planLayout for outcome positioning)
    const goalParentMap = new Map<string, string>();

    // ── 1. Root Node ──────────────────────────────────────────────────────────
    nodes.push({
      id: 'root',
      type: 'planRoot',
      position: { x: 0, y: 0 },
      data: { label: clientName, year },
    });

    // ── 2. Strategies ─────────────────────────────────────────────────────────
    const strategies = STRATEGIES
      .filter(s => s.clientId === clientId)
      .sort((a, b) => (STRATEGY_STATUS_ORDER[a.status] ?? 99) - (STRATEGY_STATUS_ORDER[b.status] ?? 99));

    // Track initiative nodes built per project id (for cross-ref edges)
    // projectId → array of node IDs (since a project can appear once per strategy/pillar combo)
    const initiativeNodesByProjectId = new Map<string, string[]>();

    strategies.forEach(strategy => {
      const isActive = strategy.status === 'active';
      const stratNodeId = `strategy-${strategy.id}`;

      nodes.push({
        id: stratNodeId,
        type: 'planStrategy',
        position: { x: 0, y: 0 },
        data: { strategy, dimmed: !isActive },
      });

      // Root → Strategy (vertical, top-to-bottom)
      treeEdges.push(makeEdge('root', stratNodeId, '#4f46e5', false, {
        sourceHandle: 'source',
        targetHandle: 'target-top',
      }));

      // ── 3. Pillars under this strategy ───────────────────────────────────
      const stratProjects = PROJECTS.filter(
        p => p.clientId === clientId && p.strategyId === strategy.id,
      );

      const pillarIdSet = new Set<string>();
      const unassignedProjects: Project[] = [];

      stratProjects.forEach(p => {
        if (p.clientPillarId) {
          pillarIdSet.add(p.clientPillarId);
        } else {
          unassignedProjects.push(p);
        }
      });

      pillarIdSet.forEach(pillarId => {
        const pillar = CLIENT_PILLARS.find(p => p.id === pillarId);
        if (!pillar) return;

        const kpis = CLIENT_PILLAR_KPIS.filter(k => k.clientPillarId === pillarId);
        const focusAreas = FOCUS_AREAS.filter(
          fa => fa.pillarId === pillarId && fa.clientId === clientId,
        );
        const pillarNodeId = `pillar-${pillar.id}-strat-${strategy.id}`;

        nodes.push({
          id: pillarNodeId,
          type: 'planPillar',
          position: { x: 0, y: 0 },
          data: {
            pillar,
            kpiCount: kpis.length,
            focusAreaCount: focusAreas.length,
            dimmed: !isActive,
          },
        });

        // Strategy BOTTOM → Pillar TOP
        treeEdges.push(makeEdge(stratNodeId, pillarNodeId, '#6366f1', false, {
          sourceHandle: 'source-bottom',
          targetHandle: 'target',
        }));

        if (isActive) {
          // ── Get all projects for this pillar ─────────────────────────────
          const pillarProjects = stratProjects.filter(p => p.clientPillarId === pillarId);

          // ── Group initiatives by focusAreaId ────────────────────────────
          const initiativesByFocusAreaId = new Map<string | null, Project[]>();
          
          pillarProjects.forEach(proj => {
            const faId = proj.focusAreaId ?? null;
            if (!initiativesByFocusAreaId.has(faId)) {
              initiativesByFocusAreaId.set(faId, []);
            }
            initiativesByFocusAreaId.get(faId)!.push(proj);
          });

          // ── Create focus area nodes and their initiatives ────────────────
          focusAreas.forEach(fa => {
            const faNodeId = `fa-${fa.id}-strat-${strategy.id}`;
            nodes.push({
              id: faNodeId,
              type: 'planFocusArea',
              position: { x: 0, y: 0 },
              data: { focusArea: fa },
            });
            // Pillar → Focus Area
            treeEdges.push(makeEdge(pillarNodeId, faNodeId, '#14b8a6'));

            // ── Initiatives UNDER this focus area ────────────────────────
            const initiativesInFA = initiativesByFocusAreaId.get(fa.id) ?? [];
            initiativesInFA.forEach(proj => {
              const projNodeId = `proj-${proj.id}-strat-${strategy.id}-pillar-${pillarId}`;
              const taskCount = (proj.taskIds ?? []).length;

              nodes.push({
                id: projNodeId,
                type: 'planInitiative',
                position: { x: 0, y: 0 },
                data: { project: proj, taskCount, hasGoalLink: false },
              });
              // Focus Area → Initiative
              treeEdges.push(makeEdge(faNodeId, projNodeId, '#3b82f6', false, {
                sourceHandle: 'source',
                targetHandle: 'target-top',
              }));

              // Track this initiative node by project id
              const existing = initiativeNodesByProjectId.get(proj.id) ?? [];
              existing.push(projNodeId);
              initiativeNodesByProjectId.set(proj.id, existing);

              // ── Tasks ──────────────────────────────────────────────────
              const projectTasks = TASKS.filter(t => (proj.taskIds ?? []).includes(t.id));
              projectTasks.forEach(task => {
                const taskNodeId = `task-${task.id}-proj-${proj.id}-strat-${strategy.id}`;
                nodes.push({
                  id: taskNodeId,
                  type: 'planTask',
                  position: { x: 0, y: 0 },
                  data: { task },
                });
                treeEdges.push(makeEdge(projNodeId, taskNodeId, '#64748b'));
              });
            });
          });

          // ── Initiatives WITHOUT a focus area (direct pillar children) ────
          const initiativesWithoutFA = initiativesByFocusAreaId.get(null) ?? [];
          initiativesWithoutFA.forEach(proj => {
            const projNodeId = `proj-${proj.id}-strat-${strategy.id}-pillar-${pillarId}`;
            const taskCount = (proj.taskIds ?? []).length;

            nodes.push({
              id: projNodeId,
              type: 'planInitiative',
              position: { x: 0, y: 0 },
              data: { project: proj, taskCount, hasGoalLink: false },
            });
            // Pillar → Initiative (direct, when no focus area)
            treeEdges.push(makeEdge(pillarNodeId, projNodeId, '#3b82f6', false, {
              sourceHandle: 'source',
              targetHandle: 'target-top',
            }));

            // Track this initiative node by project id
            const existing = initiativeNodesByProjectId.get(proj.id) ?? [];
            existing.push(projNodeId);
            initiativeNodesByProjectId.set(proj.id, existing);

            // ── Tasks ──────────────────────────────────────────────────
            const projectTasks = TASKS.filter(t => (proj.taskIds ?? []).includes(t.id));
            projectTasks.forEach(task => {
              const taskNodeId = `task-${task.id}-proj-${proj.id}-strat-${strategy.id}`;
              nodes.push({
                id: taskNodeId,
                type: 'planTask',
                position: { x: 0, y: 0 },
                data: { task },
              });
              treeEdges.push(makeEdge(projNodeId, taskNodeId, '#64748b'));
            });
          });
        }
      });

      // ── Unassigned initiatives ────────────────────────────────────────────
      if (isActive && unassignedProjects.length > 0) {
        const unassignedNodeId = `unassigned-pillar-strat-${strategy.id}`;
        nodes.push({
          id: unassignedNodeId,
          type: 'planPillar',
          position: { x: 0, y: 0 },
          data: {
            pillar: {
              id: `__unassigned__${strategy.id}`,
              clientId,
              name: 'Unassigned',
              color: '#94a3b8',
              description: 'Initiatives not yet assigned to a pillar',
              createdAt: '',
            },
            kpiCount: 0,
            focusAreaCount: 0,
            dimmed: false,
          },
        });
        treeEdges.push(makeEdge(stratNodeId, unassignedNodeId, '#94a3b8', false, {
          sourceHandle: 'source-bottom',
          targetHandle: 'target',
        }));

        unassignedProjects.forEach(proj => {
          const projNodeId = `proj-${proj.id}-strat-${strategy.id}-unassigned`;
          const taskCount = (proj.taskIds ?? []).length;
          nodes.push({
            id: projNodeId,
            type: 'planInitiative',
            position: { x: 0, y: 0 },
            data: { project: proj, taskCount, hasGoalLink: false },
          });
          treeEdges.push(makeEdge(unassignedNodeId, projNodeId, '#3b82f6', false, {
            sourceHandle: 'source',
            targetHandle: 'target-top',
          }));

          const existing = initiativeNodesByProjectId.get(proj.id) ?? [];
          existing.push(projNodeId);
          initiativeNodesByProjectId.set(proj.id, existing);

          const projectTasks = TASKS.filter(t => (proj.taskIds ?? []).includes(t.id));
          projectTasks.forEach(task => {
            const taskNodeId = `task-${task.id}-proj-${proj.id}-unassigned`;
            nodes.push({
              id: taskNodeId,
              type: 'planTask',
              position: { x: 0, y: 0 },
              data: { task },
            });
            treeEdges.push(makeEdge(projNodeId, taskNodeId, '#64748b'));
          });
        });
      }
    });

    // ── 4. Goals — lateral column off strategy's LEFT handle ─────────────────
    // Find active strategy node id
    const activeStrategy = strategies.find(s => s.status === 'active');
    const activeStratNodeId = activeStrategy ? `strategy-${activeStrategy.id}` : null;

    const goals = CLIENT_GOALS.filter(g => g.clientId === clientId);

    // Set of initiative node IDs that have goal cross-refs (to enable their left handle)
    const initiativeNodesWithGoalLink = new Set<string>();

    goals.forEach(goal => {
      const goalNodeId = `goal-${goal.id}`;

      // Get linked outcomes and initiatives for progress calculation
      const linkedOutcomes = OUTCOMES.filter(o => o.goalId === goal.id && o.clientId === clientId);
      const linkedPillarIds = GOAL_PILLAR_LINKS
        .filter(l => l.goalId === goal.id)
        .map(l => l.pillarId);
      const linkedInitiatives = PROJECTS.filter(p =>
        p.clientId === clientId &&
        p.clientPillarId &&
        linkedPillarIds.includes(p.clientPillarId),
      );

      nodes.push({
        id: goalNodeId,
        type: 'planGoal',
        position: { x: 0, y: 0 },
        data: { goal, linkedOutcomes, linkedInitiatives },
      });

      // Strategy ↔ Goal (read from strategy_goal_links table — real persisted edges)
      STRATEGY_GOAL_LINKS
        .filter(l => l.goalId === goal.id)
        .forEach(link => {
          const stratNodeId = `strategy-${link.strategyId}`;
          treeEdges.push(makeEdge(stratNodeId, goalNodeId, '#d97706', false, {
            sourceHandle: 'source-left',
            targetHandle: 'target-left',
          }));
        });

      // ── Cross-reference edges: Goal RIGHT → Initiative LEFT ───────────────
      // Find which initiatives this goal drives:
      // 1. Via goal_pillar_links → pillars → projects under those pillars in active strategy
      const drivenProjectIds = new Set<string>();

      if (activeStrategy) {
        PROJECTS
          .filter(p =>
            p.clientId === clientId &&
            p.strategyId === activeStrategy.id &&
            p.clientPillarId &&
            linkedPillarIds.includes(p.clientPillarId),
          )
          .forEach(p => drivenProjectIds.add(p.id));
      }

      // 2. Also via outcomes.initiative_id
      OUTCOMES
        .filter(o => o.goalId === goal.id && o.clientId === clientId && o.initiativeId)
        .forEach(o => {
          if (o.initiativeId) drivenProjectIds.add(o.initiativeId);
        });

      // Create dashed cross-ref edges for each driven project
      drivenProjectIds.forEach(projId => {
        const projNodeIds = initiativeNodesByProjectId.get(projId) ?? [];
        projNodeIds.forEach(projNodeId => {
          initiativeNodesWithGoalLink.add(projNodeId);
          crossRefEdges.push(makeEdge(goalNodeId, projNodeId, '#d97706', true, {
            sourceHandle: 'source-right',
            targetHandle: 'target-left',
            crossRef: true,
          }));
        });
      });

      // ── Outcomes below this goal ──────────────────────────────────────────
      const outcomes = OUTCOMES.filter(o => o.goalId === goal.id && o.clientId === clientId);
      outcomes.forEach(outcome => {
        const outcomeNodeId = `outcome-${outcome.id}`;
        goalParentMap.set(outcomeNodeId, goalNodeId);

        nodes.push({
          id: outcomeNodeId,
          type: 'planOutcome',
          position: { x: 0, y: 0 },
          data: { outcome },
        });

        // Solid edge goal → outcome (vertical, within goal column)
        treeEdges.push(makeEdge(goalNodeId, outcomeNodeId, '#10b981'));

        // Dashed traceability: outcome → linked initiative
        if (outcome.initiativeId) {
          const projNodeIds = initiativeNodesByProjectId.get(outcome.initiativeId) ?? [];
          projNodeIds.forEach(projNodeId => {
            crossRefEdges.push(makeEdge(outcomeNodeId, projNodeId, '#10b981', true, {
              crossRef: true,
            }));
          });
        }

        // Dashed traceability: outcome → linked pillar
        if (outcome.pillarId && activeStrategy) {
          const pillarNode = nodes.find(
            n =>
              n.type === 'planPillar' &&
              (n.data as Record<string, unknown> & { pillar?: { id?: string } })?.pillar?.id === outcome.pillarId &&
              !String(n.id).includes('unassigned'),
          );
          if (pillarNode) {
            crossRefEdges.push(makeEdge(outcomeNodeId, pillarNode.id, '#10b981', true, {
              crossRef: true,
            }));
          }
        }
      });
    });

    // Patch hasGoalLink on initiative nodes that have cross-refs
    initiativeNodesWithGoalLink.forEach(nodeId => {
      const idx = nodes.findIndex(n => n.id === nodeId);
      if (idx !== -1) {
        nodes[idx] = {
          ...nodes[idx],
          data: { ...nodes[idx].data, hasGoalLink: true },
        };
      }
    });

    // ── Pass 1+2 layout, then add cross-ref edges (Pass 3) ─────────────────
    const { nodes: laidOutNodes, edges: laidOutEdges } = layoutPlanGraph(
      nodes,
      treeEdges,
      goalParentMap,
    );

    return {
      nodes: laidOutNodes,
      edges: [...laidOutEdges, ...crossRefEdges],
    };
  }, [
    clientId,
    clientName,
    year,
    CLIENT_PILLARS,
    CLIENT_PILLAR_KPIS,
    FOCUS_AREAS,
    STRATEGIES,
    PROJECTS,
    TASKS,
    CLIENT_GOALS,
    GOAL_PILLAR_LINKS,
    STRATEGY_GOAL_LINKS,
    OUTCOMES,
  ]);
}
