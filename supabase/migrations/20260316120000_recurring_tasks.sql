-- Recurring task templates
CREATE TABLE IF NOT EXISTS recurring_task_templates (
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
);

-- Enable RLS on recurring_task_templates
ALTER TABLE recurring_task_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON recurring_task_templates FOR ALL USING (true) WITH CHECK (true);

-- Link tasks to their recurring template
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_template_id TEXT REFERENCES recurring_task_templates(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_instance_date TEXT;
