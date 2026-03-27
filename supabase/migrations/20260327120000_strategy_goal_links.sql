-- Strategy ↔ Goal Links (real persisted relationship)

CREATE TABLE IF NOT EXISTS strategy_goal_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id TEXT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES client_goals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(strategy_id, goal_id)
);

CREATE INDEX IF NOT EXISTS idx_strategy_goal_links_strategy ON strategy_goal_links(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_goal_links_goal ON strategy_goal_links(goal_id);

ALTER TABLE strategy_goal_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'strategy_goal_links' AND policyname = 'Allow all for anon') THEN
    CREATE POLICY "Allow all for anon" ON strategy_goal_links FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
