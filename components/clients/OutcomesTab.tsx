'use client';

import { useState, useTransition } from 'react';
import { CheckCircle, Plus, Trash2, Edit2, Save, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { Outcome, ClientGoal, ClientPillar, Project } from '@/lib/data';
import { createOutcome, updateOutcome, deleteOutcome } from '@/lib/actions-goals';
import Drawer from '@/components/ui/Drawer';
import { useAppData } from '@/lib/contexts/AppDataContext';

interface OutcomesTabProps {
  clientId: string;
  outcomes: Outcome[];
  goals: ClientGoal[];
  pillars: ClientPillar[];
  projects: Project[];
  onRefresh: () => void;
}

function OutcomeCard({
  outcome,
  goals,
  pillars,
  projects,
  onEdit,
  onDelete,
}: {
  outcome: Outcome;
  goals: ClientGoal[];
  pillars: ClientPillar[];
  projects: Project[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const linkedPillar = outcome.pillarId ? pillars.find(p => p.id === outcome.pillarId) : null;
  const linkedProject = outcome.initiativeId ? projects.find(p => p.id === outcome.initiativeId) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{outcome.title}</h4>
          {outcome.description && (
            <p className="text-xs text-gray-500 mt-1">{outcome.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {outcome.metricValue && (
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                📈 {outcome.metricValue}
              </span>
            )}
            {outcome.period && (
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                🗓 {outcome.period}
              </span>
            )}
            {linkedPillar && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: linkedPillar.color }}
              >
                {linkedPillar.name}
              </span>
            )}
            {linkedProject && (
              <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                📁 {linkedProject.name}
              </span>
            )}
            {outcome.evidenceUrl && (
              <a
                href={outcome.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-blue-500 hover:underline"
              >
                <ExternalLink size={10} /> Evidence
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded">
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  title: '',
  description: '',
  metricValue: '',
  period: '',
  goalId: '',
  pillarId: '',
  initiativeId: '',
  evidenceUrl: '',
};

export default function OutcomesTab({ clientId, outcomes, goals, pillars, projects, onRefresh }: OutcomesTabProps) {
  const { optimisticUpdate } = useAppData();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [, startTransition] = useTransition();

  function openEditForm(outcome: Outcome) {
    setEditingId(outcome.id);
    setForm({
      title: outcome.title,
      description: outcome.description ?? '',
      metricValue: outcome.metricValue ?? '',
      period: outcome.period ?? '',
      goalId: outcome.goalId ?? '',
      pillarId: outcome.pillarId ?? '',
      initiativeId: outcome.initiativeId ?? '',
      evidenceUrl: outcome.evidenceUrl ?? '',
    });
    setIsCreating(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const outcomeData = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      metricValue: form.metricValue.trim() || null,
      period: form.period.trim() || null,
      goalId: form.goalId || null,
      pillarId: form.pillarId || null,
      initiativeId: form.initiativeId || null,
      evidenceUrl: form.evidenceUrl.trim() || null,
    };

    if (editingId) {
      // Optimistically update
      optimisticUpdate(prev => ({
        ...prev,
        OUTCOMES: (prev.OUTCOMES ?? []).map(o =>
          o.id === editingId ? { ...o, ...outcomeData } : o
        ),
      }));
      setIsCreating(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
      toast.success('Outcome updated');
      startTransition(async () => {
        try {
          await updateOutcome(editingId, outcomeData);
        } catch {
          toast.error('Failed to update outcome');
          onRefresh();
        }
      });
    } else {
      startTransition(async () => {
        try {
          const newOutcome = await createOutcome({ clientId, ...outcomeData });
          setIsCreating(false);
          setEditingId(null);
          setForm({ ...EMPTY_FORM });
          toast.success('Outcome created');
          // Optimistically add
          optimisticUpdate(prev => ({
            ...prev,
            OUTCOMES: [...(prev.OUTCOMES ?? []), newOutcome],
          }));
        } catch {
          toast.error('Failed to save outcome');
          onRefresh();
        }
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this outcome? This cannot be undone.')) return;
    // Optimistically remove
    optimisticUpdate(prev => ({
      ...prev,
      OUTCOMES: (prev.OUTCOMES ?? []).filter(o => o.id !== id),
    }));
    toast.success('Outcome deleted');
    startTransition(async () => {
      try {
        await deleteOutcome(id, clientId);
      } catch {
        toast.error('Failed to delete outcome');
        onRefresh();
      }
    });
  }

  // Group outcomes by goal
  const goaledOutcomes = new Map<string | null, Outcome[]>();
  outcomes.forEach(o => {
    const key = o.goalId ?? null;
    if (!goaledOutcomes.has(key)) goaledOutcomes.set(key, []);
    goaledOutcomes.get(key)!.push(o);
  });

  const goalIds = Array.from(goaledOutcomes.keys());
  const linkedGoalIds = goalIds.filter(id => id !== null);
  const hasUnlinked = goaledOutcomes.has(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <CheckCircle size={18} style={{ color: 'var(--color-primary)' }} />
          Outcomes
        </h2>
        <button
          onClick={() => { setEditingId(null); setForm({ ...EMPTY_FORM }); setIsCreating(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus size={14} />
          Add Outcome
        </button>
      </div>

      {outcomes.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <CheckCircle size={32} className="mx-auto mb-3 opacity-30 text-gray-400" />
          <p className="text-sm font-medium text-gray-400 mb-3">No outcomes recorded yet</p>
          <button
            onClick={() => { setEditingId(null); setForm({ ...EMPTY_FORM }); setIsCreating(true); }}
            className="text-sm font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            + Record the first outcome
          </button>
        </div>
      )}

      {/* Grouped by goal */}
      <div className="space-y-6">
        {linkedGoalIds.map(goalId => {
          const goal = goals.find(g => g.id === goalId);
          const groupOutcomes = goaledOutcomes.get(goalId) ?? [];
          return (
            <div key={goalId}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                  {goal ? goal.title : 'Unknown Goal'}
                </span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="space-y-3">
                {groupOutcomes.map(o => (
                  <OutcomeCard
                    key={o.id}
                    outcome={o}
                    goals={goals}
                    pillars={pillars}
                    projects={projects}
                    onEdit={() => openEditForm(o)}
                    onDelete={() => handleDelete(o.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {hasUnlinked && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Unlinked</span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="space-y-3">
              {(goaledOutcomes.get(null) ?? []).map(o => (
                <OutcomeCard
                  key={o.id}
                  outcome={o}
                  goals={goals}
                  pillars={pillars}
                  projects={projects}
                  onEdit={() => openEditForm(o)}
                  onDelete={() => handleDelete(o.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Drawer */}
      <Drawer
        isOpen={isCreating}
        onClose={() => { setIsCreating(false); setEditingId(null); setForm({ ...EMPTY_FORM }); }}
        title={editingId ? 'Edit Outcome' : 'Add Outcome'}
        variant="create"
        footer={
          <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              className="flex-1 py-2 px-4 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {editingId ? 'Save Changes' : 'Create Outcome'}
            </button>
            <button
              onClick={() => { setIsCreating(false); setEditingId(null); setForm({ ...EMPTY_FORM }); }}
              className="py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              Cancel
            </button>
          </div>
        }
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Catering Revenue Growth Q2 2026"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm resize-none"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What happened, how did we achieve this?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Metric Value</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                value={form.metricValue}
                onChange={e => setForm(f => ({ ...f, metricValue: e.target.value }))}
                placeholder="e.g. +31% revenue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Period</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                value={form.period}
                onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                placeholder="e.g. Q2 2026"
              />
            </div>
          </div>
          {goals.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Linked Goal</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                value={form.goalId}
                onChange={e => setForm(f => ({ ...f, goalId: e.target.value }))}
              >
                <option value="">— None —</option>
                {goals.filter(g => g.status !== 'archived').map(g => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
          )}
          {pillars.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Linked Pillar</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                value={form.pillarId}
                onChange={e => setForm(f => ({ ...f, pillarId: e.target.value }))}
              >
                <option value="">— None —</option>
                {pillars.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          {projects.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Linked Initiative</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                value={form.initiativeId}
                onChange={e => setForm(f => ({ ...f, initiativeId: e.target.value }))}
              >
                <option value="">— None —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Evidence URL</label>
            <input
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              value={form.evidenceUrl}
              onChange={e => setForm(f => ({ ...f, evidenceUrl: e.target.value }))}
              placeholder="https://..."
              type="url"
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
