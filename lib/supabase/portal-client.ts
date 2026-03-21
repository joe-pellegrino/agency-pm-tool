import { createClient } from '@supabase/supabase-js';

/**
 * Portal Supabase client (read-only connection to rj-client-portal)
 * Used to fetch integration data without duplicating tables
 */
export const createPortalClient = () => {
  const portalUrl = process.env.PORTAL_SUPABASE_URL;
  const portalServiceKey = process.env.PORTAL_SUPABASE_SERVICE_KEY;

  if (!portalUrl || !portalServiceKey) {
    throw new Error(
      'Portal Supabase credentials not configured. ' +
      'Set PORTAL_SUPABASE_URL and PORTAL_SUPABASE_SERVICE_KEY in .env.local'
    );
  }

  return createClient(portalUrl, portalServiceKey, {
    auth: {
      persistSession: false,
    },
  });
};

export type ClientIntegration = {
  id: string;
  client_id: string;
  platform: 'meta' | 'ga4' | 'gsc' | 'google_ads' | 'jotform' | 'gbp';
  status: 'connected' | 'pending' | 'error' | 'disconnected';
  credentials: Record<string, any>;
  account_config: Record<string, any>;
  connected_at?: string;
  last_sync_at?: string;
  sync_error?: string;
};
