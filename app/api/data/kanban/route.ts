import { NextResponse } from 'next/server';
import { getKanbanData } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getKanbanData();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('API /api/data/kanban error:', error);
    return NextResponse.json({ error: 'Failed to load kanban data' }, { status: 500 });
  }
}
