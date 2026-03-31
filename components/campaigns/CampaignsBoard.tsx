'use client';

import { useState, useMemo } from 'react';
import type { Campaign, Client, TeamMember } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import CampaignGroup from './CampaignGroup';
import CampaignDrawer from './CampaignDrawer';
import CampaignToolbar from './CampaignToolbar';
import NewCampaignModal from './NewCampaignModal';
import { Megaphone } from 'lucide-react';

const TABLE_COLUMNS = [
  { key: 'name',     label: 'Campaign',  sticky: true,  width: 260 },
  { key: 'status',   label: 'Status',    sticky: false, width: 130 },
  { key: 'platform', label: 'Platform',  sticky: false, width: 100 },
  { key: 'owner',    label: 'Owner',     sticky: false, width: 130 },
  { key: 'priority', label: 'Priority',  sticky: false, width: 100 },
  { key: 'startDate',label: 'Start',     sticky: false, width: 110 },
  { key: 'endDate',  label: 'End',       sticky: false, width: 110 },
  { key: 'budget',   label: 'Budget',    sticky: false, width: 110, align: 'right' as const },
  { key: 'spend',    label: 'Spend',     sticky: false, width: 100, align: 'right' as const },
  { key: 'results',  label: 'Results',   sticky: false, width: 90,  align: 'right' as const },
  { key: 'roas',     label: 'ROAS',      sticky: false, width: 80,  align: 'right' as const },
];

export default function CampaignsBoard() {
  const { CAMPAIGNS = [], CLIENTS = [], TEAM_MEMBERS = [], loading, error } = useAppData();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Sync campaigns from AppData on first load
  if (!initialized && CAMPAIGNS.length >= 0 && !loading) {
    setCampaigns(CAMPAIGNS);
    setInitialized(true);
  }

  const handleUpdated = (updated: Campaign) => {
    setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (selectedCampaign?.id === updated.id) setSelectedCampaign(updated);
  };

  const handleCreated = (created: Campaign) => {
    setCampaigns(prev => [created, ...prev]);
  };

  const handleDeleted = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  // Filter campaigns
  const filtered = useMemo(() => {
    let list = campaigns;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q));
    }
    if (selectedClientIds.length > 0) {
      list = list.filter(c => selectedClientIds.includes(c.clientId));
    }
    if (selectedStatuses.length > 0) {
      list = list.filter(c => selectedStatuses.includes(c.status));
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let av: string | number = '';
        let bv: string | number = '';
        if (sortKey === 'name') { av = a.name; bv = b.name; }
        else if (sortKey === 'status') { av = a.status; bv = b.status; }
        else if (sortKey === 'startDate') { av = a.startDate ?? ''; bv = b.startDate ?? ''; }
        else if (sortKey === 'endDate') { av = a.endDate ?? ''; bv = b.endDate ?? ''; }
        else if (sortKey === 'budget') { av = a.totalBudget ?? 0; bv = b.totalBudget ?? 0; }
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [campaigns, search, selectedClientIds, selectedStatuses, sortKey, sortDir]);

  // Group by client
  const groups = useMemo(() => {
    const map = new Map<string, Campaign[]>();
    for (const c of filtered) {
      if (!map.has(c.clientId)) map.set(c.clientId, []);
      map.get(c.clientId)!.push(c);
    }
    return map;
  }, [filtered]);

  // Determine which clients to show (those that appear in the filtered campaigns)
  const activeClients = useMemo(() => {
    return CLIENTS.filter(c => groups.has(c.id));
  }, [CLIENTS, groups]);

  // Also include clients with no campaigns if no filter is active
  const groupClients = useMemo(() => {
    if (selectedClientIds.length > 0 || search.trim() || selectedStatuses.length > 0) {
      return activeClients;
    }
    // Show all clients (even empty ones)
    return CLIENTS;
  }, [CLIENTS, activeClients, selectedClientIds, search, selectedStatuses]);

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

  const totalCount = campaigns.length;
  const activeCount = campaigns.filter(c => c.status === 'active').length;

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
          Track and manage all client campaigns in one place
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
      />

      {/* Board table */}
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
                    Click &ldquo;New Campaign&rdquo; to create your first campaign.
                  </p>
                </td>
              </tr>
            </tbody>
          ) : (
            groupClients.map((client, index) => (
              <CampaignGroup
                key={client.id}
                client={client}
                campaigns={groups.get(client.id) ?? []}
                allClients={CLIENTS}
                teamMembers={TEAM_MEMBERS}
                colorIndex={index}
                onCampaignClick={setSelectedCampaign}
                onUpdated={handleUpdated}
                onCreated={handleCreated}
              />
            ))
          )}
        </table>
      </div>

      {/* Detail Drawer */}
      {selectedCampaign && (
        <CampaignDrawer
          campaign={selectedCampaign}
          clients={CLIENTS}
          teamMembers={TEAM_MEMBERS}
          onClose={() => setSelectedCampaign(null)}
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
