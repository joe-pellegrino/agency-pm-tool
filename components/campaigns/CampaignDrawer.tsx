'use client';

import { useState, useEffect } from 'react';
import type { Campaign, Client, TeamMember } from '@/lib/data';
import { updateCampaign, deleteCampaign } from '@/lib/actions-campaigns';
import StatusCell from './StatusCell';
import { X, Trash2, ExternalLink, Calendar, DollarSign, Target, BarChart3, Tag, StickyNote } from 'lucide-react';

const PLATFORM_LABEL: Record<string, string> = {
  meta: 'Meta Ads',
  google_ads: 'Google Ads',
  email: 'Email',
  organic: 'Organic',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  other: 'Other',
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label: 'Low',    color: '#3B82F6' },
  medium: { label: 'Medium', color: '#F59E0B' },
  high:   { label: 'High',   color: '#EF4444' },
  urgent: { label: 'Urgent', color: '#DC2626' },
};

interface CampaignDrawerProps {
  campaign: Campaign | null;
  clients: Client[];
  teamMembers: TeamMember[];
  onClose: () => void;
  onUpdated: (updated: Campaign) => void;
  onDeleted: (id: string) => void;
}

export default function CampaignDrawer({
  campaign,
  clients,
  teamMembers,
  onClose,
  onUpdated,
  onDeleted,
}: CampaignDrawerProps) {
  const [editing, setEditing] = useState<Partial<Campaign>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (campaign) setEditing({});
  }, [campaign?.id]);

  if (!campaign) return null;

  const merged = { ...campaign, ...editing };
  const client = clients.find(c => c.id === merged.clientId);
  const owner = teamMembers.find(m => m.id === merged.ownerId);
  const priorityCfg = PRIORITY_CONFIG[merged.priority] ?? PRIORITY_CONFIG.medium;

  const handleSave = async () => {
    if (Object.keys(editing).length === 0) return;
    setSaving(true);
    try {
      const updated = await updateCampaign({ id: campaign.id, ...editing });
      onUpdated(updated);
      setEditing({});
    } catch (err) {
      console.error('Failed to update campaign:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteCampaign(campaign.id);
      onDeleted(campaign.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete campaign:', err);
    } finally {
      setDeleting(false);
    }
  };

  const isDirty = Object.keys(editing).length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.2)',
          zIndex: 40,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '480px',
        maxWidth: '100vw',
        backgroundColor: '#FFFFFF',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              value={editing.name ?? campaign.name}
              onChange={e => setEditing(prev => ({ ...prev, name: e.target.value }))}
              style={{
                width: '100%',
                fontSize: '18px',
                fontWeight: 700,
                color: '#111827',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                padding: '2px 0',
              }}
              onFocus={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onBlur={e => e.currentTarget.style.backgroundColor = 'transparent'}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <StatusCell
                status={merged.status}
                onChange={s => setEditing(prev => ({ ...prev, status: s }))}
              />
              <span style={{
                fontSize: '12px',
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: priorityCfg.color,
                }} />
                {priorityCfg.label} priority
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#9CA3AF',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Meta */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <DrawerField label="Client" icon={<Target size={14} />}>
              <span style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>
                {client?.name ?? merged.clientId}
              </span>
            </DrawerField>

            <DrawerField label="Platform" icon={<BarChart3 size={14} />}>
              <select
                value={editing.platform ?? campaign.platform}
                onChange={e => setEditing(prev => ({ ...prev, platform: e.target.value as Campaign['platform'] }))}
                style={{
                  fontSize: '14px',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                {Object.entries(PLATFORM_LABEL).map(([val, lbl]) => (
                  <option key={val} value={val}>{lbl}</option>
                ))}
              </select>
            </DrawerField>

            <DrawerField label="Start Date" icon={<Calendar size={14} />}>
              <input
                type="date"
                value={editing.startDate ?? campaign.startDate ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, startDate: e.target.value || null }))}
                style={{
                  fontSize: '13px',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  width: '100%',
                }}
              />
            </DrawerField>

            <DrawerField label="End Date" icon={<Calendar size={14} />}>
              <input
                type="date"
                value={editing.endDate ?? campaign.endDate ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, endDate: e.target.value || null }))}
                style={{
                  fontSize: '13px',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  width: '100%',
                }}
              />
            </DrawerField>

            <DrawerField label="Daily Budget" icon={<DollarSign size={14} />}>
              <input
                type="number"
                value={editing.dailyBudget ?? campaign.dailyBudget ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, dailyBudget: e.target.value ? Number(e.target.value) : null }))}
                placeholder="0.00"
                style={{
                  fontSize: '13px',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  width: '100%',
                }}
              />
            </DrawerField>

            <DrawerField label="Total Budget" icon={<DollarSign size={14} />}>
              <input
                type="number"
                value={editing.totalBudget ?? campaign.totalBudget ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, totalBudget: e.target.value ? Number(e.target.value) : null }))}
                placeholder="0.00"
                style={{
                  fontSize: '13px',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  width: '100%',
                }}
              />
            </DrawerField>

            <DrawerField label="Owner" icon={<Target size={14} />}>
              <select
                value={editing.ownerId ?? campaign.ownerId ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, ownerId: e.target.value || null }))}
                style={{
                  fontSize: '13px',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="">Unassigned</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </DrawerField>

            <DrawerField label="Priority" icon={<Tag size={14} />}>
              <select
                value={editing.priority ?? campaign.priority}
                onChange={e => setEditing(prev => ({ ...prev, priority: e.target.value as Campaign['priority'] }))}
                style={{
                  fontSize: '13px',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  width: '100%',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </DrawerField>
          </div>

          {/* Objective */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Objective
            </label>
            <input
              value={editing.objective ?? campaign.objective ?? ''}
              onChange={e => setEditing(prev => ({ ...prev, objective: e.target.value || null }))}
              placeholder="Campaign objective..."
              style={{
                width: '100%',
                marginTop: '6px',
                fontSize: '14px',
                color: '#111827',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                padding: '8px 12px',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
              onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <StickyNote size={12} />
              Notes
            </label>
            <textarea
              value={editing.notes ?? campaign.notes ?? ''}
              onChange={e => setEditing(prev => ({ ...prev, notes: e.target.value || null }))}
              placeholder="Add notes..."
              rows={4}
              style={{
                width: '100%',
                marginTop: '6px',
                fontSize: '14px',
                color: '#111827',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                padding: '8px 12px',
                outline: 'none',
                resize: 'vertical',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
              onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
            />
          </div>

          {/* Portal link */}
          {campaign.portalCampaignId && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#EFF6FF',
                borderRadius: '8px',
                border: '1px solid #BFDBFE',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#3B82F6', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ExternalLink size={12} />
                  PORTAL LINKED
                </div>
                {campaign.portalMetrics ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                    <MetricTile label="Spend" value={`$${campaign.portalMetrics.totalSpend.toLocaleString()}`} />
                    <MetricTile label="Results" value={campaign.portalMetrics.totalResults.toLocaleString()} />
                    {campaign.portalMetrics.avgRoas != null && (
                      <MetricTile label="ROAS" value={`${campaign.portalMetrics.avgRoas.toFixed(2)}x`} />
                    )}
                    {campaign.portalMetrics.avgCostPerResult != null && (
                      <MetricTile label="Cost/Result" value={`$${campaign.portalMetrics.avgCostPerResult.toFixed(2)}`} />
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: '#6B7280' }}>Campaign ID: {campaign.portalCampaignId}</p>
                )}
              </div>
            </div>
          )}

          {/* Portal campaign ID field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Portal Campaign ID (optional)
            </label>
            <input
              value={editing.portalCampaignId ?? campaign.portalCampaignId ?? ''}
              onChange={e => setEditing(prev => ({ ...prev, portalCampaignId: e.target.value || null }))}
              placeholder="Link to portal campaign..."
              style={{
                width: '100%',
                marginTop: '6px',
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#111827',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                padding: '8px 12px',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
              onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: '#F9FAFB',
        }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #FCA5A5',
              backgroundColor: '#FFF5F5',
              color: '#EF4444',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <Trash2 size={14} />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                color: '#6B7280',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            {isDirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#6366F1',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function DrawerField({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '6px', padding: '8px 10px', border: '1px solid #BFDBFE' }}>
      <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E40AF' }}>{value}</div>
    </div>
  );
}
