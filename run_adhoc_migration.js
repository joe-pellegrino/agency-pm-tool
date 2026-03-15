import { createClient } from '@supabase/supabase-js';

const url = 'https://najrksokhyyhqgokxbys.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanJrc29raHl5aHFnb2t4YnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwODg2NCwiZXhwIjoyMDg4OTg0ODY0fQ.Vwpjgt4OSqXwiFAYIoUQVbN41rQM6fkyIMLQ3KujF-E';

const db = createClient(url, serviceKey);

async function runMigration() {
  try {
    console.log('Running migration to add is_adhoc and request_notes columns...');
    
    // Try to add the columns
    const { error } = await db.rpc('exec_sql', {
      query: `
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_adhoc INTEGER NOT NULL DEFAULT 0 CHECK (is_adhoc IN (0, 1));
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS request_notes TEXT NOT NULL DEFAULT '';
      `
    });

    if (error) {
      // If rpc doesn't work, try direct SQL
      console.log('RPC method failed, trying direct approach...');
      console.log('Please run these SQL commands in Supabase directly:');
      console.log(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_adhoc INTEGER NOT NULL DEFAULT 0 CHECK (is_adhoc IN (0, 1));
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS request_notes TEXT NOT NULL DEFAULT '';
      `);
    } else {
      console.log('✓ Migration completed successfully');
    }
  } catch (err) {
    console.error('Migration error:', err);
    console.log('Please run these SQL commands in Supabase SQL editor:');
    console.log(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_adhoc INTEGER NOT NULL DEFAULT 0 CHECK (is_adhoc IN (0, 1));
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS request_notes TEXT NOT NULL DEFAULT '';
    `);
  }
}

runMigration();
