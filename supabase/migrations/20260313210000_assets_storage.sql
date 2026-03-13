-- Add storage columns to assets table for Supabase Storage integration
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS storage_url TEXT;
