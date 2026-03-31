'use client';

import { useState } from 'react';
import type { Campaign, Client, TeamMember } from '@/lib/data';
import { updateCampaign } from '@/lib/actions-campaigns';
import StatusCell from './StatusCell';

const PLATFORM_ICON: Record<string, string> = {
  meta: 'M',
  google_ads: 'G',
  email: 'E',
  organic: 'O',
  tiktok: 'T',
  linkedin: 'Li',
  other: '—',
};

const PLATFORM_COLOR: Record<string, { bg: string; text: string }> = {
  meta:       { bg: '#EFF6FF', text: '#2563EB' },
  google_ads: { bg: '#FEF3C7', text: '#D97706' },
  email:      { bg: '#F0FDF4', text: '#16A34A' },
  organic:    { bg: '#F5F3FF', text: '#7C3AED' },
  tiktok:     { bg: '#FDF2F8', text: '#DB2777' },
  linkedin:   { bg: '#EFF6FF', text: '#1D4ED8' },
  other:      { bg: '#F9FAFB', text: '#6B7280' },
};

const PRIORITY_DOT: Record<string, string> = {
  low:    '#3B82F6',
  medium: '#F59E0B',
  high:   '#EF4444',
  urgent: '#DC2626',
};

interface CampaignRowProps {
  campaign: Campaign;
  client: Client | undefined;
  teamMembers: TeamMember[];
  onCampaignClick: (campaign: Campaign) => void;
  onUpdated: (updated: Campaign) => void;
}

export default function CampaignRow({
  campaign,
  client,
  teamMembers,
  onCampaignClick,
  onUpdated,
}: CampaignRowProps) {
  const [hover, setHover] = useState(false);
  const owner = teamMembers.find(m => m.id === campaign.ownerId);
  const platformCfg = PLATFORM_COLOR[campaign.platform] ?? PLATFORM_COLOR.other;

  const handleStatusChange = async (status: Campaign['status']) => {
    const updated = await updateCampaign({ id: campaign.id, status });
    onUpdated(updated);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const formatCurrency = (n: number | null) => {
    if (n == null) return '—';
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const roasColor = (roas: number | null) => {
    if (roas == null) return '#6B7280';
    if (roas < 1) return '#EF4444';
    if (roas < 2) return '#F59E0B';
    return '#059669';
  };

  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        backgroundColor: hover ? '#F9FAFB' : '#FFFFFF',
        transition: 'background-color 0.1s',
        cursor: 'default',
      }}
    >
      {/* Campaign Name — sticky */}
      <td style={{
        position: 'sticky',
        left: 0,
        zIndex: 2,
        backgroundColor: hover ? '#F9FAFB' : '#FFFFFF',
        padding: '0 16px',
        borderBottom: '1px solid #F3F4F6',
        borderRight: '1px solid #E5E7EB',
        minWidth: '240px',
        maxWidth: '280px',
        height: '44px',
        transition: 'background-color 0.1s',
      }}>
        <button
          onClick={() => onCampaignClick(campaign)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
          }}
        >
          <span style={{
            display: 'inline-block',
            width: '4px',
            height: '24px',
            borderRadius: '2px',
            backgroundColor: client?.color ?? '#6366F1',
            flexShrink: 0,
          }} />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#111827',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textDecoration: hover ? 'underline' : 'none',
              textDecorationColor: '#6366F1',
            }}
          >
            {campaign.name}
          </span>
        </button>
      </td>

      {/* Status */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>
        <StatusCell status={campaign.status} onChange={handleStatusChange} />
      </td>

      {/* Platform */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: platformCfg.bg,
          color: platformCfg.text,
        }}>
          <span style={{ fontSize: '11px' }}>{PLATFORM_ICON[campaign.platform] ?? '—'}</span>
          {campaign.platform === 'meta' ? 'Meta' :
           campaign.platform === 'google_ads' ? 'Google' :
           campaign.platform === 'email' ? 'Email' :
           campaign.platform === 'organic' ? 'Organic' :
           campaign.platform === 'tiktok' ? 'TikTok' :
           campaign.platform === 'linkedin' ? 'LinkedIn' : 'Other'}
        </span>
      </td>

      {/* Owner */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>
        {owner ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: owner.color ?? '#6366F1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {owner.initials}
            </div>
            <span style={{ fontSize: '13px', color: '#374151' }}>{owner.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: '#D1D5DB' }}>—</span>
        )}
      </td>

      {/* Priority */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: PRIORITY_DOT[campaign.priority] ?? '#F59E0B',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
            {campaign.priority.charAt(0).toUpperCase() + campaign.priority.slice(1)}
          </span>
        </span>
      </td>

      {/* Start Date */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '13px', color: '#6B7280' }}>{formatDate(campaign.startDate)}</span>
      </td>

      {/* End Date */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '13px', color: '#6B7280' }}>{formatDate(campaign.endDate)}</span>
      </td>

      {/* Budget */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap', textAlign: 'right' }}>
        <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500, fontFamily: 'ui-monospace, monospace' }}>
          {formatCurrency(campaign.totalBudget)}
        </span>
      </td>

      {/* Spend (portal) */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap', textAlign: 'right' }}>
        {campaign.portalMetrics ? (
          <span style={{ fontSize: '13px', color: '#374151', fontFamily: 'ui-monospace, monospace' }}>
            {formatCurrency(campaign.portalMetrics.totalSpend)}
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: '#D1D5DB' }}>—</span>
        )}
      </td>

      {/* Results (portal) */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap', textAlign: 'right' }}>
        {campaign.portalMetrics ? (
          <span style={{ fontSize: '13px', color: '#374151', fontFamily: 'ui-monospace, monospace' }}>
            {campaign.portalMetrics.totalResults.toLocaleString()}
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: '#D1D5DB' }}>—</span>
        )}
      </td>

      {/* ROAS (portal) */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap', textAlign: 'right' }}>
        {campaign.portalMetrics?.avgRoas != null ? (
          <span style={{
            fontSize: '13px',
            fontWeight: 600,
            color: roasColor(campaign.portalMetrics.avgRoas),
            fontFamily: 'ui-monospace, monospace',
          }}>
            {campaign.portalMetrics.avgRoas.toFixed(2)}x
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: '#D1D5DB' }}>—</span>
        )}
      </td>
    </tr>
  );
}
