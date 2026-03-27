import { NextResponse } from 'next/server';
import { getStrategiesData } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getStrategiesData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('API /api/data/strategies error:', error);
    return NextResponse.json({ error: 'Failed to load strategies data' }, { status: 500 });
  }
}
