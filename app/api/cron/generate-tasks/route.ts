import { NextResponse } from 'next/server';
import { generateRecurringTaskInstances } from '@/lib/actions';

export async function GET(request: Request) {
  // Verify Vercel cron secret header in production
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const result = await generateRecurringTaskInstances();
    return NextResponse.json({ 
      success: true, 
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Cron error:', e);
    return NextResponse.json({ 
      error: (e as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
