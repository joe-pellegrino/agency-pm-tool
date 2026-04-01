'use client';

import { useState, useMemo } from 'react';
import type { Project, Client } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import CampaignGroup from './CampaignGroup';
import CampaignDrawer from './CampaignDrawer';
import CampaignToolbar from './CampaignToolbar';
import CampaignCalendar from './CampaignCalendar';
import NewCampaignModal from './NewCampaignModal';
import { Megaphone } from 'lucide-react';

const TABLE_COLUMNS = [
  { key: 'name',      label: 'Campaign',  sticky: true,  width: 280 },
  { key: 'status',    label: 'Status',    sticky: false, width: 130 },
  { key: 'startDate', label: 'Start',     sticky: false, width: 110 },
  { key: 'endDate',   label: 'End',       sticky: false, width: 110 },
  { key: 'progress',  label: 'Progress',  sticky: false, width: 160 },
  { key: 'tasks',     label: 'Tasks',     sticky: false, width: 80, align: 'right' as const },
];

export default function CampaignsBoard() {
  const { PROJECTS = [], CLIENTS = [], loading, error } = useAppData();

  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [search, setSearch] = useState('');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Sync from AppData on first load — filter projects where type='campaign'
  if (!initialized && !loading) {
    const campaigns = PROJECTS.filter(p => p.type?.toLowerCase() === 'campaign');
    setLocalProjects(campaigns);
    setInitialized(true);
  }

  const handleUpdated = (updated: Project) => {
    setLocalProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (selectedProject?.id === updated.id) setSelectedProject(updated);
  };

  const handleCreated = (created: Project) => {
    setLocalProjects(prev => [created, ...prev]);
  };

  const handleDeleted = (id: string) => {
    setLocalProjects(prev => prev.filter(p => p.id !== id));
  };

  // Filter projects
  const filtered = useMemo(() => {
    let list = localProjects;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    if (selectedClientIds.length > 0) {
      list = list.filter(p => selectedClientIds.includes(p.clientId));
    }
    if (selectedStatuses.length > 0) {
      list = list.filter(p => selectedStatuses.includes(p.status));
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let av: string | number = '';
        let bv: string | number = '';
        if (sortKey === 'name') { av = a.name; bv = b.name; }
        else if (sortKey === 'status') { av = a.status; bv = b.status; }
        else if (sortKey === 'startDate') { av = a.startDate ?? ''; bv = b.startDate ?? ''; }
        else if (sortKey === 'endDate') { av = a.endDate ?? ''; bv = b.endDate ?? ''; }
        else if (sortKey === 'progress') { av = a.progress ?? 0; bv = b.progress ?? 0; }
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [localProjects, search, selectedClientIds, selectedStatuses, sortKey, sortDir]);

  // Group by client
  const groups = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const p of filtered) {
      if (!map.has(p.clientId)) map.set(p.clientId, []);
      map.get(p.clientId)!.push(p);
    }
    return map;
  }, [filtered]);

  // Which clients appear in filtered results
  const activeClients = useMemo(() => {
    return CLIENTS.filter(c => groups.has(c.id));
  }, [CLIENTS, groups]);

  // Show all clients when no filter active (so groups can show empty state)
  const groupClients = useMemo(() => {
    if (selectedClientIds.length > 0 || search.trim() || selectedStatuses.length > 0) {
      return activeClients;
    }
    // Only show clients that have at least one campaign
    return CLIENTS.filter(c => localProjects.some(p => p.clientId === c.id));
  }, [CLIENTS, activeClients, localProjects, selectedClientIds, search, selectedStatuses]);

  const handleSortClick = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #E5E7EB',
            borderTopColor: '#6366F1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{ fontSize: '14px', color: '#9CA3AF' }}>Loading campaigns...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '24px',
        backgroundColor: '#FEF2F2',
        borderRadius: '8px',
        border: '1px solid #FCA5A5',
        color: '#DC2626',
        fontSize: '14px',
      }}>
        Failed to load campaigns: {error}
      </div>
    );
  }

  const totalCount = localProjects.length;
  const activeCount = localProjects.filter(p => p.status === 'active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Page Header */}
      <div style={{ marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Megaphone size={20} color="#6366F1" />
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>Campaigns</h1>
          {totalCount > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginLeft: '4px' }}>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: '#EEF2FF',
                color: '#6366F1',
                padding: '2px 8px',
                borderRadius: '10px',
              }}>
                {totalCount} total
              </span>
              {activeCount > 0 && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  padding: '2px 8px',
                  borderRadius: '10px',
                }}>
                  {activeCount} active
                </span>
              )}
            </div>
          )}
        </div>
        <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
          Initiatives of type &ldquo;campaign&rdquo; — tracked and managed in one place
        </p>
      </div>

      {/* Toolbar */}
      <CampaignToolbar
        search={search}
        onSearchChange={setSearch}
        selectedClientIds={selectedClientIds}
        onClientFilterChange={setSelectedClientIds}
        selectedStatuses={selectedStatuses}
        onStatusFilterChange={setSelectedStatuses}
        clients={CLIENTS}
        onNewCampaign={() => setShowNewModal(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Calendar view */}
      {viewMode === 'calendar' ? (
        <CampaignCalendar
          projects={filtered}
          clients={CLIENTS}
          onSelectProject={setSelectedProject}
        />
      ) : (
        /* Board table */
        <div style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: `${TABLE_COLUMNS.reduce((s, c) => s + c.width, 0)}px`,
          }}>
            {/* Header */}
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                {TABLE_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSortClick(col.key)}
                    style={{
                      padding: '10px 12px',
                      textAlign: (col.align ?? 'left') as 'left' | 'right',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: sortKey === col.key ? '#6366F1' : '#6B7280',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      borderBottom: '2px solid #E5E7EB',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      userSelect: 'none',
                      position: col.sticky ? 'sticky' : 'static',
                      left: col.sticky ? 0 : undefined,
                      zIndex: col.sticky ? 4 : 1,
                      backgroundColor: '#F9FAFB',
                      minWidth: col.width,
                      ...(col.key === 'name' ? { paddingLeft: '16px' } : {}),
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {col.label}
                      {sortKey === col.key && (
                        <span style={{ fontSize: '10px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Groups */}
            {groupClients.length === 0 ? (
              <tbody>
                <tr>
                  <td
                    colSpan={TABLE_COLUMNS.length}
                    style={{ padding: '60px 24px', textAlign: 'center' }}
                  >
                    <Megaphone size={40} color="#D1D5DB" style={{ margin: '0 auto 16px', display: 'block' }} />
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#6B7280', margin: '0 0 6px' }}>
                      No campaigns yet
                    </p>
                    <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
                      Click &ldquo;New Campaign&rdquo; to create your first campaign initiative.
                    </p>
                  </td>
                </tr>
              </tbody>
            ) : (
              groupClients.map((client, index) => (
                <CampaignGroup
                  key={client.id}
                  client={client}
                  projects={groups.get(client.id) ?? []}
                  allClients={CLIENTS}
                  colorIndex={index}
                  onCampaignClick={setSelectedProject}
                  onUpdated={handleUpdated}
                  onCreated={handleCreated}
                />
              ))
            )}
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      {selectedProject && (
        <CampaignDrawer
          project={selectedProject}
          clients={CLIENTS}
          onClose={() => setSelectedProject(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}

      {/* New Campaign Modal */}
      {showNewModal && (
        <NewCampaignModal
          clients={CLIENTS}
          onCreated={handleCreated}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
}
