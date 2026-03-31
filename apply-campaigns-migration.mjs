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
  const migrationPath = path.join(__dirname, 'supabase/migrations/20260331_create_campaigns_table.sql');
  const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log('📋 Applying migration: campaigns table\n');

  // Try Supabase Management API (project-level SQL execution)
  const projectRef = 'najrksokhyyhqgokxbys';
  
  // Get management API token from env or try service key
  const mgmtToken = process.env.SUPABASE_ACCESS_TOKEN || supabaseServiceKey;
  
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mgmtToken}`,
    },
    body: JSON.stringify({ query: sqlContent }),
  });
  
  if (response.ok) {
    console.log('✅ Migration applied via management API');
    return;
  }
  
  const errText = await response.text();
  console.log('Management API response:', response.status, errText);

  // Fallback: check if table already exists
  const { data: tableCheck, error: tableErr } = await supabase
    .from('campaigns')
    .select('id')
    .limit(1);

  if (!tableErr) {
    console.log('✅ Table campaigns already exists - migration not needed');
    return;
  }

  console.error('❌ Could not apply migration automatically.');
  console.log('\nPlease run this SQL in your Supabase SQL editor:');
  console.log('https://supabase.com/dashboard/project/najrksokhyyhqgokxbys/sql\n');
  console.log(sqlContent);
  process.exit(1);
}

runMigration().catch(console.error);
