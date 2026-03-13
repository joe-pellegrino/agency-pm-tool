import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const creds = JSON.parse(readFileSync('/home/ubuntu/projects/agency-pm-tool/.supabase-credentials.json', 'utf8'));
const supabase = createClient(creds.url, creds.service_role_key);

const sql = `
CREATE TABLE IF NOT EXISTS document_folders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES document_folders(id),
  client_id TEXT REFERENCES clients(id),
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now(),
  archived_at TIMESTAMPTZ NULL
);
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'document_folders' AND policyname = 'anon_all'
  ) THEN
    CREATE POLICY "anon_all" ON document_folders FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id TEXT REFERENCES document_folders(id);
`;

// Try pg/query endpoint
const resp = await fetch(`${creds.url}/pg/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': creds.service_role_key,
    'Authorization': `Bearer ${creds.service_role_key}`,
  },
  body: JSON.stringify({ query: sql }),
});

const text = await resp.text();
if (!resp.ok) {
  console.error('pg/query failed:', text);
  // Try management API
  const resp2 = await fetch(`https://api.supabase.com/v1/projects/${creds.project_ref}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${creds.service_role_key}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  const text2 = await resp2.text();
  if (!resp2.ok) {
    console.error('Management API also failed:', text2);
    process.exit(1);
  }
  console.log('Migration via management API:', text2);
} else {
  console.log('Migration via pg/query:', text);
}
