CREATE TABLE IF NOT EXISTS agency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_settings_key ON agency_settings(key);

ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access"
  ON agency_settings FOR ALL
  USING (true)
  WITH CHECK (true);
