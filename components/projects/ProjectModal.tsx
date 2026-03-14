'use client';

import { useState, useTransition } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { toast } from 'sonner';
import type { Project } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { createProject, updateProject } from '@/lib/actions';

const STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'complete', label: 'Complete' },
];

interface ProjectModalProps {
  project?: Project;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const { CLIENTS = [], WORKFLOW_TEMPLATES = [], STRATEGIES = [], refresh } = useAppData();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    clientId: project?.clientId || (CLIENTS[0]?.id || ''),
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'planning',
    startDate: project?.startDate || new Date().toISOString().split('T')[0],
    endDate: project?.endDate || '',
    workflowTemplateId: project?.workflowTemplateId || '',
    strategyId: project?.strategyId || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.endDate) e.endDate = 'End date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      try {
        if (project) {
          await updateProject(project.id, {
            name: form.name,
            description: form.description,
            status: form.status,
            startDate: form.startDate,
            endDate: form.endDate,
            workflowTemplateId: form.workflowTemplateId || undefined,
            strategyId: form.strategyId || undefined,
          });
          toast.success('Project updated');
        } else {
          await createProject({
            clientId: form.clientId,
            name: form.name,
            description: form.description,
            status: form.status,
            startDate: form.startDate,
            endDate: form.endDate,
            workflowTemplateId: form.workflowTemplateId || undefined,
            strategyId: form.strategyId || undefined,
          });
          toast.success('Project created');
        }
        refresh();
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]';
  const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';

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
          className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95 max-h-[90vh] flex flex-col"
        >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
            {project ? 'Edit Project' : 'New Project'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-4">
            {!project && (
              <div>
                <label className={labelClass}>Client</label>
                <select value={form.clientId} onChange={e => set('clientId', e.target.value)} className={inputClass}>
                  {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className={labelClass}>Project Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Project name..."
                className={`${inputClass} ${errors.name ? 'border-red-400' : ''}`}
                autoFocus
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Project description..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Start Date</label>
                <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>End Date *</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => set('endDate', e.target.value)}
                  className={`${inputClass} ${errors.endDate ? 'border-red-400' : ''}`}
                />
                {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
              </div>
            </div>

            <div>
              <label className={labelClass}>Workflow Template (optional)</label>
              <select value={form.workflowTemplateId} onChange={e => set('workflowTemplateId', e.target.value)} className={inputClass}>
                <option value="">None</option>
                {WORKFLOW_TEMPLATES.map(wt => <option key={wt.id} value={wt.id}>{wt.name}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Linked Strategy (optional)</label>
              <select value={form.strategyId} onChange={e => set('strategyId', e.target.value)} className={inputClass}>
                <option value="">None</option>
                {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
