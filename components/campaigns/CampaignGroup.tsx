'use client';

import { useState } from 'react';
import type { Campaign, Client, TeamMember } from '@/lib/data';
import { createCampaign } from '@/lib/actions-campaigns';
import CampaignRow from './CampaignRow';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

// Distinct colors for client groups
const GROUP_COLORS = [
  '#6366F1', // indigo
  '#0EA5E9', // sky
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
];

interface CampaignGroupProps {
  client: Client;
  campaigns: Campaign[];
  allClients: Client[];
  teamMembers: TeamMember[];
  colorIndex: number;
  onCampaignClick: (campaign: Campaign) => void;
  onUpdated: (updated: Campaign) => void;
  onCreated: (created: Campaign) => void;
}

export default function CampaignGroup({
  client,
  campaigns,
  allClients,
  teamMembers,
  colorIndex,
  onCampaignClick,
  onUpdated,
  onCreated,
}: CampaignGroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const color = GROUP_COLORS[colorIndex % GROUP_COLORS.length];

  const handleAddCampaign = async () => {
    const name = newName.trim();
    if (!name) {
      setAddingNew(false);
      return;
    }
    setCreating(true);
    try {
      const created = await createCampaign({ clientId: client.id, name });
      onCreated(created);
      setNewName('');
      setAddingNew(false);
    } catch (err) {
      console.error('Failed to create campaign:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddCampaign();
    if (e.key === 'Escape') {
      setAddingNew(false);
      setNewName('');
    }
  };

  return (
    <tbody>
      {/* Group Header Row */}
      <tr>
        <td
          colSpan={11}
          style={{
            padding: 0,
            position: 'sticky',
            left: 0,
            zIndex: 3,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              backgroundColor: '#F8F9FF',
              borderBottom: '1px solid #E5E7EB',
              borderTop: collapsed ? '1px solid #E5E7EB' : undefined,
              borderLeft: `3px solid ${color}`,
              cursor: 'pointer',
            }}
            onClick={() => setCollapsed(!collapsed)}
          >
            <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center' }}>
              {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </span>

            {/* Client color dot */}
            <span style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: color,
              flexShrink: 0,
            }} />

            <span style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#111827',
            }}>
              {client.name}
            </span>

            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#9CA3AF',
              backgroundColor: '#F3F4F6',
              padding: '2px 7px',
              borderRadius: '10px',
            }}>
              {campaigns.length}
            </span>
          </div>
        </td>
      </tr>

      {/* Campaign rows */}
      {!collapsed && campaigns.map(campaign => (
        <CampaignRow
          key={campaign.id}
          campaign={campaign}
          client={allClients.find(c => c.id === campaign.clientId)}
          teamMembers={teamMembers}
          onCampaignClick={onCampaignClick}
          onUpdated={onUpdated}
        />
      ))}

      {/* Add row */}
      {!collapsed && (
        <tr>
          <td
            colSpan={11}
            style={{
              padding: 0,
              borderBottom: '1px solid #F3F4F6',
            }}
          >
            {addingNew ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', paddingLeft: '32px' }}>
                <span style={{
                  display: 'inline-block',
                  width: '4px',
                  height: '24px',
                  borderRadius: '2px',
                  backgroundColor: color,
                  flexShrink: 0,
                }} />
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleAddCampaign}
                  placeholder="Campaign name..."
                  disabled={creating}
                  style={{
                    flex: 1,
                    fontSize: '13px',
                    color: '#111827',
                    border: '1px solid #6366F1',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    outline: 'none',
                    maxWidth: '280px',
                  }}
                />
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Enter to save, Esc to cancel</span>
              </div>
            ) : (
              <button
                onClick={() => setAddingNew(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: '100%',
                  padding: '9px 16px',
                  paddingLeft: '32px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  fontSize: '13px',
                  textAlign: 'left',
                  transition: 'color 0.1s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB';
                  (e.currentTarget as HTMLElement).style.color = '#6366F1';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#9CA3AF';
                }}
              >
                <Plus size={14} />
                Add Campaign
              </button>
            )}
          </td>
        </tr>
      )}
    </tbody>
  );
}
