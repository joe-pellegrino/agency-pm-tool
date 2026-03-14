'use client';

import { useState, useMemo, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { Service, ClientService, ServiceCategory } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import TopBar from '@/components/layout/TopBar';
import {
  LayoutGrid, List, Filter, Search, TrendingUp, Activity, AlertTriangle,
  CheckCircle, Zap, FolderOpen, ChevronRight, Users, Plus, Pencil, X, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { upsertClientService, updateClientService, archiveClientService, removeClientService } from '@/lib/actions';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; cell: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', dot: 'bg-green-500', cell: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700/50' },
  planning: { label: 'Planning', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-400', cell: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/50' },
  paused: { label: 'Paused', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', cell: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/50' },
  cancelled: { label: 'Not Active', color: 'bg-gray-100 text-gray-400', dot: 'bg-gray-300', cell: 'bg-gray-50 border-gray-100 dark:bg-gray-800/30 dark:border-gray-700/30' },
};

function getHealthColor(score: number | null): string {
  if (score === null) return 'text-gray-400';
  if (score >= 70) return 'text-green-600 dark:text-green-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getCellBg(score: number | null, status: string): string {
  if (status === 'cancelled') return 'bg-gray-50 dark:bg-gray-800/20';
  if (score === null) return 'bg-white dark:bg-gray-800';
  if (score >= 70) return 'bg-green-50 dark:bg-green-900/10';
  if (score >= 40) return 'bg-amber-50 dark:bg-amber-900/10';
  return 'bg-red-50 dark:bg-red-900/10';
}

function getCellBorder(score: number | null, status: string): string {
  if (status === 'cancelled') return 'border-gray-100 dark:border-gray-700/30';
  if (score === null) return 'border-gray-200 dark:border-gray-700';
  if (score >= 70) return 'border-green-200 dark:border-green-700/40';
  if (score >= 40) return 'border-amber-200 dark:border-amber-700/40';
  return 'border-red-200 dark:border-red-700/40';
}

function computeHealthScore(cs: ClientService, serviceStrategies: import('@/lib/data').ServiceStrategy[]): number | null {
  const ss = serviceStrategies.find(s => s.clientServiceId === cs.id);
  if (!ss) return null;
  const scores = ss.kpis.map(kpi => {
    const lb = kpi.name.toLowerCase().includes('bounce') || kpi.name.toLowerCase().includes('cpc') || kpi.name.toLowerCase().includes('pos');
    return lb ? Math.min(100, (kpi.target / Math.max(kpi.current, 0.01)) * 100) : Math.min(100, (kpi.current / kpi.target) * 100);
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// Quick-assign popup for matrix cell (services page)
function MatrixQuickAssign({
  service,
  client,
  onClose,
}: {
  service: import('@/lib/data').Service;
  client: import('@/lib/data').Client;
  onClose: () => void;
}) {
  const { STRATEGIES = [], refresh } = useAppData();
  const [status, setStatus] = useState('active');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [cadence, setCadence] = useState('');
  const [isPending, startTransition] = useTransition();
  const clientStrategies = STRATEGIES.filter(s => s.clientId === client.id);
  const [stratId, setStratId] = useState('');

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]';

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await upsertClientService({
          clientId: client.id,
          serviceId: service.id,
          status,
          startDate,
          monthlyCadence: cadence || undefined,
          linkedStrategyId: stratId || undefined,
        });
        toast.success(`${service.name} assigned to ${client.name}`);
        refresh?.();
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xl">{service.icon}</span>
              <h2 className="font-semibold text-gray-900 dark:text-white">Assign Service</h2>
            </div>
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700 dark:text-gray-300">{service.name}</span>
              {' → '}
              <span className="font-medium text-gray-700 dark:text-gray-300">{client.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass}>
                <option value="active">Active</option>
                <option value="planning">Planning</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Cadence (optional)</label>
            <input type="text" value={cadence} onChange={e => setCadence(e.target.value)} placeholder="e.g. 4 posts/month..." className={inputClass} />
          </div>
          {clientStrategies.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Linked Strategy (optional)</label>
              <select value={stratId} onChange={e => setStratId(e.target.value)} className={inputClass}>
                <option value="">None</option>
                {clientStrategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={isPending} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={14} />}
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

function MatrixCell({ cs, clientId, serviceId }: { cs: ClientService | null; clientId: string; serviceId: string }) {
  const { SERVICE_STRATEGIES = [], TASKS = [], PROJECTS = [], CLIENTS = [], SERVICES = [], refresh } = useAppData();
  const [showAssign, setShowAssign] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, startRemoveTransition] = useTransition();
  const client = CLIENTS.find(c => c.id === clientId);
  const service = SERVICES.find(s => s.id === serviceId);

  const handleRemove = () => {
    if (!cs) return;
    startRemoveTransition(async () => {
      try {
        await removeClientService(cs.id);
        toast.success(`${service?.name ?? 'Service'} removed from ${client?.name ?? 'client'}`);
        refresh?.();
        setShowRemoveConfirm(false);
      } catch (err) {
        toast.error('Failed to remove: ' + (err as Error).message);
      }
    });
  };

  if (!cs) {
    return (
      <>
        {showAssign && client && service && (
          <MatrixQuickAssign service={service} client={client} onClose={() => setShowAssign(false)} />
        )}
        <button
          onClick={() => setShowAssign(true)}
          className="h-20 w-full rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20 flex items-center justify-center hover:border-indigo-300 hover:bg-[#EEF2FF]/40 dark:hover:border-[#3B5BDB] dark:hover:bg-indigo-900/10 transition-all group"
        >
          <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus size={14} className="text-[#3B5BDB]" />
            <span className="text-[10px] text-[#3B5BDB] font-medium">Assign</span>
          </div>
        </button>
      </>
    );
  }

  const health = computeHealthScore(cs, SERVICE_STRATEGIES);
  const projs = PROJECTS.filter(p => cs.linkedProjects.includes(p.id));
  const tasks = projs.flatMap(p => TASKS.filter(t => p.taskIds.includes(t.id)));
  const openTasks = tasks.filter(t => t.status !== 'done').length;
  const blockers = tasks.filter(t => t.priority === 'Urgent' && t.status !== 'done').length;
  const donePct = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;
  const statusCfg = STATUS_CONFIG[cs.status];

  return (
    <>
      {showRemoveConfirm && (
        <ConfirmDialog
          title="Remove Service"
          message={`Remove ${service?.name ?? 'this service'} from ${client?.name ?? 'this client'}? This will unlink the service entirely.`}
          confirmLabel={isRemoving ? 'Removing…' : 'Remove'}
          destructive
          onConfirm={handleRemove}
          onCancel={() => setShowRemoveConfirm(false)}
        />
      )}
      <div className={`relative h-20 rounded-lg border flex flex-col justify-between p-2.5 transition-all group/cell bg-white ${getCellBorder(health, cs.status)}`}>
        {/* Remove button on hover */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowRemoveConfirm(true); }}
          className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-700 opacity-0 group-hover/cell:opacity-100 transition-opacity z-10"
          title="Remove service"
        >
          <X size={10} />
        </button>
        <Link href={`/clients/${cs.clientId}`} className="absolute inset-0 rounded-lg" />
        <div className="relative flex items-start justify-between pointer-events-none">
          {health !== null && (
            <span className={`text-xs font-bold ${getHealthColor(health)}`}>{health}%</span>
          )}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${statusCfg.color}`}>
            <span className={`w-1 h-1 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>
        {cs.status !== 'cancelled' && (
          <div className="relative space-y-1 pointer-events-none">
            <div className="flex items-center justify-between gap-2 text-[10px] text-gray-500">
              <span>{openTasks} tasks</span>
              {blockers > 0 && (
                <span className="text-red-500 flex items-center gap-0.5">
                  <AlertTriangle size={9} />
                  {blockers}
                </span>
              )}
            </div>
            {tasks.length > 0 && (
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-1 rounded-full ${health !== null && health >= 70 ? 'bg-green-500' : health !== null && health >= 40 ? 'bg-amber-500' : 'bg-indigo-400'}`}
                  style={{ width: `${donePct}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function ListView({ filteredServices, clientFilter }: { filteredServices: Service[]; clientFilter: string }) {
  const { CLIENT_SERVICES = [], SERVICE_STRATEGIES = [], TASKS = [], PROJECTS = [], CLIENTS = [] } = useAppData();
  return (
    <div className="space-y-4">
      {filteredServices.map(service => {
        const csForService = CLIENT_SERVICES.filter(
          cs => cs.serviceId === service.id && (clientFilter === 'all' || cs.clientId === clientFilter),
        );
        const activeCs = csForService.filter(cs => cs.status === 'active' || cs.status === 'planning');

        if (activeCs.length === 0) return null;

        return (
          <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Service header */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <span className="text-xl">{service.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{service.name}</h3>
                <span className="text-xs text-gray-400">{service.category}</span>
              </div>
              <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {activeCs.length} client{activeCs.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Client rows */}
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {activeCs.map(cs => {
                const client = CLIENTS.find(c => c.id === cs.clientId)!;
                const health = computeHealthScore(cs, SERVICE_STRATEGIES);
                const projs = PROJECTS.filter(p => cs.linkedProjects.includes(p.id));
                const tasks = projs.flatMap(p => TASKS.filter(t => p.taskIds.includes(t.id)));
                const openTasks = tasks.filter(t => t.status !== 'done').length;
                const blockers = tasks.filter(t => t.priority === 'Urgent' && t.status !== 'done').length;
                const statusCfg = STATUS_CONFIG[cs.status];

                return (
                  <Link
                    key={cs.id}
                    href={`/clients/${client.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                  >
                    {/* Client badge */}
                    <div className="flex items-center gap-2 w-36 flex-shrink-0">
                      <span
                        className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#000000', color: '#ffffff' }}
                      >
                        {client.logo}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{client.name}</span>
                    </div>

                    {/* Status */}
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ${statusCfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>

                    {/* Cadence */}
                    <span className="text-xs text-gray-400 flex-1 truncate hidden sm:block">{cs.monthlyCadence}</span>

                    {/* Metrics */}
                    <div className="flex items-center gap-4 flex-shrink-0 ml-auto">
                      <div className="text-center hidden md:block">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{projs.length}</div>
                        <div className="text-[10px] text-gray-400">projects</div>
                      </div>
                      <div className="text-center hidden md:block">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{openTasks}</div>
                        <div className="text-[10px] text-gray-400">open tasks</div>
                      </div>
                      {blockers > 0 && (
                        <div className="text-center hidden sm:block">
                          <div className="text-sm font-semibold text-red-500">{blockers}</div>
                          <div className="text-[10px] text-gray-400">blockers</div>
                        </div>
                      )}
                      {health !== null && (
                        <div className={`text-center ${getHealthColor(health)}`}>
                          <div className="text-sm font-bold">{health}%</div>
                          <div className="text-[10px] text-gray-400">health</div>
                        </div>
                      )}
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ClientServiceModal({ onClose }: { onClose: () => void }) {
  const { CLIENTS = [], SERVICES = [], STRATEGIES = [], refresh } = useAppData();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    clientId: CLIENTS[0]?.id || '',
    serviceId: SERVICES[0]?.id || '',
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
    monthlyCadence: '',
    linkedStrategyId: '',
  });

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await upsertClientService({
          clientId: form.clientId,
          serviceId: form.serviceId,
          status: form.status,
          startDate: form.startDate,
          monthlyCadence: form.monthlyCadence || undefined,
          linkedStrategyId: form.linkedStrategyId || undefined,
        });
        toast.success('Service assigned successfully');
        refresh?.();
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white text-lg">Assign Service</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Client</label>
            <select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))} className={inputClass}>
              {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Service</label>
            <select value={form.serviceId} onChange={e => setForm(p => ({ ...p, serviceId: e.target.value }))} className={inputClass}>
              {SERVICES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inputClass}>
                <option value="active">Active</option>
                <option value="planning">Planning</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Linked Strategy (optional)</label>
            <select value={form.linkedStrategyId} onChange={e => setForm(p => ({ ...p, linkedStrategyId: e.target.value }))} className={inputClass}>
              <option value="">None</option>
              {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors">
              {isPending && <Loader2 size={13} className="animate-spin" />}
              Assign Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const { CLIENTS = [], SERVICES = [], CLIENT_SERVICES = [], SERVICE_STRATEGIES = [], PROJECTS = [], TASKS = [], refresh } = useAppData();
  const [view, setView] = useState<'matrix' | 'list'>('matrix');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showNewService, setShowNewService] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(SERVICES.map(s => s.category));
    return ['all', ...Array.from(cats)];
  }, [SERVICES]);

  const filteredServices = useMemo(() => {
    return SERVICES.filter(s => {
      const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [categoryFilter, search, SERVICES]);

  // Stats
  const stats = useMemo(() => {
    const activeCs = CLIENT_SERVICES.filter(cs => cs.status === 'active');
    const planningCs = CLIENT_SERVICES.filter(cs => cs.status === 'planning');
    const allProjs = activeCs.flatMap(cs => PROJECTS.filter(p => cs.linkedProjects.includes(p.id)));
    const allTasks = allProjs.flatMap(p => TASKS.filter(t => p.taskIds.includes(t.id)));
    const openTasks = allTasks.filter(t => t.status !== 'done').length;
    const blockers = allTasks.filter(t => t.priority === 'Urgent' && t.status !== 'done').length;

    return {
      totalActive: activeCs.length,
      planning: planningCs.length,
      openTasks,
      blockers,
    };
  }, [CLIENT_SERVICES, PROJECTS, TASKS]);

  // Matrix data: map[serviceId][clientId] = ClientService | null
  const matrixData = useMemo(() => {
    const map: Record<string, Record<string, ClientService | null>> = {};
    filteredServices.forEach(s => {
      map[s.id] = {};
      CLIENTS.forEach(c => {
        const cs = CLIENT_SERVICES.find(
          x => x.serviceId === s.id && x.clientId === c.id &&
            (statusFilter === 'all' || x.status === statusFilter) &&
            (clientFilter === 'all' || x.clientId === clientFilter),
        );
        map[s.id][c.id] = cs || null;
      });
    });
    return map;
  }, [filteredServices, statusFilter, clientFilter, CLIENTS, CLIENT_SERVICES]);

  return (
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <TopBar />
      {showNewService && <ClientServiceModal onClose={() => setShowNewService(false)} />}

      <div style={{ padding: '24px 32px' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Services</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Agency-wide service delivery across all clients</p>
        </div>
        {/* Assign Service button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowNewService(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            Assign Service
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Services', value: stats.totalActive, icon: Zap, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'In Planning', value: stats.planning, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Open Tasks', value: stats.openTasks, icon: CheckCircle, color: 'text-[#3B5BDB]', bg: 'bg-[#EEF2FF] dark:bg-indigo-900/20' },
            { label: 'Urgent Items', value: stats.blockers, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${bg} flex items-center gap-3`}>
              <div className={`${color} flex-shrink-0`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:text-white"
            />
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:text-white"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>

          {/* Client filter */}
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:text-white"
          >
            <option value="all">All Clients</option>
            {CLIENTS.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Not Active</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 flex-shrink-0 ml-auto">
            <button
              onClick={() => setView('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${view === 'matrix' ? 'bg-[#3B5BDB] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <LayoutGrid size={14} />
              Matrix
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${view === 'list' ? 'bg-[#3B5BDB] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <List size={14} />
              List
            </button>
          </div>
        </div>

        {view === 'matrix' ? (
          /* Matrix View */
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Legend */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4 flex-wrap">
              <span className="text-xs font-semibold text-gray-500">Health:</span>
              {[
                { label: '≥ 70% On Track', color: 'bg-green-500' },
                { label: '40-70% At Risk', color: 'bg-amber-500' },
                { label: '< 40% Behind', color: 'bg-red-400' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
              <span className="text-xs text-gray-400 ml-auto">Click filled cell → client detail · Click empty cell → assign service</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">
                      Service
                    </th>
                    {CLIENTS.map(client => (
                      <th key={client.id} className="px-3 py-3 text-center w-36">
                        <Link href={`/clients/${client.id}`} className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity">
                          <span
                            className="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center"
                            style={{ backgroundColor: '#000000', color: '#ffffff' }}
                          >
                            {client.logo}
                          </span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{client.name}</span>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map(service => (
                    <tr key={service.id} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{service.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{service.name}</div>
                            <div className="text-[10px] text-gray-400">{service.category}</div>
                          </div>
                        </div>
                      </td>
                      {CLIENTS.map(client => (
                        <td key={client.id} className="px-3 py-3">
                          <MatrixCell
                            cs={matrixData[service.id]?.[client.id] || null}
                            clientId={client.id}
                            serviceId={service.id}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* List View */
          <ListView filteredServices={filteredServices} clientFilter={clientFilter} />
        )}

        {/* Client quick links */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Jump to Client</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CLIENTS.map(client => {
              const active = CLIENT_SERVICES.filter(cs => cs.clientId === client.id && cs.status === 'active').length;
              const css = CLIENT_SERVICES.filter(cs => cs.clientId === client.id && cs.status === 'active');
              const allScores = css.flatMap(cs => {
                const ss = SERVICE_STRATEGIES.find(s => s.clientServiceId === cs.id);
                if (!ss) return [];
                return ss.kpis.map(kpi => {
                  const lb = kpi.name.toLowerCase().includes('bounce') || kpi.name.toLowerCase().includes('cpc') || kpi.name.toLowerCase().includes('pos');
                  return lb ? Math.min(100, (kpi.target / Math.max(kpi.current, 0.01)) * 100) : Math.min(100, (kpi.current / kpi.target) * 100);
                });
              });
              const health = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-[#C7D2FE] dark:hover:border-[#3B5BDB] transition-all flex items-center gap-4 group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: '#000000' }}
                  >
                    {client.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{client.name}</div>
                    <div className="text-xs text-gray-500">{active} active services</div>
                  </div>
                  <div className={`text-lg font-bold ${getHealthColor(health)} flex-shrink-0`}>{health}%</div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
