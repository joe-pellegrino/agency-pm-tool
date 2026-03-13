'use client';

import { useState, useTransition } from 'react';
import { PRIORITY_COLORS, PRIORITY_DOT, TaskTemplate, WorkflowTemplate, WorkflowStep } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import {
  LayoutTemplate, Clock, Users, Calendar, Tag, ChevronRight, Plus, Search, X,
  ArrowRight, Zap, GitBranch, Pencil, Archive, Trash2, GripVertical, AlertTriangle,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { toast } from 'sonner';
import {
  createTaskTemplate, updateTaskTemplate, archiveTaskTemplate,
  createWorkflowTemplate, updateWorkflowTemplate, archiveWorkflowTemplate,
} from '@/lib/actions';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const TYPE_COLORS: Record<string, string> = {
  social: 'bg-pink-100 text-pink-700',
  ad: 'bg-orange-100 text-orange-700',
  blog: 'bg-purple-100 text-purple-700',
  report: 'bg-blue-100 text-blue-700',
  meeting: 'bg-[#E0E7FF] text-[#3B5BDB]',
  design: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-600',
};

const TYPE_ICONS: Record<string, string> = {
  social: '📱', ad: '📣', blog: '✍️', report: '📊',
  meeting: '🤝', design: '🎨', other: '📋',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Paid Media': 'bg-orange-100 text-orange-700',
  'Web Dev': 'bg-blue-100 text-blue-700',
  'Social Media': 'bg-pink-100 text-pink-700',
  'Onboarding': 'bg-[#E0E7FF] text-[#3B5BDB]',
  'SEO': 'bg-green-100 text-green-700',
  'Strategy': 'bg-purple-100 text-purple-700',
};

const TASK_CATEGORIES = ['All', 'Reporting', 'Content', 'Paid Media', 'Local SEO', 'Client Relations', 'Reputation', 'Email Marketing'];
const TASK_TYPES = ['social', 'ad', 'blog', 'report', 'meeting', 'design', 'other'] as const;
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;

// ─── Task Template Edit Modal ─────────────────────────────────────────────────

function TaskTemplateModal({
  template,
  onClose,
}: {
  template?: TaskTemplate;
  onClose: () => void;
}) {
  const { refresh } = useAppData();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    title: template?.title || '',
    description: template?.description || '',
    defaultAssigneeRole: template?.defaultAssigneeRole || '',
    defaultPriority: template?.defaultPriority || 'Medium',
    estimatedDuration: template?.estimatedDuration || 1,
    type: template?.type || 'other',
    dueRule: template?.dueRule || '',
    category: template?.category || 'Reporting',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (template) {
          await updateTaskTemplate(template.id, {
            title: form.title,
            description: form.description,
            defaultAssigneeRole: form.defaultAssigneeRole,
            defaultPriority: form.defaultPriority,
            estimatedDuration: Number(form.estimatedDuration),
            type: form.type,
            dueRule: form.dueRule,
            category: form.category,
          });
          toast.success('Task template updated');
        } else {
          await createTaskTemplate({
            title: form.title,
            description: form.description,
            defaultAssigneeRole: form.defaultAssigneeRole,
            defaultPriority: form.defaultPriority,
            estimatedDuration: Number(form.estimatedDuration),
            type: form.type,
            dueRule: form.dueRule,
            category: form.category,
          });
          toast.success('Task template created');
        }
        refresh?.();
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]';
  const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
            {template ? 'Edit Task Template' : 'New Task Template'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Monthly Analytics Report"
                className={inputClass}
                autoFocus
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="What does this task template cover?"
                className={inputClass + ' resize-none'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as typeof TASK_TYPES[number] }))} className={inputClass}>
                  {TASK_TYPES.map(t => (
                    <option key={t} value={t}>{TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
                  {TASK_CATEGORIES.slice(1).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Default Priority</label>
                <select value={form.defaultPriority} onChange={e => setForm(f => ({ ...f, defaultPriority: e.target.value as typeof PRIORITIES[number] }))} className={inputClass}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Est. Duration (days)</label>
                <input
                  type="number"
                  min={1}
                  value={form.estimatedDuration}
                  onChange={e => setForm(f => ({ ...f, estimatedDuration: Number(e.target.value) }))}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Assignee Role</label>
              <input
                type="text"
                value={form.defaultAssigneeRole}
                onChange={e => setForm(f => ({ ...f, defaultAssigneeRole: e.target.value }))}
                placeholder="e.g. Social Media Manager"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Due Rule</label>
              <input
                type="text"
                value={form.dueRule}
                onChange={e => setForm(f => ({ ...f, dueRule: e.target.value }))}
                placeholder="e.g. 5th of each month"
                className={inputClass}
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isPending ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Workflow Step Editor ──────────────────────────────────────────────────────

interface EditableStep {
  tempId: string;
  title: string;
  description: string;
  defaultDurationDays: number;
  assigneeRole: string;
}

function WorkflowStepEditor({
  steps,
  onChange,
}: {
  steps: EditableStep[];
  onChange: (steps: EditableStep[]) => void;
}) {
  const addStep = () => {
    onChange([...steps, {
      tempId: `new-${Date.now()}`,
      title: '',
      description: '',
      defaultDurationDays: 1,
      assigneeRole: '',
    }]);
  };

  const updateStep = (tempId: string, field: string, value: string | number) => {
    onChange(steps.map(s => s.tempId === tempId ? { ...s, [field]: value } : s));
  };

  const removeStep = (tempId: string) => {
    onChange(steps.filter(s => s.tempId !== tempId));
  };

  return (
    <div className="space-y-2">
      {steps.map((step, idx) => (
        <div key={step.tempId} className="flex items-start gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="w-6 h-6 rounded-full bg-[#E0E7FF] text-[#3B5BDB] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-2">
            {idx + 1}
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={step.title}
              onChange={e => updateStep(step.tempId, 'title', e.target.value)}
              placeholder="Step title *"
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#3B5BDB]"
            />
            <input
              type="text"
              value={step.assigneeRole}
              onChange={e => updateStep(step.tempId, 'assigneeRole', e.target.value)}
              placeholder="Assignee role"
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#3B5BDB]"
            />
            <input
              type="text"
              value={step.description}
              onChange={e => updateStep(step.tempId, 'description', e.target.value)}
              placeholder="Description"
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#3B5BDB]"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Days:</label>
              <input
                type="number"
                min={1}
                value={step.defaultDurationDays}
                onChange={e => updateStep(step.tempId, 'defaultDurationDays', Number(e.target.value))}
                className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#3B5BDB] w-20"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeStep(step.tempId)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mt-2"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addStep}
        className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 hover:border-indigo-300 hover:text-[#3B5BDB] transition-colors"
      >
        <Plus size={14} /> Add Step
      </button>
    </div>
  );
}

// ─── Workflow Template Edit Modal ─────────────────────────────────────────────

const WORKFLOW_CATEGORIES = ['Paid Media', 'Web Dev', 'Social Media', 'Onboarding', 'SEO', 'Strategy'];

function WorkflowTemplateModal({
  template,
  onClose,
}: {
  template?: WorkflowTemplate;
  onClose: () => void;
}) {
  const { refresh } = useAppData();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'Paid Media',
    defaultDurationDays: template?.defaultDurationDays || 30,
  });
  const [steps, setSteps] = useState<EditableStep[]>(
    template?.steps.map(s => ({
      tempId: s.id,
      title: s.title,
      description: s.description,
      defaultDurationDays: s.defaultDurationDays,
      assigneeRole: s.assigneeRole,
    })) || []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (steps.some(s => !s.title.trim())) {
      toast.error('All steps must have a title');
      return;
    }
    startTransition(async () => {
      try {
        const stepsData = steps.map((s, idx) => ({
          id: s.tempId,
          title: s.title,
          description: s.description,
          defaultDurationDays: s.defaultDurationDays,
          assigneeRole: s.assigneeRole,
          order: idx + 1,
          dependsOn: [] as string[],
        }));

        if (template) {
          await updateWorkflowTemplate(template.id, {
            name: form.name,
            description: form.description,
            category: form.category,
            defaultDurationDays: Number(form.defaultDurationDays),
            steps: stepsData,
          });
          toast.success('Workflow template updated');
        } else {
          await createWorkflowTemplate({
            name: form.name,
            description: form.description,
            category: form.category,
            defaultDurationDays: Number(form.defaultDurationDays),
            steps: stepsData,
          });
          toast.success('Workflow template created');
        }
        refresh?.();
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]';
  const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
            {template ? 'Edit Workflow Template' : 'New Workflow Template'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className={labelClass}>Name *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Monthly Ad Campaign Management"
                className={inputClass}
                autoFocus
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="What does this workflow cover?"
                className={inputClass + ' resize-none'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
                  {WORKFLOW_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Total Duration (days)</label>
                <input
                  type="number"
                  min={1}
                  value={form.defaultDurationDays}
                  onChange={e => setForm(f => ({ ...f, defaultDurationDays: Number(e.target.value) }))}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass + ' mb-2'}>Steps ({steps.length})</label>
              <WorkflowStepEditor steps={steps} onChange={setSteps} />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || steps.length === 0}
              className="flex-1 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isPending ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Task Template Card ────────────────────────────────────────────────────────

function TaskTemplateCard({
  template,
  onEdit,
  onArchive,
}: {
  template: TaskTemplate;
  onEdit: () => void;
  onArchive: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md hover:border-[#C7D2FE] dark:hover:border-indigo-700 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center text-xl group-hover:bg-[#EEF2FF] transition-colors flex-shrink-0">
          {TYPE_ICONS[template.type || 'other']}
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[template.type || 'other']}`}>
            {template.type}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 text-gray-400 hover:text-[#3B5BDB] hover:bg-[#EEF2FF] rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onArchive(); }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Archive"
          >
            <Archive size={12} />
          </button>
        </div>
      </div>
      <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1.5 group-hover:text-[#3B5BDB] dark:group-hover:text-indigo-400 transition-colors">
        {template.title}
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{template.description}</p>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Clock size={11} />
          {template.estimatedDuration}d
        </div>
        <div className="hidden sm:flex items-center gap-1">
          <Calendar size={11} />
          {template.dueRule.split(' ').slice(0, 3).join(' ')}
        </div>
        <div className="ml-auto">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_COLORS[template.defaultPriority]}`}>
            {template.defaultPriority}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Workflow Template Card ────────────────────────────────────────────────────

function WorkflowTemplateCard({
  template,
  onEdit,
  onArchive,
}: {
  template: WorkflowTemplate;
  onEdit: () => void;
  onArchive: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md hover:border-[#C7D2FE] dark:hover:border-indigo-700 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[template.category] || 'bg-gray-100 text-gray-600'}`}>
            {template.category}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 text-gray-400 hover:text-[#3B5BDB] hover:bg-[#EEF2FF] rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onArchive(); }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Archive"
          >
            <Archive size={12} />
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1.5 group-hover:text-[#3B5BDB] dark:group-hover:text-indigo-400 transition-colors">
        {template.name}
      </h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{template.description}</p>

      {/* Mini step flow */}
      <div className="flex items-center gap-1 mb-4 overflow-hidden">
        {template.steps.slice(0, 6).map((step, idx) => (
          <div key={step.id} className="flex items-center gap-1">
            <div
              className="w-5 h-5 rounded-full bg-[#E0E7FF] text-[#3B5BDB] flex items-center justify-center text-[9px] font-bold flex-shrink-0"
              title={step.title}
            >
              {idx + 1}
            </div>
            {idx < Math.min(template.steps.length, 6) - 1 && (
              <div className="w-3 h-px bg-gray-200 flex-shrink-0" />
            )}
          </div>
        ))}
        {template.steps.length > 6 && (
          <span className="text-[10px] text-gray-400 ml-1">+{template.steps.length - 6}</span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Clock size={11} />
          {template.defaultDurationDays}d
        </div>
        <div className="flex items-center gap-1">
          <GitBranch size={11} />
          {template.steps.length} steps
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const { TASK_TEMPLATES = [], WORKFLOW_TEMPLATES = [], refresh } = useAppData();
  const [activeTab, setActiveTab] = useState<'workflow' | 'task'>('workflow');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [, startTransition] = useTransition();

  // Modal state
  const [editTaskTemplate, setEditTaskTemplate] = useState<TaskTemplate | null>(null);
  const [newTaskTemplate, setNewTaskTemplate] = useState(false);
  const [editWorkflowTemplate, setEditWorkflowTemplate] = useState<WorkflowTemplate | null>(null);
  const [newWorkflowTemplate, setNewWorkflowTemplate] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<{ id: string; type: 'task' | 'workflow'; name: string } | null>(null);

  const handleArchive = () => {
    if (!archiveTarget) return;
    const { id, type } = archiveTarget;
    setArchiveTarget(null);
    startTransition(async () => {
      try {
        if (type === 'task') {
          await archiveTaskTemplate(id);
          toast.success('Task template archived');
        } else {
          await archiveWorkflowTemplate(id);
          toast.success('Workflow template archived');
        }
        refresh?.();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  // Task template filtering
  const filteredTasks = TASK_TEMPLATES.filter(t => {
    const matchCat = selectedCategory === 'All' || t.category === selectedCategory;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const groupedTasks = TASK_CATEGORIES.slice(1).reduce((acc, cat) => {
    const items = filteredTasks.filter(t => t.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, TaskTemplate[]>);

  // Workflow template filtering
  const workflowCategories = ['All', ...new Set(WORKFLOW_TEMPLATES.map(wt => wt.category))];
  const filteredWorkflows = WORKFLOW_TEMPLATES.filter(wt => {
    const matchCat = selectedCategory === 'All' || wt.category === selectedCategory;
    const matchSearch = !search || wt.name.toLowerCase().includes(search.toLowerCase()) || wt.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleTabChange = (tab: 'workflow' | 'task') => {
    setActiveTab(tab);
    setSelectedCategory('All');
    setSearch('');
  };

  return (
    <div style={{ backgroundColor: '#EDF0F5', minHeight: '100vh' }}>
      <TopBar title="Templates" subtitle="Workflow templates and reusable task templates" />

      {/* Modals */}
      {(newTaskTemplate || editTaskTemplate) && (
        <TaskTemplateModal
          template={editTaskTemplate || undefined}
          onClose={() => { setNewTaskTemplate(false); setEditTaskTemplate(null); }}
        />
      )}
      {(newWorkflowTemplate || editWorkflowTemplate) && (
        <WorkflowTemplateModal
          template={editWorkflowTemplate || undefined}
          onClose={() => { setNewWorkflowTemplate(false); setEditWorkflowTemplate(null); }}
        />
      )}
      {archiveTarget && (
        <ConfirmDialog
          title={`Archive ${archiveTarget.type === 'task' ? 'Task' : 'Workflow'} Template`}
          message={`Archive "${archiveTarget.name}"? It will be hidden from the list.`}
          confirmLabel="Archive"
          destructive
          onConfirm={handleArchive}
          onCancel={() => setArchiveTarget(null)}
        />
      )}

      <div style={{ padding: '24px 32px' }}>
        {/* Tab switcher */}
        <div className="flex items-center gap-2 mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1.5 w-fit">
          <button
            onClick={() => handleTabChange('workflow')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
              activeTab === 'workflow' ? 'bg-[#3B5BDB] text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <GitBranch size={14} />
            Workflow Templates
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${activeTab === 'workflow' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
              {WORKFLOW_TEMPLATES.length}
            </span>
          </button>
          <button
            onClick={() => handleTabChange('task')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
              activeTab === 'task' ? 'bg-[#3B5BDB] text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <LayoutTemplate size={14} />
            Task Templates
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${activeTab === 'task' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
              {TASK_TEMPLATES.length}
            </span>
          </button>
        </div>

        {/* Search + New */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${activeTab === 'workflow' ? 'workflow' : 'task'} templates...`}
              className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] w-full"
            />
          </div>
          <button
            onClick={() => activeTab === 'task' ? setNewTaskTemplate(true) : setNewWorkflowTemplate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#3B5BDB] hover:bg-[#3B5BDB] text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New Template</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {(activeTab === 'workflow' ? workflowCategories : TASK_CATEGORIES).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${
                selectedCategory === cat
                  ? 'bg-[#3B5BDB] text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stats */}
        {activeTab === 'workflow' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label: 'Workflow Templates', value: WORKFLOW_TEMPLATES.length, icon: GitBranch, color: 'text-[#3B5BDB]' },
              { label: 'Categories', value: workflowCategories.length - 1, icon: Tag, color: 'text-purple-600' },
              { label: 'Total Steps', value: WORKFLOW_TEMPLATES.reduce((s, t) => s + t.steps.length, 0), icon: LayoutTemplate, color: 'text-blue-600' },
              { label: 'Avg Duration', value: WORKFLOW_TEMPLATES.length > 0 ? `${Math.round(WORKFLOW_TEMPLATES.reduce((s, t) => s + t.defaultDurationDays, 0) / WORKFLOW_TEMPLATES.length)}d` : '0d', icon: Clock, color: 'text-green-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label: 'Total Templates', value: TASK_TEMPLATES.length, icon: LayoutTemplate, color: 'text-[#3B5BDB]' },
              { label: 'Categories', value: TASK_CATEGORIES.length - 1, icon: Tag, color: 'text-purple-600' },
              { label: 'Avg Duration', value: TASK_TEMPLATES.length > 0 ? `${Math.round(TASK_TEMPLATES.reduce((s, t) => s + t.estimatedDuration, 0) / TASK_TEMPLATES.length)}d` : '0d', icon: Clock, color: 'text-blue-600' },
              { label: 'Team Roles', value: [...new Set(TASK_TEMPLATES.map(t => t.defaultAssigneeRole))].length, icon: Users, color: 'text-green-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {activeTab === 'workflow' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredWorkflows.map(wt => (
              <WorkflowTemplateCard
                key={wt.id}
                template={wt}
                onEdit={() => setEditWorkflowTemplate(wt)}
                onArchive={() => setArchiveTarget({ id: wt.id, type: 'workflow', name: wt.name })}
              />
            ))}
            {filteredWorkflows.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-400">
                <GitBranch size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-medium">No workflow templates found</p>
                <button
                  onClick={() => setNewWorkflowTemplate(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] text-white rounded-lg text-sm font-medium transition-colors mx-auto"
                >
                  <Plus size={14} /> New Workflow Template
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {selectedCategory === 'All' ? (
              Object.entries(groupedTasks).map(([cat, templates]) => (
                <div key={cat} className="mb-6 sm:mb-8">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
                    <span>{cat}</span>
                    <span className="text-gray-300 font-normal">({templates.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {templates.map(t => (
                      <TaskTemplateCard
                        key={t.id}
                        template={t}
                        onEdit={() => setEditTaskTemplate(t)}
                        onArchive={() => setArchiveTarget({ id: t.id, type: 'task', name: t.title })}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredTasks.map(t => (
                  <TaskTemplateCard
                    key={t.id}
                    template={t}
                    onEdit={() => setEditTaskTemplate(t)}
                    onArchive={() => setArchiveTarget({ id: t.id, type: 'task', name: t.title })}
                  />
                ))}
              </div>
            )}
            {filteredTasks.length === 0 && (
              <div className="text-center py-16 sm:py-20 text-gray-400">
                <LayoutTemplate size={40} className="mx-auto mb-4 opacity-30" />
                <p className="font-medium">No templates found</p>
                <button
                  onClick={() => setNewTaskTemplate(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] text-white rounded-lg text-sm font-medium transition-colors mx-auto"
                >
                  <Plus size={14} /> New Task Template
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
