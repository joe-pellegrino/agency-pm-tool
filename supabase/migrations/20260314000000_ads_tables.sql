-- Ad campaigns table
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL REFERENCES clients(id),
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'Meta',
  status TEXT NOT NULL DEFAULT 'active', -- active | paused | ended
  objective TEXT,
  daily_budget NUMERIC(12,2),
  total_budget NUMERIC(12,2),
  start_date DATE,
  end_date DATE,
  external_campaign_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Campaign metrics (one row per campaign per date)
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

-- Link campaigns to KPIs for auto-updating KPI progress
CREATE TABLE IF NOT EXISTS campaign_kpi_links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT NOT NULL REFERENCES ad_campaigns(id),
  kpi_id TEXT NOT NULL REFERENCES strategy_kpis(id),
  metric_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, kpi_id)
);

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_kpi_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ad_campaigns' AND policyname='anon_all') THEN
    CREATE POLICY anon_all ON ad_campaigns FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ad_campaign_metrics' AND policyname='anon_all') THEN
    CREATE POLICY anon_all ON ad_campaign_metrics FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='campaign_kpi_links' AND policyname='anon_all') THEN
    CREATE POLICY anon_all ON campaign_kpi_links FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
