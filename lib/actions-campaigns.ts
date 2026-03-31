'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/client';
import type { Campaign, CampaignStatus, CampaignPlatform, CampaignPriority } from '@/lib/data';

const db = () => createServerClient();

export interface CreateCampaignInput {
  clientId: string;
  name: string;
  platform?: CampaignPlatform;
  status?: CampaignStatus;
  objective?: string | null;
  ownerId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  dailyBudget?: number | null;
  totalBudget?: number | null;
  notes?: string | null;
  portalCampaignId?: string | null;
  initiativeId?: string | null;
  priority?: CampaignPriority;
  tags?: string[];
}

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {
  id: string;
}

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const supabase = db();

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      client_id: input.clientId,
      name: input.name,
      platform: input.platform ?? 'meta',
      status: input.status ?? 'draft',
      objective: input.objective ?? null,
      owner_id: input.ownerId ?? null,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      daily_budget: input.dailyBudget ?? null,
      total_budget: input.totalBudget ?? null,
      notes: input.notes ?? null,
      portal_campaign_id: input.portalCampaignId ?? null,
      initiative_id: input.initiativeId ?? null,
      priority: input.priority ?? 'medium',
      tags: input.tags ?? [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/campaigns');

  return toCampaign(data as Record<string, unknown>);
}

export async function updateCampaign(input: UpdateCampaignInput): Promise<Campaign> {
  const supabase = db();

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.clientId !== undefined) patch.client_id = input.clientId;
  if (input.platform !== undefined) patch.platform = input.platform;
  if (input.status !== undefined) patch.status = input.status;
  if (input.objective !== undefined) patch.objective = input.objective;
  if (input.ownerId !== undefined) patch.owner_id = input.ownerId;
  if (input.startDate !== undefined) patch.start_date = input.startDate;
  if (input.endDate !== undefined) patch.end_date = input.endDate;
  if (input.dailyBudget !== undefined) patch.daily_budget = input.dailyBudget;
  if (input.totalBudget !== undefined) patch.total_budget = input.totalBudget;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.portalCampaignId !== undefined) patch.portal_campaign_id = input.portalCampaignId;
  if (input.initiativeId !== undefined) patch.initiative_id = input.initiativeId;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.tags !== undefined) patch.tags = input.tags;

  const { data, error } = await supabase
    .from('campaigns')
    .update(patch)
    .eq('id', input.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/campaigns');

  return toCampaign(data as Record<string, unknown>);
}

export async function deleteCampaign(id: string): Promise<void> {
  const supabase = db();

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/campaigns');
}

export async function updateCampaignStatus(id: string, status: CampaignStatus): Promise<Campaign> {
  return updateCampaign({ id, status });
}

// ─── Transform helper ─────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

function toCampaign(r: Row): Campaign {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    name: r.name as string,
    platform: (r.platform as Campaign['platform']) || 'meta',
    status: (r.status as Campaign['status']) || 'draft',
    objective: (r.objective as string) || null,
    ownerId: (r.owner_id as string) || null,
    startDate: (r.start_date as string) || null,
    endDate: (r.end_date as string) || null,
    dailyBudget: r.daily_budget != null ? Number(r.daily_budget) : null,
    totalBudget: r.total_budget != null ? Number(r.total_budget) : null,
    notes: (r.notes as string) || null,
    portalCampaignId: (r.portal_campaign_id as string) || null,
    initiativeId: (r.initiative_id as string) || null,
    priority: (r.priority as Campaign['priority']) || 'medium',
    tags: (r.tags as string[]) || [],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
