-- Campaigns table for Monday.com-style campaign board
-- Local campaign records, optionally linked to portal meta_ad_insights

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY DEFAULT 'camp-' || gen_random_uuid()::text,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'meta',
  status TEXT NOT NULL DEFAULT 'draft',
  objective TEXT,
  owner_id TEXT,
  start_date DATE,
  end_date DATE,
  daily_budget NUMERIC(10,2),
  total_budget NUMERIC(10,2),
  notes TEXT,
  portal_campaign_id TEXT,
  initiative_id TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_client ON campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='campaigns' AND policyname='anon read campaigns'
  ) THEN
    CREATE POLICY "anon read campaigns" ON campaigns FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='campaigns' AND policyname='anon write campaigns'
  ) THEN
    CREATE POLICY "anon write campaigns" ON campaigns FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaigns_updated_at_trigger ON campaigns;
CREATE TRIGGER campaigns_updated_at_trigger
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_campaigns_updated_at();
