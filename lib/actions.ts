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
    });
  if (error) throw new Error(error.message);
  revalidatePath('/projects');
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
  const { error } = await db().from('projects').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/projects');
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
  quarter: string;
  startDate: string;
  endDate: string;
  status: string;
}>) {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
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

export async function createStrategyPillar(strategyId: string, name: string, description: string) {
  const id = `pillar-${Date.now()}`;
  const { error } = await db()
    .from('strategy_pillars')
    .insert({ id, strategy_id: strategyId, name, description });
  if (error) throw new Error(error.message);
  revalidatePath('/strategy');
  return id;
}

export async function updateStrategyPillar(id: string, name: string, description: string) {
  const { error } = await db()
    .from('strategy_pillars')
    .update({ name, description })
    .eq('id', id);
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
