'use client';

import { useState, useMemo, useTransition, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ClientService, ServiceStrategy, Project, Task, Service } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import TopBar from '@/components/layout/TopBar';
import {
  Activity, Target, FolderOpen, CheckCircle, Clock, AlertCircle,
  ChevronDown, ChevronUp, Plus, BarChart3, TrendingUp, Zap, ArrowLeft,
  X, Loader2, Megaphone, Edit2, Save, DollarSign, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { upsertClientService, removeClientService, updateClient } from '@/lib/actions';
import { getBudgetProgress } from '@/lib/actions-budget';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Drawer from '@/components/ui/Drawer';
import PaidAdsDashboard from '@/components/ads/PaidAdsDashboard';
import BudgetMatrix from '@/components/budget/BudgetMatrix';
import ClientModal from '@/components/clients/ClientModal';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  paused: { label: 'Paused', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  cancelled: { label: 'Not Active', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' },
  planning: { label: 'Planning', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-400' },
};

function KPIBar({
  name, current, target, unit,
}: {
  name: string; current: number; target: number; unit: string;
}) {
  const lowerIsBetter = name.toLowerCase().includes('bounce') || name.toLowerCase().includes('cpc') || name.toLowerCase().includes('pos') || name.toLowerCase().includes('churn');
  const pct = lowerIsBetter
    ? Math.max(0, Math.min(100, (target / current) * 100))
    : Math.max(0, Math.min(100, (current / target) * 100));
  const isOnTrack = pct >= 70;
  const isAtRisk = pct >= 40 && pct < 70;
  const barColor = isOnTrack ? 'bg-green-500' : isAtRisk ? 'bg-amber-500' : 'bg-red-400';

  const fmt = (v: number) => {
    if (unit === '$') return `$${v.toLocaleString()}`;
    if (unit === '%' || unit === 'x' || unit === '★') return `${v}${unit}`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return `${v}`;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-600 dark:text-gray-400">{name}</span>
        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
          {fmt(current)} <span className="text-gray-400 font-normal">/ {fmt(target)}</span>
        </span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const { CLIENTS = [], TEAM_MEMBERS = [] } = useAppData();
  const statusColors: Record<string, string> = {
    todo: 'bg-gray-100 text-gray-600',
    inprogress: 'bg-blue-100 text-blue-700',
    review: 'bg-amber-100 text-amber-700',
    done: 'bg-green-100 text-green-700',
  };
  const statusLabels: Record<string, string> = {
    todo: 'To Do', inprogress: 'In Progress', review: 'Review', done: 'Done',
  };
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded border border-gray-200 dark:border-gray-700 mb-1" style={{ backgroundColor: 'white' }}>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">{task.title}</span>
      </div>
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[task.status]}`}>
        {statusLabels[task.status]}
      </span>
      <span className="text-[10px] text-gray-500 flex-shrink-0 whitespace-nowrap">{task.dueDate}</span>
    </div>
  );
}

// ── Quick Assign Popup ────────────────────────────────────────────────────────
function QuickAssignModal({
  service,
  clientName,
  clientId,
  existingCs,
  onClose,
}: {
  service: Service;
  clientName: string;
  clientId: string;
  existingCs?: ClientService;
  onClose: () => void;
}) {
  const { STRATEGIES = [], refresh } = useAppData();
  const clientStrategies = STRATEGIES.filter(s => s.clientId === clientId);
  const [status, setStatus] = useState<ClientService['status']>(existingCs?.status || 'active');
  const [startDate, setStartDate] = useState(existingCs?.startDate || new Date().toISOString().split('T')[0]);
  const [cadence, setCadence] = useState(existingCs?.monthlyCadence || '');
  const [strategyId, setStrategyId] = useState(existingCs?.linkedStrategyId || '');
  const [isPending, startTransition] = useTransition();

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]';

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await upsertClientService({
          clientId,
          serviceId: service.id,
          status,
          startDate,
          monthlyCadence: cadence || undefined,
          linkedStrategyId: strategyId || undefined,
        });
        toast.success(`${service.name} assigned to ${clientName}`);
        refresh?.();
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{service.icon}</span>
              <h2 className="font-semibold text-gray-900 dark:text-white text-base">Assign Service</h2>
            </div>
            <p className="text-sm text-gray-500">
              Assign <span className="font-medium text-gray-700 dark:text-gray-300">{service.name}</span> to <span className="font-medium text-gray-700 dark:text-gray-300">{clientName}</span>?
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as ClientService['status'])} className={inputClass}>
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
            <input
              type="text"
              value={cadence}
              onChange={e => setCadence(e.target.value)}
              placeholder="e.g. 4 posts/month, weekly calls..."
              className={inputClass}
            />
          </div>
          {clientStrategies.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Linked Strategy (optional)</label>
              <select value={strategyId} onChange={e => setStrategyId(e.target.value)} className={inputClass}>
                <option value="">None</option>
                {clientStrategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {existingCs ? 'Update Assignment' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Service Tile (in the client grid) ────────────────────────────────────────
function ServiceTile({
  service,
  clientService,
  clientName,
  clientId,
}: {
  service: Service;
  clientService?: ClientService;
  clientName: string;
  clientId: string;
}) {
  const { SERVICE_STRATEGIES = [], PROJECTS = [], TASKS = [], refresh } = useAppData();
  const [showAssign, setShowAssign] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, startRemoveTransition] = useTransition();

  const handleRemove = () => {
    if (!clientService) return;
    startRemoveTransition(async () => {
      try {
        await removeClientService(clientService.id);
        toast.success(`${service.name} removed from ${clientName}`);
        refresh?.();
        setShowRemoveConfirm(false);
      } catch (err) {
        toast.error('Failed to remove: ' + (err as Error).message);
      }
    });
  };

  const isActive = clientService && (clientService.status === 'active' || clientService.status === 'planning');
  const isPaused = clientService?.status === 'paused';

  const projs = clientService ? PROJECTS.filter(p => clientService.linkedProjects.includes(p.id)) : [];
  const tasks = projs.flatMap(p => TASKS.filter(t => p.taskIds.includes(t.id)));
  const openTasks = tasks.filter(t => t.status !== 'done').length;

  const STATUS_CONF = {
    active: { label: 'Active', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    planning: { label: 'Planning', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-400' },
    paused: { label: 'Paused', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    cancelled: { label: 'Inactive', color: 'bg-gray-100 text-gray-400', dot: 'bg-gray-300' },
  };

  const statusCfg = clientService ? STATUS_CONF[clientService.status] : null;

  if (!isActive && !isPaused) {
    // Unassigned / cancelled — show empty slot
    return (
      <>
        {showAssign && (
          <QuickAssignModal
            service={service}
            clientName={clientName}
            clientId={clientId}
            existingCs={clientService}
            onClose={() => setShowAssign(false)}
          />
        )}
        <button
          onClick={() => setShowAssign(true)}
          className="w-full text-left bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-300 dark:hover:border-[#3B5BDB] hover:bg-[#EEF2FF]/30 dark:hover:bg-indigo-900/10 transition-all group"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl opacity-50 group-hover:opacity-100 transition-opacity">{service.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 truncate">{service.name}</div>
              <div className="text-[10px] text-gray-300 dark:text-gray-600">{service.category}</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#3B5BDB] opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus size={13} />
              Assign
            </div>
          </div>
        </button>
      </>
    );
  }

  // Active or paused service
  return (
    <>
      {showAssign && (
        <QuickAssignModal
          service={service}
          clientName={clientName}
          clientId={clientId}
          existingCs={clientService}
          onClose={() => setShowAssign(false)}
        />
      )}
      {showRemoveConfirm && clientService && (
        <ConfirmDialog
          title="Remove Service"
          message={`Remove ${service.name} from ${clientName}? This will unlink the service entirely.`}
          confirmLabel={isRemoving ? 'Removing…' : 'Remove'}
          destructive
          onConfirm={handleRemove}
          onCancel={() => setShowRemoveConfirm(false)}
        />
      )}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">{service.icon}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{service.name}</div>
              <div className="text-[10px] text-gray-400">{service.category}</div>
            </div>
          </div>
          {statusCfg && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ${statusCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
          )}
        </div>
        {clientService?.monthlyCadence && (
          <p className="text-xs text-gray-500 mb-2 truncate">{clientService.monthlyCadence}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <span>{projs.length} initiative{projs.length !== 1 ? 's' : ''} · {openTasks} open tasks</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAssign(true)}
              className="text-[#3B5BDB] hover:text-[#3B5BDB] text-[10px] font-medium hover:bg-[#EEF2FF] px-1.5 py-0.5 rounded transition-colors"
            >
              Edit
            </button>
            {clientService && (
              <button
                onClick={() => setShowRemoveConfirm(true)}
                className="text-red-500 hover:text-red-700 text-[10px] font-medium hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ServiceCard({
  clientService,
  serviceStrategy,
  linkedProjects,
  recentTasks,
}: {
  clientService: ClientService;
  serviceStrategy: ServiceStrategy | undefined;
  linkedProjects: Project[];
  recentTasks: Task[];
}) {
  const { SERVICE_STRATEGIES = [], PROJECTS = [], TASKS = [], SERVICES = [], CLIENTS = [], refresh } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, startRemoveTransition] = useTransition();
  const service = SERVICES.find(s => s.id === clientService.serviceId)!;
  const client = CLIENTS.find(c => c.id === clientService.clientId);
  const statusCfg = STATUS_CONFIG[clientService.status];

  const handleRemove = () => {
    startRemoveTransition(async () => {
      try {
        await removeClientService(clientService.id);
        toast.success(`${service?.name ?? 'Service'} removed from ${client?.name ?? 'client'}`);
        refresh?.();
        setShowRemoveConfirm(false);
      } catch (err) {
        toast.error('Failed to remove: ' + (err as Error).message);
      }
    });
  };

  const allTasks = linkedProjects.flatMap(p => TASKS.filter(t => p.taskIds.includes(t.id)));
  const doneTasks = allTasks.filter(t => t.status === 'done').length;
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  const healthScore = useMemo(() => {
    if (!serviceStrategy) return null;
    const scores = serviceStrategy.kpis.map(kpi => {
      const lb = kpi.name.toLowerCase().includes('bounce') || kpi.name.toLowerCase().includes('cpc') || kpi.name.toLowerCase().includes('pos');
      return lb ? Math.min(100, (kpi.target / Math.max(kpi.current, 0.01)) * 100) : Math.min(100, (kpi.current / kpi.target) * 100);
    });
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [serviceStrategy]);

  const isInactive = clientService.status === 'cancelled';

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
    <div className={`rounded-xl border transition-all ${isInactive ? 'border-gray-200 dark:border-gray-700 opacity-60' : 'border-gray-200 dark:border-gray-700 hover:border-[#C7D2FE] dark:hover:border-[#3B5BDB]'} bg-white dark:bg-gray-800 overflow-hidden`}>
      {/* Card header */}
      <div
        className={`px-4 py-4 ${!isInactive ? 'cursor-pointer' : ''}`}
        onClick={() => !isInactive && setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{service.icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{service.name}</h3>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${statusCfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              </div>
              {clientService.monthlyCadence && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{clientService.monthlyCadence}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {healthScore !== null && (
              <div className={`text-center ${healthScore >= 70 ? 'text-green-600' : healthScore >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                <div className="text-lg font-bold leading-none">{healthScore}%</div>
                <div className="text-[9px] text-gray-400 mt-0.5">health</div>
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setShowRemoveConfirm(true); }}
              className="text-red-400 hover:text-red-600 transition-colors p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Remove service"
            >
              <X size={14} />
            </button>
            {!isInactive && (
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        {!isInactive && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-2">
              <div className="text-sm font-bold text-gray-900 dark:text-white">{linkedProjects.length}</div>
              <div className="text-[10px] text-gray-500">initiatives</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-2">
              <div className="text-sm font-bold text-gray-900 dark:text-white">{allTasks.length}</div>
              <div className="text-[10px] text-gray-500">tasks</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-2">
              <div className="text-sm font-bold text-gray-900 dark:text-white">{progress}%</div>
              <div className="text-[10px] text-gray-500">done</div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {!isInactive && allTasks.length > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-[#3B5BDB] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Inactive placeholder */}
        {isInactive && (
          <div className="mt-3 flex items-center gap-2 text-gray-400">
            <Plus size={14} />
            <span className="text-xs">Add Service</span>
          </div>
        )}
      </div>

      {/* Expanded panel */}
      {expanded && serviceStrategy && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/30">
          {/* Strategy summary */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Target size={11} />
              Service Strategy
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{serviceStrategy.summary}</p>
          </div>

          {/* Strategy pillars */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pillars</h4>
            <div className="space-y-2">
              {serviceStrategy.pillars.map(pillar => (
                <div key={pillar.id} className="flex gap-2">
                  <span className="w-1 rounded-full bg-indigo-400 flex-shrink-0 mt-1" style={{ minHeight: '12px' }} />
                  <div>
                    <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{pillar.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{pillar.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <BarChart3 size={11} />
              KPIs
            </h4>
            <div className="space-y-2.5">
              {serviceStrategy.kpis.map(kpi => (
                <KPIBar key={kpi.id} name={kpi.name} current={kpi.current} target={kpi.target} unit={kpi.unit} />
              ))}
            </div>
          </div>

          {/* Initiatives */}
          {linkedProjects.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FolderOpen size={11} />
                Initiatives
              </h4>
              <div className="space-y-1.5">
                {linkedProjects.map(proj => (
                  <div key={proj.id} className="flex items-center gap-2 text-xs">
                    <FolderOpen size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">{proj.name}</span>
                    <span className="text-gray-400">{proj.progress}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent tasks */}
          {recentTasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <CheckCircle size={11} />
                Recent Tasks
              </h4>
              <div>
                {recentTasks.slice(0, 5).map(task => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}

// ── Project Detail Drawer ────────────────────────────────────────────────────
function ProjectDetailDrawer({
  project,
  isOpen,
  onClose,
}: {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { TASKS = [] } = useAppData();

  if (!project) return null;

  const projectTasks = TASKS.filter(t => project.taskIds.includes(t.id));
  const completedTasks = projectTasks.filter(t => t.status === 'done').length;

  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    planning: { label: 'Planning', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-400' },
    active: { label: 'Active', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    complete: { label: 'Complete', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    'on-hold': { label: 'On Hold', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  };

  const statusCfg = statusConfig[project.status];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={project.name}>
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 ${statusCfg.color}`}>
            <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{project.description}</p>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Start Date</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">{project.startDate}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">End Date</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">{project.endDate}</p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</h4>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-[#3B5BDB] transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Tasks Summary */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <CheckCircle size={11} />
            Tasks ({completedTasks}/{projectTasks.length})
          </h4>
          {projectTasks.length === 0 ? (
            <p className="text-sm text-gray-400">No tasks yet.</p>
          ) : (
            <div className="space-y-2">
              {projectTasks.slice(0, 10).map(task => (
                <TaskRow key={task.id} task={task} />
              ))}
              {projectTasks.length > 10 && (
                <p className="text-xs text-gray-400 pt-2">...and {projectTasks.length - 10} more</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

type ClientTab = 'overview' | 'projects' | 'pillars' | 'tasks' | 'paid-ads' | 'budget' | 'documents' | 'assets';

const TAB_CONFIG: Array<{ id: ClientTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'projects', label: 'Initiatives', icon: FolderOpen },
  { id: 'pillars', label: 'Pillars', icon: Target },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle },
  { id: 'paid-ads', label: 'Paid Ads', icon: Megaphone },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'assets', label: 'Assets', icon: FolderOpen },
];

// ── Client Info Editor ───────────────────────────────────────────────────────
function ClientInfoEditor({
  client,
  onSave,
}: {
  client: any;
  onSave: (data: Partial<any>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: client.name,
    industry: client.industry,
    location: client.location,
  });
  const [isSaving, startSaveTransition] = useTransition();

  const handleSave = () => {
    startSaveTransition(async () => {
      try {
        await onSave(formData);
        toast.success('Client info updated');
        setIsEditing(false);
      } catch (err) {
        toast.error('Failed to update: ' + (err as Error).message);
      }
    });
  };

  if (!isEditing) {
    return (
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{client.industry} · {client.location}</p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          title="Edit client info"
        >
          <Edit2 size={14} />
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Industry</label>
          <input
            type="text"
            value={formData.industry}
            onChange={e => setFormData(prev => ({ ...prev, industry: e.target.value }))}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            setIsEditing(false);
            setFormData({
              name: client.name,
              industry: client.industry,
              location: client.location,
            });
          }}
          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save
        </button>
      </div>
    </div>
  );
}

export default function ClientPage() {
  const { CLIENTS = [], SERVICES = [], CLIENT_SERVICES = [], SERVICE_STRATEGIES = [], STRATEGIES = [], PROJECTS = [], TASKS = [], DOCUMENTS = [], ASSETS = [], CLIENT_PILLARS = [], CLIENT_PILLAR_KPIS = [], refresh } = useAppData();
  const { clientId } = useParams<{ clientId: string }>();
  const searchParams = useSearchParams();
  const client = CLIENTS.find(c => c.id === clientId);
  const [activeTab, setActiveTab] = useState<ClientTab>('overview');

  // Handle ?tab= URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab') as ClientTab | null;
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectDrawerOpen, setIsProjectDrawerOpen] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [budgetProgress, setBudgetProgress] = useState<{ totalBudget: number; spentToDate: number; percentage: number } | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(false);

  // Fetch budget progress on mount
  useEffect(() => {
    if (!clientId) return;
    
    const fetchBudget = async () => {
      setBudgetLoading(true);
      try {
        const progress = await getBudgetProgress(clientId);
        setBudgetProgress(progress);
      } catch (err) {
        console.error('Failed to fetch budget progress:', err);
      } finally {
        setBudgetLoading(false);
      }
    };

    fetchBudget();
  }, [clientId]);

  const strategy = useMemo(() => STRATEGIES.find(s => s.clientId === clientId), [clientId, STRATEGIES]);

  const clientServices = useMemo(
    () => CLIENT_SERVICES.filter(cs => cs.clientId === clientId),
    [clientId, CLIENT_SERVICES],
  );

  // For the new grid: get the best (most active) client_service entry per service
  const serviceMap = useMemo(() => {
    const map: Record<string, ClientService | undefined> = {};
    const priority: Record<string, number> = { active: 4, planning: 3, paused: 2, cancelled: 1 };
    clientServices.forEach(cs => {
      const existing = map[cs.serviceId];
      if (!existing || (priority[cs.status] || 0) > (priority[existing.status] || 0)) {
        map[cs.serviceId] = cs;
      }
    });
    return map;
  }, [clientServices]);

  const activeServices = clientServices.filter(cs => cs.status === 'active' || cs.status === 'planning');

  // Agency-wide health score
  const overallHealth = useMemo(() => {
    const strategies = SERVICE_STRATEGIES.filter(ss =>
      clientServices.some(cs => cs.id === ss.clientServiceId),
    );
    if (!strategies.length) return 0;
    const scores = strategies.flatMap(ss =>
      ss.kpis.map(kpi => {
        const lb = kpi.name.toLowerCase().includes('bounce') || kpi.name.toLowerCase().includes('cpc') || kpi.name.toLowerCase().includes('pos');
        return lb ? Math.min(100, (kpi.target / Math.max(kpi.current, 0.01)) * 100) : Math.min(100, (kpi.current / kpi.target) * 100);
      }),
    );
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [clientServices]);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setIsProjectDrawerOpen(true);
  };

  const handleUpdateClient = async (data: Partial<any>) => {
    await updateClient(clientId, data);
    refresh?.();
  };

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-page)' }}>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Client not found</h2>
          <Link href="/dashboard" className="text-[#3B5BDB] hover:text-[#3B5BDB] text-sm">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-page)' }}>
      <TopBar />

      {/* Project Detail Drawer */}
      <ProjectDetailDrawer
        project={selectedProject}
        isOpen={isProjectDrawerOpen}
        onClose={() => setIsProjectDrawerOpen(false)}
      />

      {/* Edit Client Modal */}
      {showEditClientModal && client && (
        <ClientModal
          client={client}
          onClose={() => {
            setShowEditClientModal(false);
            refresh?.();
          }}
        />
      )}

      <div style={{ padding: '24px 32px' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{client.name}</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{client.industry} · {client.location}</p>
        </div>
        {/* Client header card */}
        <div
          className="rounded-lg p-6 mb-6 border"
          style={{ backgroundColor: 'var(--color-white)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mt-0.5">{client.industry} · {client.location}</p>
                </div>
                <button
                  onClick={() => setShowEditClientModal(true)}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  title="Edit client info"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
              </div>

              {strategy && (
                <div className="mt-3">
                  <Link
                    href={`/clients/${clientId}/strategy`}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1 hover:text-[#3B5BDB] dark:hover:text-[#3B5BDB] transition-colors"
                  >
                    <Target size={13} style={{ color: client.color }} />
                    <span className="font-medium hover:underline">{strategy.name}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: '#000000', color: '#ffffff' }}
                    >
                      {strategy.quarter}
                    </span>
                  </Link>
                  <div className="flex gap-4 text-xs text-gray-500 mt-1">
                    <Link href={`/clients/${clientId}/pillars`} className="hover:text-[#3B5BDB] transition-colors">
                      {strategy.pillars.length} pillars
                    </Link>
                    <span>·</span>
                    <Link href={`/clients/${clientId}/strategy#kpis`} className="hover:text-[#3B5BDB] transition-colors">
                      {strategy.pillars.flatMap(p => p.kpis).length} KPIs tracked
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Health score */}
            <div className="text-center sm:text-right flex-shrink-0">
              <div
                className={`text-4xl font-bold ${overallHealth >= 70 ? 'text-green-600' : overallHealth >= 40 ? 'text-amber-500' : 'text-red-500'}`}
              >
                {overallHealth}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">Health Score</div>
              <div className="flex items-center gap-1 mt-1 justify-center sm:justify-end">
                <span className={`w-2 h-2 rounded-full ${overallHealth >= 70 ? 'bg-green-500' : overallHealth >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-500">
                  {overallHealth >= 70 ? 'On Track' : overallHealth >= 40 ? 'At Risk' : 'Behind'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            {[
              { label: 'Active Services', value: activeServices.filter(cs => cs.status === 'active').length, icon: Zap },
              { label: 'Active Initiatives', value: PROJECTS.filter(p => p.clientId === clientId && p.status === 'active').length, icon: FolderOpen },
              { label: 'Open Tasks', value: TASKS.filter(t => t.clientId === clientId && t.status !== 'done').length, icon: CheckCircle },
              { label: 'Completed Tasks', value: TASKS.filter(t => t.clientId === clientId && t.status === 'done').length, icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Budget Progress Bar */}
          {budgetProgress && (
            <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <DollarSign size={14} className="text-[#3B5BDB]" />
                    This Year's Budget
                  </h3>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {budgetProgress.percentage}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  ${budgetProgress.spentToDate.toLocaleString('en-US', { maximumFractionDigits: 0 })} of ${budgetProgress.totalBudget.toLocaleString('en-US', { maximumFractionDigits: 0 })} budgeted
                </p>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    budgetProgress.percentage < 80
                      ? 'bg-green-500'
                      : budgetProgress.percentage < 100
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(budgetProgress.percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tab Bar */}
        <div style={{ borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-0 min-w-max sm:min-w-0">
            {TAB_CONFIG.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-4 text-sm font-medium transition-all"
                  style={{
                    paddingBottom: '12px',
                    paddingTop: '12px',
                    borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
                    }
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'budget' && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <DollarSign size={18} style={{ color: 'var(--color-primary)' }} />
              Budget Matrix
            </h2>
            <BudgetMatrix clientId={clientId} />
          </div>
        )}

        {activeTab === 'paid-ads' && (
          <PaidAdsDashboard clientId={clientId} clientName={client.name} />
        )}

        {activeTab === 'projects' && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <FolderOpen size={18} style={{ color: 'var(--color-primary)' }} />
              Initiatives
            </h2>
            {(() => {
              const clientProjects = PROJECTS.filter(p => p.clientId === clientId);
              if (clientProjects.length === 0) {
                return <p className="text-gray-400">No initiatives for this client.</p>;
              }
              return (
                <div className="space-y-2">
                  {clientProjects.map(proj => (
                    <button
                      key={proj.id}
                      onClick={() => handleProjectClick(proj)}
                      className="w-full text-left border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm hover:border-[#3B5BDB] dark:hover:border-[#3B5BDB] transition-all bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white hover:text-[#3B5BDB] transition-colors">{proj.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{proj.description}</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                          proj.status === 'complete' ? 'bg-green-100 text-green-700' :
                          proj.status === 'on-hold' ? 'bg-amber-100 text-amber-700' :
                          proj.status === 'active' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {proj.status.charAt(0).toUpperCase() + proj.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span>{proj.progress}% progress</span>
                        <span>{proj.startDate} to {proj.endDate}</span>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'pillars' && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Target size={18} style={{ color: 'var(--color-primary)' }} />
              Pillars
            </h2>
            {(() => {
              const pillars = CLIENT_PILLARS.filter(p => p.clientId === clientId);
              
              if (pillars.length === 0) {
                return (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <Target size={32} className="mx-auto mb-3 opacity-30 text-gray-400" />
                    <p className="text-sm font-medium text-gray-400 mb-3">No pillars defined yet for this client</p>
                    <a href={`/clients/${clientId}/pillars`} className="text-sm text-[#3B5BDB] hover:underline">Manage Pillars →</a>
                  </div>
                );
              }
              
              return (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <a href={`/clients/${clientId}/pillars`} className="text-sm text-[#3B5BDB] hover:underline font-medium">Manage Pillars →</a>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pillars.map(pillar => {
                      const kpis = CLIENT_PILLAR_KPIS.filter(k => k.clientPillarId === pillar.id);
                      const linkedInitiatives = PROJECTS.filter(p => p.clientPillarId === pillar.id && p.clientId === clientId);
                      const linkedTasks = TASKS.filter(t => t.clientPillarId === pillar.id && t.clientId === clientId);
                      
                      return (
                        <div
                          key={pillar.id}
                          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700" style={{ borderLeftWidth: '4px', borderLeftColor: pillar.color }}>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{pillar.name}</h3>
                            {pillar.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{pillar.description}</p>}
                          </div>
                          <div className="px-4 py-3 space-y-3">
                            {kpis.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">KPIs</div>
                                <div className="space-y-2">
                                  {kpis.map(kpi => {
                                    const lb = kpi.name.toLowerCase().includes('bounce') || kpi.name.toLowerCase().includes('cpc');
                                    const pct = lb
                                      ? Math.max(0, Math.min(100, (kpi.target / Math.max(kpi.current, 0.01)) * 100))
                                      : Math.max(0, Math.min(100, (kpi.current / kpi.target) * 100));
                                    const barColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-400';
                                    return (
                                      <div key={kpi.id} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{kpi.name}</span>
                                          <span className="text-gray-500 flex-shrink-0 ml-2">{Math.round(pct)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                          <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-700">
                              <span className="flex items-center gap-1"><FolderOpen size={11} />{linkedInitiatives.length} initiatives</span>
                              <span className="flex items-center gap-1"><CheckCircle size={11} />{linkedTasks.length} tasks</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <CheckCircle size={18} style={{ color: 'var(--color-primary)' }} />
              Tasks
            </h2>
            {(() => {
              const clientTasks = TASKS.filter(t => t.clientId === clientId);
              if (clientTasks.length === 0) {
                return <p className="text-gray-400">No tasks for this client.</p>;
              }
              return (
                <div className="space-y-1">
                  {clientTasks.map(task => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            {/* All Services Grid — active + unassigned */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Activity size={18} style={{ color: 'var(--color-primary)' }} />
                Services
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>Active services are filled. Click any empty slot to assign a service.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
                {SERVICES.map(svc => (
                  <ServiceTile
                    key={svc.id}
                    service={svc}
                    clientService={serviceMap[svc.id]}
                    clientName={client.name}
                    clientId={clientId}
                  />
                ))}
              </div>
            </div>

            {/* Expanded service details for active services */}
            {activeServices.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                  <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
                  Service Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activeServices.map(cs => {
                    const ss = SERVICE_STRATEGIES.find(s => s.clientServiceId === cs.id);
                    const projs = PROJECTS.filter(p => cs.linkedProjects.includes(p.id));
                    const tasks = projs.flatMap(p => TASKS.filter(t => p.taskIds.includes(t.id)));
                    return (
                      <ServiceCard
                        key={cs.id}
                        clientService={cs}
                        serviceStrategy={ss}
                        linkedProjects={projs}
                        recentTasks={tasks}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'documents' && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <FileText size={18} style={{ color: 'var(--color-primary)' }} />
              Documents
            </h2>
            {(() => {
              const clientDocs = DOCUMENTS.filter((d: any) => d.clientId === clientId);
              if (clientDocs.length === 0) {
                return (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <FileText size={32} className="mx-auto mb-3 opacity-30 text-gray-400" />
                    <p className="text-sm font-medium text-gray-400">No documents for this client</p>
                    <a href="/documents" className="text-sm text-[#3B5BDB] hover:underline mt-2 block">Go to Documents →</a>
                  </div>
                );
              }
              return (
                <div className="space-y-2">
                  {clientDocs.map((doc: any) => (
                    <a
                      key={doc.id}
                      href={`/documents/${doc.id}`}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#3B5BDB] hover:shadow-sm transition-all"
                    >
                      <FileText size={16} className="text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{doc.title || doc.name || 'Untitled'}</div>
                        {doc.createdAt && <div className="text-xs text-gray-400 mt-0.5">{new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                      </div>
                    </a>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'assets' && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <FolderOpen size={18} style={{ color: 'var(--color-primary)' }} />
              Assets
            </h2>
            {(() => {
              const clientAssets = (ASSETS as any[]).filter((a: any) => a.clientId === clientId);
              if (clientAssets.length === 0) {
                return (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <FolderOpen size={32} className="mx-auto mb-3 opacity-30 text-gray-400" />
                    <p className="text-sm font-medium text-gray-400">No assets for this client</p>
                    <a href="/assets" className="text-sm text-[#3B5BDB] hover:underline mt-2 block">Go to Assets →</a>
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {clientAssets.map((asset: any) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(asset.filename);
                    return (
                      <div key={asset.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-sm transition-shadow">
                        {isImage && asset.url ? (
                          <img src={asset.url} alt={asset.filename} className="w-full h-24 object-cover" />
                        ) : (
                          <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <FolderOpen size={24} className="text-gray-300" />
                          </div>
                        )}
                        <div className="p-2">
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{asset.filename}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{asset.size || asset.fileType || ''}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
