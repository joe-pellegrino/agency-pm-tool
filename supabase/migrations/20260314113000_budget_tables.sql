-- Client budgets table
CREATE TABLE IF NOT EXISTS client_budgets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL REFERENCES clients(id),
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, year)
);

-- Budget rows (e.g., Paid Ads, SEO, Content)
CREATE TABLE IF NOT EXISTS budget_rows (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  budget_id TEXT NOT NULL REFERENCES client_budgets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Budget entries (monthly amounts per row)
CREATE TABLE IF NOT EXISTS budget_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  row_id TEXT NOT NULL REFERENCES budget_rows(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(row_id, month)
);

ALTER TABLE client_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='client_budgets' AND policyname='anon_all') THEN
    CREATE POLICY anon_all ON client_budgets FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='budget_rows' AND policyname='anon_all') THEN
    CREATE POLICY anon_all ON budget_rows FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='budget_entries' AND policyname='anon_all') THEN
    CREATE POLICY anon_all ON budget_entries FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
