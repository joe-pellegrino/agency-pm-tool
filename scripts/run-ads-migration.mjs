import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://najrksokhyyhqgokxbys.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanJrc29raHl5aHFnb2t4YnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwODg2NCwiZXhwIjoyMDg4OTg0ODY0fQ.Vwpjgt4OSqXwiFAYIoUQVbN41rQM6fkyIMLQ3KujF-E';

const db = createClient(SUPABASE_URL, SERVICE_KEY);

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL error: ${text}`);
  }
  return res.json().catch(() => null);
}

// Use Supabase SQL via the pg REST endpoint
async function execSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
  });
}

// Actually let's use the Supabase client with rpc
async function main() {
  console.log('Running ads migration...');

  // Create tables via Supabase SQL API
  const migrationSQL = `
-- Ad campaigns table
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL REFERENCES clients(id),
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'Meta',
  status TEXT NOT NULL DEFAULT 'active',
  objective TEXT,
  daily_budget NUMERIC(12,2),
  total_budget NUMERIC(12,2),
  start_date DATE,
  end_date DATE,
  external_campaign_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Campaign metrics
CREATE TABLE IF NOT EXISTS ad_campaign_metrics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT NOT NULL REFERENCES ad_campaigns(id),
  metric_date DATE NOT NULL,
  spend NUMERIC(12,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  results INTEGER DEFAULT 0,
  result_type TEXT DEFAULT 'leads',
  cost_per_result NUMERIC(12,2),
  roas NUMERIC(8,2),
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC(8,4),
  cpm NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, metric_date)
);

-- Campaign KPI links
CREATE TABLE IF NOT EXISTS campaign_kpi_links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT NOT NULL REFERENCES ad_campaigns(id),
  kpi_id TEXT NOT NULL REFERENCES strategy_kpis(id),
  metric_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, kpi_id)
);

-- RLS policies
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_kpi_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "anon_all" ON ad_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "anon_all" ON ad_campaign_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "anon_all" ON campaign_kpi_links FOR ALL USING (true) WITH CHECK (true);
`;

  const pgRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'GET',
    headers: { 'apikey': SERVICE_KEY },
  });
  
  // Use the direct postgres connection via management API
  const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/najrksokhyyhqgokxbys/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: migrationSQL }),
  });
  
  if (mgmtRes.ok) {
    console.log('Migration via management API succeeded');
  } else {
    const errText = await mgmtRes.text();
    console.log('Management API failed:', errText);
    console.log('Trying alternative approach...');
  }
}

main().catch(console.error);
