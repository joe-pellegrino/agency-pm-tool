#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.AGENCY_PM_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Error: Missing environment variables. Please ensure .env.local contains NEXT_PUBLIC_SUPABASE_URL and AGENCY_PM_SERVICE_KEY');
  process.exit(1);
}

async function setupDatabase() {
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });

  try {
    console.log('Creating agency_settings table...');

    // Execute raw SQL
    const { error } = await supabase.rpc('query_database', {
      sql: `
        CREATE TABLE IF NOT EXISTS agency_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          updated_at TIMESTAMPTZ DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_agency_settings_key ON agency_settings(key);

        ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Allow read access for authenticated users" ON agency_settings;
        DROP POLICY IF EXISTS "Allow write access for authenticated users" ON agency_settings;

        CREATE POLICY "Allow read access for authenticated users"
          ON agency_settings FOR SELECT
          USING (auth.role() = 'authenticated');

        CREATE POLICY "Allow write access for authenticated users"
          ON agency_settings FOR INSERT, UPDATE
          USING (auth.role() = 'authenticated');
      `
    });

    if (error) {
      console.error('Error from RPC:', error);
      console.log('\nAttempting alternative approach...');
      
      // Try using the table directly
      const { data, error: checkError } = await supabase
        .from('agency_settings')
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (checkError && checkError.code === '42P01') {
        console.log('Table does not exist. Please create it manually in Supabase SQL Editor with this query:');
        console.log(`
        CREATE TABLE IF NOT EXISTS agency_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          updated_at TIMESTAMPTZ DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_agency_settings_key ON agency_settings(key);

        ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Allow read access for authenticated users"
          ON agency_settings FOR SELECT
          USING (auth.role() = 'authenticated');

        CREATE POLICY "Allow write access for authenticated users"
          ON agency_settings FOR INSERT, UPDATE
          USING (auth.role() = 'authenticated');
        `);
      } else {
        console.log('✓ Table already exists or is accessible');
      }
    } else {
      console.log('✓ Successfully set up agency_settings table');
    }
  } catch (err) {
    console.error('Error:', err.message);
    console.log('\nPlease create the table manually in Supabase with the SQL above');
    process.exit(1);
  }
}

setupDatabase();
