-- Add focus_area_id column to projects table
-- This enables the Pillar → Focus Area → Initiative hierarchy
ALTER TABLE projects ADD COLUMN focus_area_id UUID REFERENCES focus_areas(id) ON DELETE SET NULL;

-- Create index for efficient queries
CREATE INDEX idx_projects_focus_area_id ON projects(focus_area_id);
