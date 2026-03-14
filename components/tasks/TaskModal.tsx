'use client';

import { useState, useTransition } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { toast } from 'sonner';
import type { Task } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { createTask, updateTask, linkTaskToProject } from '@/lib/actions';

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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="ds-label">{label}</label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: '#DC2626' }}>{error}</p>}
    </div>
  );
}

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

  const inputStyle = {
    height: '44px',
    border: '1px solid #D0D6E0',
    borderRadius: '6px',
    backgroundColor: 'var(--color-white)',
    fontSize: '14px',
    color: 'var(--color-text-primary)',
    padding: '0 14px',
    width: '100%',
    outline: 'none',
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      {/* Backdrop with fade transition */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      {/* Dialog positioning container */}
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto">
        {/* Panel with scale + fade animation */}
        <DialogPanel
          transition
          className="relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-2xl data-closed:sm:translate-y-0 data-closed:sm:scale-95 max-h-[90vh] flex flex-col"
          style={{
            backgroundColor: 'var(--color-white)',
            boxShadow: '0 16px 48px rgba(30, 42, 58, 0.18), 0 4px 16px rgba(30, 42, 58, 0.08)',
          }}
        >
        <div
          className="px-6 py-5 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <h2 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="transition-colors" style={{ color: 'var(--color-text-muted)' }}>
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
                style={{
                  ...inputStyle,
                  borderColor: errors.title ? '#DC2626' : '#D0D6E0',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 91, 219,0.15)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = errors.title ? '#DC2626' : '#D0D6E0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Client *" error={errors.clientId}>
                <select
                  value={form.clientId}
                  onChange={e => set('clientId', e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 91, 219,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#D0D6E0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Assignee *" error={errors.assigneeId}>
                <select
                  value={form.assigneeId}
                  onChange={e => set('assigneeId', e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 91, 219,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#D0D6E0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={e => set('status', e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 91, 219,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#D0D6E0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select
                  value={form.priority}
                  onChange={e => set('priority', e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 91, 219,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#D0D6E0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Start Date">
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => set('startDate', e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 91, 219,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#D0D6E0'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </Field>
              <Field label="Due Date *" error={errors.dueDate}>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => set('dueDate', e.target.value)}
                  style={{ ...inputStyle, borderColor: errors.dueDate ? '#DC2626' : '#D0D6E0' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 91, 219,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = errors.dueDate ? '#DC2626' : '#D0D6E0'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </Field>
              <Field label="End Date">
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => set('endDate', e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 91, 219,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#D0D6E0'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </Field>
            </div>

            <Field label="Type">
              <select
                value={form.type}
                onChange={e => set('type', e.target.value)}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 91, 219,0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#D0D6E0'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </Field>

            {!task && (
              <Field label="Project (optional)">
                <select
                  value={form.projectId}
                  onChange={e => set('projectId', e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 91, 219,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#D0D6E0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <option value="">No project</option>
                  {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
            )}

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Task description..."
                rows={3}
                style={{
                  ...inputStyle,
                  height: 'auto',
                  padding: '10px 14px',
                  resize: 'none',
                  lineHeight: '1.6',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 91, 219,0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#D0D6E0'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </Field>
          </div>

          <div
            className="px-6 py-4 flex gap-3 flex-shrink-0"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
              style={{ border: '1px solid #D0D6E0', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-white)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F8F9FA'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-white)'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-white"
              style={{ backgroundColor: isPending ? '#9ab0f5' : 'var(--color-primary)' }}
              onMouseEnter={e => { if (!isPending) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary)'; }}
              onMouseLeave={e => { if (!isPending) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary)'; }}
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
