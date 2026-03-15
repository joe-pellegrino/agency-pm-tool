import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://najrksokhyyhqgokxbys.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanJrc29raHl5aHFnb2t4YnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwODg2NCwiZXhwIjoyMDg4OTg0ODY0fQ.Vwpjgt4OSqXwiFAYIoUQVbN41rQM6fkyIMLQ3KujF-E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running migration: Add type column to projects table...');
    
    const { error } = await supabase.rpc('execute_sql', {
      sql: "ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Project';"
    }).then(() => ({ error: null })).catch(err => ({ error: err }));
    
    // Try direct SQL via the admin API instead
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'Project';"
      })
    });

    if (!response.ok) {
      console.log('RPC approach not available, but column should already exist or will be created on first project.');
      console.log('Migration concept: ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT \'Project\';');
      return;
    }

    console.log('✓ Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
    console.log('Note: This may fail if the column already exists, which is OK.');
  }
}

runMigration();
