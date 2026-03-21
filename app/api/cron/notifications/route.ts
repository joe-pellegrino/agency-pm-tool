import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { createNotification } from '@/app/actions/notifications';

const db = () => createServerClient();

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrowStr = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  let dueSoonCount = 0;
  let overdueCount = 0;
  let kpiCount = 0;

  try {
    // ─── Due Soon (tasks due tomorrow) ──────────────────────────────────────
    const { data: dueSoonTasks } = await db()
      .from('tasks')
      .select('id, title, assignee_id, client_id, due_date')
      .eq('due_date', tomorrowStr)
      .not('status', 'in', '("Done","Complete","done","complete","Closed")')
      .is('archived_at', null);

    for (const task of dueSoonTasks ?? []) {
      if (!task.assignee_id) continue;
      await createNotification(
        task.assignee_id,
        'task_due_soon',
        '⏰ Task Due Tomorrow',
        `"${task.title}" is due tomorrow (${tomorrowStr}).`,
        `/kanban?task=${task.id}`,
        { taskId: task.id, dueDate: task.due_date }
      );
      dueSoonCount++;
    }

    // ─── Due Today ───────────────────────────────────────────────────────────
    const { data: dueTodayTasks } = await db()
      .from('tasks')
      .select('id, title, assignee_id, client_id, due_date')
      .eq('due_date', todayStr)
      .not('status', 'in', '("Done","Complete","done","complete","Closed")')
      .is('archived_at', null);

    for (const task of dueTodayTasks ?? []) {
      if (!task.assignee_id) continue;
      await createNotification(
        task.assignee_id,
        'task_due_soon',
        '🔔 Task Due Today',
        `"${task.title}" is due today!`,
        `/kanban?task=${task.id}`,
        { taskId: task.id, dueDate: task.due_date }
      );
      dueSoonCount++;
    }

    // ─── Overdue ─────────────────────────────────────────────────────────────
    const { data: overdueTasks } = await db()
      .from('tasks')
      .select('id, title, assignee_id, due_date')
      .lt('due_date', todayStr)
      .not('status', 'in', '("Done","Complete","done","complete","Closed")')
      .is('archived_at', null);

    for (const task of overdueTasks ?? []) {
      if (!task.assignee_id) continue;

      // Avoid spamming — only send if no overdue notification in last 24h
      const { data: recent } = await db()
        .from('notifications')
        .select('id')
        .eq('user_id', task.assignee_id)
        .eq('type', 'task_overdue')
        .contains('metadata', { taskId: task.id })
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (recent && recent.length > 0) continue; // already notified

      await createNotification(
        task.assignee_id,
        'task_overdue',
        '🚨 Task Overdue',
        `"${task.title}" was due on ${task.due_date} and is still not complete.`,
        `/kanban?task=${task.id}`,
        { taskId: task.id, dueDate: task.due_date }
      );
      overdueCount++;
    }

    // ─── KPI Target Hit ──────────────────────────────────────────────────────
    const { data: kpis } = await db()
      .from('client_pillar_kpis')
      .select('id, name, current, target, client_pillar_id, client_pillar:client_pillar_id(client_id)')
      .gt('current', 0);

    for (const kpi of kpis ?? []) {
      if (!kpi.target || !kpi.current) continue;
      if (Number(kpi.current) < Number(kpi.target)) continue;

      // @ts-expect-error: nested join
      const clientId = kpi.client_pillar?.client_id;
      if (!clientId) continue;

      // Avoid repeated KPI hit notifications
      const { data: recent } = await db()
        .from('notifications')
        .select('id')
        .eq('type', 'kpi_target_hit')
        .contains('metadata', { kpiId: kpi.id })
        .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (recent && recent.length > 0) continue;

      // Get client owner
      const { data: client } = await db()
        .from('clients')
        .select('owner_id')
        .eq('id', clientId)
        .single();
      if (!client?.owner_id) continue;

      await createNotification(
        client.owner_id,
        'kpi_target_hit',
        '🎯 KPI Target Reached!',
        `"${kpi.name}" has reached its target of ${kpi.target} (current: ${kpi.current}).`,
        `/clients/${clientId}`,
        { kpiId: kpi.id, clientId }
      );
      kpiCount++;
    }

    return NextResponse.json({
      success: true,
      dueSoon: dueSoonCount,
      overdue: overdueCount,
      kpiHits: kpiCount,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error('Notification cron error:', err);
    return NextResponse.json(
      { error: (err as Error).message, timestamp: now.toISOString() },
      { status: 500 }
    );
  }
}
