import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Browser client (uses anon key — safe for client-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server client (uses service role key — bypasses RLS, server-side only)
export function createServerClient() {
  const key = supabaseServiceKey || supabaseAnonKey;
  return createClient(supabaseUrl, key);
}
