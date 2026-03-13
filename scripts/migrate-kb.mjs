import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const creds = JSON.parse(readFileSync('/home/ubuntu/projects/agency-pm-tool/.supabase-credentials.json', 'utf8'));
const supabase = createClient(creds.url, creds.service_role_key);

const sql = `
ALTER TABLE documents ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'client';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS yjs_state TEXT;

CREATE TABLE IF NOT EXISTS kb_categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  archived_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS kb_articles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  content JSONB,
  yjs_state TEXT,
  category_id TEXT REFERENCES kb_categories(id),
  tags TEXT[] DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'all')),
  author_id TEXT REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  archived_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS kb_article_versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  article_id TEXT NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
  content JSONB,
  author_id TEXT REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  summary TEXT
);

ALTER TABLE kb_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_article_versions ENABLE ROW LEVEL SECURITY;

ALTER TABLE comments ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS document_id TEXT REFERENCES documents(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kb_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_author ON kb_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_kb_article_versions_article ON kb_article_versions(article_id);
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
