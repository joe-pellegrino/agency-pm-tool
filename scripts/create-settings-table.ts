import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.AGENCY_PM_SERVICE_KEY!;

async function createSettingsTable() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Create the agency_settings table
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS agency_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          updated_at TIMESTAMPTZ DEFAULT now()
        );

        -- Create index on key for faster lookups
        CREATE INDEX IF NOT EXISTS idx_agency_settings_key ON agency_settings(key);

        -- Set up RLS policies
        ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

        -- Allow all authenticated users to read settings
        CREATE POLICY "Allow read access for authenticated users"
          ON agency_settings FOR SELECT
          USING (auth.role() = 'authenticated');

        -- Allow only authenticated users to update/insert settings
        CREATE POLICY "Allow write access for authenticated users"
          ON agency_settings FOR INSERT, UPDATE
          USING (auth.role() = 'authenticated');
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      return false;
    }

    console.log('✓ agency_settings table created successfully');
    return true;
  } catch (err) {
    // Fall back to direct SQL execution if rpc doesn't work
    console.log('RPC failed, trying direct SQL execution...');
    
    // Use the admin API directly with fetch
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              CREATE TABLE IF NOT EXISTS agency_settings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                key TEXT UNIQUE NOT NULL,
                value TEXT,
                updated_at TIMESTAMPTZ DEFAULT now()
              );
            `
          })
        }
      );

      if (!response.ok) {
        console.error('Failed to create table:', await response.text());
        return false;
      }

      console.log('✓ agency_settings table created successfully');
      return true;
    } catch (e) {
      console.error('Error:', e);
      return false;
    }
  }
}

createSettingsTable().then(success => {
  if (success) {
    console.log('Setup complete!');
    process.exit(0);
  } else {
    console.log('Setup failed. You may need to create the table manually in Supabase.');
    process.exit(1);
  }
});
