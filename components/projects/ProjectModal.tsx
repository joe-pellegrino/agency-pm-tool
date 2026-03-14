'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Project } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { createProject, updateProject } from '@/lib/actions';
import Drawer from '@/components/ui/Drawer';

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

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelClass = 'block text-sm font-medium text-gray-900 dark:text-white mb-1';

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={project ? 'Edit Project' : 'New Project'}
      subtitle="Fill in the information below to create your new project."
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
            form="project-form"
            disabled={isPending}
            className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="space-y-5">
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
            rows={4}
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
      </form>
    </Drawer>
  );
}
