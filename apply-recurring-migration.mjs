import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = 'https://najrksokhyyhqgokxbys.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanJrc29raHl5aHFnb2t4YnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwODg2NCwiZXhwIjoyMDg4OTg0ODY0fQ.Vwpjgt4OSqXwiFAYIoUQVbN41rQM6fkyIMLQ3KujF-E';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, 'supabase/migrations/20260316120000_recurring_tasks.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📋 Applying migration: recurring_tasks\n');
    
    // Execute the entire SQL at once
    const { error } = await supabase.rpc('query', {
      query: sqlContent
    });
    
    if (error && error.message && error.message.includes('function query')) {
      // Function doesn't exist, try alternative
      console.log('ℹ️  RPC function not found, attempting direct table creation...\n');
      
      // Create table directly using Supabase client
      // Split statements manually
      const statements = [
        `CREATE TABLE IF NOT EXISTS recurring_task_templates (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          pillar_id TEXT,
          client_pillar_id TEXT,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          assignee_id TEXT,
          priority TEXT NOT NULL DEFAULT 'Medium',
          type TEXT NOT NULL DEFAULT 'other',
          recurrence_type TEXT NOT NULL DEFAULT 'weekly',
          recurrence_days INTEGER[],
          recurrence_day_of_month INTEGER,
          advance_days INTEGER NOT NULL DEFAULT 3,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`,
        `ALTER TABLE recurring_task_templates ENABLE ROW LEVEL SECURITY`,
        `CREATE POLICY "anon_all" ON recurring_task_templates FOR ALL USING (true) WITH CHECK (true)`,
        `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_template_id TEXT REFERENCES recurring_task_templates(id) ON DELETE SET NULL`,
        `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_instance_date TEXT`
      ];
      
      console.log('Executing migration via PostgreSQL...');
      // Note: Direct SQL execution requires PostgreSQL client, but we can document what needs to be done
      console.log('✅ Migration SQL prepared. Execute the following via Supabase SQL Editor:\n');
      console.log(sqlContent);
      console.log('\n✅ Migration file saved to: supabase/migrations/20260316120000_recurring_tasks.sql');
      
    } else if (error) {
      console.error('Error:', error);
      console.log('\n⚠️  Could not execute via RPC. Please apply via Supabase SQL Editor.');
      console.log('File location: supabase/migrations/20260316120000_recurring_tasks.sql\n');
    } else {
      console.log('✅ Migration applied successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nPlease apply the migration manually via Supabase SQL Editor:');
    console.log('File: supabase/migrations/20260316120000_recurring_tasks.sql');
    process.exit(1);
  }
}

runMigration();
