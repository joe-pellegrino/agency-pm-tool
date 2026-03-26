-- Goals & Outcomes Architecture
-- Phase 1: Create four new tables

-- 1. client_goals
CREATE TABLE IF NOT EXISTS client_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_metric TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_goals_client ON client_goals(client_id);
ALTER TABLE client_goals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_goals' AND policyname = 'Allow all for anon') THEN
    CREATE POLICY "Allow all for anon" ON client_goals FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. goal_pillar_links (pillar_id is TEXT to match client_pillars.id)
CREATE TABLE IF NOT EXISTS goal_pillar_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES client_goals(id) ON DELETE CASCADE,
  pillar_id TEXT NOT NULL,
  UNIQUE(goal_id, pillar_id)
);
ALTER TABLE goal_pillar_links ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goal_pillar_links' AND policyname = 'Allow all for anon') THEN
    CREATE POLICY "Allow all for anon" ON goal_pillar_links FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. focus_areas (pillar_id is TEXT to match client_pillars.id)
CREATE TABLE IF NOT EXISTS focus_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pillar_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_focus_areas_pillar ON focus_areas(pillar_id);
CREATE INDEX IF NOT EXISTS idx_focus_areas_client ON focus_areas(client_id);
ALTER TABLE focus_areas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'focus_areas' AND policyname = 'Allow all for anon') THEN
    CREATE POLICY "Allow all for anon" ON focus_areas FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. outcomes (pillar_id is TEXT to match client_pillars.id)
CREATE TABLE IF NOT EXISTS outcomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  goal_id UUID REFERENCES client_goals(id) ON DELETE SET NULL,
  pillar_id TEXT,
  initiative_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  metric_value TEXT,
  period TEXT,
  evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_outcomes_client ON outcomes(client_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_goal ON outcomes(goal_id);
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outcomes' AND policyname = 'Allow all for anon') THEN
    CREATE POLICY "Allow all for anon" ON outcomes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
