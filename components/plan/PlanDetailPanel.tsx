'use client';

import { useState, useTransition } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import type { Node } from '@xyflow/react';
import type { ClientPillar, Strategy, TeamMember } from '@/lib/data';
import {
  createStrategy,
  createProject,
  createTask,
  linkTaskToProject,
} from '@/lib/actions';
import {
  createClientGoal,
  createFocusArea,
  createOutcome,
} from '@/lib/actions-goals';
import { createClientPillarKpi } from '@/lib/actions';

// ─── Create Form Config ────────────────────────────────────────────────────────

export type CreateFormConfig =
  | { type: 'strategy'; clientId: string; parentNodeId: string }
  | { type: 'goal'; clientId: string; parentNodeId: string }
  | { type: 'add-pillar'; clientId: string; parentNodeId: string; strategyId?: string }
  | { type: 'focus-area'; clientId: string; parentNodeId: string; pillarId?: string }
  | { type: 'initiative'; clientId: string; parentNodeId: string; pillarId?: string; strategyId?: string }
  | { type: 'kpi'; clientId: string; parentNodeId: string; pillarId?: string }
  | { type: 'task'; clientId: string; parentNodeId: string; projectId?: string }
  | { type: 'outcome'; clientId: string; parentNodeId: string; goalId?: string };

// ─── Shared form helpers ──────────────────────────────────────────────────────

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 placeholder-gray-300';

const selectCls =
  'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400';

function SaveButton({
  isPending,
  label = 'Create',
}: {
  isPending: boolean;
  label?: string;
}) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors mt-4"
    >
      {isPending && <Loader2 size={14} className="animate-spin" />}
      {label}
    </button>
  );
}

// ─── Individual Create Forms ──────────────────────────────────────────────────

function CreateStrategyForm({
  config,
  onCreated,
}: {
  config: Extract<CreateFormConfig, { type: 'strategy' }>;
  onCreated: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createStrategy({
        clientId: config.clientId,
        name: fd.get('name') as string,
        description: (fd.get('description') as string) || '',
        quarter: fd.get('quarter') as string,
        startDate: fd.get('start_date') as string,
        endDate: fd.get('end_date') as string,
        status: 'draft',
      });
      onCreated();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Name">
        <input name="name" required className={inputCls} placeholder="e.g. Q3 Growth Strategy" />
      </FormField>
      <FormField label="Description">
        <textarea name="description" className={inputCls} rows={3} placeholder="Optional description" />
      </FormField>
      <FormField label="Quarter">
        <input name="quarter" className={inputCls} placeholder="e.g. Q3 2026" />
      </FormField>
      <FormField label="Start Date">
        <input name="start_date" type="date" className={inputCls} defaultValue={today} />
      </FormField>
      <FormField label="End Date">
        <input name="end_date" type="date" className={inputCls} />
      </FormField>
      <SaveButton isPending={isPending} label="Create Strategy" />
    </form>
  );
}

function CreateGoalForm({
  config,
  onCreated,
}: {
  config: Extract<CreateFormConfig, { type: 'goal' }>;
  onCreated: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createClientGoal({
        clientId: config.clientId,
        title: fd.get('title') as string,
        description: (fd.get('description') as string) || null,
        targetMetric: (fd.get('target_metric') as string) || null,
        status: 'active',
      });
      onCreated();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Title">
        <input name="title" required className={inputCls} placeholder="e.g. Grow organic traffic" />
      </FormField>
      <FormField label="Description">
        <textarea name="description" className={inputCls} rows={3} placeholder="Optional description" />
      </FormField>
      <FormField label="Target Metric">
        <input name="target_metric" className={inputCls} placeholder="e.g. 50k sessions/month" />
      </FormField>
      <SaveButton isPending={isPending} label="Create Goal" />
    </form>
  );
}

function AddPillarForm({
  config,
  CLIENT_PILLARS,
  onCreated,
}: {
  config: Extract<CreateFormConfig, { type: 'add-pillar' }>;
  CLIENT_PILLARS: ClientPillar[];
  onCreated: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedPillarId, setSelectedPillarId] = useState('');
  const [error, setError] = useState('');

  const clientPillars = CLIENT_PILLARS.filter(p => !p.id.startsWith('__'));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedPillarId) {
      setError('Please select a pillar');
      return;
    }
    if (!config.strategyId) {
      setError('No strategy found. Please drag from a strategy node.');
      return;
    }
    startTransition(async () => {
      // Create a placeholder initiative under this pillar+strategy to make it appear
      await createProject({
        clientId: config.clientId,
        name: 'New Initiative',
        description: '',
        status: 'planning',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        strategyId: config.strategyId,
        clientPillarId: selectedPillarId,
      });
      onCreated();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="text-xs text-gray-500 mb-4">
        Selecting a pillar will create a placeholder initiative under it in this strategy. You can rename the initiative afterward.
      </p>
      <FormField label="Select Pillar">
        <select
          className={selectCls}
          value={selectedPillarId}
          onChange={e => { setSelectedPillarId(e.target.value); setError(''); }}
        >
          <option value="">— Choose a pillar —</option>
          {clientPillars.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </FormField>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <SaveButton isPending={isPending} label="Add Pillar" />
    </form>
  );
}

function CreateFocusAreaForm({
  config,
  onCreated,
}: {
  config: Extract<CreateFormConfig, { type: 'focus-area' }>;
  onCreated: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!config.pillarId) {
      setError('No pillar found. Please drag from a pillar node.');
      return;
    }
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createFocusArea({
        pillarId: config.pillarId!,
        clientId: config.clientId,
        name: fd.get('name') as string,
        description: (fd.get('description') as string) || null,
        status: 'active',
      });
      onCreated();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Name">
        <input name="name" required className={inputCls} placeholder="e.g. Content Marketing" />
      </FormField>
      <FormField label="Description">
        <textarea name="description" className={inputCls} rows={3} placeholder="Optional description" />
      </FormField>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <SaveButton isPending={isPending} label="Create Focus Area" />
    </form>
  );
}

function CreateInitiativeForm({
  config,
  onCreated,
}: {
  config: Extract<CreateFormConfig, { type: 'initiative' }>;
  onCreated: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().split('T')[0];
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createProject({
        clientId: config.clientId,
        name: fd.get('name') as string,
        description: (fd.get('description') as string) || '',
        status: (fd.get('status') as string) || 'planning',
        startDate: (fd.get('start_date') as string) || today,
        endDate: (fd.get('end_date') as string) || today,
        strategyId: config.strategyId,
        clientPillarId: config.pillarId || null,
      });
      onCreated();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Name">
        <input name="name" required className={inputCls} placeholder="e.g. SEO Content Blitz" />
      </FormField>
      <FormField label="Status">
        <select name="status" className={selectCls} defaultValue="planning">
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="complete">Complete</option>
          <option value="on-hold">On Hold</option>
        </select>
      </FormField>
      <FormField label="Start Date">
        <input name="start_date" type="date" className={inputCls} defaultValue={today} />
      </FormField>
      <FormField label="End Date">
        <input name="end_date" type="date" className={inputCls} />
      </FormField>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <SaveButton isPending={isPending} label="Create Initiative" />
    </form>
  );
}

function CreateKpiForm({
  config,
  onCreated,
}: {
  config: Extract<CreateFormConfig, { type: 'kpi' }>;
  onCreated: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!config.pillarId) {
      setError('No pillar found. Please drag from a pillar node.');
      return;
    }
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createClientPillarKpi(config.pillarId!, {
        name: fd.get('name') as string,
        target: parseFloat((fd.get('target') as string) || '0'),
        current: 0,
        unit: (fd.get('unit') as string) || '',
      });
      onCreated();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Name">
        <input name="name" required className={inputCls} placeholder="e.g. Organic Sessions" />
      </FormField>
      <FormField label="Target">
        <input name="target" type="number" className={inputCls} placeholder="e.g. 50000" />
      </FormField>
      <FormField label="Unit">
        <input name="unit" className={inputCls} placeholder="e.g. sessions, %, leads" />
      </FormField>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <SaveButton isPending={isPending} label="Create KPI" />
    </form>
  );
}

function CreateTaskForm({
  config,
  onCreated,
}: {
  config: Extract<CreateFormConfig, { type: 'task' }>;
  onCreated: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().split('T')[0];
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!config.projectId) {
      setError('No initiative found. Please drag from an initiative node.');
      return;
    }
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const row = await createTask({
        title: fd.get('title') as string,
        clientId: config.clientId,
        assigneeId: '',
        status: (fd.get('status') as string) || 'todo',
        priority: (fd.get('priority') as string) || 'medium',
        dueDate: (fd.get('end_date') as string) || today,
        startDate: (fd.get('start_date') as string) || today,
        endDate: (fd.get('end_date') as string) || today,
        type: 'other',
      });
      if (row?.id) {
        await linkTaskToProject(config.projectId!, row.id);
      }
      onCreated();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Title">
        <input name="title" required className={inputCls} placeholder="e.g. Write landing page copy" />
      </FormField>
      <FormField label="Status">
        <select name="status" className={selectCls} defaultValue="todo">
          <option value="todo">To Do</option>
          <option value="inprogress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
      </FormField>
      <FormField label="Priority">
        <select name="priority" className={selectCls} defaultValue="medium">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </FormField>
      <FormField label="Start Date">
        <input name="start_date" type="date" className={inputCls} defaultValue={today} />
      </FormField>
      <FormField label="End Date">
        <input name="end_date" type="date" className={inputCls} />
      </FormField>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <SaveButton isPending={isPending} label="Create Task" />
    </form>
  );
}

function CreateOutcomeForm({
  config,
  onCreated,
}: {
  config: Extract<CreateFormConfig, { type: 'outcome' }>;
  onCreated: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!config.goalId) {
      setError('No goal found. Please drag from a goal node.');
      return;
    }
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await createOutcome({
        clientId: config.clientId,
        goalId: config.goalId!,
        title: fd.get('title') as string,
        description: (fd.get('description') as string) || null,
        metricValue: (fd.get('metric_value') as string) || null,
        period: (fd.get('period') as string) || null,
      });
      onCreated();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Title">
        <input name="title" required className={inputCls} placeholder="e.g. 2x organic traffic" />
      </FormField>
      <FormField label="Description">
        <textarea name="description" className={inputCls} rows={3} placeholder="Optional description" />
      </FormField>
      <FormField label="Metric Value">
        <input name="metric_value" className={inputCls} placeholder="e.g. 100k sessions" />
      </FormField>
      <FormField label="Period">
        <input name="period" className={inputCls} placeholder="e.g. Q3 2026" />
      </FormField>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <SaveButton isPending={isPending} label="Create Outcome" />
    </form>
  );
}

// ─── CREATE FORM TITLES ────────────────────────────────────────────────────────

const CREATE_FORM_TITLES: Record<CreateFormConfig['type'], string> = {
  strategy: 'New Strategy',
  goal: 'New Goal',
  'add-pillar': 'Add Pillar',
  'focus-area': 'New Focus Area',
  initiative: 'New Initiative',
  kpi: 'New KPI',
  task: 'New Task',
  outcome: 'New Outcome',
};

// ─── Main Panel ────────────────────────────────────────────────────────────────

interface PlanDetailPanelProps {
  node: Node | null;
  createForm: CreateFormConfig | null;
  clientId: string;
  CLIENT_PILLARS: ClientPillar[];
  STRATEGIES: Strategy[];
  TEAM_MEMBERS: TeamMember[];
  onClose: () => void;
  onCreated: () => void;
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="mb-3">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
}

function NodeDetails({ node }: { node: Node }) {
  const data = node.data as Record<string, any>;

  switch (node.type) {
    case 'planRoot':
      return (
        <>
          <div className="text-lg font-bold text-gray-900 mb-1">{data.label}</div>
          <div className="text-sm text-gray-500">{data.year}</div>
        </>
      );

    case 'planPillar': {
      const { pillar, kpiCount, focusAreaCount } = data;
      return (
        <>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pillar.color }} />
            <div className="text-base font-bold text-gray-900">{pillar.name}</div>
          </div>
          {pillar.description && <DetailRow label="Description" value={pillar.description} />}
          <div className="flex gap-2 flex-wrap mt-2">
            <Badge label={`${kpiCount} KPIs`} color="bg-indigo-50 text-indigo-600" />
            <Badge label={`${focusAreaCount} Focus Areas`} color="bg-teal-50 text-teal-600" />
          </div>
        </>
      );
    }

    case 'planFocusArea': {
      const { focusArea } = data;
      return (
        <>
          <div className="text-base font-bold text-gray-900 mb-2">{focusArea.name}</div>
          {focusArea.description && <DetailRow label="Description" value={focusArea.description} />}
          <Badge
            label={focusArea.status}
            color={focusArea.status === 'active' ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500'}
          />
        </>
      );
    }

    case 'planStrategy': {
      const { strategy } = data;
      const statusColors: Record<string, string> = {
        active: 'bg-green-50 text-green-700',
        draft: 'bg-gray-100 text-gray-600',
        queued: 'bg-blue-50 text-blue-700',
        complete: 'bg-indigo-50 text-indigo-700',
      };
      return (
        <>
          <div className="text-base font-bold text-gray-900 mb-1">{strategy.name}</div>
          <div className="text-sm text-gray-500 mb-3">{strategy.quarter}</div>
          {strategy.description && <DetailRow label="Description" value={strategy.description} />}
          <DetailRow label="Period" value={`${strategy.startDate} → ${strategy.endDate}`} />
          <Badge label={strategy.status} color={statusColors[strategy.status] ?? 'bg-gray-100 text-gray-600'} />
        </>
      );
    }

    case 'planInitiative': {
      const { project, taskCount } = data;
      const statusColors: Record<string, string> = {
        active: 'bg-blue-50 text-blue-700',
        planning: 'bg-gray-100 text-gray-600',
        complete: 'bg-green-50 text-green-700',
        'on-hold': 'bg-amber-50 text-amber-700',
      };
      return (
        <>
          <div className="text-base font-bold text-gray-900 mb-1">{project.name}</div>
          {project.description && <DetailRow label="Description" value={project.description} />}
          <DetailRow label="Period" value={`${project.startDate} → ${project.endDate}`} />
          <DetailRow label="Progress" value={`${project.progress ?? 0}%`} />
          <DetailRow label="Tasks" value={taskCount} />
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2 mb-3 overflow-hidden">
            <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(project.progress ?? 0, 100)}%` }} />
          </div>
          <Badge label={project.status} color={statusColors[project.status] ?? 'bg-gray-100 text-gray-600'} />
        </>
      );
    }

    case 'planTask': {
      const { task } = data;
      const statusColors: Record<string, string> = {
        todo: 'bg-gray-100 text-gray-600',
        inprogress: 'bg-yellow-50 text-yellow-700',
        review: 'bg-purple-50 text-purple-700',
        done: 'bg-green-50 text-green-700',
      };
      const statusLabels: Record<string, string> = {
        todo: 'To Do',
        inprogress: 'In Progress',
        review: 'Review',
        done: 'Done',
      };
      return (
        <>
          <div className="text-base font-bold text-gray-900 mb-1">{task.title}</div>
          {task.description && <DetailRow label="Description" value={task.description} />}
          {task.dueDate && <DetailRow label="Due Date" value={task.dueDate} />}
          <Badge label={statusLabels[task.status] ?? task.status} color={statusColors[task.status] ?? 'bg-gray-100 text-gray-600'} />
        </>
      );
    }

    case 'planGoal': {
      const { goal } = data;
      const statusColors: Record<string, string> = {
        active: 'bg-amber-50 text-amber-700',
        achieved: 'bg-green-50 text-green-700',
        archived: 'bg-gray-100 text-gray-500',
      };
      return (
        <>
          <div className="text-base font-bold text-gray-900 mb-1">{goal.title}</div>
          {goal.description && <DetailRow label="Description" value={goal.description} />}
          {goal.targetMetric && <DetailRow label="Target Metric" value={goal.targetMetric} />}
          <Badge label={goal.status} color={statusColors[goal.status] ?? 'bg-gray-100 text-gray-600'} />
        </>
      );
    }

    case 'planOutcome': {
      const { outcome } = data;
      return (
        <>
          <div className="text-base font-bold text-gray-900 mb-1">{outcome.title}</div>
          {outcome.description && <DetailRow label="Description" value={outcome.description} />}
          {outcome.metricValue && <DetailRow label="Metric Value" value={outcome.metricValue} />}
          {outcome.period && <DetailRow label="Period" value={outcome.period} />}
          {outcome.evidenceUrl && (
            <a
              href={outcome.evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 mt-2"
            >
              <ExternalLink size={12} />
              Evidence
            </a>
          )}
        </>
      );
    }

    default:
      return <div className="text-sm text-gray-500">Select a node to view details.</div>;
  }
}

export function PlanDetailPanel({
  node,
  createForm,
  clientId,
  CLIENT_PILLARS,
  STRATEGIES,
  TEAM_MEMBERS,
  onClose,
  onCreated,
}: PlanDetailPanelProps) {
  const isCreateMode = !!createForm;
  const title = isCreateMode
    ? CREATE_FORM_TITLES[createForm.type]
    : 'Node Details';

  function renderCreateForm() {
    if (!createForm) return null;
    switch (createForm.type) {
      case 'strategy':
        return <CreateStrategyForm config={createForm} onCreated={onCreated} />;
      case 'goal':
        return <CreateGoalForm config={createForm} onCreated={onCreated} />;
      case 'add-pillar':
        return <AddPillarForm config={createForm} CLIENT_PILLARS={CLIENT_PILLARS} onCreated={onCreated} />;
      case 'focus-area':
        return <CreateFocusAreaForm config={createForm} onCreated={onCreated} />;
      case 'initiative':
        return <CreateInitiativeForm config={createForm} onCreated={onCreated} />;
      case 'kpi':
        return <CreateKpiForm config={createForm} onCreated={onCreated} />;
      case 'task':
        return <CreateTaskForm config={createForm} onCreated={onCreated} />;
      case 'outcome':
        return <CreateOutcomeForm config={createForm} onCreated={onCreated} />;
    }
  }

  return (
    <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200 h-full overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
        >
          <X size={15} />
        </button>
      </div>
      <div className="px-4 py-4 flex-1">
        {isCreateMode ? renderCreateForm() : node ? <NodeDetails node={node} /> : null}
      </div>
    </div>
  );
}
