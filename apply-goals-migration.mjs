import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://najrksokhyyhqgokxbys.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanJrc29raHl5aHFnb2t4YnlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQwODg2NCwiZXhwIjoyMDg4OTg0ODY0fQ.Vwpjgt4OSqXwiFAYIoUQVbN41rQM6fkyIMLQ3KujF-E';
const projectRef = 'najrksokhyyhqgokxbys';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const SQL_STATEMENTS = [
  // client_goals
  `CREATE TABLE IF NOT EXISTS client_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_metric TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_client_goals_client ON client_goals(client_id)`,
  `ALTER TABLE client_goals ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'client_goals' AND policyname = 'Allow all for anon'
    ) THEN
      CREATE POLICY "Allow all for anon" ON client_goals FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END $$`,

  // goal_pillar_links
  `CREATE TABLE IF NOT EXISTS goal_pillar_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES client_goals(id) ON DELETE CASCADE,
    pillar_id UUID NOT NULL REFERENCES client_pillars(id) ON DELETE CASCADE,
    UNIQUE(goal_id, pillar_id)
  )`,
  `ALTER TABLE goal_pillar_links ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'goal_pillar_links' AND policyname = 'Allow all for anon'
    ) THEN
      CREATE POLICY "Allow all for anon" ON goal_pillar_links FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END $$`,

  // focus_areas
  `CREATE TABLE IF NOT EXISTS focus_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pillar_id UUID NOT NULL REFERENCES client_pillars(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_focus_areas_pillar ON focus_areas(pillar_id)`,
  `CREATE INDEX IF NOT EXISTS idx_focus_areas_client ON focus_areas(client_id)`,
  `ALTER TABLE focus_areas ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'focus_areas' AND policyname = 'Allow all for anon'
    ) THEN
      CREATE POLICY "Allow all for anon" ON focus_areas FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END $$`,

  // outcomes
  `CREATE TABLE IF NOT EXISTS outcomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id TEXT NOT NULL,
    goal_id UUID REFERENCES client_goals(id) ON DELETE SET NULL,
    pillar_id UUID REFERENCES client_pillars(id) ON DELETE SET NULL,
    initiative_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    metric_value TEXT,
    period TEXT,
    evidence_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_outcomes_client ON outcomes(client_id)`,
  `CREATE INDEX IF NOT EXISTS idx_outcomes_goal ON outcomes(goal_id)`,
  `ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY`,
  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'outcomes' AND policyname = 'Allow all for anon'
    ) THEN
      CREATE POLICY "Allow all for anon" ON outcomes FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END $$`,
];

async function runViaManagementAPI(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  return response;
}

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .limit(1);
  return !error;
}

async function runMigration() {
  console.log('🚀 Starting Goals & Outcomes migration\n');

  // Check if tables already exist
  const goalsExists = await checkTableExists('client_goals');
  const focusExists = await checkTableExists('focus_areas');
  const outcomesExists = await checkTableExists('outcomes');
  const linksExists = await checkTableExists('goal_pillar_links');

  if (goalsExists && focusExists && outcomesExists && linksExists) {
    console.log('✅ All tables already exist. Migration skipped.');
    return;
  }

  console.log('Tables to create:');
  if (!goalsExists) console.log('  • client_goals');
  if (!linksExists) console.log('  • goal_pillar_links');
  if (!focusExists) console.log('  • focus_areas');
  if (!outcomesExists) console.log('  • outcomes');
  console.log('');

  // Try management API
  const fullSQL = SQL_STATEMENTS.join(';\n') + ';';
  
  let managementSuccess = false;
  try {
    const resp = await runViaManagementAPI(fullSQL);
    if (resp.ok) {
      managementSuccess = true;
      console.log('✅ Migration applied via Supabase Management API');
    } else {
      const body = await resp.text();
      console.log(`ℹ️  Management API returned ${resp.status}: ${body.substring(0, 200)}`);
    }
  } catch (err) {
    console.log(`ℹ️  Management API error: ${err.message}`);
  }

  if (!managementSuccess) {
    // Try exec_sql RPC
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: fullSQL });
      if (!error) {
        console.log('✅ Migration applied via exec_sql RPC');
        managementSuccess = true;
      }
    } catch {}
  }

  if (!managementSuccess) {
    // Run via pg REST API
    for (const stmt of SQL_STATEMENTS) {
      if (!stmt.trim()) continue;
      const trimmed = stmt.trim();
      
      // Skip if it's a complex statement with dollar quoting - log it
      if (trimmed.includes('$')) {
        console.log(`⚠️  Skipping complex statement (requires SQL editor):\n${trimmed.substring(0, 100)}...`);
        continue;
      }

      try {
        const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql: trimmed }),
        });
        if (resp.ok) {
          console.log(`✅ ${trimmed.substring(0, 60)}...`);
        }
      } catch {}
    }
    
    console.log('\n⚠️  Automatic migration may be incomplete.');
    console.log('If tables are missing, run this SQL in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/najrksokhyyhqgokxbys/sql\n');
    console.log(fullSQL);
  }

  // Verify
  console.log('\nVerifying tables...');
  const results = await Promise.all([
    checkTableExists('client_goals'),
    checkTableExists('goal_pillar_links'),
    checkTableExists('focus_areas'),
    checkTableExists('outcomes'),
  ]);
  
  const names = ['client_goals', 'goal_pillar_links', 'focus_areas', 'outcomes'];
  results.forEach((exists, i) => {
    console.log(`  ${exists ? '✅' : '❌'} ${names[i]}`);
  });
  
  const allExist = results.every(Boolean);
  if (allExist) {
    console.log('\n🎉 All tables verified successfully!');
  } else {
    console.log('\n⚠️  Some tables may not exist yet. Check Supabase dashboard.');
    process.exit(1);
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
