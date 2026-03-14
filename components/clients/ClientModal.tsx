'use client';

import { useState, useTransition } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import { toast } from 'sonner';
import type { Client } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { createClient, updateClient } from '@/lib/actions';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6',
];

interface ClientModalProps {
  client?: Client;
  onClose: () => void;
}

export default function ClientModal({ client, onClose }: ClientModalProps) {
  const { refresh } = useAppData();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: client?.name || '',
    industry: client?.industry || '',
    location: client?.location || '',
    color: client?.color || PRESET_COLORS[0],
    logo: client?.logo || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  // Auto-generate initials from name
  const handleNameChange = (v: string) => {
    const initials = v.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').join('').slice(0, 2);
    setForm(prev => ({ ...prev, name: v, logo: prev.logo || initials }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      try {
        if (client) {
          await updateClient(client.id, form);
          toast.success('Client updated');
        } else {
          await createClient(form);
          toast.success('Client created');
        }
        refresh();
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]';

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      {/* Backdrop with fade transition */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 transition duration-300 ease-in-out data-closed:opacity-0"
      />

      {/* Dialog positioning container */}
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto">
        {/* Panel with scale + fade animation */}
        <DialogPanel
          transition
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition duration-300 ease-out data-closed:opacity-0 data-closed:scale-95"
        >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
            {client ? 'Edit Client' : 'New Client'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: form.color }}
            >
              {form.logo || '?'}
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-900 dark:text-white">{form.name || 'Client Name'}</div>
              <div className="text-xs text-gray-500">{form.industry || 'Industry'}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Client name..."
              className={`${inputClass} ${errors.name ? 'border-red-400' : ''}`}
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Industry</label>
              <input type="text" value={form.industry} onChange={e => set('industry', e.target.value)} placeholder="e.g. Restaurant" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Location</label>
              <input type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. New York, NY" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Logo / Initials</label>
            <input type="text" value={form.logo} onChange={e => set('logo', e.target.value)} placeholder="e.g. AB" maxLength={3} className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Brand Color</label>
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
              <input
                type="color"
                value={form.color}
                onChange={e => set('color', e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border-0 p-0"
                title="Custom color"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {client ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
