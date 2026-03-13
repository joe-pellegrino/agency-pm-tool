'use client';

import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { useAppData } from '@/lib/contexts/AppDataContext';
import type { ClientService, ServiceStrategy } from '@/lib/data';
import {
  ChevronRight, Activity, FolderOpen, CheckCircle, Target, Zap,
} from 'lucide-react';

function getClientHealth(
  clientId: string,
  clientServices: ClientService[],
  serviceStrategies: ServiceStrategy[],
): number {
  const css = clientServices.filter(cs => cs.clientId === clientId && cs.status === 'active');
  const scores = css.flatMap(cs => {
    const ss = serviceStrategies.find(s => s.clientServiceId === cs.id);
    if (!ss) return [];
    return ss.kpis.map(kpi => {
      const lb = kpi.name.toLowerCase().includes('bounce') || kpi.name.toLowerCase().includes('cpc') || kpi.name.toLowerCase().includes('pos');
      return lb
        ? Math.min(100, (kpi.target / Math.max(kpi.current, 0.01)) * 100)
        : Math.min(100, (kpi.current / kpi.target) * 100);
    });
  });
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

function getHealthColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

function getHealthLabel(score: number): string {
  if (score >= 70) return 'On Track';
  if (score >= 40) return 'At Risk';
  return 'Behind';
}

export default function ClientsPage() {
  const {
    CLIENTS = [],
    CLIENT_SERVICES = [],
    SERVICE_STRATEGIES = [],
    PROJECTS = [],
    TASKS = [],
    STRATEGIES = [],
    loading,
  } = useAppData();

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
        <TopBar title="Clients" subtitle="All client accounts and service subscriptions" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Clients" subtitle="All client accounts and service subscriptions" />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {CLIENTS.map(client => {
            const health = getClientHealth(client.id, CLIENT_SERVICES, SERVICE_STRATEGIES);
            const activeServices = CLIENT_SERVICES.filter(cs => cs.clientId === client.id && cs.status === 'active').length;
            const planningServices = CLIENT_SERVICES.filter(cs => cs.clientId === client.id && cs.status === 'planning').length;
            const activeProjects = PROJECTS.filter(p => p.clientId === client.id && p.status === 'active').length;
            const openTasks = TASKS.filter(t => t.clientId === client.id && t.status !== 'done').length;
            const strategy = STRATEGIES.find(s => s.clientId === client.id);

            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-600 transition-all group"
              >
                <div className="h-1.5" style={{ backgroundColor: client.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                        style={{ backgroundColor: client.color }}
                      >
                        {client.logo}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{client.name}</h3>
                        <p className="text-xs text-gray-500">{client.industry}</p>
                        <p className="text-xs text-gray-400">{client.location}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-2xl font-bold ${getHealthColor(health)}`}>{health}%</div>
                      <div className={`text-[10px] font-medium ${getHealthColor(health)}`}>{getHealthLabel(health)}</div>
                    </div>
                  </div>

                  {strategy && (
                    <div
                      className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 mb-4"
                      style={{ backgroundColor: client.color + '10', color: client.color }}
                    >
                      <Target size={12} />
                      <span className="font-medium truncate">{strategy.name}</span>
                      <span className="ml-auto flex-shrink-0 opacity-70">{strategy.quarter}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Services', value: activeServices, icon: Zap },
                      { label: 'Projects', value: activeProjects, icon: FolderOpen },
                      { label: 'Open Tasks', value: openTasks, icon: CheckCircle },
                      { label: 'Planning', value: planningServices, icon: Activity },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg py-2 px-1">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
                        <div className="text-[10px] text-gray-500 leading-tight">{label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400">View services & strategy</span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
