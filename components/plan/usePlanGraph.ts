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
  OUTCOMES: Outcome[];
}

function makeEdge(
  source: string,
  target: string,
  color: string,
  dashed = false,
): Edge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    type: 'smoothstep',
    animated: !dashed,
    style: {
      stroke: dashed ? '#94a3b8' : color,
      strokeWidth: dashed ? 1.5 : 2,
      strokeDasharray: dashed ? '5 4' : undefined,
    },
    data: { dashed },
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
  OUTCOMES,
}: PlanGraphInput): { nodes: Node[]; edges: Edge[] } {
  return useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // ── 1. Root Node ─────────────────────────────────────────────────────────
    nodes.push({
      id: 'root',
      type: 'planRoot',
      position: { x: 0, y: 0 },
      data: { label: clientName, year },
    });

    // ── 2. Strategies (sorted: active first, queued, draft, complete) ────────
    const strategies = STRATEGIES
      .filter(s => s.clientId === clientId)
      .sort((a, b) => (STRATEGY_STATUS_ORDER[a.status] ?? 99) - (STRATEGY_STATUS_ORDER[b.status] ?? 99));

    strategies.forEach(strategy => {
      const isActive = strategy.status === 'active';
      const stratNodeId = `strategy-${strategy.id}`;

      nodes.push({
        id: stratNodeId,
        type: 'planStrategy',
        position: { x: 0, y: 0 },
        data: { strategy, dimmed: !isActive },
      });
      edges.push(makeEdge('root', stratNodeId, '#4f46e5'));

      // ── 3. For each strategy: find pillars it touches via projects ─────────
      const stratProjects = PROJECTS.filter(
        p => p.clientId === clientId && p.strategyId === strategy.id,
      );

      // Group projects by clientPillarId
      const pillarIdSet = new Set<string>();
      const unassignedProjects: Project[] = [];

      stratProjects.forEach(p => {
        if (p.clientPillarId) {
          pillarIdSet.add(p.clientPillarId);
        } else {
          unassignedProjects.push(p);
        }
      });

      // ── 4. Pillar nodes under this strategy ───────────────────────────────
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
        edges.push(makeEdge(stratNodeId, pillarNodeId, '#6366f1'));

        // ── 5. Focus Areas under this Pillar ──────────────────────────────
        if (isActive) {
          focusAreas.forEach(fa => {
            const faNodeId = `fa-${fa.id}-strat-${strategy.id}`;
            nodes.push({
              id: faNodeId,
              type: 'planFocusArea',
              position: { x: 0, y: 0 },
              data: { focusArea: fa },
            });
            edges.push(makeEdge(pillarNodeId, faNodeId, '#14b8a6'));
          });

          // ── 6. Initiatives under this Pillar+Strategy ─────────────────
          const pillarProjects = stratProjects.filter(p => p.clientPillarId === pillarId);
          pillarProjects.forEach(proj => {
            const projNodeId = `proj-${proj.id}-strat-${strategy.id}-pillar-${pillarId}`;
            const taskCount = (proj.taskIds ?? []).length;
            nodes.push({
              id: projNodeId,
              type: 'planInitiative',
              position: { x: 0, y: 0 },
              data: { project: proj, taskCount },
            });
            edges.push(makeEdge(pillarNodeId, projNodeId, '#3b82f6'));

            // ── 7. Tasks ───────────────────────────────────────────────
            const projectTasks = TASKS.filter(t => (proj.taskIds ?? []).includes(t.id));
            projectTasks.forEach(task => {
              const taskNodeId = `task-${task.id}-proj-${proj.id}-strat-${strategy.id}`;
              nodes.push({
                id: taskNodeId,
                type: 'planTask',
                position: { x: 0, y: 0 },
                data: { task },
              });
              edges.push(makeEdge(projNodeId, taskNodeId, '#64748b'));
            });
          });
        }
      });

      // ── 8. Unassigned initiatives (no clientPillarId) ─────────────────────
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
        edges.push(makeEdge(stratNodeId, unassignedNodeId, '#94a3b8'));

        unassignedProjects.forEach(proj => {
          const projNodeId = `proj-${proj.id}-strat-${strategy.id}-unassigned`;
          const taskCount = (proj.taskIds ?? []).length;
          nodes.push({
            id: projNodeId,
            type: 'planInitiative',
            position: { x: 0, y: 0 },
            data: { project: proj, taskCount },
          });
          edges.push(makeEdge(unassignedNodeId, projNodeId, '#3b82f6'));

          const projectTasks = TASKS.filter(t => (proj.taskIds ?? []).includes(t.id));
          projectTasks.forEach(task => {
            const taskNodeId = `task-${task.id}-proj-${proj.id}-unassigned`;
            nodes.push({
              id: taskNodeId,
              type: 'planTask',
              position: { x: 0, y: 0 },
              data: { task },
            });
            edges.push(makeEdge(projNodeId, taskNodeId, '#64748b'));
          });
        });
      }
    });

    // ── 9. Goals Branch (separate from strategies) ───────────────────────────
    const goals = CLIENT_GOALS.filter(g => g.clientId === clientId);
    if (goals.length > 0) {
      const goalsGroupId = 'goals-group';
      nodes.push({
        id: goalsGroupId,
        type: 'planGoal',
        position: { x: 0, y: 0 },
        data: {
          goal: {
            id: '__goals_group__',
            clientId,
            title: 'Goals',
            description: null,
            targetMetric: null,
            status: 'active' as const,
            createdAt: '',
            updatedAt: '',
          },
          isGroupHeader: true,
        },
      });
      edges.push(makeEdge('root', goalsGroupId, '#d97706'));

      goals.forEach(goal => {
        const goalNodeId = `goal-${goal.id}`;
        nodes.push({
          id: goalNodeId,
          type: 'planGoal',
          position: { x: 0, y: 0 },
          data: { goal },
        });
        edges.push(makeEdge(goalsGroupId, goalNodeId, '#d97706'));

        // Dashed cross-edges to linked pillars (appear under any strategy)
        const linkedPillarIds = GOAL_PILLAR_LINKS.filter(l => l.goalId === goal.id).map(l => l.pillarId);
        linkedPillarIds.forEach(pid => {
          // Find the first pillar node ID that matches this pillar (from active strategy preferably)
          const pillarNode = nodes.find(n =>
            n.type === 'planPillar' &&
            (n.data as any)?.pillar?.id === pid &&
            !String(n.id).includes('unassigned'),
          );
          if (pillarNode) {
            edges.push(makeEdge(goalNodeId, pillarNode.id, '#d97706', true));
          }
        });

        // ── 10. Outcomes ───────────────────────────────────────────────────
        const outcomes = OUTCOMES.filter(o => o.goalId === goal.id && o.clientId === clientId);
        outcomes.forEach(outcome => {
          const outcomeNodeId = `outcome-${outcome.id}`;
          nodes.push({
            id: outcomeNodeId,
            type: 'planOutcome',
            position: { x: 0, y: 0 },
            data: { outcome },
          });
          edges.push(makeEdge(goalNodeId, outcomeNodeId, '#10b981'));

          // Dashed traceability edge to linked initiative
          if (outcome.initiativeId) {
            const projNode = nodes.find(
              n =>
                n.type === 'planInitiative' &&
                (n.data as any)?.project?.id === outcome.initiativeId,
            );
            if (projNode) {
              edges.push(makeEdge(outcomeNodeId, projNode.id, '#10b981', true));
            }
          }

          // Dashed edge to linked pillar
          if (outcome.pillarId) {
            const pillarNode = nodes.find(
              n =>
                n.type === 'planPillar' &&
                (n.data as any)?.pillar?.id === outcome.pillarId &&
                !String(n.id).includes('unassigned'),
            );
            if (pillarNode) {
              edges.push(makeEdge(outcomeNodeId, pillarNode.id, '#10b981', true));
            }
          }
        });
      });
    }

    return layoutPlanGraph(nodes, edges);
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
    OUTCOMES,
  ]);
}
