const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://najrksokhyyhqgokxbys.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanJrc29raHl5aHFnb2t4YnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwODg2NCwiZXhwIjoyMDg4OTg0ODY0fQ.Vwpjgt4OSqXwiFAYIoUQVbN41rQM6fkyIMLQ3KujF-E'
);

async function runMigration() {
  try {
    console.log('Running migration to add pillar_id to tasks...');
    
    // Try using rpc
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pillar_id TEXT REFERENCES strategy_pillars(id) ON DELETE SET NULL'
    });
    
    if (error) {
      console.error('RPC method error. The column may already exist or the function does not exist.');
      console.log('Checking if column exists...');
      
      // Try to fetch a task to see if pillar_id exists
      const { data: checkData, error: checkError } = await supabase
        .from('tasks')
        .select('*')
        .limit(1);
      
      if (checkError) {
        console.error('Error checking tasks table:', checkError);
      } else if (checkData && checkData.length > 0) {
        console.log('Task structure:', Object.keys(checkData[0]));
        if ('pillar_id' in checkData[0]) {
          console.log('✓ Column pillar_id already exists!');
        } else {
          console.log('✗ Column pillar_id does not exist yet');
        }
      }
    } else {
      console.log('✓ Migration completed successfully:', data);
    }
  } catch (err) {
    console.error('Migration script error:', err.message);
  }
}

runMigration();
