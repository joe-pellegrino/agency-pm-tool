import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://najrksokhyyhqgokxbys.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanJrc29raHl5aHFnb2t4YnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwODg2NCwiZXhwIjoyMDg4OTg0ODY0fQ.Vwpjgt4OSqXwiFAYIoUQVbN41rQM6fkyIMLQ3KujF-E';

const db = createClient(SUPABASE_URL, SERVICE_KEY);

function rand(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function isWeekend(date) {
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Generate 30 days of metrics for a campaign
function generateMetrics(campaignId, baseDate, params) {
  const {
    dailyBudget,
    targetRoas,
    resultType = 'leads',
    objective,
    campaignStatus,
    endDate,
  } = params;

  const metrics = [];
  for (let i = 0; i < 30; i++) {
    const date = addDays(baseDate, i);
    
    // Skip dates after end_date for ended campaigns
    if (endDate && date > endDate) continue;
    // Skip future dates
    if (date > new Date().toISOString().split('T')[0]) continue;

    const weekendMultiplier = isWeekend(date) ? 1.3 : 1.0;
    const variance = 0.85 + Math.random() * 0.3; // 0.85 to 1.15
    const multiplier = weekendMultiplier * variance;

    const spend = Math.round(dailyBudget * multiplier * 100) / 100;
    
    let impressions, reach, results, roas, ctr;
    
    if (objective === 'Awareness') {
      impressions = Math.round(rand(8000, 15000) * multiplier);
      reach = Math.round(impressions * rand(0.55, 0.70));
      results = Math.round(rand(0, 5) * multiplier);
      roas = null;
      ctr = rand(0.015, 0.035);
    } else if (objective === 'Lead Generation') {
      impressions = Math.round(rand(3000, 7000) * multiplier);
      reach = Math.round(impressions * rand(0.60, 0.75));
      results = Math.round(rand(1, 5) * multiplier);
      roas = targetRoas ? Math.round((targetRoas * (0.9 + Math.random() * 0.2)) * 100) / 100 : null;
      ctr = rand(0.025, 0.055);
    } else {
      // Conversions
      impressions = Math.round(rand(2500, 5500) * multiplier);
      reach = Math.round(impressions * rand(0.62, 0.78));
      results = Math.round(rand(1, 4) * multiplier);
      roas = targetRoas ? Math.round((targetRoas * (0.88 + Math.random() * 0.24)) * 100) / 100 : null;
      ctr = rand(0.03, 0.065);
    }

    const costPerResult = results > 0 ? Math.round((spend / results) * 100) / 100 : null;
    const cpm = Math.round((spend / impressions) * 1000 * 100) / 100;
    const clicks = Math.round(impressions * ctr);

    metrics.push({
      id: `metric-${campaignId}-${i}`,
      campaign_id: campaignId,
      metric_date: date,
      spend,
      impressions,
      reach,
      results,
      result_type: resultType,
      cost_per_result: costPerResult,
      roas,
      clicks,
      ctr: Math.round(ctr * 10000) / 10000,
      cpm,
    });
  }
  return metrics;
}

async function main() {
  // Get existing clients
  const { data: clients } = await db.from('clients').select('id, name').is('archived_at', null);
  console.log('Clients:', clients?.map(c => `${c.id}: ${c.name}`));

  // Get existing strategies + KPIs for linking
  const { data: strategies } = await db.from('strategies').select('id, client_id, name').is('archived_at', null);
  const { data: kpis } = await db.from('strategy_kpis').select('id, pillar_id, name').is('archived_at', null);
  const { data: pillars } = await db.from('strategy_pillars').select('id, strategy_id, name').is('archived_at', null);

  console.log('Strategies:', strategies?.map(s => `${s.id}: ${s.name} (${s.client_id})`));
  console.log('KPIs:', kpis?.slice(0, 10).map(k => `${k.id}: ${k.name}`));

  const happyDaysId = 'happy-days';
  const kPachoId = 'k-pacho';
  const refugeId = 'the-refuge';

  const baseDate = addDays(new Date().toISOString().split('T')[0], -30);

  // ── Campaigns ──────────────────────────────────────────────────────────────
  const campaigns = [
    // Happy Days
    {
      id: 'camp-hd-spring',
      client_id: happyDaysId,
      name: 'Spring Menu Launch',
      platform: 'Meta',
      status: 'active',
      objective: 'Lead Generation',
      daily_budget: 50,
      total_budget: 1500,
      start_date: addDays(baseDate, 0),
    },
    {
      id: 'camp-hd-weekend',
      client_id: happyDaysId,
      name: 'Weekend Specials',
      platform: 'Meta',
      status: 'active',
      objective: 'Conversions',
      daily_budget: 30,
      total_budget: 900,
      start_date: addDays(baseDate, 5),
    },
    {
      id: 'camp-hd-holiday',
      client_id: happyDaysId,
      name: 'Holiday Promotion',
      platform: 'Meta',
      status: 'ended',
      objective: 'Conversions',
      daily_budget: 40,
      total_budget: 560,
      start_date: addDays(baseDate, 0),
      end_date: addDays(new Date().toISOString().split('T')[0], -14),
    },
    // K. Pacho
    {
      id: 'camp-kp-opening',
      client_id: kPachoId,
      name: 'Grand Opening Awareness',
      platform: 'Meta',
      status: 'active',
      objective: 'Awareness',
      daily_budget: 75,
      total_budget: 2250,
      start_date: addDays(baseDate, 0),
    },
    {
      id: 'camp-kp-orders',
      client_id: kPachoId,
      name: 'Online Order Drive',
      platform: 'Meta',
      status: 'active',
      objective: 'Conversions',
      daily_budget: 40,
      total_budget: 1200,
      start_date: addDays(baseDate, 3),
    },
    // The Refuge
    {
      id: 'camp-tr-brand',
      client_id: refugeId,
      name: 'Brand Awareness',
      platform: 'Meta',
      status: 'active',
      objective: 'Awareness',
      daily_budget: 60,
      total_budget: 1800,
      start_date: addDays(baseDate, 0),
    },
    {
      id: 'camp-tr-events',
      client_id: refugeId,
      name: 'Events Promotion',
      platform: 'Meta',
      status: 'paused',
      objective: 'Lead Generation',
      daily_budget: 35,
      total_budget: 1050,
      start_date: addDays(baseDate, 0),
    },
  ];

  // Insert campaigns (upsert)
  const { error: campErr } = await db.from('ad_campaigns').upsert(campaigns, { onConflict: 'id' });
  if (campErr) { console.error('Campaign insert error:', campErr); return; }
  console.log(`Inserted ${campaigns.length} campaigns`);

  // ── Metrics ────────────────────────────────────────────────────────────────
  const allMetrics = [
    ...generateMetrics('camp-hd-spring', baseDate, { dailyBudget: 50, targetRoas: 3.2, resultType: 'leads', objective: 'Lead Generation' }),
    ...generateMetrics('camp-hd-weekend', addDays(baseDate, 5), { dailyBudget: 30, targetRoas: 2.8, resultType: 'purchases', objective: 'Conversions' }),
    ...generateMetrics('camp-hd-holiday', baseDate, { dailyBudget: 40, targetRoas: 2.5, resultType: 'purchases', objective: 'Conversions', endDate: addDays(new Date().toISOString().split('T')[0], -14) }),
    ...generateMetrics('camp-kp-opening', baseDate, { dailyBudget: 75, targetRoas: null, resultType: 'impressions', objective: 'Awareness' }),
    ...generateMetrics('camp-kp-orders', addDays(baseDate, 3), { dailyBudget: 40, targetRoas: 4.1, resultType: 'purchases', objective: 'Conversions' }),
    ...generateMetrics('camp-tr-brand', baseDate, { dailyBudget: 60, targetRoas: null, resultType: 'reach', objective: 'Awareness' }),
    ...generateMetrics('camp-tr-events', baseDate, { dailyBudget: 35, targetRoas: 2.1, resultType: 'leads', objective: 'Lead Generation' }),
  ];

  // Insert metrics in batches
  const batchSize = 50;
  for (let i = 0; i < allMetrics.length; i += batchSize) {
    const batch = allMetrics.slice(i, i + batchSize);
    const { error: metErr } = await db.from('ad_campaign_metrics').upsert(batch, { onConflict: 'campaign_id,metric_date' });
    if (metErr) { console.error('Metrics insert error:', metErr); return; }
  }
  console.log(`Inserted ${allMetrics.length} metric rows`);

  // ── KPI Links ─────────────────────────────────────────────────────────────
  // Find or create KPIs for Happy Days and K. Pacho
  
  // Find Happy Days strategy
  const hdStrategy = strategies?.find(s => s.client_id === happyDaysId);
  const kpStrategy = strategies?.find(s => s.client_id === kPachoId);
  
  console.log('HD Strategy:', hdStrategy);
  console.log('KP Strategy:', kpStrategy);

  // Find existing KPIs for Happy Days
  let hdKpiId = null;
  let kpKpiId = null;
  
  if (hdStrategy) {
    const hdPillars = pillars?.filter(p => p.strategy_id === hdStrategy.id) || [];
    const hdKpis = kpis?.filter(k => hdPillars.some(p => p.id === k.pillar_id)) || [];
    console.log('HD KPIs:', hdKpis.map(k => `${k.id}: ${k.name}`));
    
    // Use first KPI or create ROAS Target
    if (hdKpis.length > 0) {
      hdKpiId = hdKpis[0].id;
    } else if (hdPillars.length > 0) {
      // Create a ROAS Target KPI
      const { data: newKpi, error: kpiErr } = await db.from('strategy_kpis').insert({
        id: `kpi-roas-hd-${Date.now()}`,
        pillar_id: hdPillars[0].id,
        name: 'ROAS Target',
        target: 3.0,
        current: 3.2,
        unit: 'x',
      }).select().single();
      if (!kpiErr) hdKpiId = newKpi.id;
    }
  }

  if (!hdKpiId) {
    // Create a standalone KPI — need a pillar first
    // Check if any pillar exists for happy days
    const anyHdPillar = pillars?.find(p => {
      const s = strategies?.find(s => s.id === p.strategy_id);
      return s?.client_id === happyDaysId;
    });
    if (anyHdPillar) {
      const { data: newKpi } = await db.from('strategy_kpis').insert({
        id: `kpi-roas-hd-${Date.now()}`,
        pillar_id: anyHdPillar.id,
        name: 'ROAS Target',
        target: 3.0,
        current: 3.2,
        unit: 'x',
      }).select().single();
      if (newKpi) hdKpiId = newKpi.id;
    }
  }

  if (kpStrategy) {
    const kpPillars = pillars?.filter(p => p.strategy_id === kpStrategy.id) || [];
    const kpKpis = kpis?.filter(k => kpPillars.some(p => p.id === k.pillar_id)) || [];
    console.log('KP KPIs:', kpKpis.map(k => `${k.id}: ${k.name}`));
    
    // Look for "Monthly Leads" or create it
    const leadsKpi = kpKpis.find(k => k.name.toLowerCase().includes('lead'));
    if (leadsKpi) {
      kpKpiId = leadsKpi.id;
    } else if (kpPillars.length > 0) {
      const { data: newKpi } = await db.from('strategy_kpis').insert({
        id: `kpi-leads-kp-${Date.now()}`,
        pillar_id: kpPillars[0].id,
        name: 'Monthly Leads',
        target: 150,
        current: 0,
        unit: '',
      }).select().single();
      if (newKpi) kpKpiId = newKpi.id;
    }
  }

  console.log('HD KPI ID:', hdKpiId, '| KP KPI ID:', kpKpiId);

  // Insert KPI links
  const links = [];
  if (hdKpiId) {
    links.push({
      id: `link-hd-spring-roas`,
      campaign_id: 'camp-hd-spring',
      kpi_id: hdKpiId,
      metric_type: 'roas',
    });
  }
  if (kpKpiId) {
    links.push({
      id: `link-kp-orders-results`,
      campaign_id: 'camp-kp-orders',
      kpi_id: kpKpiId,
      metric_type: 'results',
    });
  }

  if (links.length > 0) {
    const { error: linkErr } = await db.from('campaign_kpi_links').upsert(links, { onConflict: 'id' });
    if (linkErr) console.error('KPI links error:', linkErr);
    else console.log(`Inserted ${links.length} KPI links`);
  }

  console.log('✅ Seed complete!');
}

main().catch(console.error);
