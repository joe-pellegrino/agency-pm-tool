import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { createPortalClient } from '@/lib/supabase/portal-client';

export const dynamic = 'force-dynamic';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const range = (searchParams.get('range') || '7d') as DateRange;

  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
  }

  const { start, end } = getDateBounds(range);

  try {
    const db = createServerClient();
    const portal = createPortalClient();

    // 1. Look up portal_client_id from client_portal_mapping
    const { data: mapping, error: mapErr } = await db
      .from('client_portal_mapping')
      .select('portal_client_id')
      .eq('client_id', clientId)
      .single();

    if (mapErr || !mapping) {
      // No portal mapping for this client — return empty
      return NextResponse.json({ campaigns: [] });
    }

    const portalClientId = mapping.portal_client_id as string;

    // 2. Query portal meta_ad_insights for this client/date range (READ ONLY)
    const { data: insights, error: insightsErr } = await portal
      .from('meta_ad_insights')
      .select('campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name, date, spend, impressions, clicks, reach, link_clicks, landing_page_views, video_views, post_engagements, post_reactions, actions')
      .eq('client_id', portalClientId)
      .gte('date', start)
      .lte('date', end);

    if (insightsErr) {
      console.error('Portal meta_ad_insights error:', insightsErr);
      return NextResponse.json({ error: insightsErr.message }, { status: 500 });
    }

    const rows = insights ?? [];

    // 3. Query portal leads for meta_ad leads (READ ONLY)
    const { data: leads } = await portal
      .from('leads')
      .select('source_id, source_detail, status, converted, conversion_amount')
      .eq('client_id', portalClientId)
      .eq('source', 'meta_ad')
      .gte('created_at', start + 'T00:00:00Z')
      .lte('created_at', end + 'T23:59:59Z');

    // Group leads by campaign name (source_detail)
    const leadsByCampaignName = new Map<string, number>();
    (leads ?? []).forEach((l: Record<string, unknown>) => {
      const key = (l.source_detail as string) || '';
      leadsByCampaignName.set(key, (leadsByCampaignName.get(key) || 0) + 1);
    });

    // 4. Aggregate by campaign_id
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

    // 5. Fetch KPI links from local DB for these campaign IDs
    const campaignIds = Array.from(campaignMap.keys());
    let kpiLinks: Record<string, unknown>[] = [];
    if (campaignIds.length > 0) {
      const { data: linkRows } = await db
        .from('campaign_kpi_links')
        .select('*, strategy_kpis(id, name, target, unit)')
        .in('campaign_id', campaignIds);
      kpiLinks = linkRows ?? [];
    }

    const kpiLinkMap = new Map<string, Record<string, unknown>>();
    for (const l of kpiLinks) {
      kpiLinkMap.set(l.campaign_id as string, l);
    }

    // 6. Build response
    const campaigns = Array.from(campaignMap.values()).map(c => {
      const totalSpend = Math.round(c.spend * 100) / 100;
      const totalResults = c.actions_leads || leadsByCampaignName.get(c.campaign_name) || 0;
      const avgCostPerResult = totalResults > 0 ? Math.round((totalSpend / totalResults) * 100) / 100 : null;

      const dailySpend = Array.from(c.daily.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, spend]) => ({ date, spend: Math.round(spend * 100) / 100 }));

      const linkRow = kpiLinkMap.get(c.campaign_id);
      const kpiRow = linkRow?.strategy_kpis as Record<string, unknown> | null;
      const kpiLink = linkRow ? {
        id: linkRow.id as string,
        campaignId: linkRow.campaign_id as string,
        kpiId: linkRow.kpi_id as string,
        metricType: linkRow.metric_type as string,
        kpiName: kpiRow?.name as string | undefined,
        kpiTarget: kpiRow?.target as number | undefined,
        kpiUnit: kpiRow?.unit as string | undefined,
        currentValue: null as number | null,
      } : null;

      // Compute kpiLink currentValue
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

    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error('/api/data/ads error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
