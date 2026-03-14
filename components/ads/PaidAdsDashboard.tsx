'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import {
  getClientCampaigns,
  linkCampaignToKpi,
  unlinkCampaignFromKpi,
  getClientKpis,
  type AdCampaign,
  type CampaignKpiLink,
} from '@/lib/actions-ads';
import { Loader2, X, Link2, Link2Off, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

type DateRange = 'today' | '7d' | '30d' | 'month';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  '7d': '7 Days',
  '30d': '30 Days',
  month: 'This Month',
};

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ data }: { data: Array<{ date: string; spend: number }> }) {
  if (!data || data.length < 2) {
    return <div className="w-20 h-8 bg-gray-50 dark:bg-gray-700/30 rounded" />;
  }

  const w = 80;
  const h = 32;
  const pad = 2;
  const values = data.map(d => d.spend);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  // Fill area
  const first = points[0];
  const last = points[points.length - 1];
  const lastX = last.split(',')[0];
  const firstX = first.split(',')[0];
  const area = `${polyline} ${lastX},${h - pad} ${firstX},${h - pad}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polygon
        points={area}
        fill="#3B5BDB"
        fillOpacity="0.08"
      />
      <polyline
        points={polyline}
        fill="none"
        stroke="#3B5BDB"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Format helpers ─────────────────────────────────────────────────────────────
function fmtCurrency(v: number | null) {
  if (v == null) return '-';
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtNum(v: number | null) {
  if (v == null) return '-';
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v.toString();
}

function fmtRoas(v: number | null) {
  if (v == null) return '-';
  return `${v.toFixed(1)}x`;
}

function roasColor(v: number | null) {
  if (v == null) return 'text-gray-500';
  if (v >= 2.0) return 'text-green-600';
  if (v >= 1.0) return 'text-amber-600';
  return 'text-red-600';
}

// ── KPI Link Modal ────────────────────────────────────────────────────────────
function KpiLinkModal({
  campaign,
  clientId,
  onClose,
  onSaved,
}: {
  campaign: AdCampaign;
  clientId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kpis, setKpis] = useState<Array<{ id: string; name: string; target: number; unit: string; strategyName: string }>>([]);
  const [selectedKpiId, setSelectedKpiId] = useState(campaign.kpiLink?.kpiId ?? '');
  const [selectedMetric, setSelectedMetric] = useState(campaign.kpiLink?.metricType ?? 'roas');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useTransition();

  useEffect(() => {
    getClientKpis(clientId)
      .then(data => { setKpis(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [clientId]);

  const handleSave = () => {
    if (!selectedKpiId) { toast.error('Please select a KPI'); return; }
    setSaving(async () => {
      try {
        await linkCampaignToKpi(campaign.id, selectedKpiId, selectedMetric);
        toast.success('KPI link saved');
        onSaved();
        onClose();
      } catch (e) {
        toast.error('Failed: ' + (e as Error).message);
      }
    });
  };

  const handleRemove = () => {
    if (!campaign.kpiLink) return;
    setSaving(async () => {
      try {
        await unlinkCampaignFromKpi(campaign.kpiLink!.id);
        toast.success('KPI link removed');
        onSaved();
        onClose();
      } catch (e) {
        toast.error('Failed: ' + (e as Error).message);
      }
    });
  };

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">Link Campaign to KPI</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-500">
            Campaign: <span className="font-medium text-gray-700 dark:text-gray-300">{campaign.name}</span>
          </p>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading KPIs...</span>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">KPI</label>
                <select value={selectedKpiId} onChange={e => setSelectedKpiId(e.target.value)} className={inputClass}>
                  <option value="">Select a KPI...</option>
                  {kpis.map(k => (
                    <option key={k.id} value={k.id}>
                      {k.name} (target: {k.target}{k.unit}) — {k.strategyName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Metric</label>
                <select value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)} className={inputClass}>
                  <option value="roas">ROAS</option>
                  <option value="results">Results</option>
                  <option value="spend">Spend</option>
                  <option value="impressions">Impressions</option>
                  <option value="reach">Reach</option>
                  <option value="cost_per_result">Cost Per Result</option>
                </select>
              </div>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          {campaign.kpiLink && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={saving}
              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              <Link2Off size={13} className="inline mr-1" />
              Remove Link
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#364FC7] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            Save Link
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Campaign Card ─────────────────────────────────────────────────────────────
function CampaignCard({
  campaign,
  clientId,
  onRefresh,
}: {
  campaign: AdCampaign;
  clientId: string;
  onRefresh: () => void;
}) {
  const [showLinkModal, setShowLinkModal] = useState(false);

  const statusDot = {
    active: 'bg-green-500',
    paused: 'bg-amber-400',
    ended: 'bg-gray-400',
  }[campaign.status];

  const statusLabel = {
    active: 'Active',
    paused: 'Paused',
    ended: 'Ended',
  }[campaign.status];

  const startLabel = campaign.startDate
    ? new Date(campaign.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const kpi = campaign.kpiLink;
  const kpiPct = kpi?.kpiTarget && kpi.currentValue != null
    ? Math.min(100, Math.round((kpi.currentValue / kpi.kpiTarget) * 100))
    : null;

  const metricLabel = {
    roas: 'ROAS',
    results: 'Results',
    spend: 'Spend',
    impressions: 'Impressions',
    reach: 'Reach',
    cost_per_result: 'CPR',
  }[kpi?.metricType ?? ''] ?? kpi?.metricType;

  const formatKpiValue = (v: number | null | undefined, metricType: string) => {
    if (v == null) return '-';
    if (metricType === 'roas') return `${v.toFixed(1)}x`;
    if (metricType === 'spend' || metricType === 'cost_per_result') return fmtCurrency(v);
    return fmtNum(v);
  };

  return (
    <>
      {showLinkModal && (
        <KpiLinkModal
          campaign={campaign}
          clientId={clientId}
          onClose={() => setShowLinkModal(false)}
          onSaved={onRefresh}
        />
      )}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all overflow-hidden">
        {/* Card Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`} />
              <h3 className="font-semibold text-[#1E2A3A] dark:text-white text-sm truncate">{campaign.name}</h3>
            </div>
            <span className="text-[10px] font-semibold bg-[#EEF2FF] text-[#3B5BDB] px-2 py-0.5 rounded-full flex-shrink-0">
              {campaign.platform}
            </span>
          </div>
          <p className="text-[11px] text-[#8896A6] ml-4">
            {campaign.objective}
            {startLabel && <span className="ml-1">· Started {startLabel}</span>}
            {campaign.status === 'paused' && <span className="ml-1 text-amber-600">· Paused</span>}
            {campaign.status === 'ended' && <span className="ml-1 text-gray-500">· Ended</span>}
          </p>
        </div>

        {/* Metrics Row */}
        <div className="px-4 pb-3 grid grid-cols-6 gap-1">
          {[
            { label: 'Spend', value: fmtCurrency(campaign.totalSpend) },
            { label: 'Impress.', value: fmtNum(campaign.totalImpressions) },
            { label: 'Reach', value: fmtNum(campaign.totalReach) },
            { label: 'Results', value: campaign.totalResults > 0 ? campaign.totalResults.toString() : '-' },
            { label: 'CPResult', value: campaign.avgCostPerResult ? `$${campaign.avgCostPerResult.toFixed(1)}` : '-' },
            {
              label: 'ROAS',
              value: fmtRoas(campaign.avgRoas),
              className: roasColor(campaign.avgRoas),
            },
          ].map(({ label, value, className }) => (
            <div key={label} className="text-center">
              <div
                className="text-[10px] font-semibold uppercase tracking-wide mb-0.5"
                style={{ color: '#8896A6', letterSpacing: '0.06em' }}
              >
                {label}
              </div>
              <div
                className={`text-[15px] font-bold ${className ?? 'text-[#1E2A3A] dark:text-white'}`}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Sparkline */}
        {campaign.dailySpend.length > 1 && (
          <div className="px-4 pb-3">
            <div className="text-[9px] font-semibold uppercase text-[#8896A6] mb-1">Spend Trend</div>
            <Sparkline data={campaign.dailySpend} />
          </div>
        )}

        {/* KPI Link Section */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
          {kpi && kpi.currentValue != null ? (
            <div className="flex items-center gap-3 min-w-0">
              <TrendingUp size={13} className="text-[#3B5BDB] flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-[#8896A6] truncate block">
                  {kpi.kpiName}
                </span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {metricLabel}: {formatKpiValue(kpi.currentValue, kpi.metricType)}
                  {kpi.kpiTarget != null && (
                    <span className="text-[#8896A6] font-normal"> / {formatKpiValue(kpi.kpiTarget, kpi.metricType)}</span>
                  )}
                  {kpiPct != null && kpiPct >= 100 && <span className="ml-1 text-green-600">✓</span>}
                </span>
                {kpiPct != null && (
                  <div className="w-24 h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-0.5 overflow-hidden">
                    <div
                      className={`h-1 rounded-full ${kpiPct >= 70 ? 'bg-green-500' : kpiPct >= 40 ? 'bg-amber-500' : 'bg-red-400'}`}
                      style={{ width: `${kpiPct}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <span className="text-[11px] text-[#8896A6]">No KPI linked</span>
          )}
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex-shrink-0 text-[11px] font-medium text-[#3B5BDB] hover:bg-[#EEF2FF] px-2 py-1 rounded transition-colors flex items-center gap-1"
          >
            <Link2 size={11} />
            {kpi ? 'Edit Link' : 'Link KPI'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function PaidAdsDashboard({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getClientCampaigns(clientId, dateRange)
      .then(data => { setCampaigns(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, [clientId, dateRange]);

  useEffect(() => { load(); }, [load]);

  // Summary stats
  const totalSpend = campaigns.reduce((s, c) => s + c.totalSpend, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.totalImpressions, 0);
  const totalResults = campaigns.reduce((s, c) => s + c.totalResults, 0);
  const roasCampaigns = campaigns.filter(c => c.avgRoas != null);
  const avgRoas = roasCampaigns.length > 0
    ? roasCampaigns.reduce((s, c) => s + (c.avgRoas ?? 0), 0) / roasCampaigns.length
    : null;

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  return (
    <div>
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#1E2A3A] dark:text-white">
            {clientName} Campaigns
          </h2>
          <p className="text-sm text-[#8896A6] mt-0.5">
            Meta Ads · {campaigns.length} campaigns · {fmtCurrency(totalSpend)} total spend
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                dateRange === range
                  ? 'bg-white dark:bg-gray-800 text-[#3B5BDB] shadow-sm'
                  : 'text-[#5A6A7E] dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {DATE_RANGE_LABELS[range]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stat Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Spend', value: fmtCurrency(totalSpend) },
          { label: 'Total Impressions', value: fmtNum(totalImpressions) },
          { label: 'Total Results', value: totalResults > 0 ? totalResults.toString() : '0' },
          { label: 'Avg ROAS', value: avgRoas != null ? `${avgRoas.toFixed(1)}x` : '-' },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center"
          >
            <div
              className="text-[11px] font-semibold uppercase mb-1"
              style={{ color: '#8896A6', letterSpacing: '0.06em' }}
            >
              {label}
            </div>
            <div className="text-[22px] font-bold text-[#1E2A3A] dark:text-white leading-tight">
              {loading ? '-' : value}
            </div>
          </div>
        ))}
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#3B5BDB]" />
          <span className="ml-2 text-sm text-gray-500">Loading campaigns...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No campaigns found for this period.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              clientId={clientId}
              onRefresh={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
