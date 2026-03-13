'use client';

import { useState, useTransition } from 'react';
import { Automation } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { Zap, Play, Pause, Plus, X, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { toast } from 'sonner';
import { createAutomation, updateAutomation } from '@/lib/actions';

const FREQ_LABELS: Record<string, string> = {
  monthly: 'Monthly',
  weekly: 'Weekly',
  custom: 'Custom',
};

const FREQ_COLORS: Record<string, string> = {
  monthly: 'bg-blue-100 text-blue-700',
  weekly: 'bg-purple-100 text-purple-700',
  custom: 'bg-amber-100 text-amber-700',
};

function SaveButton({ form, onClose, canProceed }: { form: { clientId: string; templateId: string; frequency: string; assigneeId: string }; onClose: () => void; canProceed: () => boolean }) {
  const { refresh } = useAppData();
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!canProceed()) return;
    startTransition(async () => {
      try {
        await createAutomation({
          clientId: form.clientId,
          templateId: form.templateId,
          frequency: form.frequency,
          assigneeId: form.assigneeId,
          status: 'active',
          nextRunDate: (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]; })(),
        });
        toast.success('Automation created');
        refresh?.();
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  return (
    <button
      disabled={!canProceed() || isPending}
      onClick={handleSave}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]"
    >
      <Zap size={15} />
      Activate
    </button>
  );
}

function CreateAutomationModal({ onClose }: { onClose: () => void }) {
  const { CLIENTS = [], TASK_TEMPLATES = [], TEAM_MEMBERS = [] } = useAppData();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ clientId: '', templateId: '', frequency: 'monthly', assigneeId: '' });

  const canProceed = () => {
    if (step === 1) return !!form.clientId;
    if (step === 2) return !!form.templateId;
    if (step === 3) return !!form.frequency;
    if (step === 4) return !!form.assigneeId;
    return false;
  };

  const steps = ['Select Client', 'Choose Template', 'Set Frequency', 'Assign & Activate'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Create Automation</h2>
            <p className="text-xs text-gray-500 mt-0.5">Step {step} of 4 — {steps[step - 1]}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 sm:px-6 pt-4">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            ))}
          </div>
        </div>

        <div className="px-5 sm:px-6 py-5 sm:py-6">
          {step === 1 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Which client is this for?</p>
              <div className="space-y-2">
                {CLIENTS.map(client => (
                  <button
                    key={client.id}
                    onClick={() => setForm(f => ({ ...f, clientId: client.id }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all min-h-[56px] ${
                      form.clientId === client.id ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: client.color + '20', color: client.color }}>{client.logo}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{client.name}</div>
                      <div className="text-xs text-gray-400">{client.industry}</div>
                    </div>
                    {form.clientId === client.id && <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Which template?</p>
              <div className="space-y-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
                {TASK_TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => setForm(f => ({ ...f, templateId: tmpl.id }))}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all min-h-[52px] ${
                      form.templateId === tmpl.id ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{tmpl.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">Due: {tmpl.dueRule} · {tmpl.estimatedDuration}d</div>
                    </div>
                    {form.templateId === tmpl.id && <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">How often should this run?</p>
              <div className="space-y-2">
                {['monthly', 'weekly', 'custom'].map(freq => (
                  <button
                    key={freq}
                    onClick={() => setForm(f => ({ ...f, frequency: freq }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all min-h-[52px] ${
                      form.frequency === freq ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${FREQ_COLORS[freq]}`}>{FREQ_LABELS[freq]}</span>
                    <span className="text-sm text-gray-500">{freq === 'monthly' ? 'Once per month' : freq === 'weekly' ? 'Every week' : 'Custom schedule'}</span>
                    {form.frequency === freq && <CheckCircle2 size={16} className="ml-auto text-indigo-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Who should be assigned?</p>
              <div className="space-y-2">
                {TEAM_MEMBERS.map(member => (
                  <button
                    key={member.id}
                    onClick={() => setForm(f => ({ ...f, assigneeId: member.id }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all min-h-[56px] ${
                      form.assigneeId === member.id ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: member.color }}>{member.initials}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</div>
                      <div className="text-xs text-gray-400">{member.role}</div>
                    </div>
                    {form.assigneeId === member.id && <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="px-4 py-3 text-gray-600 hover:text-gray-800 text-sm border border-gray-200 rounded-lg transition-colors min-h-[44px]">
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]"
            >
              Continue
            </button>
          ) : (
            <SaveButton form={form} onClose={onClose} canProceed={canProceed} />
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile card view for automation
function AutomationCard({ automation, onToggle }: { automation: Automation; onToggle: () => void }) {
  const { TASK_TEMPLATES = [], TEAM_MEMBERS = [], CLIENTS = [] } = useAppData();
  const template = TASK_TEMPLATES.find(t => t.id === automation.templateId)!;
  const assignee = TEAM_MEMBERS.find(m => m.id === automation.assigneeId)!;

  return (
    <div className={`p-4 border-b border-gray-100 dark:border-gray-700/50 ${automation.status === 'paused' ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${automation.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{template?.title}</span>
        </div>
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-shrink-0 min-h-[44px] ${
            automation.status === 'active' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          {automation.status === 'active' ? <><Pause size={11} /> Pause</> : <><Play size={11} /> Resume</>}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className={`font-medium px-2 py-0.5 rounded-full ${FREQ_COLORS[automation.frequency]}`}>
          {FREQ_LABELS[automation.frequency]}
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={10} />
          Next: {new Date(automation.nextRunDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={10} />
          Last: {new Date(automation.lastRunDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: assignee?.color }}>
            {assignee?.initials}
          </div>
          <span>{assignee?.name.split(' ')[0]}</span>
        </div>
      </div>
    </div>
  );
}

// Desktop row view
function AutomationRow({ automation, onToggle }: { automation: Automation; onToggle: () => void }) {
  const { TASK_TEMPLATES = [], TEAM_MEMBERS = [] } = useAppData();
  const template = TASK_TEMPLATES.find(t => t.id === automation.templateId)!;
  const assignee = TEAM_MEMBERS.find(m => m.id === automation.assigneeId)!;

  return (
    <div className={`flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${automation.status === 'paused' ? 'opacity-60' : ''}`}>
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${automation.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{template?.title}</div>
        <div className="text-xs text-gray-400 mt-0.5">{template?.dueRule}</div>
      </div>
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${FREQ_COLORS[automation.frequency]}`}>
        {FREQ_LABELS[automation.frequency]}
      </span>
      <div className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0 w-28">
        <Calendar size={11} />
        {new Date(automation.nextRunDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
      <div className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0 w-28">
        <Clock size={11} />
        {new Date(automation.lastRunDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: assignee?.color }} title={assignee?.name}>
        {assignee?.initials}
      </div>
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 min-h-[44px] ${
          automation.status === 'active' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
        }`}
      >
        {automation.status === 'active' ? <><Pause size={11} /> Pause</> : <><Play size={11} /> Resume</>}
      </button>
    </div>
  );
}

export default function AutomationsPage() {
  const { AUTOMATIONS = [], TASK_TEMPLATES = [], CLIENTS = [], TEAM_MEMBERS = [], refresh } = useAppData();
  const [automations, setAutomations] = useState<Automation[]>(AUTOMATIONS);
  const [selectedClient, setSelectedClient] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [, startTransition] = useTransition();

  // Sync when data loads
  useState(() => { if (AUTOMATIONS.length > 0) setAutomations(AUTOMATIONS); });

  const toggleAutomation = (id: string) => {
    const current = automations.find(a => a.id === id);
    if (!current) return;
    const newStatus = current.status === 'active' ? 'paused' : 'active';
    // Optimistic update
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    startTransition(async () => {
      try {
        await updateAutomation(id, { status: newStatus });
      } catch {
        toast.error('Failed to update automation');
        setAutomations(AUTOMATIONS);
      }
    });
  };

  const filtered = automations.filter(a => selectedClient === 'all' || a.clientId === selectedClient);
  const activeCount = automations.filter(a => a.status === 'active').length;
  const pausedCount = automations.filter(a => a.status === 'paused').length;

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Automations" subtitle="Recurring task rules per client" />

      <div className="p-4 sm:p-6 lg:p-8">
        {showCreate && <CreateAutomationModal onClose={() => setShowCreate(false)} />}

        {/* Stats — 2 cols mobile, 4 desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'Total', value: automations.length, color: 'text-indigo-600' },
            { label: 'Active', value: activeCount, color: 'text-green-600' },
            { label: 'Paused', value: pausedCount, color: 'text-amber-600' },
            { label: 'Weekly', value: automations.filter(a => a.status === 'active' && a.frequency === 'weekly').length, color: 'text-blue-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
              <div className={`text-xl sm:text-2xl font-bold ${color} mb-1`}>{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Actions + Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 sm:mb-6">
          {/* Client filter chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
            <button
              onClick={() => setSelectedClient('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${selectedClient === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              All
            </button>
            {CLIENTS.map(client => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[40px] ${selectedClient === client.id ? 'text-white' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
                style={selectedClient === client.id ? { backgroundColor: client.color } : { color: client.color }}
              >
                {client.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px] flex-shrink-0"
          >
            <Plus size={15} />
            Create Automation
          </button>
        </div>

        {/* Per-client automation groups */}
        {(selectedClient === 'all' ? CLIENTS : CLIENTS.filter(c => c.id === selectedClient)).map(client => {
          const clientAutomations = filtered.filter(a => a.clientId === client.id);
          if (clientAutomations.length === 0) return null;

          return (
            <div key={client.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-4 sm:mb-6 overflow-hidden">
              {/* Client header */}
              <div className="px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: client.color + '20', color: client.color }}>
                    {client.logo}
                  </span>
                  <div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{client.name}</div>
                    <div className="text-xs text-gray-400">{clientAutomations.filter(a => a.status === 'active').length} active</div>
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: client.color + '15', color: client.color }}>
                  {clientAutomations.length} rules
                </span>
              </div>

              {/* Mobile: card list */}
              <div className="sm:hidden">
                {clientAutomations.map(automation => (
                  <AutomationCard key={automation.id} automation={automation} onToggle={() => toggleAutomation(automation.id)} />
                ))}
              </div>

              {/* Desktop: table with header */}
              <div className="hidden sm:block">
                <div className="px-5 py-2 bg-gray-50 dark:bg-gray-700/30 flex items-center gap-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                  <div className="w-2 flex-shrink-0" />
                  <div className="flex-1">Template</div>
                  <div className="w-20">Frequency</div>
                  <div className="w-28">Next Run</div>
                  <div className="w-28">Last Run</div>
                  <div className="w-7">Who</div>
                  <div className="w-20">Action</div>
                </div>
                {clientAutomations.map(automation => (
                  <AutomationRow key={automation.id} automation={automation} onToggle={() => toggleAutomation(automation.id)} />
                ))}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 sm:py-20 text-gray-400">
            <Zap size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No automations found</p>
            <p className="text-sm mt-1">Create your first automation to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
