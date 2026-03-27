import { NextResponse } from 'next/server';
import { getAllData } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getAllData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('API /api/data error:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
