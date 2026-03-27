import { NextResponse } from 'next/server';
import { getDocumentsData } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getDocumentsData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('API /api/data/documents error:', error);
    return NextResponse.json({ error: 'Failed to load documents data' }, { status: 500 });
  }
}
