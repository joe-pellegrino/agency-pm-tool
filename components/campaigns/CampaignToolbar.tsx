'use client';

import { Search, Plus } from 'lucide-react';
import type { Client } from '@/lib/data';

interface CampaignToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  selectedClientIds: string[];
  onClientFilterChange: (ids: string[]) => void;
  selectedStatuses: string[];
  onStatusFilterChange: (statuses: string[]) => void;
  clients: Client[];
  onNewCampaign: () => void;
}

const ALL_STATUSES = ['planning', 'active', 'complete', 'on-hold'];

const STATUS_LABEL: Record<string, string> = {
  planning: 'Planning',
  active: 'Active',
  complete: 'Complete',
  'on-hold': 'On Hold',
};

export default function CampaignToolbar({
  search,
  onSearchChange,
  selectedClientIds,
  onClientFilterChange,
  selectedStatuses,
  onStatusFilterChange,
  clients,
  onNewCampaign,
}: CampaignToolbarProps) {
  const toggleClient = (id: string) => {
    if (selectedClientIds.includes(id)) {
      onClientFilterChange(selectedClientIds.filter(c => c !== id));
    } else {
      onClientFilterChange([...selectedClientIds, id]);
    }
  };

  const toggleStatus = (s: string) => {
    if (selectedStatuses.includes(s)) {
      onStatusFilterChange(selectedStatuses.filter(x => x !== s));
    } else {
      onStatusFilterChange([...selectedStatuses, s]);
    }
  };

  const activeFilters = selectedClientIds.length + selectedStatuses.length;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 0',
      flexWrap: 'wrap',
    }}>
      {/* Search */}
      <div style={{
        position: 'relative',
        flex: '1 1 240px',
        maxWidth: '320px',
      }}>
        <Search size={14} style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#9CA3AF',
          pointerEvents: 'none',
        }} />
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search campaigns..."
          style={{
            width: '100%',
            paddingLeft: '32px',
            paddingRight: '12px',
            paddingTop: '8px',
            paddingBottom: '8px',
            fontSize: '13px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            outline: 'none',
            color: '#111827',
            backgroundColor: '#FFFFFF',
            boxSizing: 'border-box',
          }}
          onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
          onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
        />
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {ALL_STATUSES.map(s => {
          const active = selectedStatuses.includes(s);
          return (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: active ? '1px solid #6366F1' : '1px solid #E5E7EB',
                backgroundColor: active ? '#EEF2FF' : '#FFFFFF',
                color: active ? '#6366F1' : '#6B7280',
                fontSize: '12px',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>

      {/* Client filter - show if more than 1 client */}
      {clients.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>Client:</span>
          {clients.map(c => {
            const active = selectedClientIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleClient(c.id)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: active ? '1px solid #6366F1' : '1px solid #E5E7EB',
                  backgroundColor: active ? '#EEF2FF' : '#FFFFFF',
                  color: active ? '#6366F1' : '#6B7280',
                  fontSize: '12px',
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Clear filters */}
      {activeFilters > 0 && (
        <button
          onClick={() => {
            onClientFilterChange([]);
            onStatusFilterChange([]);
          }}
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid #FCA5A5',
            backgroundColor: '#FFF5F5',
            color: '#EF4444',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Clear ({activeFilters})
        </button>
      )}

      <div style={{ flex: 1 }} />

      {/* New Campaign */}
      <button
        onClick={onNewCampaign}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#6366F1',
          color: '#FFFFFF',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#4F46E5'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#6366F1'}
      >
        <Plus size={15} />
        New Campaign
      </button>
    </div>
  );
}
