-- Initiative ↔ Campaign linking table
-- Stores links between initiatives and portal Meta campaign IDs
-- Note: campaign_id references portal's Meta campaign ID (stored as text, no FK)

CREATE TABLE IF NOT EXISTS initiative_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  initiative_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'meta',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(initiative_id, campaign_id)
);

ALTER TABLE initiative_campaigns ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='initiative_campaigns' AND policyname='anon read initiative_campaigns') THEN
    CREATE POLICY "anon read initiative_campaigns" ON initiative_campaigns FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='initiative_campaigns' AND policyname='anon write initiative_campaigns') THEN
    CREATE POLICY "anon write initiative_campaigns" ON initiative_campaigns FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;
