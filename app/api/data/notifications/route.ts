import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || 'default-user';

    const db = createServerClient();
    const { data, error } = await db
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json(data ?? [], {
      headers: {
        // Short cache — notifications should be fairly fresh
        'Cache-Control': 's-maxage=10, stale-while-revalidate=20',
      },
    });
  } catch (error) {
    console.error('API /api/data/notifications error:', error);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}
