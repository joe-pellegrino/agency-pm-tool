import { NextResponse } from 'next/server';
import { getKBData } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getKBData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('API /api/data/kb error:', error);
    return NextResponse.json({ error: 'Failed to load KB data' }, { status: 500 });
  }
}
