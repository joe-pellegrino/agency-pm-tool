import { NextResponse } from 'next/server';
import { getServicesData } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getServicesData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('API /api/data/services error:', error);
    return NextResponse.json({ error: 'Failed to load services data' }, { status: 500 });
  }
}
