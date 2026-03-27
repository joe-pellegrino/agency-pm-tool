'use client';

import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
  type OnConnectStartParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { usePlanGraph } from './usePlanGraph';
import { RootNode } from './nodes/RootNode';
import { PillarNode } from './nodes/PillarNode';
import { FocusAreaNode } from './nodes/FocusAreaNode';
import { StrategyNode } from './nodes/StrategyNode';
import { InitiativeNode } from './nodes/InitiativeNode';
import { TaskNode } from './nodes/TaskNode';
import { GoalNode } from './nodes/GoalNode';
import { OutcomeNode } from './nodes/OutcomeNode';
import { DeletableEdge } from './DeletableEdge';
import { PlanContextMenu, type PlanAction } from './PlanContextMenu';
import { PlanDetailPanel, type CreateFormConfig } from './PlanDetailPanel';
import { updateProject, unlinkTaskFromProject } from '@/lib/actions';
import { unlinkGoalFromPillar } from '@/lib/actions-goals';

const NODE_TYPES = {
  planRoot: RootNode,
  planPillar: PillarNode,
  planFocusArea: FocusAreaNode,
  planStrategy: StrategyNode,
  planInitiative: InitiativeNode,
  planTask: TaskNode,
  planGoal: GoalNode,
  planOutcome: OutcomeNode,
} as const;

const EDGE_TYPES = {
  deletable: DeletableEdge,
} as const;

interface PlanModeProps {
  clientId: string;
  clientName: string;
  onClose: () => void;
}

function PlanModeInner({ clientId, clientName, onClose }: PlanModeProps) {
  const {
    CLIENT_PILLARS = [],
    CLIENT_PILLAR_KPIS = [],
    FOCUS_AREAS = [],
    STRATEGIES = [],
    PROJECTS = [],
    TASKS = [],
    CLIENT_GOALS = [],
    GOAL_PILLAR_LINKS = [],
    OUTCOMES = [],
    refresh,
    optimisticUpdate,
  } = useAppData();

  const currentYear = new Date().getFullYear();

  const { nodes: initialNodes, edges: initialEdges } = usePlanGraph({
    clientId,
    clientName,
    year: currentYear,
    CLIENT_PILLARS,
    CLIENT_PILLAR_KPIS,
    FOCUS_AREAS,
    STRATEGIES,
    PROJECTS,
    TASKS,
    CLIENT_GOALS,
    GOAL_PILLAR_LINKS,
    OUTCOMES,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [createForm, setCreateForm] = useState<CreateFormConfig | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    sourceNodeId: string;
    sourceNodeType: string;
  } | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const connectingNode = useRef<{ nodeId: string; nodeType: string } | null>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  // ─── DELETE EDGE ────────────────────────────────────────────────────────────
  const handleDeleteEdge = useCallback(async (edgeId: string) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;

    const edgeData = (edge.data ?? {}) as Record<string, unknown>;
    const dashed = !!edgeData.dashed;

    // Parse IDs from well-known edge id patterns
    // Edge IDs are like: "source->target" or "source->target-handleName"
    const [sourceId, targetIdRaw] = edgeId.split('->');
    const targetId = targetIdRaw?.split('-source')[0]?.split('-target')[0] ?? targetIdRaw;

    // Determine edge type from source/target node ids
    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId?.replace(/-source.*|-target.*/g, ''));

    // --- Dashed cross-reference edge: goal → initiative ---
    if (dashed && sourceId.startsWith('goal-') && edge.target?.startsWith('proj-')) {
      // Find the goal_pillar_link to delete
      const goalId = sourceId.replace('goal-', '');
      // Extract project id from target node id: "proj-{projectId}-strat-..."
      const projIdMatch = edge.target.match(/^proj-([^-]+(?:-[^-]+)*?)-strat-/);
      if (projIdMatch) {
        const projectId = projIdMatch[1];
        const project = PROJECTS.find(p => p.id === projectId);
        if (project?.clientPillarId) {
          try {
            await unlinkGoalFromPillar(goalId, project.clientPillarId);
          } catch (err) {
            console.error('[PlanMode] Failed to unlink goal from pillar:', err);
            return;
          }
        }
      }
      // Optimistically remove edge
      setEdges(prev => prev.filter(e => e.id !== edgeId));
      refresh?.();
      return;
    }

    // --- pillar → initiative edge: set clientPillarId = null ---
    if (sourceId.includes('pillar-') && edge.target?.startsWith('proj-')) {
      const projIdMatch = edge.target.match(/^proj-([^-]+(?:-[^-]+)*?)-strat-/);
      if (projIdMatch) {
        const projectId = projIdMatch[1];
        try {
          await updateProject(projectId, { clientPillarId: null });
        } catch (err) {
          console.error('[PlanMode] Failed to unset pillar on project:', err);
          return;
        }
        setEdges(prev => prev.filter(e => e.id !== edgeId));
        refresh?.();
      }
      return;
    }

    // --- initiative → task edge: delete project_task_links row ---
    if (edge.source?.startsWith('proj-') && edge.target?.startsWith('task-')) {
      // task node id: "task-{taskId}-proj-{projectId}-strat-..."
      const taskIdMatch = edge.target.match(/^task-([^-]+(?:-[^-]+)*?)-proj-/);
      const projIdMatch = edge.source.match(/^proj-([^-]+(?:-[^-]+)*?)-strat-/);
      if (taskIdMatch && projIdMatch) {
        const taskId = taskIdMatch[1];
        const projectId = projIdMatch[1];
        try {
          await unlinkTaskFromProject(projectId, taskId);
        } catch (err) {
          console.error('[PlanMode] Failed to unlink task from project:', err);
          return;
        }
        setEdges(prev => prev.filter(e => e.id !== edgeId));
        refresh?.();
      }
      return;
    }

    // --- strategy LEFT → goal edge: display-only, just visually remove ---
    if (edge.source?.startsWith('strategy-') && edge.target?.startsWith('goal-')) {
      setEdges(prev => prev.filter(e => e.id !== edgeId));
      return;
    }

    // --- strategy → pillar edge: derived, warn and skip ---
    if (edge.source?.startsWith('strategy-') && edge.target?.includes('pillar-')) {
      alert('Strategy–pillar connections are derived from initiatives. To remove a pillar, unassign all its initiatives from this strategy.');
      return;
    }

    // --- Fallback: just visually remove ---
    setEdges(prev => prev.filter(e => e.id !== edgeId));
  }, [edges, nodes, PROJECTS, refresh, setEdges]);

  // Inject onDelete handler into each edge's data when it's selected
  const edgesWithDelete = edges.map(e => ({
    ...e,
    type: 'deletable',
    data: {
      ...(e.data ?? {}),
      onDelete: handleDeleteEdge,
    },
  }));

  const onConnectStart = useCallback(
    (_event: MouseEvent | TouchEvent, params: OnConnectStartParams) => {
      if (!params.nodeId) return;
      const sourceNode = nodes.find(n => n.id === params.nodeId);
      if (sourceNode) {
        connectingNode.current = { nodeId: params.nodeId, nodeType: sourceNode.type ?? '' };
      }
    },
    [nodes],
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!connectingNode.current) return;
      const target = (event as MouseEvent).target as HTMLElement;
      if (target.closest('.react-flow__pane') || target.classList.contains('react-flow__pane')) {
        const clientX = (event as MouseEvent).clientX;
        const clientY = (event as MouseEvent).clientY;
        setContextMenu({
          position: { x: clientX, y: clientY },
          sourceNodeId: connectingNode.current.nodeId,
          sourceNodeType: connectingNode.current.nodeType,
        });
      }
      connectingNode.current = null;
    },
    [],
  );

  // ─── CONTEXT MENU → OPEN CREATE FORM ────────────────────────────────────────
  const handleContextMenuAction = useCallback((action: PlanAction, sourceNodeId: string) => {
    const sourceNode = nodes.find(n => n.id === sourceNodeId);
    const nodeData = (sourceNode?.data ?? {}) as Record<string, unknown>;

    switch (action) {
      case 'new-strategy':
        setCreateForm({ type: 'strategy', clientId, parentNodeId: sourceNodeId });
        break;

      case 'new-goal':
        setCreateForm({ type: 'goal', clientId, parentNodeId: sourceNodeId });
        break;

      case 'add-pillar': {
        const strategy = nodeData.strategy as { id: string } | undefined;
        setCreateForm({
          type: 'add-pillar',
          clientId,
          parentNodeId: sourceNodeId,
          strategyId: strategy?.id,
        });
        break;
      }

      case 'new-focus-area': {
        const pillar = nodeData.pillar as { id: string } | undefined;
        setCreateForm({
          type: 'focus-area',
          clientId,
          parentNodeId: sourceNodeId,
          pillarId: pillar?.id,
        });
        break;
      }

      case 'new-initiative': {
        const pillar = nodeData.pillar as { id: string } | undefined;
        // Find strategy node that is parent of this pillar
        const strategyEdge = edges.find(e => e.target === sourceNodeId && e.source.startsWith('strategy-'));
        const stratNodeId = strategyEdge?.source;
        const stratNode = nodes.find(n => n.id === stratNodeId);
        const stratData = (stratNode?.data ?? {}) as Record<string, unknown>;
        const strategy = stratData.strategy as { id: string } | undefined;
        setCreateForm({
          type: 'initiative',
          clientId,
          parentNodeId: sourceNodeId,
          pillarId: pillar?.id,
          strategyId: strategy?.id,
        });
        break;
      }

      case 'new-kpi': {
        const pillar = nodeData.pillar as { id: string } | undefined;
        setCreateForm({
          type: 'kpi',
          clientId,
          parentNodeId: sourceNodeId,
          pillarId: pillar?.id,
        });
        break;
      }

      case 'new-task': {
        const project = nodeData.project as { id: string } | undefined;
        setCreateForm({
          type: 'task',
          clientId,
          parentNodeId: sourceNodeId,
          projectId: project?.id,
        });
        break;
      }

      case 'new-outcome': {
        const goal = nodeData.goal as { id: string } | undefined;
        setCreateForm({
          type: 'outcome',
          clientId,
          parentNodeId: sourceNodeId,
          goalId: goal?.id,
        });
        break;
      }
    }
  }, [nodes, edges, clientId]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setCreateForm(null);
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  const handlePanelClose = useCallback(() => {
    setSelectedNode(null);
    setCreateForm(null);
  }, []);

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-gray-50" style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <div>
            <span className="font-bold text-gray-900 text-base">{clientName}</span>
            <span className="text-gray-400 text-sm ml-2">{currentYear}</span>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
            Plan Mode
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => zoomIn()}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => zoomOut()}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => fitView({ padding: 0.15, duration: 400 })}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Fit to view"
          >
            <Maximize2 size={16} />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            <X size={14} />
            Exit Plan Mode
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <div ref={reactFlowWrapper} className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edgesWithDelete}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            onNodeClick={handleNodeClick}
            onConnectStart={onConnectStart as any}
            onConnectEnd={onConnectEnd as any}
            onPaneClick={() => {
              setSelectedNode(null);
              setContextMenu(null);
            }}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.1}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e2e8f0" gap={20} size={1} />
            <Controls className="!border-gray-200 !shadow-sm !rounded-lg overflow-hidden" />
            <MiniMap
              nodeColor={(node) => {
                const colorMap: Record<string, string> = {
                  planRoot: '#1f2937',
                  planPillar: '#6366f1',
                  planFocusArea: '#14b8a6',
                  planStrategy: '#4f46e5',
                  planInitiative: '#3b82f6',
                  planTask: '#94a3b8',
                  planGoal: '#d97706',
                  planOutcome: '#10b981',
                };
                return colorMap[node.type ?? ''] ?? '#9ca3af';
              }}
              className="!border-gray-200 !rounded-lg !shadow-sm"
              maskColor="rgba(249,250,251,0.7)"
            />
          </ReactFlow>
        </div>

        {/* Detail Panel — node view OR create form */}
        {(selectedNode || createForm) && (
          <PlanDetailPanel
            node={selectedNode}
            createForm={createForm}
            clientId={clientId}
            CLIENT_PILLARS={CLIENT_PILLARS}
            STRATEGIES={STRATEGIES}
            TEAM_MEMBERS={[]}
            onClose={handlePanelClose}
            onCreated={() => {
              setCreateForm(null);
              refresh?.();
            }}
          />
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <PlanContextMenu
          position={contextMenu.position}
          sourceNodeId={contextMenu.sourceNodeId}
          sourceNodeType={contextMenu.sourceNodeType}
          onSelect={(action, sourceNodeId) => {
            handleContextMenuAction(action, sourceNodeId);
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

export function PlanMode(props: PlanModeProps) {
  return (
    <ReactFlowProvider>
      <PlanModeInner {...props} />
    </ReactFlowProvider>
  );
}
