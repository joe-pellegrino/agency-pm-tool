'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/client';

const db = () => createServerClient();

// ─── BILLING ──────────────────────────────────────────────────────────────────

export async function getClientBilling(clientId: string) {
  try {
    const { data, error } = await db()
      .from('client_billing')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching billing:', error);
    throw error;
  }
}

export async function upsertClientBilling(data: {
  clientId: string;
  monthly_retainer?: number;
  contract_start?: string;
  contract_end?: string;
  billing_contact_name?: string;
  billing_contact_email?: string;
  payment_terms?: string;
  notes?: string;
}) {
  try {
    const { clientId, ...rest } = data;

    const { error } = await db()
      .from('client_billing')
      .upsert({
        client_id: clientId,
        ...rest,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'client_id' });

    if (error) throw error;

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    console.error('Error upserting billing:', error);
    throw error;
  }
}

// ─── TEAM ASSIGNMENTS ─────────────────────────────────────────────────────────

export async function getClientTeamAssignments(clientId: string) {
  try {
    const { data, error } = await db()
      .from('client_team_assignments')
      .select('*')
      .eq('client_id', clientId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching team assignments:', error);
    throw error;
  }
}

export async function addClientTeamAssignment(data: {
  clientId: string;
  teamMemberId: string;
  role: string;
  isPrimary?: boolean;
}) {
  try {
    const { data: row, error } = await db()
      .from('client_team_assignments')
      .insert({
        client_id: data.clientId,
        team_member_id: data.teamMemberId,
        role: data.role,
        is_primary: data.isPrimary || false,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/clients/${data.clientId}`);
    return {
      id: row.id,
      client_id: row.client_id,
      team_member_id: row.team_member_id,
      teamMemberId: row.team_member_id,
      role: row.role,
      is_primary: row.is_primary,
      isPrimary: row.is_primary,
      created_at: row.created_at,
    };
  } catch (error) {
    console.error('Error adding team assignment:', error);
    throw error;
  }
}

export async function removeClientTeamAssignment(assignmentId: string) {
  try {
    const { error } = await db()
      .from('client_team_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) throw error;

    revalidatePath('/clients');
    return { success: true };
  } catch (error) {
    console.error('Error removing team assignment:', error);
    throw error;
  }
}

export async function updateClientTeamAssignmentRole(assignmentId: string, role: string) {
  try {
    const { error } = await db()
      .from('client_team_assignments')
      .update({ role })
      .eq('id', assignmentId);

    if (error) throw error;

    revalidatePath('/clients');
    return { success: true };
  } catch (error) {
    console.error('Error updating team assignment role:', error);
    throw error;
  }
}

export async function updateClientTeamAssignment(
  assignmentId: string,
  updates: { role?: string; isPrimary?: boolean }
) {
  try {
    const updateData: Record<string, any> = {};
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.isPrimary !== undefined) updateData.is_primary = updates.isPrimary;

    const { data, error } = await db()
      .from('client_team_assignments')
      .update(updateData)
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/clients');
    return {
      id: data.id,
      client_id: data.client_id,
      team_member_id: data.team_member_id,
      teamMemberId: data.team_member_id,
      role: data.role,
      is_primary: data.is_primary,
      isPrimary: data.is_primary,
      created_at: data.created_at,
    };
  } catch (error) {
    console.error('Error updating team assignment:', error);
    throw error;
  }
}

// ─── NOTIFICATION PREFERENCES ────────────────────────────────────────────────

export async function getClientNotificationPrefs(clientId: string) {
  try {
    const { data, error } = await db()
      .from('client_notification_prefs')
      .select('*')
      .eq('client_id', clientId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notification prefs:', error);
    throw error;
  }
}

export async function upsertClientNotificationPref(data: {
  clientId: string;
  teamMemberId: string;
  emailEnabled?: boolean;
  digestFrequency?: string;
}) {
  try {
    const { clientId, teamMemberId, emailEnabled, digestFrequency } = data;

    const { error } = await db()
      .from('client_notification_prefs')
      .upsert({
        client_id: clientId,
        team_member_id: teamMemberId,
        email_enabled: emailEnabled !== undefined ? emailEnabled : true,
        digest_frequency: digestFrequency || 'realtime',
      }, { onConflict: 'client_id,team_member_id' });

    if (error) throw error;

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    console.error('Error upserting notification pref:', error);
    throw error;
  }
}

// ─── PORTAL MAPPING ───────────────────────────────────────────────────────────

export async function getClientPortalMapping(clientId: string) {
  try {
    const { data, error } = await db()
      .from('client_portal_mapping')
      .select('portal_client_id')
      .eq('client_id', clientId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data?.portal_client_id || null;
  } catch (error) {
    console.error('Error fetching portal mapping:', error);
    throw error;
  }
}

export async function setClientPortalMapping(clientId: string, portalClientId: string) {
  try {
    const { error } = await db()
      .from('client_portal_mapping')
      .upsert({
        client_id: clientId,
        portal_client_id: portalClientId,
      }, { onConflict: 'client_id' });

    if (error) throw error;

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    console.error('Error setting portal mapping:', error);
    throw error;
  }
}
