'use client';

import { useState, useTransition, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Project, ClientPillar } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { createProject, updateProject, getClientPillars } from '@/lib/actions';
import { getProjectMembers } from '@/lib/actions-projects';
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
  const { CLIENTS = [], WORKFLOW_TEMPLATES = [], STRATEGIES = [], TEAM_MEMBERS = [], refresh } = useAppData();
  const [isOpen, setIsOpen] = useState(true);
  const handleClose = () => setIsOpen(false);
  const [isPending, startTransition] = useTransition();
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    clientId: project?.clientId || (CLIENTS[0]?.id || ''),
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'planning',
    startDate: project?.startDate || new Date().toISOString().split('T')[0],
    endDate: project?.endDate || '',
    workflowTemplateId: project?.workflowTemplateId || '',
    strategyId: project?.strategyId || '',
    pillarId: project?.pillarId || '',
    clientPillarId: project?.clientPillarId || '',
    type: project?.type?.toLowerCase() || 'project',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientPillars, setClientPillars] = useState<ClientPillar[]>([]);

  // Load existing project members on mount
  useEffect(() => {
    if (project?.id) {
      getProjectMembers(project.id).then(members => {
        setMemberIds(members.map(m => m.teamMemberId));
      }).catch(err => {
        console.error('Failed to load project members:', err);
      });
    }
  }, [project?.id]);

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
        if (project?.id) {
          await updateProject(project.id, {
            name: form.name,
            description: form.description,
            status: form.status,
            startDate: form.startDate,
            endDate: form.endDate,
            workflowTemplateId: form.workflowTemplateId || undefined,
            strategyId: form.strategyId || undefined,
            pillarId: form.pillarId || undefined,
            clientPillarId: form.clientPillarId || null,
            type: form.type,
          });
          
          // Sync project members
          const { addProjectMember, removeProjectMember } = await import('@/lib/actions-projects');
          const current = await getProjectMembers(project.id);
          const currentIds = current.map(m => m.teamMemberId);
          const toAdd = memberIds.filter(id => !currentIds.includes(id));
          const toRemove = currentIds.filter(id => !memberIds.includes(id));
          await Promise.all([
            ...toAdd.map(id => addProjectMember(project.id, id)),
            ...toRemove.map(id => removeProjectMember(project.id, id)),
          ]);
          
          toast.success('Project updated');
        } else {
          const result = await createProject({
            clientId: form.clientId,
            name: form.name,
            description: form.description,
            status: form.status,
            startDate: form.startDate,
            endDate: form.endDate,
            workflowTemplateId: form.workflowTemplateId || undefined,
            strategyId: form.strategyId || undefined,
            pillarId: form.pillarId || undefined,
            clientPillarId: form.clientPillarId || null,
            type: form.type,
          });
          
          // Add members to new project (createProject returns the new id as a string)
          if (result && memberIds.length > 0) {
            const newId = typeof result === 'string' ? result : (result as any).id;
            const { addProjectMember } = await import('@/lib/actions-projects');
            await Promise.all(memberIds.map(id => addProjectMember(newId, id)));
          }
          
          toast.success('Project created');
        }
        refresh();
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
      title={project ? 'Edit Initiative' : 'New Initiative'}
      subtitle="Fill in the information below to create your new project."
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
            form="project-form"
            disabled={isPending}
            className="bg-indigo-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {project ? 'Save Changes' : 'Create Initiative'}
          </button>
        </div>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="space-y-5">
        {!project && (
          <div>
            <label className={labelClass}>Client</label>
            <select value={form.clientId} onChange={e => set('clientId', e.target.value)} className={selectClass}>
              {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>Initiative Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Initiative name..."
            className={`${inputClass} ${errors.name ? 'border-red-400' : ''}`}
            autoFocus
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className={labelClass}>Type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)} className={selectClass}>
            {['campaign', 'project', 'retainer', 'content-series', 'event', 'audit', 'other'].map(t => (
              <option key={t} value={t}>{t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
            ))}
          </select>
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
          <select value={form.status} onChange={e => set('status', e.target.value)} className={selectClass}>
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
          <select value={form.workflowTemplateId} onChange={e => set('workflowTemplateId', e.target.value)} className={selectClass}>
            <option value="">None</option>
            {WORKFLOW_TEMPLATES.map(wt => <option key={wt.id} value={wt.id}>{wt.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Linked Strategy (optional)</label>
          <select value={form.strategyId} onChange={e => set('strategyId', e.target.value)} className={selectClass}>
            <option value="">None</option>
            {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
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

        <div>
          <label className={labelClass}>Initiative Leads</label>
          <div className="space-y-2">
            <select
              onChange={e => {
                const id = e.target.value;
                if (id && !memberIds.includes(id)) {
                  setMemberIds(prev => [...prev, id]);
                }
                e.currentTarget.value = '';
              }}
              className={selectClass}
              defaultValue=""
            >
              <option value="" disabled>Add a lead...</option>
              {TEAM_MEMBERS.filter(m => !memberIds.includes(m.id)).map(m => (
                <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
              ))}
            </select>
            {memberIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {memberIds.map(id => {
                  const m = TEAM_MEMBERS.find(tm => tm.id === id);
                  return m ? (
                    <span key={id} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-200">
                      {m.name}
                      <button
                        type="button"
                        onClick={() => setMemberIds(prev => prev.filter(i => i !== id))}
                        className="hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      </form>
    </Drawer>
  );
}
