-- Create agency_settings table for storing configuration like logo URL
CREATE TABLE IF NOT EXISTS agency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups by key
CREATE INDEX IF NOT EXISTS idx_agency_settings_key ON agency_settings(key);

-- Enable row level security
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY IF NOT EXISTS "Allow authenticated read"
  ON agency_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update settings
CREATE POLICY IF NOT EXISTS "Allow authenticated insert/update"
  ON agency_settings FOR INSERT, UPDATE
  USING (auth.role() = 'authenticated');
