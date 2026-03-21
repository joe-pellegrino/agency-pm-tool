import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = 'https://najrksokhyyhqgokxbys.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanJrc29raHl5aHFnb2t4YnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwODg2NCwiZXhwIjoyMDg4OTg0ODY0fQ.Vwpjgt4OSqXwiFAYIoUQVbN41rQM6fkyIMLQ3KujF-E';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function runMigration() {
  const migrationPath = path.join(__dirname, 'supabase/migrations/20260321000000_initiative_campaigns.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('📋 Applying migration: initiative_campaigns\n');
  
  // Split on semicolons and run each statement
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  // Try running as a block first via raw SQL
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    if (!error) {
      console.log('✅ Migration applied via exec_sql RPC');
      return;
    }
  } catch {
    // exec_sql not available, try statement by statement
  }

  // Run via REST API using pg query
  const url = `${supabaseUrl}/rest/v1/rpc/query`;
  
  for (const stmt of statements) {
    if (!stmt) continue;
    // Use the Supabase management API
    const resp = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
    });
  }

  // Alternative: use the pg endpoint directly
  // The Supabase JS client doesn't have direct SQL execution
  // Use the management API
  const projectRef = 'najrksokhyyhqgokxbys';
  
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: sqlContent }),
  });
  
  if (response.ok) {
    console.log('✅ Migration applied via management API');
    return;
  }

  // Last resort: try individual inserts/creates via supabase client
  // Check if table exists first
  const { data: tableCheck, error: tableErr } = await supabase
    .from('initiative_campaigns')
    .select('id')
    .limit(1);

  if (!tableErr) {
    console.log('✅ Table initiative_campaigns already exists');
    return;
  }

  console.error('❌ Could not apply migration automatically.');
  console.log('\nPlease run this SQL in your Supabase SQL editor:');
  console.log('https://supabase.com/dashboard/project/najrksokhyyhqgokxbys/sql\n');
  console.log(sqlContent);
}

runMigration().catch(console.error);
