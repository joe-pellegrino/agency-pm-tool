'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Task } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { createTask, updateTask, linkTaskToProject } from '@/lib/actions';
import Drawer from '@/components/ui/Drawer';

interface TaskModalProps {
  task?: Task;
  defaultStatus?: string;
  defaultProjectId?: string;
  onClose: () => void;
  onSuccess?: (task: Task | null) => void;
}

const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];
const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];
const TYPES = ['social', 'ad', 'blog', 'report', 'meeting', 'design', 'other'];

export default function TaskModal({ task, defaultStatus = 'todo', defaultProjectId, onClose, onSuccess }: TaskModalProps) {
  const { CLIENTS = [], TEAM_MEMBERS = [], PROJECTS = [], refresh } = useAppData();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    title: task?.title || '',
    clientId: task?.clientId || (CLIENTS[0]?.id || ''),
    assigneeId: task?.assigneeId || (TEAM_MEMBERS[0]?.id || ''),
    status: task?.status || defaultStatus,
    priority: task?.priority || 'Medium',
    dueDate: task?.dueDate || new Date().toISOString().split('T')[0],
    startDate: task?.startDate || new Date().toISOString().split('T')[0],
    endDate: task?.endDate || new Date().toISOString().split('T')[0],
    type: task?.type || 'other',
    description: task?.description || '',
    projectId: defaultProjectId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.clientId) e.clientId = 'Client is required';
    if (!form.assigneeId) e.assigneeId = 'Assignee is required';
    if (!form.dueDate) e.dueDate = 'Due date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validType = (t: string): string => {
    const valid = ['social', 'ad', 'blog', 'report', 'meeting', 'design', 'other'];
    return valid.includes(t) ? t : 'other';
  };

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      try {
        if (task) {
          await updateTask(task.id, {
            title: form.title,
            clientId: form.clientId,
            assigneeId: form.assigneeId,
            status: form.status,
            priority: form.priority as Task['priority'],
            dueDate: form.dueDate,
            startDate: form.startDate,
            endDate: form.endDate,
            type: validType(form.type) as Task['type'],
            description: form.description,
          });
          toast.success('Task updated');
          refresh();
          onSuccess?.(null);
        } else {
          const created = await createTask({
            title: form.title,
            clientId: form.clientId,
            assigneeId: form.assigneeId,
            status: form.status,
            priority: form.priority,
            dueDate: form.dueDate,
            startDate: form.startDate,
            endDate: form.endDate,
            type: validType(form.type),
            description: form.description,
          });
          if (form.projectId && created?.id) {
            await linkTaskToProject(form.projectId, created.id);
          }
          toast.success('Task created');
          refresh();
          onSuccess?.(null);
        }
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const selectClass = 'mt-1 block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={task ? 'Edit Task' : 'New Task'}
      subtitle="Add a new task to your workflow."
      variant="create"
      footer={
        <div className="px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-form"
            disabled={isPending}
            className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Task title..."
            className={`${inputClass} ${errors.title ? 'border-red-400' : ''}`}
            autoFocus
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Client *</label>
            <select
              value={form.clientId}
              onChange={e => set('clientId', e.target.value)}
              className={`${selectClass} ${errors.clientId ? 'border-red-400' : ''}`}
            >
              {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.clientId && <p className="text-xs text-red-500 mt-1">{errors.clientId}</p>}
          </div>
          <div>
            <label className={labelClass}>Assignee *</label>
            <select
              value={form.assigneeId}
              onChange={e => set('assigneeId', e.target.value)}
              className={`${selectClass} ${errors.assigneeId ? 'border-red-400' : ''}`}
            >
              {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {errors.assigneeId && <p className="text-xs text-red-500 mt-1">{errors.assigneeId}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={selectClass}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)} className={selectClass}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Start Date</label>
            <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Due Date *</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)}
              className={`${inputClass} ${errors.dueDate ? 'border-red-400' : ''}`}
            />
            {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
          </div>
          <div>
            <label className={labelClass}>End Date</label>
            <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)} className={selectClass}>
            {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>

        {!task && (
          <div>
            <label className={labelClass}>Project (optional)</label>
            <select value={form.projectId} onChange={e => set('projectId', e.target.value)} className={selectClass}>
              <option value="">No project</option>
              {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Task description..."
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </div>
      </form>
    </Drawer>
  );
}
