'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/client';
import { createPortalClient } from '@/lib/supabase/portal-client';

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
// Now reads from portal Supabase (via /api/data/ads) instead of empty local tables
export async function getClientCampaigns(
  clientId: string,
  dateRange: DateRange = '7d',
): Promise<AdCampaign[]> {
  const portal = createPortalClient();

  // Look up portal_client_id from client_portal_mapping
  const { data: mapping } = await db()
    .from('client_portal_mapping')
    .select('portal_client_id')
    .eq('client_id', clientId)
    .single();

  if (!mapping) return [];

  const portalClientId = mapping.portal_client_id as string;
  const { start, end } = getDateBounds(dateRange);

  // Query portal meta_ad_insights (READ ONLY)
  const { data: insights, error: insightsErr } = await portal
    .from('meta_ad_insights')
    .select('campaign_id, campaign_name, date, spend, impressions, clicks, reach, link_clicks, video_views, post_engagements, actions')
    .eq('client_id', portalClientId)
    .gte('date', start)
    .lte('date', end);

  if (insightsErr) throw new Error(insightsErr.message);

  const rows = insights ?? [];
  if (rows.length === 0) return [];

  // Query portal leads (READ ONLY)
  const { data: leads } = await portal
    .from('leads')
    .select('source_id, source_detail, status, converted, conversion_amount')
    .eq('client_id', portalClientId)
    .eq('source', 'meta_ad')
    .gte('created_at', start + 'T00:00:00Z')
    .lte('created_at', end + 'T23:59:59Z');

  const leadsByCampaignName = new Map<string, number>();
  (leads ?? []).forEach((l: Record<string, unknown>) => {
    const key = (l.source_detail as string) || '';
    leadsByCampaignName.set(key, (leadsByCampaignName.get(key) || 0) + 1);
  });

  // Aggregate by campaign_id
  const campaignMap = new Map<string, {
    campaign_id: string;
    campaign_name: string;
    spend: number;
    impressions: number;
    clicks: number;
    reach: number;
    link_clicks: number;
    video_views: number;
    post_engagements: number;
    actions_leads: number;
    daily: Map<string, number>;
  }>();

  for (const row of rows) {
    const cid = row.campaign_id as string;
    if (!campaignMap.has(cid)) {
      campaignMap.set(cid, {
        campaign_id: cid,
        campaign_name: row.campaign_name as string,
        spend: 0,
        impressions: 0,
        clicks: 0,
        reach: 0,
        link_clicks: 0,
        video_views: 0,
        post_engagements: 0,
        actions_leads: 0,
        daily: new Map(),
      });
    }

    const c = campaignMap.get(cid)!;
    c.spend += Number(row.spend) || 0;
    c.impressions += Number(row.impressions) || 0;
    c.clicks += Number(row.clicks) || 0;
    c.reach = Math.max(c.reach, Number(row.reach) || 0);
    c.link_clicks += Number(row.link_clicks) || 0;
    c.video_views += Number(row.video_views) || 0;
    c.post_engagements += Number(row.post_engagements) || 0;

    // Extract leads from Meta actions JSONB
    const actionsArr = row.actions as Array<{ action_type: string; value: string }> | null;
    if (Array.isArray(actionsArr)) {
      for (const a of actionsArr) {
        if (a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped') {
          c.actions_leads += Number(a.value) || 0;
        }
      }
    }

    // Daily spend for sparkline
    const dateKey = row.date as string;
    c.daily.set(dateKey, (c.daily.get(dateKey) || 0) + (Number(row.spend) || 0));
  }

  // Fetch KPI links from local DB for campaign IDs
  const campaignIds = Array.from(campaignMap.keys());
  const { data: linkRows } = await db()
    .from('campaign_kpi_links')
    .select('*, strategy_kpis(id, name, target, unit)')
    .in('campaign_id', campaignIds);

  const kpiLinkMap = new Map<string, Record<string, unknown>>();
  for (const l of (linkRows ?? [])) {
    kpiLinkMap.set(l.campaign_id as string, l);
  }

  const campaigns: AdCampaign[] = Array.from(campaignMap.values()).map(c => {
    const totalSpend = Math.round(c.spend * 100) / 100;
    const totalResults = c.actions_leads || leadsByCampaignName.get(c.campaign_name) || 0;
    const avgCostPerResult = totalResults > 0 ? Math.round((totalSpend / totalResults) * 100) / 100 : null;

    const dailySpend = Array.from(c.daily.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, spend]) => ({ date, spend: Math.round(spend * 100) / 100 }));

    const linkRow = kpiLinkMap.get(c.campaign_id);
    const kpiRow = linkRow?.strategy_kpis as Record<string, unknown> | null;
    const kpiLink: CampaignKpiLink | null = linkRow ? {
      id: linkRow.id as string,
      campaignId: linkRow.campaign_id as string,
      kpiId: linkRow.kpi_id as string,
      metricType: linkRow.metric_type as string,
      kpiName: kpiRow?.name as string | undefined,
      kpiTarget: kpiRow?.target as number | undefined,
      kpiUnit: kpiRow?.unit as string | undefined,
      currentValue: null,
    } : null;

    if (kpiLink && kpiLink.metricType) {
      switch (kpiLink.metricType) {
        case 'spend': kpiLink.currentValue = totalSpend; break;
        case 'results': kpiLink.currentValue = totalResults; break;
        case 'impressions': kpiLink.currentValue = c.impressions; break;
        case 'reach': kpiLink.currentValue = c.reach; break;
        case 'clicks': kpiLink.currentValue = c.clicks; break;
        case 'cost_per_result': kpiLink.currentValue = avgCostPerResult; break;
        default: kpiLink.currentValue = null;
      }
    }

    return {
      id: c.campaign_id,
      clientId,
      name: c.campaign_name,
      platform: 'Meta',
      status: 'active' as const,
      objective: null,
      dailyBudget: null,
      totalBudget: null,
      startDate: null,
      endDate: null,
      totalSpend,
      totalImpressions: c.impressions,
      totalReach: c.reach,
      totalResults,
      avgCostPerResult,
      avgRoas: null,
      resultType: 'leads',
      dailySpend,
      kpiLink,
    };
  });

  // Sort by spend descending
  campaigns.sort((a, b) => b.totalSpend - a.totalSpend);
  return campaigns;
}

// Get daily metrics for a specific campaign from portal (for sparkline/trend)
export async function getCampaignMetrics(
  campaignId: string,
  dateRange: DateRange = '7d',
): Promise<CampaignMetric[]> {
  const { start, end } = getDateBounds(dateRange);
  const portal = createPortalClient();

  const { data, error } = await portal
    .from('meta_ad_insights')
    .select('date, spend, impressions, reach, clicks, link_clicks, actions')
    .eq('campaign_id', campaignId)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true });

  if (error) throw new Error(error.message);

  // Aggregate by date (multiple rows per day possible)
  const dateMap = new Map<string, CampaignMetric>();
  for (const row of (data ?? [])) {
    const dateKey = row.date as string;
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {
        date: dateKey,
        spend: 0,
        impressions: 0,
        reach: 0,
        results: 0,
        costPerResult: null,
        roas: null,
        clicks: 0,
        ctr: null,
        cpm: null,
      });
    }
    const m = dateMap.get(dateKey)!;
    m.spend += Number(row.spend) || 0;
    m.impressions += Number(row.impressions) || 0;
    m.reach = Math.max(m.reach, Number(row.reach) || 0);
    m.clicks += Number(row.clicks) || 0;

    // Extract leads from actions
    const actionsArr = row.actions as Array<{ action_type: string; value: string }> | null;
    if (Array.isArray(actionsArr)) {
      for (const a of actionsArr) {
        if (a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped') {
          m.results += Number(a.value) || 0;
        }
      }
    }
  }

  const result = Array.from(dateMap.values());
  // Compute derived metrics
  for (const m of result) {
    m.ctr = m.impressions > 0 ? Math.round((m.clicks / m.impressions) * 10000) / 10000 : null;
    m.cpm = m.impressions > 0 ? Math.round((m.spend / m.impressions) * 1000 * 100) / 100 : null;
    m.costPerResult = m.results > 0 ? Math.round((m.spend / m.results) * 100) / 100 : null;
  }

  return result;
}

// Get all campaign-KPI links for a client
// campaignIds must be provided (fetched from portal meta_ad_insights)
export async function getCampaignKpiLinks(clientId: string, campaignIds?: string[]): Promise<CampaignKpiLink[]> {
  if (!campaignIds || campaignIds.length === 0) {
    // Fetch campaign IDs from portal for this client
    const portal = createPortalClient();
    const { data: mapping } = await db()
      .from('client_portal_mapping')
      .select('portal_client_id')
      .eq('client_id', clientId)
      .single();

    if (!mapping) return [];

    const { data: insights } = await portal
      .from('meta_ad_insights')
      .select('campaign_id')
      .eq('client_id', mapping.portal_client_id as string)
      .limit(500);

    const uniqueIds = [...new Set((insights ?? []).map((r: Record<string, unknown>) => r.campaign_id as string))];
    if (uniqueIds.length === 0) return [];
    campaignIds = uniqueIds;
  }

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

// ─── Phase 2: Initiative ↔ Campaign Linking ────────────────────────────────

export interface InitiativeCampaign {
  id: string;
  initiativeId: string;
  campaignId: string;
  platform: string;
  createdAt: string;
  // Populated from portal
  campaignName?: string;
  totalSpend?: number;
  totalImpressions?: number;
  totalClicks?: number;
  totalResults?: number;
  dailySpend?: Array<{ date: string; spend: number }>;
}

export async function linkCampaignToInitiative(
  initiativeId: string,
  campaignId: string,
  platform: string = 'meta',
): Promise<void> {
  const { error } = await db()
    .from('initiative_campaigns')
    .upsert({ initiative_id: initiativeId, campaign_id: campaignId, platform }, {
      onConflict: 'initiative_id,campaign_id',
    });
  if (error) throw new Error(error.message);
  revalidatePath('/initiatives');
}

export async function unlinkCampaignFromInitiative(
  initiativeId: string,
  campaignId: string,
): Promise<void> {
  const { error } = await db()
    .from('initiative_campaigns')
    .delete()
    .eq('initiative_id', initiativeId)
    .eq('campaign_id', campaignId);
  if (error) throw new Error(error.message);
  revalidatePath('/initiatives');
}

export async function getInitiativeCampaigns(
  initiativeId: string,
  dateRange: DateRange = '7d',
): Promise<InitiativeCampaign[]> {
  // Get linked campaign IDs from local DB
  const { data: links, error: linkErr } = await db()
    .from('initiative_campaigns')
    .select('*')
    .eq('initiative_id', initiativeId);

  if (linkErr) throw new Error(linkErr.message);
  if (!links || links.length === 0) return [];

  const campaignIds = links.map((l: Record<string, unknown>) => l.campaign_id as string);
  const { start, end } = getDateBounds(dateRange);
  const portal = createPortalClient();

  // Fetch metrics from portal for linked campaigns (READ ONLY)
  const { data: insights } = await portal
    .from('meta_ad_insights')
    .select('campaign_id, campaign_name, date, spend, impressions, clicks, actions')
    .in('campaign_id', campaignIds)
    .gte('date', start)
    .lte('date', end);

  // Aggregate per campaign
  const metricsMap = new Map<string, {
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    results: number;
    daily: Map<string, number>;
  }>();

  for (const row of (insights ?? [])) {
    const cid = row.campaign_id as string;
    if (!metricsMap.has(cid)) {
      metricsMap.set(cid, { name: row.campaign_name as string, spend: 0, impressions: 0, clicks: 0, results: 0, daily: new Map() });
    }
    const m = metricsMap.get(cid)!;
    m.spend += Number(row.spend) || 0;
    m.impressions += Number(row.impressions) || 0;
    m.clicks += Number(row.clicks) || 0;

    const actionsArr = row.actions as Array<{ action_type: string; value: string }> | null;
    if (Array.isArray(actionsArr)) {
      for (const a of actionsArr) {
        if (a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped') {
          m.results += Number(a.value) || 0;
        }
      }
    }

    const dateKey = row.date as string;
    m.daily.set(dateKey, (m.daily.get(dateKey) || 0) + (Number(row.spend) || 0));
  }

  return links.map((l: Record<string, unknown>) => {
    const cid = l.campaign_id as string;
    const m = metricsMap.get(cid);
    const dailySpend = m
      ? Array.from(m.daily.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, spend]) => ({ date, spend: Math.round(spend * 100) / 100 }))
      : [];

    return {
      id: l.id as string,
      initiativeId: l.initiative_id as string,
      campaignId: cid,
      platform: l.platform as string,
      createdAt: l.created_at as string,
      campaignName: m?.name,
      totalSpend: m ? Math.round(m.spend * 100) / 100 : 0,
      totalImpressions: m?.impressions ?? 0,
      totalClicks: m?.clicks ?? 0,
      totalResults: m?.results ?? 0,
      dailySpend,
    };
  });
}

// Get all portal campaigns for a client (for the campaign picker modal)
export async function getPortalCampaignsForClient(
  clientId: string,
  dateRange: DateRange = '30d',
): Promise<Array<{ id: string; name: string; spend: number; impressions: number }>> {
  const { data: mapping } = await db()
    .from('client_portal_mapping')
    .select('portal_client_id')
    .eq('client_id', clientId)
    .single();

  if (!mapping) return [];

  const portal = createPortalClient();
  const { start, end } = getDateBounds(dateRange);

  const { data: insights } = await portal
    .from('meta_ad_insights')
    .select('campaign_id, campaign_name, spend, impressions')
    .eq('client_id', mapping.portal_client_id as string)
    .gte('date', start)
    .lte('date', end);

  // Aggregate by campaign
  const map = new Map<string, { name: string; spend: number; impressions: number }>();
  for (const row of (insights ?? [])) {
    const cid = row.campaign_id as string;
    if (!map.has(cid)) map.set(cid, { name: row.campaign_name as string, spend: 0, impressions: 0 });
    const c = map.get(cid)!;
    c.spend += Number(row.spend) || 0;
    c.impressions += Number(row.impressions) || 0;
  }

  return Array.from(map.entries())
    .map(([id, v]) => ({ id, name: v.name, spend: Math.round(v.spend * 100) / 100, impressions: v.impressions }))
    .sort((a, b) => b.spend - a.spend);
}
