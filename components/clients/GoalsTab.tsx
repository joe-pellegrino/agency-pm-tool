'use client';

import { useState, useTransition } from 'react';
import { Target, Plus, Trash2, Edit2, Save, X, Link, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ClientGoal, GoalPillarLink, ClientPillar } from '@/lib/data';
import {
  createClientGoal,
  updateClientGoal,
  deleteClientGoal,
  linkGoalToPillar,
  unlinkGoalFromPillar,
} from '@/lib/actions-goals';
import Drawer from '@/components/ui/Drawer';
import { useAppData } from '@/lib/contexts/AppDataContext';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active:   { label: 'Active',    cls: 'bg-blue-100 text-blue-700' },
  achieved: { label: 'Achieved',  cls: 'bg-green-100 text-green-700' },
  archived: { label: 'Archived',  cls: 'bg-gray-100 text-gray-500' },
};

interface GoalsTabProps {
  clientId: string;
  goals: ClientGoal[];
  goalPillarLinks: GoalPillarLink[];
  pillars: ClientPillar[];
  onRefresh: () => void;
}

export default function GoalsTab({ clientId, goals, goalPillarLinks, pillars, onRefresh }: GoalsTabProps) {
  const { optimisticUpdate } = useAppData();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkingGoalId, setLinkingGoalId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Create form state
  const [createForm, setCreateForm] = useState({ title: '', description: '', targetMetric: '' });

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<ClientGoal>>({});

  function getLinkedPillarIds(goalId: string) {
    return goalPillarLinks.filter(l => l.goalId === goalId).map(l => l.pillarId);
  }

  function getPillarForId(pillarId: string) {
    return pillars.find(p => p.id === pillarId);
  }

  async function handleCreate() {
    if (!createForm.title.trim()) { toast.error('Title is required'); return; }
    startTransition(async () => {
      try {
        const newGoal = await createClientGoal({
          clientId,
          title: createForm.title.trim(),
          description: createForm.description.trim() || null,
          targetMetric: createForm.targetMetric.trim() || null,
        });
        setCreateForm({ title: '', description: '', targetMetric: '' });
        setIsCreating(false);
        toast.success('Goal created');
        // Optimistically add the new goal
        optimisticUpdate(prev => ({
          ...prev,
          CLIENT_GOALS: [...(prev.CLIENT_GOALS ?? []), newGoal],
        }));
      } catch (e) {
        toast.error('Failed to create goal');
        onRefresh();
      }
    });
  }

  async function handleUpdate(id: string) {
    if (!editForm.title?.trim()) { toast.error('Title is required'); return; }
    const updates = {
      title: editForm.title?.trim() ?? '',
      description: editForm.description ?? null,
      targetMetric: editForm.targetMetric ?? null,
      status: (editForm.status ?? 'active') as ClientGoal['status'],
    };
    // Optimistically update
    optimisticUpdate(prev => ({
      ...prev,
      CLIENT_GOALS: (prev.CLIENT_GOALS ?? []).map(g =>
        g.id === id ? { ...g, ...updates } : g
      ),
    }));
    setEditingId(null);
    toast.success('Goal updated');
    startTransition(async () => {
      try {
        await updateClientGoal(id, updates);
      } catch {
        toast.error('Failed to update goal');
        onRefresh();
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this goal? This cannot be undone.')) return;
    // Optimistically remove
    optimisticUpdate(prev => ({
      ...prev,
      CLIENT_GOALS: (prev.CLIENT_GOALS ?? []).filter(g => g.id !== id),
      GOAL_PILLAR_LINKS: (prev.GOAL_PILLAR_LINKS ?? []).filter(l => l.goalId !== id),
    }));
    toast.success('Goal deleted');
    startTransition(async () => {
      try {
        await deleteClientGoal(id, clientId);
      } catch {
        toast.error('Failed to delete goal');
        onRefresh();
      }
    });
  }

  async function handleStatusChange(id: string, status: ClientGoal['status']) {
    // Optimistically update status
    optimisticUpdate(prev => ({
      ...prev,
      CLIENT_GOALS: (prev.CLIENT_GOALS ?? []).map(g =>
        g.id === id ? { ...g, status } : g
      ),
    }));
    toast.success('Status updated');
    startTransition(async () => {
      try {
        await updateClientGoal(id, { status });
      } catch {
        toast.error('Failed to update status');
        onRefresh();
      }
    });
  }

  async function handleLinkPillar(goalId: string, pillarId: string, isLinked: boolean) {
    // Optimistically update pillar links
    if (isLinked) {
      optimisticUpdate(prev => ({
        ...prev,
        GOAL_PILLAR_LINKS: (prev.GOAL_PILLAR_LINKS ?? []).filter(
          l => !(l.goalId === goalId && l.pillarId === pillarId)
        ),
      }));
      toast.success('Pillar unlinked');
    } else {
      const tempLink: GoalPillarLink = { id: `temp-${Date.now()}`, goalId, pillarId };
      optimisticUpdate(prev => ({
        ...prev,
        GOAL_PILLAR_LINKS: [...(prev.GOAL_PILLAR_LINKS ?? []), tempLink],
      }));
      toast.success('Pillar linked');
    }
    startTransition(async () => {
      try {
        if (isLinked) {
          await unlinkGoalFromPillar(goalId, pillarId);
        } else {
          await linkGoalToPillar(goalId, pillarId);
        }
        onRefresh(); // refresh to get real IDs for any temp links
      } catch {
        toast.error('Failed to update pillar link');
        onRefresh();
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <Target size={18} style={{ color: 'var(--color-primary)' }} />
          Client Goals
        </h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus size={14} />
          Add Goal
        </button>
      </div>

      {goals.length === 0 && !isCreating && (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <Target size={32} className="mx-auto mb-3 opacity-30 text-gray-400" />
          <p className="text-sm font-medium text-gray-400 mb-3">No goals defined yet for this client</p>
          <button
            onClick={() => setIsCreating(true)}
            className="text-sm font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            + Add the first goal
          </button>
        </div>
      )}

      <div className="space-y-3">
        {goals.map(goal => {
          const linkedPillarIds = getLinkedPillarIds(goal.id);
          const isEditing = editingId === goal.id;
          const badge = STATUS_BADGE[goal.status] ?? STATUS_BADGE.active;

          return (
            <div
              key={goal.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                    value={editForm.title ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Goal title"
                  />
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm resize-none"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                    rows={2}
                    value={editForm.description ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Description (optional)"
                  />
                  <input
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                    value={editForm.targetMetric ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, targetMetric: e.target.value }))}
                    placeholder="Target metric (e.g. 25% more catering revenue)"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(goal.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-lg"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <Save size={12} /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg"
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{goal.title}</h3>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                      </div>
                      {goal.description && (
                        <p className="text-xs text-gray-500 mt-1">{goal.description}</p>
                      )}
                      {goal.targetMetric && (
                        <p className="text-xs mt-1 font-medium text-green-600 dark:text-green-400">
                          🎯 {goal.targetMetric}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Status toggle */}
                      <select
                        value={goal.status}
                        onChange={e => handleStatusChange(goal.id, e.target.value as ClientGoal['status'])}
                        className="text-[10px] border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 cursor-pointer"
                        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
                      >
                        <option value="active">Active</option>
                        <option value="achieved">Achieved</option>
                        <option value="archived">Archived</option>
                      </select>
                      <button
                        onClick={() => {
                          setEditingId(goal.id);
                          setEditForm({
                            title: goal.title,
                            description: goal.description ?? '',
                            targetMetric: goal.targetMetric ?? '',
                            status: goal.status,
                          });
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setLinkingGoalId(goal.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 rounded"
                        title="Link pillars"
                      >
                        <Link size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(goal.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                        title="Delete goal"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Linked pillar chips */}
                  {linkedPillarIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      {linkedPillarIds.map(pid => {
                        const pillar = getPillarForId(pid);
                        if (!pillar) return null;
                        return (
                          <span
                            key={pid}
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: pillar.color }}
                          >
                            {pillar.name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Goal Drawer */}
      <Drawer
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Add Goal"
        variant="create"
        footer={
          <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCreate}
              className="flex-1 py-2 px-4 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Create Goal
            </button>
            <button
              onClick={() => setIsCreating(false)}
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
              value={createForm.title}
              onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Grow catering revenue by 25%"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm resize-none"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              rows={3}
              value={createForm.description}
              onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What does this goal mean for the client?"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Target Metric</label>
            <input
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
              value={createForm.targetMetric}
              onChange={e => setCreateForm(f => ({ ...f, targetMetric: e.target.value }))}
              placeholder="e.g. 25% more catering revenue by Q4"
            />
          </div>
        </div>
      </Drawer>

      {/* Link Pillar Drawer */}
      <Drawer
        isOpen={linkingGoalId !== null}
        onClose={() => setLinkingGoalId(null)}
        title="Link Pillars to Goal"
        subtitle="Select which pillars this goal supports"
        variant="details"
      >
        <div className="p-4">
          {pillars.length === 0 ? (
            <p className="text-sm text-gray-500">No pillars defined for this client yet.</p>
          ) : (
            <div className="space-y-2">
              {pillars.map(pillar => {
                const linkedIds = linkingGoalId ? getLinkedPillarIds(linkingGoalId) : [];
                const isLinked = linkedIds.includes(pillar.id);
                return (
                  <button
                    key={pillar.id}
                    onClick={() => linkingGoalId && handleLinkPillar(linkingGoalId, pillar.id, isLinked)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-colors text-left"
                    style={{ backgroundColor: isLinked ? `${pillar.color}15` : 'var(--color-surface)' }}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: pillar.color }}
                    />
                    <span className="text-sm font-medium flex-1" style={{ color: 'var(--color-text-primary)' }}>
                      {pillar.name}
                    </span>
                    {isLinked ? (
                      <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="w-[15px] h-[15px] rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
