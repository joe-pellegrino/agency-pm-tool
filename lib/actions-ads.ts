'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/client';

const db = () => createServerClient();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdCampaign {
  id: string;
  clientId: string;
  name: string;
  platform: string;
  status: 'active' | 'paused' | 'ended';
  objective: string | null;
  dailyBudget: number | null;
  totalBudget: number | null;
  startDate: string | null;
  endDate: string | null;
  // Aggregated for the selected date range
  totalSpend: number;
  totalImpressions: number;
  totalReach: number;
  totalResults: number;
  avgCostPerResult: number | null;
  avgRoas: number | null;
  resultType: string;
  // For sparkline
  dailySpend: Array<{ date: string; spend: number }>;
  // KPI link (if any)
  kpiLink: CampaignKpiLink | null;
}

export interface CampaignMetric {
  date: string;
  spend: number;
  impressions: number;
  reach: number;
  results: number;
  costPerResult: number | null;
  roas: number | null;
  clicks: number;
  ctr: number | null;
  cpm: number | null;
}

export interface CampaignKpiLink {
  id: string;
  campaignId: string;
  kpiId: string;
  metricType: string;
  // Populated from joined KPI
  kpiName?: string;
  kpiTarget?: number;
  kpiUnit?: string;
  currentValue?: number | null;
}

type DateRange = 'today' | '7d' | '30d' | 'month';

function getDateBounds(dateRange: DateRange): { start: string; end: string } {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  switch (dateRange) {
    case 'today':
      return { start: today, end: today };
    case '7d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { start: d.toISOString().split('T')[0], end: today };
    }
    case '30d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { start: d.toISOString().split('T')[0], end: today };
    }
    case 'month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: d.toISOString().split('T')[0], end: today };
    }
  }
}

// Get all campaigns for a client with aggregated metrics for the given time range
export async function getClientCampaigns(
  clientId: string,
  dateRange: DateRange = '7d',
): Promise<AdCampaign[]> {
  const { start, end } = getDateBounds(dateRange);

  // Fetch campaigns
  const { data: campaignRows, error: campErr } = await db()
    .from('ad_campaigns')
    .select('*')
    .eq('client_id', clientId)
    .is('archived_at', null)
    .order('created_at', { ascending: true });

  if (campErr) throw new Error(campErr.message);
  if (!campaignRows || campaignRows.length === 0) return [];

  const campaignIds = campaignRows.map((c: Record<string, unknown>) => c.id as string);

  // Fetch metrics for the date range
  const { data: metricRows, error: metErr } = await db()
    .from('ad_campaign_metrics')
    .select('*')
    .in('campaign_id', campaignIds)
    .gte('metric_date', start)
    .lte('metric_date', end);

  if (metErr) throw new Error(metErr.message);

  // Fetch all daily spend for sparkline (same range)
  const metricsMap = new Map<string, Record<string, unknown>[]>();
  (metricRows ?? []).forEach((m: Record<string, unknown>) => {
    const cid = m.campaign_id as string;
    if (!metricsMap.has(cid)) metricsMap.set(cid, []);
    metricsMap.get(cid)!.push(m);
  });

  // Fetch KPI links
  const { data: linkRows } = await db()
    .from('campaign_kpi_links')
    .select('*, strategy_kpis(id, name, target, unit)')
    .in('campaign_id', campaignIds);

  const linkMap = new Map<string, CampaignKpiLink>();
  (linkRows ?? []).forEach((l: Record<string, unknown>) => {
    const kpiRow = l.strategy_kpis as Record<string, unknown> | null;
    linkMap.set(l.campaign_id as string, {
      id: l.id as string,
      campaignId: l.campaign_id as string,
      kpiId: l.kpi_id as string,
      metricType: l.metric_type as string,
      kpiName: kpiRow?.name as string | undefined,
      kpiTarget: kpiRow?.target as number | undefined,
      kpiUnit: kpiRow?.unit as string | undefined,
    });
  });

  return campaignRows.map((c: Record<string, unknown>) => {
    const cMetrics = metricsMap.get(c.id as string) ?? [];

    const totalSpend = cMetrics.reduce((s, m) => s + (Number(m.spend) || 0), 0);
    const totalImpressions = cMetrics.reduce((s, m) => s + (Number(m.impressions) || 0), 0);
    const totalReach = cMetrics.reduce((max, m) => Math.max(max, Number(m.reach) || 0), 0);
    const totalResults = cMetrics.reduce((s, m) => s + (Number(m.results) || 0), 0);
    const avgCostPerResult = totalResults > 0 ? Math.round((totalSpend / totalResults) * 100) / 100 : null;

    // Weighted average ROAS (by spend)
    let roasNumerator = 0;
    let roas_denom = 0;
    cMetrics.forEach(m => {
      if (m.roas != null && m.spend != null) {
        roasNumerator += Number(m.roas) * Number(m.spend);
        roas_denom += Number(m.spend);
      }
    });
    const avgRoas = roas_denom > 0
      ? Math.round((roasNumerator / roas_denom) * 100) / 100
      : null;

    const resultType = cMetrics[0]?.result_type as string || 'leads';

    const dailySpend = cMetrics
      .sort((a, b) => (a.metric_date as string).localeCompare(b.metric_date as string))
      .map(m => ({ date: m.metric_date as string, spend: Number(m.spend) || 0 }));

    const kpiLink = linkMap.get(c.id as string) ?? null;

    // If linked, compute the current value from aggregated metrics
    if (kpiLink && kpiLink.metricType) {
      switch (kpiLink.metricType) {
        case 'roas':
          kpiLink.currentValue = avgRoas;
          break;
        case 'spend':
          kpiLink.currentValue = Math.round(totalSpend * 100) / 100;
          break;
        case 'results':
          kpiLink.currentValue = totalResults;
          break;
        case 'impressions':
          kpiLink.currentValue = totalImpressions;
          break;
        case 'reach':
          kpiLink.currentValue = totalReach;
          break;
        case 'cost_per_result':
          kpiLink.currentValue = avgCostPerResult;
          break;
        default:
          kpiLink.currentValue = null;
      }
    }

    return {
      id: c.id as string,
      clientId: c.client_id as string,
      name: c.name as string,
      platform: c.platform as string,
      status: c.status as 'active' | 'paused' | 'ended',
      objective: c.objective as string | null,
      dailyBudget: c.daily_budget as number | null,
      totalBudget: c.total_budget as number | null,
      startDate: c.start_date as string | null,
      endDate: c.end_date as string | null,
      totalSpend: Math.round(totalSpend * 100) / 100,
      totalImpressions,
      totalReach,
      totalResults,
      avgCostPerResult,
      avgRoas,
      resultType,
      dailySpend,
      kpiLink,
    };
  });
}

// Get daily metrics for a specific campaign (for sparkline/trend)
export async function getCampaignMetrics(
  campaignId: string,
  dateRange: DateRange = '7d',
): Promise<CampaignMetric[]> {
  const { start, end } = getDateBounds(dateRange);

  const { data, error } = await db()
    .from('ad_campaign_metrics')
    .select('*')
    .eq('campaign_id', campaignId)
    .gte('metric_date', start)
    .lte('metric_date', end)
    .order('metric_date', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((m: Record<string, unknown>) => ({
    date: m.metric_date as string,
    spend: Number(m.spend) || 0,
    impressions: Number(m.impressions) || 0,
    reach: Number(m.reach) || 0,
    results: Number(m.results) || 0,
    costPerResult: m.cost_per_result != null ? Number(m.cost_per_result) : null,
    roas: m.roas != null ? Number(m.roas) : null,
    clicks: Number(m.clicks) || 0,
    ctr: m.ctr != null ? Number(m.ctr) : null,
    cpm: m.cpm != null ? Number(m.cpm) : null,
  }));
}

// Get all campaign-KPI links for a client
export async function getCampaignKpiLinks(clientId: string): Promise<CampaignKpiLink[]> {
  const { data: campaigns } = await db()
    .from('ad_campaigns')
    .select('id')
    .eq('client_id', clientId)
    .is('archived_at', null);

  if (!campaigns || campaigns.length === 0) return [];

  const campaignIds = campaigns.map((c: Record<string, unknown>) => c.id as string);

  const { data, error } = await db()
    .from('campaign_kpi_links')
    .select('*, strategy_kpis(id, name, target, unit)')
    .in('campaign_id', campaignIds);

  if (error) throw new Error(error.message);

  return (data ?? []).map((l: Record<string, unknown>) => {
    const kpiRow = l.strategy_kpis as Record<string, unknown> | null;
    return {
      id: l.id as string,
      campaignId: l.campaign_id as string,
      kpiId: l.kpi_id as string,
      metricType: l.metric_type as string,
      kpiName: kpiRow?.name as string | undefined,
      kpiTarget: kpiRow?.target as number | undefined,
      kpiUnit: kpiRow?.unit as string | undefined,
    };
  });
}

// Link a campaign to a KPI
export async function linkCampaignToKpi(
  campaignId: string,
  kpiId: string,
  metricType: string,
): Promise<void> {
  // Upsert: remove any existing link for this campaign first, then insert
  await db().from('campaign_kpi_links').delete().eq('campaign_id', campaignId);

  if (kpiId) {
    const { error } = await db().from('campaign_kpi_links').insert({
      id: `link-${campaignId}-${Date.now()}`,
      campaign_id: campaignId,
      kpi_id: kpiId,
      metric_type: metricType,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath('/clients');
}

// Unlink a campaign from a KPI
export async function unlinkCampaignFromKpi(linkId: string): Promise<void> {
  const { error } = await db().from('campaign_kpi_links').delete().eq('id', linkId);
  if (error) throw new Error(error.message);
  revalidatePath('/clients');
}

// Get all KPIs for a client (for the link modal)
export async function getClientKpis(clientId: string) {
  const { data: strategies } = await db()
    .from('strategies')
    .select('id, name')
    .eq('client_id', clientId)
    .is('archived_at', null);

  if (!strategies || strategies.length === 0) return [];

  const strategyIds = strategies.map((s: Record<string, unknown>) => s.id as string);

  const { data: pillars } = await db()
    .from('strategy_pillars')
    .select('id, strategy_id, name')
    .in('strategy_id', strategyIds)
    .is('archived_at', null);

  if (!pillars || pillars.length === 0) return [];

  const pillarIds = pillars.map((p: Record<string, unknown>) => p.id as string);

  const { data: kpis, error } = await db()
    .from('strategy_kpis')
    .select('id, name, target, current, unit, pillar_id')
    .in('pillar_id', pillarIds)
    .is('archived_at', null);

  if (error) throw new Error(error.message);

  return (kpis ?? []).map((k: Record<string, unknown>) => {
    const pillar = pillars.find((p: Record<string, unknown>) => p.id === k.pillar_id);
    const strategy = strategies.find((s: Record<string, unknown>) => s.id === (pillar as Record<string, unknown>)?.strategy_id);
    return {
      id: k.id as string,
      name: k.name as string,
      target: Number(k.target),
      current: Number(k.current),
      unit: k.unit as string,
      pillarName: pillar ? (pillar as Record<string, unknown>).name as string : '',
      strategyName: strategy ? (strategy as Record<string, unknown>).name as string : '',
    };
  });
}
