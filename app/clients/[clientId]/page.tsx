'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ClientService, ServiceStrategy, Project, Task } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import TopBar from '@/components/layout/TopBar';
import {
  Activity, Target, FolderOpen, CheckCircle, Clock, AlertCircle,
  ChevronDown, ChevronUp, Plus, BarChart3, TrendingUp, Zap, ArrowLeft,
} from 'lucide-react';

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
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">{task.title}</span>
      </div>
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[task.status]}`}>
        {statusLabels[task.status]}
      </span>
      <span className="text-[10px] text-gray-400 flex-shrink-0">{task.dueDate}</span>
    </div>
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
  const { SERVICE_STRATEGIES = [], PROJECTS = [], TASKS = [], SERVICES = [] } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const service = SERVICES.find(s => s.id === clientService.serviceId)!;
  const statusCfg = STATUS_CONFIG[clientService.status];

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
    <div className={`rounded-xl border transition-all ${isInactive ? 'border-gray-200 dark:border-gray-700 opacity-60' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-600'} bg-white dark:bg-gray-800 overflow-hidden`}>
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
              <div className="text-[10px] text-gray-500">projects</div>
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
                className="h-1.5 rounded-full bg-indigo-500 transition-all"
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

          {/* Projects */}
          {linkedProjects.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FolderOpen size={11} />
                Projects
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
  );
}

export default function ClientPage() {
  const { CLIENTS = [], SERVICES = [], CLIENT_SERVICES = [], SERVICE_STRATEGIES = [], STRATEGIES = [], PROJECTS = [], TASKS = [] } = useAppData();
  const { clientId } = useParams<{ clientId: string }>();
  const client = CLIENTS.find(c => c.id === clientId);

  const strategy = useMemo(() => STRATEGIES.find(s => s.clientId === clientId), [clientId]);

  const clientServices = useMemo(
    () => CLIENT_SERVICES.filter(cs => cs.clientId === clientId),
    [clientId],
  );

  const activeServices = clientServices.filter(cs => cs.status === 'active' || cs.status === 'planning');
  const inactiveServices = clientServices.filter(cs => cs.status === 'cancelled' || cs.status === 'paused');

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

  if (!client) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Client not found</h2>
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700 text-sm">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title={client.name} subtitle={`${client.industry} · ${client.location}`} />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Back nav */}
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-5 transition-colors"
        >
          <ArrowLeft size={14} />
          All Services
        </Link>

        {/* Client header card */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-6 border"
          style={{ backgroundColor: client.color + '08', borderColor: client.color + '30' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Logo */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
              style={{ backgroundColor: client.color }}
            >
              {client.logo}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{client.industry} · {client.location}</p>

              {strategy && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <Target size={13} style={{ color: client.color }} />
                    <span className="font-medium">{strategy.name}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: client.color + '18', color: client.color }}
                    >
                      {strategy.quarter}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {strategy.pillars.length} strategic pillars · {strategy.pillars.flatMap(p => p.kpis).length} KPIs tracked
                  </p>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t" style={{ borderColor: client.color + '20' }}>
            {[
              { label: 'Active Services', value: activeServices.filter(cs => cs.status === 'active').length, icon: Zap },
              { label: 'Active Projects', value: PROJECTS.filter(p => p.clientId === clientId && p.status === 'active').length, icon: FolderOpen },
              { label: 'Open Tasks', value: TASKS.filter(t => t.clientId === clientId && t.status !== 'done').length, icon: CheckCircle },
              { label: 'Completed Tasks', value: TASKS.filter(t => t.clientId === clientId && t.status === 'done').length, icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Services */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity size={18} className="text-indigo-500" />
            Active Services
            <span className="text-sm font-normal text-gray-400">({activeServices.length})</span>
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

        {/* Inactive / Available */}
        {inactiveServices.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Not Currently Active
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {inactiveServices.map(cs => (
                <ServiceCard
                  key={cs.id}
                  clientService={cs}
                  serviceStrategy={undefined}
                  linkedProjects={[]}
                  recentTasks={[]}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
