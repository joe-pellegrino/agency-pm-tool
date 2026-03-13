import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const creds = JSON.parse(readFileSync('/home/ubuntu/projects/agency-pm-tool/.supabase-credentials.json', 'utf8'));

const tables = [
  'tasks', 'clients', 'team_members', 'time_entries', 'assets',
  'projects', 'strategies', 'automations', 'client_services',
  'documents', 'comments', 'task_templates', 'workflow_templates',
  'service_strategies'
];

async function execSQL(sql) {
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
    throw new Error(`SQL failed (${resp.status}): ${text}`);
  }
  return text;
}

// Try adding columns one at a time
for (const tbl of tables) {
  try {
    const sql = `
      ALTER TABLE ${tbl} ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL DEFAULT NULL;
      CREATE INDEX IF NOT EXISTS idx_${tbl}_archived_at ON ${tbl} (archived_at) WHERE archived_at IS NULL;
    `;
    const result = await execSQL(sql);
    console.log(`✅ ${tbl}: ${result}`);
  } catch (e) {
    console.error(`❌ ${tbl}: ${e.message}`);
  }
}
