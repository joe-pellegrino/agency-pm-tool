import { NextResponse } from 'next/server';
import { getAssetsData } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getAssetsData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('API /api/data/assets error:', error);
    return NextResponse.json({ error: 'Failed to load assets data' }, { status: 500 });
  }
}
