const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://najrksokhyyhqgokxbys.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanJrc29raHl5aHFnb2t4YnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwODg2NCwiZXhwIjoyMDg4OTg0ODY0fQ.Vwpjgt4OSqXwiFAYIoUQVbN41rQM6fkyIMLQ3KujF-E'
);

async function runMigration() {
  try {
    console.log('Attempting direct ALTER TABLE via Supabase...');
    
    // Use the query endpoint directly
    const response = await fetch('https://najrksokhyyhqgokxbys.supabase.co/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanJrc29raHl5aHFnb2t4YnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwODg2NCwiZXhwIjoyMDg4OTg0ODY0fQ.Vwpjgt4OSqXwiFAYIoUQVbN41rQM6fkyIMLQ3KujF-E',
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pillar_id TEXT REFERENCES strategy_pillars(id) ON DELETE SET NULL'
      })
    });
    
    const result = await response.json();
    console.log('Response:', result);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

runMigration();
