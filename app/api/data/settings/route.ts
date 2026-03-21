import { NextResponse } from 'next/server';
import { getSettingsData } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getSettingsData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('API /api/data/settings error:', error);
    return NextResponse.json({ error: 'Failed to load settings data' }, { status: 500 });
  }
}
