'use client';

import { useState, useTransition, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Task, ClientPillar } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { createTask, updateTask, linkTaskToProject, getClientPillars, createRecurringTemplate, generateRecurringTaskInstances, addTaskDependency, removeTaskDependency } from '@/lib/actions';
import Drawer from '@/components/ui/Drawer';

interface TaskModalProps {
  task?: Task;
  defaultStatus?: string;
  defaultProjectId?: string;
  defaultClientId?: string;
  defaultClientPillarId?: string;
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

export default function TaskModal({ task, defaultStatus = 'todo', defaultProjectId, defaultClientId, defaultClientPillarId, onClose, onSuccess }: TaskModalProps) {
  const { CLIENTS = [], TEAM_MEMBERS = [], PROJECTS = [], STRATEGIES = [], TASKS = [], refresh } = useAppData();
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => setIsOpen(false);
  const [isPending, startTransition] = useTransition();
  
  const [form, setForm] = useState({
    title: task?.title || '',
    clientId: task?.clientId || defaultClientId || (CLIENTS[0]?.id || ''),
    assigneeId: task?.assigneeId || (TEAM_MEMBERS[0]?.id || ''),
    status: task?.status || defaultStatus,
    priority: task?.priority || 'Medium',
    dueDate: task?.dueDate || new Date().toISOString().split('T')[0],
    startDate: task?.startDate || new Date().toISOString().split('T')[0],
    endDate: task?.endDate || new Date().toISOString().split('T')[0],
    type: task?.type || 'other',
    description: task?.description || '',
    projectId: defaultProjectId || '',
    pillarId: task?.pillarId || '',
    clientPillarId: task?.clientPillarId || defaultClientPillarId || '',
    dependencies: task?.dependencies || [],
    isRecurring: false,
    recurrenceType: 'weekly',
    recurrenceDays: [1, 3, 5],
    recurrenceDayOfMonth: 15,
    advanceDays: 3,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientPillars, setClientPillars] = useState<ClientPillar[]>([]);

  // Fetch client pillars when clientId changes
  useEffect(() => {
    if (form.clientId) {
      getClientPillars(form.clientId)
        .then(setClientPillars)
        .catch(err => console.error('Failed to fetch client pillars:', err));
    }
  }, [form.clientId]);

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
        if (form.isRecurring && !task) {
          // Create recurring template
          await createRecurringTemplate({
            clientId: form.clientId,
            pillarId: form.pillarId || null,
            clientPillarId: form.clientPillarId || null,
            title: form.title,
            description: form.description,
            assigneeId: form.assigneeId,
            priority: form.priority,
            type: form.type,
            recurrenceType: form.recurrenceType as 'daily' | 'weekly' | 'biweekly' | 'monthly',
            recurrenceDays: form.recurrenceType === 'weekly' || form.recurrenceType === 'biweekly' ? form.recurrenceDays : undefined,
            recurrenceDayOfMonth: form.recurrenceType === 'monthly' ? form.recurrenceDayOfMonth : undefined,
            advanceDays: form.advanceDays,
          });
          
          // Generate first batch of instances
          const result = await generateRecurringTaskInstances();
          const endDate = new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString();
          toast.success(`Recurring task created — ${result.created} instances generated through ${endDate}`);
          refresh();
          onSuccess?.(null);
        } else if (task) {
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
            pillarId: form.pillarId || null,
            clientPillarId: form.clientPillarId || null,
          });
          
          // Handle dependency changes (compare old vs new)
          const oldDeps = task.dependencies || [];
          const newDeps = form.dependencies;
          
          // Find additions and removals
          const added = newDeps.filter(dep => !oldDeps.includes(dep));
          const removed = oldDeps.filter(dep => !newDeps.includes(dep));
          
          // Add new dependencies
          for (const depId of added) {
            await addTaskDependency(task.id, depId);
          }
          
          // Remove old dependencies
          for (const depId of removed) {
            await removeTaskDependency(task.id, depId);
          }
          
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
            pillarId: form.pillarId || null,
            clientPillarId: form.clientPillarId || null,
          });
          
          // Add dependencies for newly created task
          if (created?.id && form.dependencies.length > 0) {
            for (const depId of form.dependencies) {
              await addTaskDependency(created.id, depId);
            }
          }
          
          if (form.projectId && created?.id) {
            await linkTaskToProject(form.projectId, created.id);
          }
          toast.success('Task created');
          refresh();
          onSuccess?.(null);
        }
        handleClose();
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
      isOpen={isOpen}
      onClose={handleClose}
      onAfterLeave={onClose}
      title={task ? 'Edit Task' : 'New Task'}
      subtitle="Add a new task to your workflow."
      variant="create"
      footer={
        <div className="px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
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

        {clientPillars.length > 0 && (
          <div>
            <label className={labelClass}>Client Pillar</label>
            <select value={form.clientPillarId} onChange={e => set('clientPillarId', e.target.value)} className={selectClass}>
              <option value="">No pillar</option>
              {clientPillars.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

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
            <label className={labelClass}>Initiative (optional)</label>
            <select value={form.projectId} onChange={e => set('projectId', e.target.value)} className={selectClass}>
              <option value="">No initiative</option>
              {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        {/* Dependencies Section */}
        <div>
          <label className={labelClass}>Depends On</label>
          
          {/* Dependency Dropdown */}
          <div className="mt-2">
            <select
              onChange={e => {
                const depId = e.target.value;
                if (depId && !form.dependencies.includes(depId)) {
                  setForm(prev => ({
                    ...prev,
                    dependencies: [...prev.dependencies, depId]
                  }));
                }
                // Reset dropdown
                setTimeout(() => {
                  const select = e.target as HTMLSelectElement;
                  select.value = '';
                }, 0);
              }}
              className={selectClass}
            >
              <option value="">+ Add dependency</option>
              {TASKS.filter(t => 
                t.clientId === form.clientId && 
                t.id !== task?.id &&
                !form.dependencies.includes(t.id)
              ).map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          
          {/* Selected Dependencies as Chips */}
          {form.dependencies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {form.dependencies.map(depId => {
                const depTask = TASKS.find(t => t.id === depId);
                return (
                  <div
                    key={depId}
                    className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm border border-indigo-200 dark:border-indigo-700"
                  >
                    <span>{depTask?.title || depId}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          dependencies: prev.dependencies.filter(id => id !== depId)
                        }));
                      }}
                      className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-bold text-lg leading-none"
                      title="Remove dependency"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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

        {!task && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={e => setForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <RefreshCw size={14} />
                  This task repeats
                </span>
              </label>
            </div>

            {form.isRecurring && (
              <div className="space-y-4 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div>
                  <label className={labelClass}>Recurrence</label>
                  <div className="flex gap-2 mt-2">
                    {['daily', 'weekly', 'biweekly', 'monthly'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, recurrenceType: type }))}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          form.recurrenceType === type
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {(form.recurrenceType === 'weekly' || form.recurrenceType === 'biweekly') && (
                  <div>
                    <label className={labelClass}>Days of Week</label>
                    <div className="grid grid-cols-7 gap-2 mt-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              recurrenceDays: prev.recurrenceDays.includes(i)
                                ? prev.recurrenceDays.filter(d => d !== i)
                                : [...prev.recurrenceDays, i].sort()
                            }));
                          }}
                          className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                            form.recurrenceDays.includes(i)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {form.recurrenceType === 'monthly' && (
                  <div>
                    <label className={labelClass}>Day of Month</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={form.recurrenceDayOfMonth}
                      onChange={e => setForm(prev => ({ ...prev, recurrenceDayOfMonth: parseInt(e.target.value) }))}
                      className={inputClass}
                    />
                  </div>
                )}

                <div>
                  <label className={labelClass}>Create in Advance (days)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={form.advanceDays}
                    onChange={e => setForm(prev => ({ ...prev, advanceDays: parseInt(e.target.value) }))}
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500 mt-1">Tasks will be created this many days before the due date</p>
                </div>
              </div>
            )}
          </>
        )}
      </form>
    </Drawer>
  );
}
