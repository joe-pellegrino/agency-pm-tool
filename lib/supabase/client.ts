import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Use AGENCY_PM_SERVICE_KEY to avoid collision with system-level SUPABASE_SERVICE_ROLE_KEY
// which may belong to a different project
const supabaseServiceKey = process.env.AGENCY_PM_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Browser client (uses anon key — safe for client-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server client (uses service role key — bypasses RLS, server-side only)
export function createServerClient() {
  const key = supabaseServiceKey || supabaseAnonKey;
  return createClient(supabaseUrl, key);
}
