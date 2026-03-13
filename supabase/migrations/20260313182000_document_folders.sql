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
CREATE POLICY "anon_all" ON document_folders FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id TEXT REFERENCES document_folders(id);
