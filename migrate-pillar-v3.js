const fetch = require('node-fetch');

async function runMigration() {
  try {
    console.log('Attempting to add pillar_id column to tasks table...');
    
    const response = await fetch('https://najrksokhyyhqgokxbys.supabase.co/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanJrc29raHl5aHFnb2t4YnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwODg2NCwiZXhwIjoyMDg4OTg0ODY0fQ.Vwpjgt4OSqXwiFAYIoUQVbN41rQM6fkyIMLQ3KujF-E',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanJrc29raHl5aHFnb2t4YnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwODg2NCwiZXhwIjoyMDg4OTg0ODY0fQ.Vwpjgt4OSqXwiFAYIoUQVbN41rQM6fkyIMLQ3KujF-E'
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pillar_id TEXT REFERENCES strategy_pillars(id) ON DELETE SET NULL'
      })
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Result:', result);
    
    if (result.error) {
      console.log('Error:', result.error);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

runMigration();
