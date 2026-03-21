import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { getKpiActualValues } from '@/lib/actions-ads';

export const dynamic = 'force-dynamic';

/**
 * GET /api/data/kpi-actuals?clientId=<slug>&kpiIds=id1,id2,...
 *
 * Returns live actual values for strategy KPIs that are linked to Meta campaigns
 * via campaign_kpi_links. Falls back to manual for unlinked KPIs.
 *
 * HARD RULE: This route only READS from portal Supabase. Never writes.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  const kpiIdsParam = searchParams.get('kpiIds');

  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
  }

  try {
    let kpiIds: string[] = [];

    if (kpiIdsParam) {
      kpiIds = kpiIdsParam.split(',').filter(Boolean);
    } else {
      // If no kpiIds given, look up all KPIs for this client
      const db = createServerClient();
      const { data: strategies } = await db
        .from('strategies')
        .select('id')
        .eq('client_id', clientId)
        .is('archived_at', null);

      if (!strategies || strategies.length === 0) {
        return NextResponse.json({ kpiActuals: {} });
      }

      const strategyIds = strategies.map((s: Record<string, unknown>) => s.id as string);
      const { data: pillars } = await db
        .from('strategy_pillars')
        .select('id')
        .in('strategy_id', strategyIds)
        .is('archived_at', null);

      if (!pillars || pillars.length === 0) {
        return NextResponse.json({ kpiActuals: {} });
      }

      const pillarIds = pillars.map((p: Record<string, unknown>) => p.id as string);
      const { data: kpis } = await db
        .from('strategy_kpis')
        .select('id')
        .in('pillar_id', pillarIds)
        .is('archived_at', null);

      kpiIds = (kpis ?? []).map((k: Record<string, unknown>) => k.id as string);
    }

    if (kpiIds.length === 0) {
      return NextResponse.json({ kpiActuals: {} });
    }

    const actualsMap = await getKpiActualValues(clientId, kpiIds);

    // Convert Map to plain object for JSON response
    const kpiActuals: Record<string, { actual: number | null; source: string; lastSyncAt: string | null; metricType: string | null; trendPct: number | null }> = {};
    for (const [kpiId, val] of actualsMap) {
      kpiActuals[kpiId] = {
        actual: val.actual,
        source: val.source,
        lastSyncAt: val.lastSyncAt,
        metricType: val.metricType,
        trendPct: val.trendPct,
      };
    }

    return NextResponse.json({ kpiActuals });
  } catch (err) {
    console.error('/api/data/kpi-actuals error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
