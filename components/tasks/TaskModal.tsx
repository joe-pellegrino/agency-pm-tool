'use client';

import { useState, useTransition } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Task } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { createTask, updateTask } from '@/lib/actions';

interface TaskModalProps {
  task?: Task;
  defaultStatus?: string;
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
const TYPES = ['content', 'design', 'dev', 'strategy', 'meeting', 'review', 'seo', 'ads'];

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function TaskModal({ task, defaultStatus = 'todo', onClose, onSuccess }: TaskModalProps) {
  const { CLIENTS = [], TEAM_MEMBERS = [], refresh } = useAppData();
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
    type: task?.type || 'content',
    description: task?.description || '',
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
            type: form.type as Task['type'],
            description: form.description,
          });
          toast.success('Task updated');
          refresh();
          onSuccess?.(null);
        } else {
          await createTask({
            title: form.title,
            clientId: form.clientId,
            assigneeId: form.assigneeId,
            status: form.status,
            priority: form.priority,
            dueDate: form.dueDate,
            startDate: form.startDate,
            endDate: form.endDate,
            type: form.type,
            description: form.description,
          });
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

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-4">
            <Field label="Title *" error={errors.title}>
              <input
                type="text"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Task title..."
                className={`${inputClass} ${errors.title ? 'border-red-400' : ''}`}
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Client *" error={errors.clientId}>
                <select value={form.clientId} onChange={e => set('clientId', e.target.value)} className={inputClass}>
                  {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Assignee *" error={errors.assigneeId}>
                <select value={form.assigneeId} onChange={e => set('assigneeId', e.target.value)} className={inputClass}>
                  {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inputClass}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Start Date">
                <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Due Date *" error={errors.dueDate}>
                <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} className={`${inputClass} ${errors.dueDate ? 'border-red-400' : ''}`} />
              </Field>
              <Field label="End Date">
                <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className={inputClass} />
              </Field>
            </div>

            <Field label="Type">
              <select value={form.type} onChange={e => set('type', e.target.value)} className={inputClass}>
                {TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Task description..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </Field>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
