'use client';

import { useState, useTransition } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TeamMember } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { createTeamMember, updateTeamMember } from '@/lib/actions';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6',
  '#64748b', '#78716c',
];

interface TeamMemberModalProps {
  member?: TeamMember;
  onClose: () => void;
}

export default function TeamMemberModal({ member, onClose }: TeamMemberModalProps) {
  const { refresh } = useAppData();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: member?.name || '',
    role: member?.role || '',
    initials: member?.initials || '',
    color: member?.color || PRESET_COLORS[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.role.trim()) e.role = 'Role is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleNameChange = (v: string) => {
    const initials = v.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').join('').slice(0, 2);
    setForm(prev => ({ ...prev, name: v, initials: prev.initials || initials }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      try {
        if (member) {
          await updateTeamMember(member.id, form);
          toast.success('Team member updated');
        } else {
          await createTeamMember(form);
          toast.success('Team member added');
        }
        refresh();
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F6AE8]';
  const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
            {member ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: form.color }}
            >
              {form.initials || '?'}
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-900 dark:text-white">{form.name || 'Team Member'}</div>
              <div className="text-xs text-gray-500">{form.role || 'Role'}</div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Full name..."
              className={`${inputClass} ${errors.name ? 'border-red-400' : ''}`}
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className={labelClass}>Role *</label>
            <input
              type="text"
              value={form.role}
              onChange={e => set('role', e.target.value)}
              placeholder="e.g. Designer, Developer..."
              className={`${inputClass} ${errors.role ? 'border-red-400' : ''}`}
            />
            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
          </div>

          <div>
            <label className={labelClass}>Initials</label>
            <input
              type="text"
              value={form.initials}
              onChange={e => set('initials', e.target.value.toUpperCase().slice(0, 3))}
              placeholder="e.g. AB"
              maxLength={3}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input type="color" value={form.color} onChange={e => set('color', e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border-0 p-0" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#4F6AE8] hover:bg-[#3B5BDB] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {member ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
