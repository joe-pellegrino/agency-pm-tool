'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import TopBar from '@/components/layout/TopBar';
import { useAppData } from '@/lib/contexts/AppDataContext';
import type { Client, ClientService, ServiceStrategy } from '@/lib/data';
import {
  ChevronRight, Activity, FolderOpen, CheckCircle, Target, Zap, Plus, Pencil, Archive,
} from 'lucide-react';
import { toast } from 'sonner';
import ClientModal from '@/components/clients/ClientModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { archiveClient } from '@/lib/actions';

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

function getHealthStyle(score: number) {
  if (score >= 70) return { color: '#059669' };
  if (score >= 40) return { color: '#D97706' };
  return { color: '#DC2626' };
}

function getHealthLabel(score: number): string {
  if (score >= 70) return 'On Track';
  if (score >= 40) return 'At Risk';
  return 'Behind';
}

function getHealthBarColor(score: number): string {
  if (score >= 70) return '#22C55E';
  if (score >= 40) return '#F59F00';
  return '#E03131';
}

function getHealthBarTrack(score: number): string {
  if (score >= 70) return '#D1FAE5';
  if (score >= 40) return '#FEF3C7';
  return '#FEE2E2';
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
    refresh,
  } = useAppData();

  const [showNewClient, setShowNewClient] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleArchive = () => {
    if (!archiveId) return;
    const id = archiveId;
    setArchiveId(null);
    startTransition(async () => {
      try {
        await archiveClient(id);
        toast.success('Client archived');
        refresh?.();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
        <TopBar />
        <div style={{ padding: '24px 32px' }}>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Clients</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">All client accounts and service subscriptions</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
      {(showNewClient || editClient) && (
        <ClientModal client={editClient || undefined} onClose={() => { setShowNewClient(false); setEditClient(null); }} />
      )}
      {archiveId && (
        <ConfirmDialog
          title="Archive Client"
          message={`Archive this client and all associated tasks, projects, and services?`}
          confirmLabel="Archive Client"
          destructive
          onConfirm={handleArchive}
          onCancel={() => setArchiveId(null)}
        />
      )}
      <TopBar />

      <div style={{ padding: '24px 32px' }}>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">All client accounts and service subscriptions</p>
        </div>
        <div className="flex justify-end mb-5">
          <button
            onClick={() => setShowNewClient(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-white rounded-md text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary)'; }}
          >
            <Plus size={14} />
            New Client
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {CLIENTS.map(client => {
            const health = getClientHealth(client.id, CLIENT_SERVICES, SERVICE_STRATEGIES);
            const activeServices = CLIENT_SERVICES.filter(cs => cs.clientId === client.id && cs.status === 'active').length;
            const planningServices = CLIENT_SERVICES.filter(cs => cs.clientId === client.id && cs.status === 'planning').length;
            const activeProjects = PROJECTS.filter(p => p.clientId === client.id && p.status === 'active').length;
            const openTasks = TASKS.filter(t => t.clientId === client.id && t.status !== 'done').length;
            const strategy = STRATEGIES.find(s => s.clientId === client.id);
            const healthStyle = getHealthStyle(health);

            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="rounded-lg overflow-hidden transition-all group block"
                style={{
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)';
                  (e.currentTarget as HTMLElement).style.borderColor = '#D0D6E0';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                }}
              >
                {/* Status color accent bar */}
                {(() => {
                  const health = getClientHealth(client.id, CLIENT_SERVICES, SERVICE_STRATEGIES);
                  const statusColor = getHealthBarColor(health);
                  return <div className="h-1.5" style={{ backgroundColor: statusColor }} />;
                })()}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{client.name}</h3>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{client.industry}</p>
                      <p className="text-xs" style={{ color: 'var(--color-icon-muted)' }}>{client.location}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold" style={healthStyle}>{health}%</div>
                      <div className="text-[10px] font-medium" style={healthStyle}>{getHealthLabel(health)}</div>
                    </div>
                  </div>

                  {/* Health progress bar */}
                  <div className="mb-4">
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: getHealthBarTrack(health) }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${health}%`, backgroundColor: getHealthBarColor(health) }}
                      />
                    </div>
                  </div>

                  {strategy && (
                    <div
                      className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 mb-4"
                      style={{ backgroundColor: '#000000', color: '#ffffff' }}
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
                      <div key={label} className="rounded-lg py-2 px-1" style={{ backgroundColor: 'var(--color-bg-page)' }}>
                        <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
                        <div className="text-[10px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="flex items-center justify-between mt-4 pt-4"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                  >
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>View services & strategy</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.preventDefault(); setEditClient(client); }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--color-text-muted)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-donut-track)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                        title="Edit client"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); setArchiveId(client.id); }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--color-text-muted)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#DC2626'; (e.currentTarget as HTMLElement).style.backgroundColor = '#FEE2E2'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                        title="Archive client"
                      >
                        <Archive size={13} />
                      </button>
                      <ChevronRight size={16} style={{ color: 'var(--color-icon-muted)' }} className="group-hover:text-blue-500 transition-colors" />
                    </div>
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
