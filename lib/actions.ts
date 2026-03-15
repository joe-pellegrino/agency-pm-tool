'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/client';

const db = () => createServerClient();

// ─── TASKS ────────────────────────────────────────────────────────────────────

export async function createTask(data: {
  title: string;
  clientId: string;
  assigneeId: string;
  status: string;
  priority: string;
  dueDate: string;
  startDate: string;
  endDate: string;
  type?: string;
  description?: string;
  isMilestone?: boolean;
  pillarId?: string | null;
  isAdhoc?: boolean;
  requestNotes?: string;
}) {
  const { error, data: row } = await db()
    .from('tasks')
    .insert({
      id: `task-${Date.now()}`,
      title: data.title,
      client_id: data.clientId,
      assignee_id: data.assigneeId,
      status: data.status,
      priority: data.priority,
      due_date: data.dueDate,
      start_date: data.startDate,
      end_date: data.endDate,
      type: data.type || 'other',
      description: data.description || '',
      is_milestone: data.isMilestone || false,
      pillar_id: data.pillarId || null,
      is_adhoc: data.isAdhoc ? 1 : 0,
      request_notes: data.requestNotes || '',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/kanban');
  revalidatePath('/projects');
  return row;
}

export async function updateTask(id: string, data: Partial<{
  title: string;
  clientId: string;
  assigneeId: string;
  status: string;
  priority: string;
  dueDate: string;
  startDate: string;
  endDate: string;
  type: string;
  description: string;
  isMilestone: boolean;
  pillarId: string | null;
  isAdhoc: boolean;
  requestNotes: string;
}>) {
  const update: Record<string, unknown> = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.clientId !== undefined) update.client_id = data.clientId;
  if (data.assigneeId !== undefined) update.assignee_id = data.assigneeId;
  if (data.status !== undefined) update.status = data.status;
  if (data.priority !== undefined) update.priority = data.priority;
  if (data.dueDate !== undefined) update.due_date = data.dueDate;
  if (data.startDate !== undefined) update.start_date = data.startDate;
  if (data.endDate !== undefined) update.end_date = data.endDate;
  if (data.type !== undefined) update.type = data.type;
  if (data.description !== undefined) update.description = data.description;
  if (data.isMilestone !== undefined) update.is_milestone = data.isMilestone;
  if (data.pillarId !== undefined) update.pillar_id = data.pillarId;
  if (data.isAdhoc !== undefined) update.is_adhoc = data.isAdhoc ? 1 : 0;
  if (data.requestNotes !== undefined) update.request_notes = data.requestNotes;

  const { error } = await db().from('tasks').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kanban');
  revalidatePath('/projects');
}

export async function updateTaskStatus(id: string, status: string) {
  const { error } = await db().from('tasks').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kanban');
}

export async function archiveTask(id: string) {
  const { error } = await db()
    .from('tasks')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kanban');
  revalidatePath('/projects');
}

export async function addTaskDependency(taskId: string, dependsOnId: string) {
  const { error } = await db()
    .from('task_dependencies')
    .insert({ task_id: taskId, depends_on_id: dependsOnId });
  if (error && !error.message.includes('duplicate')) throw new Error(error.message);
  revalidatePath('/kanban');
}

export async function removeTaskDependency(taskId: string, dependsOnId: string) {
  const { error } = await db()
    .from('task_dependencies')
    .delete()
    .eq('task_id', taskId)
    .eq('depends_on_id', dependsOnId);
  if (error) throw new Error(error.message);
  revalidatePath('/kanban');
}

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

export async function createClient(data: {
  name: string;
  industry: string;
  location: string;
  color: string;
  logo: string;
}) {
  const id = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now();
  const { error, data: row } = await db()
    .from('clients')
    .insert({ id, ...data })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/clients');
  return row;
}

export async function updateClient(id: string, data: Partial<{
  name: string;
  industry: string;
  location: string;
  color: string;
  logo: string;
}>) {
  const { error } = await db().from('clients').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/clients');
}

export async function archiveClient(id: string) {
  const now = new Date().toISOString();
  // Cascade archive: tasks, projects, client_services
  await db().from('tasks').update({ archived_at: now }).eq('client_id', id).is('archived_at', null);
  await db().from('projects').update({ archived_at: now }).eq('client_id', id).is('archived_at', null);
  await db().from('client_services').update({ archived_at: now }).eq('client_id', id).is('archived_at', null);
  const { error } = await db().from('clients').update({ archived_at: now }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/clients');
  revalidatePath('/kanban');
}

// ─── TEAM MEMBERS ─────────────────────────────────────────────────────────────

export async function createTeamMember(data: {
  name: string;
  role: string;
  initials: string;
  color: string;
}) {
  const id = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
  const { error, data: row } = await db()
    .from('team_members')
    .insert({ id, ...data, is_owner: false })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
  return row;
}

export async function updateTeamMember(id: string, data: Partial<{
  name: string;
  role: string;
  initials: string;
  color: string;
}>) {
  const { error } = await db().from('team_members').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function archiveTeamMember(id: string, reassignToId?: string) {
  if (reassignToId) {
    await db().from('tasks').update({ assignee_id: reassignToId }).eq('assignee_id', id).is('archived_at', null);
  }
  const { error } = await db()
    .from('team_members')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
  revalidatePath('/kanban');
}

// ─── TIME ENTRIES ────────────────────────────────────────────────────────────

export async function createTimeEntry(data: {
  taskId: string;
  clientId: string;
  memberId: string;
  date: string;
  durationMinutes: number;
  note?: string;
}) {
  const { error, data: row } = await db()
    .from('time_entries')
    .insert({
      id: `te-${Date.now()}`,
      task_id: data.taskId,
      client_id: data.clientId,
      member_id: data.memberId,
      date: data.date,
      duration_minutes: data.durationMinutes,
      note: data.note || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/kanban');
  return row;
}

export async function updateTimeEntry(id: string, data: Partial<{
  date: string;
  durationMinutes: number;
  note: string;
}>) {
  const update: Record<string, unknown> = {};
  if (data.date !== undefined) update.date = data.date;
  if (data.durationMinutes !== undefined) update.duration_minutes = data.durationMinutes;
  if (data.note !== undefined) update.note = data.note;
  const { error } = await db().from('time_entries').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kanban');
}

export async function archiveTimeEntry(id: string) {
  const { error } = await db()
    .from('time_entries')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kanban');
}

// ─── ASSETS ──────────────────────────────────────────────────────────────────

export async function createAsset(data: {
  clientId: string;
  filename: string;
  fileType: string;
  uploadedBy: string;
  size: string;
  tags: string[];
}) {
  const id = `asset-${Date.now()}`;
  const { error } = await db()
    .from('assets')
    .insert({
      id,
      client_id: data.clientId,
      filename: data.filename,
      file_type: data.fileType,
      upload_date: new Date().toISOString().split('T')[0],
      uploaded_by: data.uploadedBy,
      size: data.size,
      color: '#6366f1',
    });
  if (error) throw new Error(error.message);

  // Insert tags
  if (data.tags.length > 0) {
    await db().from('asset_tags').insert(data.tags.map(tag => ({ asset_id: id, tag })));
  }

  revalidatePath('/assets');
  return id;
}

export async function updateAsset(id: string, data: {
  filename?: string;
  fileType?: string;
  size?: string;
  tags?: string[];
}) {
  if (data.filename || data.fileType || data.size) {
    const update: Record<string, unknown> = {};
    if (data.filename) update.filename = data.filename;
    if (data.fileType) update.file_type = data.fileType;
    if (data.size) update.size = data.size;
    const { error } = await db().from('assets').update(update).eq('id', id);
    if (error) throw new Error(error.message);
  }

  if (data.tags !== undefined) {
    await db().from('asset_tags').delete().eq('asset_id', id);
    if (data.tags.length > 0) {
      await db().from('asset_tags').insert(data.tags.map(tag => ({ asset_id: id, tag })));
    }
  }

  revalidatePath('/assets');
}

export async function archiveAsset(id: string) {
  const { error } = await db()
    .from('assets')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/assets');
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

export async function createProject(data: {
  clientId: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  workflowTemplateId?: string;
  strategyId?: string;
  pillarId?: string;
  type?: string;
}) {
  const id = `proj-${Date.now()}`;
  const { error } = await db()
    .from('projects')
    .insert({
      id,
      client_id: data.clientId,
      name: data.name,
      description: data.description,
      status: data.status,
      start_date: data.startDate,
      end_date: data.endDate,
      progress: 0,
      workflow_template_id: data.workflowTemplateId || null,
      strategy_id: data.strategyId || null,
      pillar_id: data.pillarId || null,
    });
  if (error) throw new Error(error.message);
  revalidatePath('/initiatives');
  return id;
}

export async function updateProject(id: string, data: Partial<{
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
  workflowTemplateId: string;
  strategyId: string;
  pillarId: string;
  type: string;
}>) {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;
  if (data.status !== undefined) update.status = data.status;
  if (data.startDate !== undefined) update.start_date = data.startDate;
  if (data.endDate !== undefined) update.end_date = data.endDate;
  if (data.progress !== undefined) update.progress = data.progress;
  if (data.workflowTemplateId !== undefined) update.workflow_template_id = data.workflowTemplateId;
  if (data.strategyId !== undefined) update.strategy_id = data.strategyId;
  if (data.pillarId !== undefined) update.pillar_id = data.pillarId;
  // type column: pending DB migration (ALTER TABLE projects ADD COLUMN type TEXT NOT NULL DEFAULT 'Project')
  const { error } = await db().from('projects').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/initiatives');
}

export async function archiveProject(id: string) {
  const { error } = await db()
    .from('projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/projects');
}

export async function linkTaskToProject(projectId: string, taskId: string) {
  const { error } = await db()
    .from('project_task_links')
    .insert({ project_id: projectId, task_id: taskId });
  if (error && !error.message.includes('duplicate')) throw new Error(error.message);
  revalidatePath('/projects');
}

export async function unlinkTaskFromProject(projectId: string, taskId: string) {
  const { error } = await db()
    .from('project_task_links')
    .delete()
    .eq('project_id', projectId)
    .eq('task_id', taskId);
  if (error) throw new Error(error.message);
  revalidatePath('/projects');
}

// ─── STRATEGIES ───────────────────────────────────────────────────────────────

export async function createStrategy(data: {
  clientId: string;
  name: string;
  description?: string;
  quarter: string;
  startDate: string;
  endDate: string;
  status: string;
}) {
  const id = `strat-${Date.now()}`;
  const { error } = await db()
    .from('strategies')
    .insert({
      id,
      client_id: data.clientId,
      name: data.name,
      description: data.description ?? '',
      quarter: data.quarter,
      start_date: data.startDate,
      end_date: data.endDate,
      status: data.status,
    });
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
  return id;
}

export async function updateStrategy(id: string, data: Partial<{
  name: string;
  description: string;
  quarter: string;
  startDate: string;
  endDate: string;
  status: string;
}>) {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;
  if (data.quarter !== undefined) update.quarter = data.quarter;
  if (data.startDate !== undefined) update.start_date = data.startDate;
  if (data.endDate !== undefined) update.end_date = data.endDate;
  if (data.status !== undefined) update.status = data.status;
  const { error } = await db().from('strategies').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
}

export async function archiveStrategy(id: string) {
  const { error } = await db()
    .from('strategies')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
}

export async function createStrategyPillar(strategyId: string, data: { name: string; description?: string }) {
  const id = `pillar-${Date.now()}`;
  const { error } = await db()
    .from('strategy_pillars')
    .insert({ id, strategy_id: strategyId, name: data.name, description: data.description || '' });
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
  return id;
}

export async function updateStrategyPillar(id: string, data: { name?: string; description?: string }) {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;
  const { error } = await db()
    .from('strategy_pillars')
    .update(update)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
}

export async function archiveStrategyPillar(id: string) {
  const now = new Date().toISOString();
  // Archive KPIs first
  await db().from('strategy_kpis').update({ archived_at: now }).eq('pillar_id', id).is('archived_at', null);
  const { error } = await db().from('strategy_pillars').update({ archived_at: now }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
}

export async function deleteStrategyPillar(id: string) {
  // Delete KPIs first
  await db().from('strategy_kpis').delete().eq('pillar_id', id);
  const { error } = await db().from('strategy_pillars').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
}

export async function createStrategyKPI(pillarId: string, data: {
  name: string;
  target: number;
  current: number;
  unit: string;
}) {
  const id = `kpi-${Date.now()}`;
  const { error } = await db()
    .from('strategy_kpis')
    .insert({ id, pillar_id: pillarId, ...data });
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
  return id;
}

export async function updateStrategyKPI(id: string, data: Partial<{
  name: string;
  target: number;
  current: number;
  unit: string;
}>) {
  const { error } = await db().from('strategy_kpis').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
}

export async function archiveStrategyKPI(id: string) {
  const { error } = await db()
    .from('strategy_kpis')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
}

export async function deleteStrategyKPI(id: string) {
  const { error } = await db().from('strategy_kpis').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
}

// ─── AUTOMATIONS ──────────────────────────────────────────────────────────────

export async function createAutomation(data: {
  clientId: string;
  templateId: string;
  frequency: string;
  assigneeId: string;
  status: string;
  nextRunDate: string;
}) {
  const id = `auto-${Date.now()}`;
  const { error } = await db()
    .from('automations')
    .insert({
      id,
      client_id: data.clientId,
      template_id: data.templateId,
      frequency: data.frequency,
      assignee_id: data.assigneeId,
      status: data.status,
      next_run_date: data.nextRunDate,
      last_run_date: new Date().toISOString().split('T')[0],
    });
  if (error) throw new Error(error.message);
  revalidatePath('/automations');
  return id;
}

export async function updateAutomation(id: string, data: Partial<{
  frequency: string;
  assigneeId: string;
  status: string;
  nextRunDate: string;
}>) {
  const update: Record<string, unknown> = {};
  if (data.frequency !== undefined) update.frequency = data.frequency;
  if (data.assigneeId !== undefined) update.assignee_id = data.assigneeId;
  if (data.status !== undefined) update.status = data.status;
  if (data.nextRunDate !== undefined) update.next_run_date = data.nextRunDate;
  const { error } = await db().from('automations').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/automations');
}

export async function archiveAutomation(id: string) {
  const { error } = await db()
    .from('automations')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/automations');
}

// ─── CLIENT SERVICES ──────────────────────────────────────────────────────────

// Check-then-insert/update: prevents duplicates when re-assigning a service
export async function upsertClientService(data: {
  clientId: string;
  serviceId: string;
  status: string;
  startDate: string;
  monthlyCadence?: string;
  linkedStrategyId?: string;
}) {
  // Check for existing (including cancelled)
  const { data: existing } = await db()
    .from('client_services')
    .select('id')
    .eq('client_id', data.clientId)
    .eq('service_id', data.serviceId)
    .is('archived_at', null)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const update: Record<string, unknown> = {
      status: data.status,
      start_date: data.startDate,
    };
    if (data.monthlyCadence !== undefined) update.monthly_cadence = data.monthlyCadence || null;
    if (data.linkedStrategyId !== undefined) update.linked_strategy_id = data.linkedStrategyId || null;
    const { error } = await db().from('client_services').update(update).eq('id', existing.id);
    if (error) throw new Error(error.message);
    revalidatePath('/services');
    revalidatePath('/clients');
    return existing.id;
  }

  return createClientService(data);
}

export async function createClientService(data: {
  clientId: string;
  serviceId: string;
  status: string;
  startDate: string;
  monthlyCadence?: string;
  linkedStrategyId?: string;
}) {
  const id = `cs-${Date.now()}`;
  const { error } = await db()
    .from('client_services')
    .insert({
      id,
      client_id: data.clientId,
      service_id: data.serviceId,
      status: data.status,
      start_date: data.startDate,
      monthly_cadence: data.monthlyCadence || null,
      linked_strategy_id: data.linkedStrategyId || null,
    });
  if (error) throw new Error(error.message);
  revalidatePath('/services');
  revalidatePath('/clients');
  return id;
}

export async function updateClientService(id: string, data: Partial<{
  status: string;
  startDate: string;
  monthlyCadence: string;
  linkedStrategyId: string;
}>) {
  const update: Record<string, unknown> = {};
  if (data.status !== undefined) update.status = data.status;
  if (data.startDate !== undefined) update.start_date = data.startDate;
  if (data.monthlyCadence !== undefined) update.monthly_cadence = data.monthlyCadence;
  if (data.linkedStrategyId !== undefined) update.linked_strategy_id = data.linkedStrategyId;
  const { error } = await db().from('client_services').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/services');
}

export async function archiveClientService(id: string) {
  const { error } = await db()
    .from('client_services')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/services');
}

export async function removeClientService(id: string) {
  // Delete linked service_strategies (cascades to pillars + kpis via FK ON DELETE CASCADE)
  const { data: ss } = await db()
    .from('service_strategies')
    .select('id')
    .eq('client_service_id', id);

  if (ss && ss.length > 0) {
    const ssIds = ss.map((r: { id: string }) => r.id);
    // Delete kpis and pillars explicitly (in case cascade not set)
    await db().from('service_strategy_kpis').delete().in('service_strategy_id', ssIds);
    await db().from('service_strategy_pillars').delete().in('service_strategy_id', ssIds);
    await db().from('service_strategies').delete().in('id', ssIds);
  }

  // Hard delete the client_service row
  const { error } = await db().from('client_services').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/services');
  revalidatePath('/clients');
}

// ─── TASK TEMPLATES ───────────────────────────────────────────────────────────

export async function createTaskTemplate(data: {
  title: string;
  description: string;
  defaultAssigneeRole: string;
  defaultPriority: string;
  estimatedDuration: number;
  type: string;
  dueRule: string;
  category: string;
}) {
  const id = `tmpl-${Date.now()}`;
  const { error } = await db().from('task_templates').insert({
    id,
    title: data.title,
    description: data.description,
    default_assignee_role: data.defaultAssigneeRole,
    default_priority: data.defaultPriority,
    estimated_duration: data.estimatedDuration,
    type: data.type,
    due_rule: data.dueRule,
    category: data.category,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/templates');
  return id;
}

export async function updateTaskTemplate(id: string, data: Partial<{
  title: string;
  description: string;
  defaultAssigneeRole: string;
  defaultPriority: string;
  estimatedDuration: number;
  type: string;
  dueRule: string;
  category: string;
}>) {
  const update: Record<string, unknown> = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.defaultAssigneeRole !== undefined) update.default_assignee_role = data.defaultAssigneeRole;
  if (data.defaultPriority !== undefined) update.default_priority = data.defaultPriority;
  if (data.estimatedDuration !== undefined) update.estimated_duration = data.estimatedDuration;
  if (data.type !== undefined) update.type = data.type;
  if (data.dueRule !== undefined) update.due_rule = data.dueRule;
  if (data.category !== undefined) update.category = data.category;
  const { error } = await db().from('task_templates').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/templates');
}

export async function archiveTaskTemplate(id: string) {
  const { error } = await db().from('task_templates').update({ archived_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/templates');
}

// ─── WORKFLOW TEMPLATES ───────────────────────────────────────────────────────

export async function createWorkflowTemplate(data: {
  name: string;
  description: string;
  category: string;
  defaultDurationDays: number;
  steps: Array<{
    title: string;
    description: string;
    defaultDurationDays: number;
    assigneeRole: string;
    order: number;
    dependsOn: string[];
  }>;
}) {
  const id = `wt-${Date.now()}`;
  const { error } = await db().from('workflow_templates').insert({
    id,
    name: data.name,
    description: data.description,
    category: data.category,
    default_duration_days: data.defaultDurationDays,
  });
  if (error) throw new Error(error.message);

  // Insert steps
  for (const step of data.steps) {
    const stepId = `${id}-s${step.order}`;
    const { error: stepErr } = await db().from('workflow_steps').insert({
      id: stepId,
      workflow_template_id: id,
      step_order: step.order,
      title: step.title,
      description: step.description,
      default_duration_days: step.defaultDurationDays,
      assignee_role: step.assigneeRole,
    });
    if (stepErr) throw new Error(stepErr.message);
    for (const depId of step.dependsOn) {
      await db().from('workflow_step_dependencies').insert({ step_id: stepId, depends_on_id: depId });
    }
  }

  revalidatePath('/templates');
  return id;
}

export async function updateWorkflowTemplate(id: string, data: {
  name?: string;
  description?: string;
  category?: string;
  defaultDurationDays?: number;
  steps?: Array<{
    id?: string;
    title: string;
    description: string;
    defaultDurationDays: number;
    assigneeRole: string;
    order: number;
    dependsOn: string[];
  }>;
}) {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;
  if (data.category !== undefined) update.category = data.category;
  if (data.defaultDurationDays !== undefined) update.default_duration_days = data.defaultDurationDays;
  if (Object.keys(update).length > 0) {
    const { error } = await db().from('workflow_templates').update(update).eq('id', id);
    if (error) throw new Error(error.message);
  }

  if (data.steps !== undefined) {
    // Get existing step ids
    const { data: existingSteps } = await db().from('workflow_steps').select('id').eq('workflow_template_id', id);
    const existingIds = (existingSteps || []).map((s: { id: string }) => s.id);

    // Delete dependencies for existing steps
    if (existingIds.length > 0) {
      await db().from('workflow_step_dependencies').delete().in('step_id', existingIds);
    }
    // Delete existing steps
    await db().from('workflow_steps').delete().eq('workflow_template_id', id);

    // Re-insert steps
    for (const step of data.steps) {
      const stepId = step.id || `${id}-s${step.order}-${Date.now()}`;
      const { error: stepErr } = await db().from('workflow_steps').insert({
        id: stepId,
        workflow_template_id: id,
        step_order: step.order,
        title: step.title,
        description: step.description,
        default_duration_days: step.defaultDurationDays,
        assignee_role: step.assigneeRole,
      });
      if (stepErr) throw new Error(stepErr.message);
    }
    // Re-insert dependencies using updated step IDs (steps are reinserted with same order)
  }

  revalidatePath('/templates');
}

export async function archiveWorkflowTemplate(id: string) {
  const { error } = await db().from('workflow_templates').update({ archived_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/templates');
}

// ─── ASSET STORAGE ────────────────────────────────────────────────────────────

export async function createAssetWithStorage(data: {
  clientId: string;
  filename: string;
  fileType: string;
  size: string;
  storagePath: string;
  storageUrl: string;
}) {
  const id = `asset-${Date.now()}`;
  const { error } = await db().from('assets').insert({
    id,
    client_id: data.clientId,
    filename: data.filename,
    file_type: data.fileType,
    upload_date: new Date().toISOString().split('T')[0],
    uploaded_by: 'team',
    size: data.size,
    color: '#6366f1',
    storage_path: data.storagePath,
    storage_url: data.storageUrl,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/assets');
  return id;
}

export async function deleteAssetWithStorage(id: string, storagePath: string) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.AGENCY_PM_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const storageDb = createClient(supabaseUrl, serviceKey);

  // Remove from storage
  if (storagePath) {
    await storageDb.storage.from('assets').remove([storagePath]);
  }
  // Remove from DB
  const { error } = await db().from('assets').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/assets');
}

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────

export async function createDocument(data: {
  title: string;
  type: 'client' | 'internal';
  clientId?: string;
  collaboratorIds?: string[];
}) {
  const id = `doc-${Date.now()}`;
  const now = new Date().toISOString();
  const { error } = await db()
    .from('documents')
    .insert({
      id,
      title: data.title,
      type: data.type,
      client_id: data.clientId || 'all',
      content: '',
      created_at: now,
      updated_at: now,
    });
  if (error) throw new Error(error.message);

  if (data.collaboratorIds && data.collaboratorIds.length > 0) {
    await db()
      .from('document_collaborators')
      .insert(data.collaboratorIds.map(memberId => ({ document_id: id, team_member_id: memberId })));
  }

  revalidatePath('/documents');
  return id;
}

export async function updateDocument(id: string, data: {
  title?: string;
  content?: string;
  yjsState?: string;
  type?: 'client' | 'internal';
  clientId?: string;
  collaboratorIds?: string[];
}) {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) update.title = data.title;
  if (data.content !== undefined) update.content = data.content;
  if (data.yjsState !== undefined) update.yjs_state = data.yjsState;
  if (data.type !== undefined) update.type = data.type;
  if (data.clientId !== undefined) update.client_id = data.clientId;

  const { error } = await db().from('documents').update(update).eq('id', id);
  if (error) throw new Error(error.message);

  if (data.collaboratorIds !== undefined) {
    await db().from('document_collaborators').delete().eq('document_id', id);
    if (data.collaboratorIds.length > 0) {
      await db()
        .from('document_collaborators')
        .insert(data.collaboratorIds.map(memberId => ({ document_id: id, team_member_id: memberId })));
    }
  }

  revalidatePath('/documents');
}

export async function archiveDocument(id: string) {
  const { error } = await db()
    .from('documents')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/documents');
}

export async function createDocumentVersion(data: {
  documentId: string;
  content: string;
  authorId: string;
  summary?: string;
}) {
  const id = `dv-${Date.now()}`;
  const versionNum = Math.floor(Date.now() / 1000);
  const { error } = await db()
    .from('document_versions')
    .insert({
      id,
      document_id: data.documentId,
      version: `v${versionNum}`,
      author_id: data.authorId,
      summary: data.summary || 'Auto-saved',
      created_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);
  revalidatePath(`/documents/${data.documentId}`);
  return id;
}

export async function createDocumentComment(data: {
  documentId: string;
  authorId: string;
  text: string;
  parentCommentId?: string;
}) {
  const id = `c-${Date.now()}`;
  const { error } = await db()
    .from('comments')
    .insert({
      id,
      document_id: data.documentId,
      author_id: data.authorId,
      text: data.text,
      parent_comment_id: data.parentCommentId || null,
      created_at: new Date().toISOString(),
      resolved: false,
    });
  if (error) throw new Error(error.message);
  revalidatePath(`/documents/${data.documentId}`);
  return id;
}

export async function resolveDocumentComment(id: string, resolved: boolean) {
  const { error } = await db()
    .from('comments')
    .update({ resolved })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function createTaskComment(data: {
  taskId: string;
  authorId: string;
  text: string;
}) {
  const id = `tc-${Date.now()}`;
  const { error } = await db()
    .from('comments')
    .insert({
      id,
      task_id: data.taskId,
      author_id: data.authorId,
      text: data.text,
      created_at: new Date().toISOString(),
      resolved: false,
    });
  if (error) throw new Error(error.message);
  revalidatePath('/kanban');
  return id;
}

export async function getTaskComments(taskId: string) {
  const { data, error } = await db()
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateTaskComment(data: { id: string; text: string }) {
  const { error } = await db()
    .from('comments')
    .update({ text: data.text })
    .eq('id', data.id);
  if (error) throw new Error(error.message);
  revalidatePath('/kanban');
}

export async function deleteTaskComment(id: string) {
  const { error } = await db()
    .from('comments')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kanban');
}

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────

export async function createKBCategory(data: { name: string; description?: string }) {
  const { error, data: row } = await db()
    .from('kb_categories')
    .insert({ name: data.name, description: data.description || null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/knowledge-base');
  return row;
}

export async function updateKBCategory(id: string, data: { name?: string; description?: string }) {
  const { error } = await db().from('kb_categories').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/knowledge-base');
}

export async function archiveKBCategory(id: string) {
  const { error } = await db()
    .from('kb_categories')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/knowledge-base');
}

export async function createKBArticle(data: {
  title: string;
  categoryId?: string;
  tags?: string[];
  visibility?: 'internal' | 'all';
  authorId?: string;
}) {
  const { error, data: row } = await db()
    .from('kb_articles')
    .insert({
      title: data.title,
      category_id: data.categoryId || null,
      tags: data.tags || [],
      visibility: data.visibility || 'internal',
      author_id: data.authorId || null,
      content: null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/knowledge-base');
  return row;
}

export async function updateKBArticle(id: string, data: {
  title?: string;
  content?: Record<string, unknown> | null;
  yjsState?: string;
  categoryId?: string | null;
  tags?: string[];
  visibility?: 'internal' | 'all';
  authorId?: string | null;
}) {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) update.title = data.title;
  if (data.content !== undefined) update.content = data.content;
  if (data.yjsState !== undefined) update.yjs_state = data.yjsState;
  if (data.categoryId !== undefined) update.category_id = data.categoryId;
  if (data.tags !== undefined) update.tags = data.tags;
  if (data.visibility !== undefined) update.visibility = data.visibility;
  if (data.authorId !== undefined) update.author_id = data.authorId;
  const { error } = await db().from('kb_articles').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/knowledge-base');
  revalidatePath(`/knowledge-base/${id}`);
}

export async function archiveKBArticle(id: string) {
  const { error } = await db()
    .from('kb_articles')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/knowledge-base');
}

export async function createKBArticleVersion(data: {
  articleId: string;
  content: Record<string, unknown> | null;
  authorId?: string;
  summary?: string;
}) {
  const { error } = await db()
    .from('kb_article_versions')
    .insert({
      article_id: data.articleId,
      content: data.content,
      author_id: data.authorId || null,
      summary: data.summary || 'Auto-saved',
    });
  if (error) throw new Error(error.message);
  revalidatePath(`/knowledge-base/${data.articleId}`);
}

// ─── DOCUMENT FOLDERS ─────────────────────────────────────────────────────────

export async function createDocumentFolder(data: {
  name: string;
  parentId?: string;
  clientId?: string;
  color?: string;
}) {
  const { error, data: row } = await db()
    .from('document_folders')
    .insert({
      name: data.name,
      parent_id: data.parentId || null,
      client_id: data.clientId || null,
      color: data.color || '#6366f1',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/documents');
  return row;
}

export async function updateDocumentFolder(id: string, data: {
  name?: string;
  color?: string;
  clientId?: string | null;
  parentId?: string | null;
}) {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.color !== undefined) update.color = data.color;
  if (data.clientId !== undefined) update.client_id = data.clientId;
  if (data.parentId !== undefined) update.parent_id = data.parentId;
  const { error } = await db().from('document_folders').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/documents');
}

export async function archiveDocumentFolder(id: string) {
  // Move all docs in folder to root first
  await db().from('documents').update({ folder_id: null }).eq('folder_id', id);
  const { error } = await db()
    .from('document_folders')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/documents');
}

export async function moveDocumentToFolder(documentId: string, folderId: string | null) {
  const { error } = await db()
    .from('documents')
    .update({ folder_id: folderId })
    .eq('id', documentId);
  if (error) throw new Error(error.message);
  revalidatePath('/documents');
}

// ─── SERVICE STRATEGIES ─────────────────────────────────────────────────────

export async function addServiceToStrategy(clientServiceId: string, strategyId: string): Promise<string> {
  const id = `ss-${Date.now()}`;
  const { error } = await db()
    .from('service_strategies')
    .insert({
      id,
      client_service_id: clientServiceId,
      client_strategy_id: strategyId,
      name: '',
      summary: '',
    });
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
  return id;
}

export async function removeServiceFromStrategy(serviceStrategyId: string): Promise<void> {
  const { error } = await db()
    .from('service_strategies')
    .delete()
    .eq('id', serviceStrategyId);
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
}

export async function updateServiceStrategySummary(id: string, summary: string): Promise<void> {
  const { error } = await db()
    .from('service_strategies')
    .update({ summary, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
}
