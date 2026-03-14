const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://najrksokhyyhqgokxbys.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanJrc29raHl5aHFnb2t4YnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwODg2NCwiZXhwIjoyMDg4OTg0ODY0fQ.Vwpjgt4OSqXwiFAYIoUQVbN41rQM6fkyIMLQ3KujF-E';

const supabase = createClient(supabaseUrl, serviceKey);

async function test() {
  try {
    // Try to insert a test record
    const { data, error } = await supabase
      .from('agency_settings')
      .insert({
        key: 'logo_url_test',
        value: 'https://example.com/logo.png'
      })
      .select();

    if (error) {
      if (error.code === '42P01') {
        console.log('Table does not exist. Creating it now...');
        // The table doesn't exist, we need to create it
        process.exit(1);
      } else {
        console.error('Error:', error);
        process.exit(1);
      }
    } else {
      console.log('Success! Table exists and insert worked:', data);
      // Clean up test record
      await supabase
        .from('agency_settings')
        .delete()
        .eq('key', 'logo_url_test');
      process.exit(0);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

test();
