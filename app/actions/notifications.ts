'use server';

import { createServerClient } from '@/lib/supabase/client';
import { sendNotificationEmail } from '@/lib/email';

const db = () => createServerClient();

export type NotificationType =
  | 'task_assigned'
  | 'task_status_changed'
  | 'task_comment'
  | 'mention'
  | 'approval_requested'
  | 'approval_decision'
  | 'dependency_unblocked'
  | 'task_due_soon'
  | 'task_overdue'
  | 'recurring_task_created'
  | 'new_task_on_client'
  | 'initiative_status_changed'
  | 'initiative_completed'
  | 'milestone_reached'
  | 'adhoc_request'
  | 'kpi_target_hit'
  | 'document_shared'
  | 'document_updated'
  | 'document_comment'
  | 'strategy_published'
  | 'team_member_added'
  | 'asset_uploaded';

// ── Preference types ──────────────────────────────────────────────────────────
// Stored JSONB supports both legacy `boolean` and new `{ inApp, email }` format.
// The helpers below normalise on read.

export interface NotificationPrefValue {
  inApp: boolean;
  email: boolean;
}

export type NotificationPreferences = {
  [K in NotificationType]?: NotificationPrefValue | boolean;
};

// Normalise a raw pref value (boolean or object) → { inApp, email }
function normaliseEntry(raw: boolean | NotificationPrefValue | undefined): NotificationPrefValue {
  if (raw === undefined) return { inApp: true, email: true };
  if (typeof raw === 'boolean') return { inApp: raw, email: true };
  return { inApp: raw.inApp ?? true, email: raw.email ?? true };
}

// ── DB helpers ────────────────────────────────────────────────────────────────

export async function checkNotificationPreference(
  userId: string,
  type: NotificationType
): Promise<{ inApp: boolean; email: boolean }> {
  try {
    const { data } = await db()
      .from('notification_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single();

    if (!data) return { inApp: true, email: true };
    const prefs = (data.preferences ?? {}) as Record<string, boolean | NotificationPrefValue>;
    return normaliseEntry(prefs[type]);
  } catch {
    return { inApp: true, email: true };
  }
}

// ── Agency branding (logo + name) for emails ──────────────────────────────────
async function getAgencyBranding(): Promise<{ logoUrl: string; agencyName: string }> {
  try {
    const { data } = await db()
      .from('agency_settings')
      .select('key, value')
      .in('key', ['logo_light_url', 'agency_name']);

    const map: Record<string, string> = {};
    (data ?? []).forEach((r: { key: string; value: string }) => { map[r.key] = r.value; });
    return {
      logoUrl: map['logo_light_url'] ?? '',
      agencyName: map['agency_name'] ?? 'RJ Media',
    };
  } catch {
    return { logoUrl: '', agencyName: 'RJ Media' };
  }
}

// ── Core create ───────────────────────────────────────────────────────────────

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  if (!userId) return null;

  // Check preferences
  const pref = await checkNotificationPreference(userId, type);
  if (!pref.inApp && !pref.email) return null;

  let notifId: string | null = null;

  if (pref.inApp) {
    const { data, error } = await db()
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link: link || null,
        metadata: metadata || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('createNotification error:', error.message);
    } else {
      notifId = data?.id ?? null;
    }
  }

  // Send email if enabled
  if (pref.email) {
    try {
      // Look up user email from team_members
      const { data: member } = await db()
        .from('team_members')
        .select('email')
        .eq('id', userId)
        .single();

      const userEmail = member?.email as string | null | undefined;

      if (userEmail) {
        const { logoUrl, agencyName } = await getAgencyBranding();
        await sendNotificationEmail(
          userEmail,
          title,
          type,
          title,
          message,
          link ?? null,
          logoUrl,
          agencyName
        ).catch(() => {});
      }
    } catch {
      // best-effort, never throws
    }
  }

  return notifId;
}

// ── Other actions (unchanged) ─────────────────────────────────────────────────

export async function markAsRead(notificationId: string): Promise<void> {
  await db().from('notifications').update({ read: true }).eq('id', notificationId);
}

export async function markAllAsRead(userId: string): Promise<void> {
  await db()
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}

export async function getNotifications(
  userId: string,
  limit = 20,
  offset = 0
): Promise<import('./notifications').NotificationRow[]> {
  const { data, error } = await db()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('getNotifications error:', error.message);
    return [];
  }
  return (data ?? []) as import('./notifications').NotificationRow[];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await db()
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) return 0;
  return count ?? 0;
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const { data } = await db()
    .from('notification_preferences')
    .select('preferences')
    .eq('user_id', userId)
    .single();

  return (data?.preferences ?? {}) as NotificationPreferences;
}

export async function saveNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
): Promise<void> {
  await db()
    .from('notification_preferences')
    .upsert(
      { user_id: userId, preferences, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}
