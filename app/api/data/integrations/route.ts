import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { createPortalClient, ClientIntegration } from '@/lib/supabase/portal-client';

/**
 * GET /api/data/integrations?clientId=happy-days
 * 
 * Fetches integration data from the portal Supabase for a given client.
 * Returns connected platforms (Meta, GA4, GSC, Google Ads, JotForm, GBP)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId parameter required' },
        { status: 400 }
      );
    }

    // Get the portal client ID from client_portal_mapping
    const agencyClient = createServerClient();
    const { data: mapping, error: mappingError } = await agencyClient
      .from('client_portal_mapping')
      .select('portal_client_id')
      .eq('client_id', clientId)
      .single();

    if (mappingError || !mapping) {
      // No mapping yet; return empty integrations list
      return NextResponse.json({
        integrations: [],
        clientId,
        portalClientId: null,
      });
    }

    // Fetch integrations from portal
    const portalClient = createPortalClient();
    const { data: integrations, error: integrationsError } = await portalClient
      .from('client_integrations')
      .select('*')
      .eq('client_id', mapping.portal_client_id)
      .order('platform', { ascending: true });

    if (integrationsError) {
      console.error('Portal integration fetch error:', integrationsError);
      return NextResponse.json(
        { error: 'Failed to fetch integrations from portal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      integrations: integrations || [],
      clientId,
      portalClientId: mapping.portal_client_id,
    });
  } catch (error) {
    console.error('Integration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
