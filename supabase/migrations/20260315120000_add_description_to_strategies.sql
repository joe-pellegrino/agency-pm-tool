-- Add description column to strategies table
ALTER TABLE strategies ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
