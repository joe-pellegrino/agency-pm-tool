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
import { PlanContextMenu, type PlanAction } from './PlanContextMenu';
import { PlanDetailPanel } from './PlanDetailPanel';

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

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    sourceNodeId: string;
    sourceNodeType: string;
  } | null>(null);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const connectingNode = useRef<{ nodeId: string; nodeType: string } | null>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  const onConnectStart = useCallback(
    (_event: MouseEvent | TouchEvent, params: OnConnectStartParams) => {
      if (!params.nodeId) return;
      const sourceNode = nodes.find(n => n.id === params.nodeId);
      if (sourceNode) {
        connectingNode.current = { nodeId: params.nodeId, handle: params.handleId, nodeType: sourceNode.type ?? '' } as any;
      }
    },
    [nodes],
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!connectingNode.current) return;
      const target = (event as MouseEvent).target as HTMLElement;
      // Only show context menu when dropped on the pane (empty canvas)
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

  const handleContextMenuAction = useCallback((action: PlanAction, sourceNodeId: string) => {
    // For now, log the action — wiring to server actions would go here
    console.log('[PlanMode] Create action:', action, 'from node:', sourceNodeId);
    // TODO: Open creation forms using existing server actions
    // e.g. action === 'new-pillar' → open pillar creation modal
  }, []);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
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
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={NODE_TYPES}
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

        {/* Detail Panel */}
        {selectedNode && (
          <PlanDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <PlanContextMenu
          position={contextMenu.position}
          sourceNodeId={contextMenu.sourceNodeId}
          sourceNodeType={contextMenu.sourceNodeType}
          onSelect={handleContextMenuAction}
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
