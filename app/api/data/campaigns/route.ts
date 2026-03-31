import { NextResponse } from 'next/server';
import { getCampaignsData } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getCampaignsData();
    return NextResponse.json(data);
  } catch (err) {
    console.error('/api/data/campaigns error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
