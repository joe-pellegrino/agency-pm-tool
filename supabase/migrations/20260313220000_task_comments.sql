-- Add task_id column to comments table for task-level comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE;

-- Index for fast lookup by task
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
