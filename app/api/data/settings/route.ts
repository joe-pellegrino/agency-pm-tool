import { NextResponse } from 'next/server';
import { getSettingsData } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getSettingsData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('API /api/data/settings error:', error);
    return NextResponse.json({ error: 'Failed to load settings data' }, { status: 500 });
  }
}
