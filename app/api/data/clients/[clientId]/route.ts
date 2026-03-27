import { NextResponse } from 'next/server';
import { getClientPageData } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const data = await getClientPageData(clientId);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('API /api/data/clients/[clientId] error:', error);
    return NextResponse.json(
      { error: 'Failed to load client data' },
      { status: 500 }
    );
  }
}
