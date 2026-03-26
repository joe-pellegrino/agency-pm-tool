'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/client';
import type { ClientGoal, GoalPillarLink, FocusArea, Outcome } from '@/lib/data';

const db = () => createServerClient();

// ─── CLIENT GOALS ─────────────────────────────────────────────────────────────

export async function getClientGoals(clientId: string): Promise<ClientGoal[]> {
  const { data, error } = await db()
    .from('client_goals')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((r) => ({
    id: r.id as string,
    clientId: r.client_id as string,
    title: r.title as string,
    description: (r.description as string) || null,
    targetMetric: (r.target_metric as string) || null,
    status: r.status as ClientGoal['status'],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));
}

export async function createClientGoal(data: {
  clientId: string;
  title: string;
  description?: string | null;
  targetMetric?: string | null;
  status?: 'active' | 'achieved' | 'archived';
}): Promise<ClientGoal> {
  const { data: row, error } = await db()
    .from('client_goals')
    .insert({
      client_id: data.clientId,
      title: data.title,
      description: data.description || null,
      target_metric: data.targetMetric || null,
      status: data.status || 'active',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${data.clientId}`);
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    title: row.title as string,
    description: (row.description as string) || null,
    targetMetric: (row.target_metric as string) || null,
    status: row.status as ClientGoal['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function updateClientGoal(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    targetMetric: string | null;
    status: 'active' | 'achieved' | 'archived';
  }>
): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.targetMetric !== undefined) update.target_metric = data.targetMetric;
  if (data.status !== undefined) update.status = data.status;

  const { error } = await db().from('client_goals').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/clients');
}

export async function deleteClientGoal(id: string, clientId: string): Promise<void> {
  const { error } = await db().from('client_goals').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
}

// ─── GOAL PILLAR LINKS ────────────────────────────────────────────────────────

export async function getGoalPillarLinks(clientId: string): Promise<GoalPillarLink[]> {
  // Join via client_goals to filter by client
  const { data, error } = await db()
    .from('goal_pillar_links')
    .select('*, client_goals!inner(client_id)')
    .eq('client_goals.client_id', clientId);

  if (error) throw new Error(error.message);
  return (data || []).map((r) => ({
    id: r.id as string,
    goalId: r.goal_id as string,
    pillarId: r.pillar_id as string,
  }));
}

export async function linkGoalToPillar(goalId: string, pillarId: string): Promise<void> {
  const { error } = await db()
    .from('goal_pillar_links')
    .insert({ goal_id: goalId, pillar_id: pillarId });

  if (error && !error.message.includes('duplicate')) throw new Error(error.message);
  revalidatePath('/clients');
  revalidatePath('/strategy');
}

export async function unlinkGoalFromPillar(goalId: string, pillarId: string): Promise<void> {
  const { error } = await db()
    .from('goal_pillar_links')
    .delete()
    .eq('goal_id', goalId)
    .eq('pillar_id', pillarId);

  if (error) throw new Error(error.message);
  revalidatePath('/clients');
  revalidatePath('/strategy');
}

// ─── FOCUS AREAS ─────────────────────────────────────────────────────────────

export async function getFocusAreas(pillarId: string): Promise<FocusArea[]> {
  const { data, error } = await db()
    .from('focus_areas')
    .select('*')
    .eq('pillar_id', pillarId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((r) => ({
    id: r.id as string,
    pillarId: r.pillar_id as string,
    clientId: r.client_id as string,
    name: r.name as string,
    description: (r.description as string) || null,
    status: r.status as FocusArea['status'],
    createdAt: r.created_at as string,
  }));
}

export async function getFocusAreasByClient(clientId: string): Promise<FocusArea[]> {
  const { data, error } = await db()
    .from('focus_areas')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((r) => ({
    id: r.id as string,
    pillarId: r.pillar_id as string,
    clientId: r.client_id as string,
    name: r.name as string,
    description: (r.description as string) || null,
    status: r.status as FocusArea['status'],
    createdAt: r.created_at as string,
  }));
}

export async function createFocusArea(data: {
  pillarId: string;
  clientId: string;
  name: string;
  description?: string | null;
  status?: 'active' | 'archived';
}): Promise<FocusArea> {
  const { data: row, error } = await db()
    .from('focus_areas')
    .insert({
      pillar_id: data.pillarId,
      client_id: data.clientId,
      name: data.name,
      description: data.description || null,
      status: data.status || 'active',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${data.clientId}`);
  return {
    id: row.id as string,
    pillarId: row.pillar_id as string,
    clientId: row.client_id as string,
    name: row.name as string,
    description: (row.description as string) || null,
    status: row.status as FocusArea['status'],
    createdAt: row.created_at as string,
  };
}

export async function updateFocusArea(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    status: 'active' | 'archived';
  }>
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;
  if (data.status !== undefined) update.status = data.status;

  const { error } = await db().from('focus_areas').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/clients');
}

export async function deleteFocusArea(id: string, clientId: string): Promise<void> {
  const { error } = await db().from('focus_areas').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
}

// ─── OUTCOMES ─────────────────────────────────────────────────────────────────

export async function getOutcomes(clientId: string): Promise<Outcome[]> {
  const { data, error } = await db()
    .from('outcomes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((r) => ({
    id: r.id as string,
    clientId: r.client_id as string,
    goalId: (r.goal_id as string) || null,
    pillarId: (r.pillar_id as string) || null,
    initiativeId: (r.initiative_id as string) || null,
    title: r.title as string,
    description: (r.description as string) || null,
    metricValue: (r.metric_value as string) || null,
    period: (r.period as string) || null,
    evidenceUrl: (r.evidence_url as string) || null,
    createdAt: r.created_at as string,
  }));
}

export async function createOutcome(data: {
  clientId: string;
  goalId?: string | null;
  pillarId?: string | null;
  initiativeId?: string | null;
  title: string;
  description?: string | null;
  metricValue?: string | null;
  period?: string | null;
  evidenceUrl?: string | null;
}): Promise<Outcome> {
  const { data: row, error } = await db()
    .from('outcomes')
    .insert({
      client_id: data.clientId,
      goal_id: data.goalId || null,
      pillar_id: data.pillarId || null,
      initiative_id: data.initiativeId || null,
      title: data.title,
      description: data.description || null,
      metric_value: data.metricValue || null,
      period: data.period || null,
      evidence_url: data.evidenceUrl || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${data.clientId}`);
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    goalId: (row.goal_id as string) || null,
    pillarId: (row.pillar_id as string) || null,
    initiativeId: (row.initiative_id as string) || null,
    title: row.title as string,
    description: (row.description as string) || null,
    metricValue: (row.metric_value as string) || null,
    period: (row.period as string) || null,
    evidenceUrl: (row.evidence_url as string) || null,
    createdAt: row.created_at as string,
  };
}

export async function updateOutcome(
  id: string,
  data: Partial<{
    goalId: string | null;
    pillarId: string | null;
    initiativeId: string | null;
    title: string;
    description: string | null;
    metricValue: string | null;
    period: string | null;
    evidenceUrl: string | null;
  }>
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.goalId !== undefined) update.goal_id = data.goalId;
  if (data.pillarId !== undefined) update.pillar_id = data.pillarId;
  if (data.initiativeId !== undefined) update.initiative_id = data.initiativeId;
  if (data.metricValue !== undefined) update.metric_value = data.metricValue;
  if (data.period !== undefined) update.period = data.period;
  if (data.evidenceUrl !== undefined) update.evidence_url = data.evidenceUrl;

  const { error } = await db().from('outcomes').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/clients');
}

export async function deleteOutcome(id: string, clientId: string): Promise<void> {
  const { error } = await db().from('outcomes').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`);
}
