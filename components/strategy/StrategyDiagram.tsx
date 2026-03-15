'use client';

import { useCallback, useMemo, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  Node, 
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import { useRouter } from 'next/navigation';
import { Strategy, ClientService, Service, Project, Task } from '@/lib/data';
import Drawer from '@/components/ui/Drawer';

// ─── Dagre Layout Helper ──────────────────────────────────────────────────────
function layoutGraph(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 60, nodesep: 30 });

  nodes.forEach(n => g.setNode(n.id, { width: n.data?.width ?? 200, height: n.data?.height ?? 50 }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);

  return {
    nodes: nodes.map(n => {
      const pos = g.node(n.id);
      const posX = Number(pos?.x ?? 0);
      const posY = Number(pos?.y ?? 0);
      const width = Number(n.data?.width ?? 200);
      const height = Number(n.data?.height ?? 50);
      return { 
        ...n, 
        position: { 
          x: posX - width / 2, 
          y: posY - height / 2 
        } 
      };
    }),
    edges,
  };
}

// ─── Custom Node Types ────────────────────────────────────────────────────────

function StrategyNode({ data }: { data: any }) {
  return (
    <div className="px-5 py-3 rounded-xl bg-gray-900 text-white shadow-lg border border-gray-700 min-w-[180px] text-center">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Strategy</div>
      <div className="font-bold text-sm">{data.label}</div>
      <div className="text-xs text-gray-400 mt-0.5">{data.quarter}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function ServiceNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2.5 rounded-xl shadow-md border min-w-[160px] text-center" style={{ backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }}>
      <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-0.5">Service</div>
      <div className="font-bold text-sm text-indigo-800">{data.label}</div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function ProjectNode({ data, onClick }: { data: any; onClick?: () => void }) {
  return (
    <div 
      className="px-4 py-2.5 rounded-xl shadow-sm border min-w-[160px] text-center cursor-pointer hover:shadow-md transition-shadow"
      style={{ backgroundColor: '#DBEAFE', borderColor: '#93C5FD' }}
      onClick={onClick}
    >
      <div className="font-semibold text-sm text-blue-800">{data.label}</div>
      <div className="text-[10px] mt-0.5 px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: data.pillarName ? '#BFDBFE' : '#E5E7EB', color: data.pillarName ? '#1D4ED8' : '#6B7280' }}>
        {data.pillarName ?? 'No Pillar'}
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function TaskNode({ data, onClick }: { data: any; onClick?: () => void }) {
  const statusColor: Record<string, string> = {
    todo: '#E5E7EB',
    inprogress: '#FEF3C7',
    review: '#E0E7FF',
    done: '#D1FAE5',
  };
  const bg = statusColor[data.status] ?? '#F9FAFB';
  return (
    <div 
      className="px-3 py-2 rounded-lg shadow-sm border text-center cursor-pointer hover:shadow-md transition-shadow min-w-[140px] max-w-[200px]"
      style={{ backgroundColor: bg, borderColor: '#D1D5DB' }}
      onClick={onClick}
    >
      <div className="font-medium text-xs text-gray-700 leading-tight">{data.label}</div>
      <div className="text-[9px] mt-0.5 px-1.5 py-0.5 rounded-full inline-block" style={{ backgroundColor: data.pillarName ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.06)', color: data.pillarName ? '#4338CA' : '#9CA3AF' }}>
        {data.pillarName ?? 'No Pillar'}
      </div>
      <div className="text-[9px] text-gray-400 mt-0.5 capitalize">{data.status}</div>
      <Handle type="target" position={Position.Top} />
    </div>
  );
}

function StandaloneGroupNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-2.5 rounded-xl shadow-sm border min-w-[160px] text-center" style={{ backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' }}>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Standalone Tasks</div>
      <div className="font-semibold text-sm text-gray-600">{data.count} tasks</div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface StrategyDiagramProps {
  strategy: Strategy;
  serviceStrategies: Array<{ id: string; clientServiceId: string }>;
  clientServices: ClientService[];
  services: Service[];
  projects: Project[];
  tasks: Task[];
  pillars: Strategy['pillars'];
  onClose: () => void;
}

export default function StrategyDiagram({
  strategy,
  serviceStrategies,
  clientServices,
  services,
  projects,
  tasks,
  pillars,
  onClose,
}: StrategyDiagramProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const nodeTypes: NodeTypes = useMemo(() => ({
    strategy: StrategyNode,
    service: ServiceNode,
    project: (props: any) => <ProjectNode {...props} onClick={() => router.push(`/projects/${props.data.projectId}`)} />,
    task: (props: any) => <TaskNode {...props} onClick={() => {
      const t = tasks.find(t => t.id === props.data.taskId);
      if (t) setSelectedTask(t);
    }} />,
    standaloneGroup: StandaloneGroupNode,
  }), [router, tasks]);

  const pillarMap = useMemo(() => {
    const m = new Map<string, string>();
    pillars.forEach(p => m.set(p.id, p.name));
    return m;
  }, [pillars]);

  const { initialNodes, initialEdges } = useMemo(() => {
    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];

    // Strategy root
    rawNodes.push({
      id: 'strategy',
      type: 'strategy',
      position: { x: 0, y: 0 },
      data: { label: strategy.name, quarter: strategy.quarter, width: 220, height: 70 },
    });

    // Services
    const linkedCs = serviceStrategies.map(ss => clientServices.find(cs => cs.id === ss.clientServiceId)).filter(Boolean) as ClientService[];

    linkedCs.forEach(cs => {
      const service = services.find(s => s.id === cs.serviceId);
      const nodeId = `service-${cs.id}`;
      rawNodes.push({
        id: nodeId,
        type: 'service',
        position: { x: 0, y: 0 },
        data: { label: service?.name ?? 'Service', width: 180, height: 60 },
      });
      rawEdges.push({ id: `e-strategy-${nodeId}`, source: 'strategy', target: nodeId, type: 'smoothstep', animated: true });

      // Projects under this service
      const serviceProjects = projects.filter(p => cs.linkedProjects.includes(p.id) && p.clientId === strategy.clientId);
      serviceProjects.forEach(proj => {
        const projNodeId = `project-${proj.id}`;
        rawNodes.push({
          id: projNodeId,
          type: 'project',
          position: { x: 0, y: 0 },
          data: { 
            label: proj.name, 
            pillarName: proj.pillarId ? pillarMap.get(proj.pillarId) : undefined,
            projectId: proj.id,
            width: 180, 
            height: 60,
          },
        });
        rawEdges.push({ id: `e-${nodeId}-${projNodeId}`, source: nodeId, target: projNodeId, type: 'smoothstep' });

        // Tasks under project
        const projTasks = tasks.filter(t => proj.taskIds.includes(t.id));
        projTasks.forEach(task => {
          const taskNodeId = `task-${task.id}`;
          rawNodes.push({
            id: taskNodeId,
            type: 'task',
            position: { x: 0, y: 0 },
            data: {
              label: task.title,
              status: task.status,
              pillarName: task.pillarId ? pillarMap.get(task.pillarId) : undefined,
              taskId: task.id,
              width: 160,
              height: 55,
            },
          });
          rawEdges.push({ id: `e-${projNodeId}-${taskNodeId}`, source: projNodeId, target: taskNodeId, type: 'smoothstep' });
        });
      });
    });

    // Standalone tasks (have pillarId or clientId matching strategy's client, but no project)
    const allProjectTaskIds = new Set(projects.flatMap(p => p.taskIds));
    const strategyClientTasks = tasks.filter(t => t.clientId === strategy.clientId && !allProjectTaskIds.has(t.id));

    if (strategyClientTasks.length > 0) {
      rawNodes.push({
        id: 'standalone-group',
        type: 'standaloneGroup',
        position: { x: 0, y: 0 },
        data: { count: strategyClientTasks.length, width: 180, height: 60 },
      });
      rawEdges.push({ id: 'e-strategy-standalone', source: 'strategy', target: 'standalone-group', type: 'smoothstep', style: { strokeDasharray: '5,5' } });

      strategyClientTasks.forEach(task => {
        const taskNodeId = `task-${task.id}`;
        rawNodes.push({
          id: taskNodeId,
          type: 'task',
          position: { x: 0, y: 0 },
          data: {
            label: task.title,
            status: task.status,
            pillarName: task.pillarId ? pillarMap.get(task.pillarId) : undefined,
            taskId: task.id,
            width: 160,
            height: 55,
          },
        });
        rawEdges.push({ id: `e-standalone-${taskNodeId}`, source: 'standalone-group', target: taskNodeId, type: 'smoothstep' });
      });
    }

    const laid = layoutGraph(rawNodes, rawEdges);
    return { initialNodes: laid.nodes, initialEdges: laid.edges };
  }, [strategy, serviceStrategies, clientServices, services, projects, tasks, pillars, pillarMap]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ backgroundColor: 'var(--color-bg-page)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-900 shadow-sm">
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">{strategy.name}</h2>
          <p className="text-sm text-gray-500">Strategy Overview Diagram</p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
        >
          Close
        </button>
      </div>

      {/* React Flow */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
        >
          <Background color="#E5E7EB" gap={20} />
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
        </ReactFlow>
      </div>

      {/* Task Detail Drawer (reuse existing Drawer component) */}
      {selectedTask && (
        <Drawer
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title="Task Details"
          variant="details"
        >
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedTask.title}</h2>
            <dl className="space-y-3">
              {[
                { label: 'Status', value: selectedTask.status === 'inprogress' ? 'In Progress' : selectedTask.status.charAt(0).toUpperCase() + selectedTask.status.slice(1) },
                { label: 'Priority', value: selectedTask.priority },
                { label: 'Due Date', value: new Date(selectedTask.dueDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                { label: 'Pillar', value: selectedTask.pillarId ? (pillars.find(p => p.id === selectedTask.pillarId)?.name ?? 'Unknown') : 'None' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm border-b pb-2 border-gray-100">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{value}</dd>
                </div>
              ))}
            </dl>
            {selectedTask.description && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTask.description}</p>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
}
