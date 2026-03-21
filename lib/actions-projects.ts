'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/client';

const db = () => createServerClient();

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProjectDetail = {
  id: string;
  clientId: string;
  clientName: string;
  clientColor: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
  icon: string;
  iconColor: string;
  strategyId?: string;
  pillarId?: string;
  workflowTemplateId?: string;
  totalHours: number;
  taskCount: number;
  memberCount: number;
};

export type ProjectMember = {
  id: string;
  teamMemberId: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  taskCount: number;
  hoursLogged: number;
};

export type ProjectBudget = {
  id: string;
  projectId: string;
  totalBudget: number;
  currency: string;
  notes: string | null;
};

export type ProjectExpense = {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  createdBy: string | null;
  createdAt: string;
};

export type ProjectActivity = {
  id: string;
  projectId: string;
  userName: string;
  actionType: string;
  entityType: string | null;
  entityId: string | null;
  description: string;
  createdAt: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  clientId: string;
  assigneeId: string;
  assigneeName: string;
  assigneeInitials: string;
  assigneeColor: string;
  status: string;
  priority: string;
  dueDate: string;
  startDate: string;
  endDate: string;
  description: string;
  projectId: string | null;
};

export type ProjectAsset = {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string | null;
  projectId: string | null;
  createdAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function logProjectActivity(
  projectId: string,
  data: {
    userName?: string;
    actionType: string;
    entityType?: string;
    entityId?: string;
    description: string;
    metadata?: Record<string, unknown>;
  }
) {
  await db().from('project_activity_log').insert({
    project_id: projectId,
    user_name: data.userName || 'Joe',
    action_type: data.actionType,
    entity_type: data.entityType || null,
    entity_id: data.entityId || null,
    description: data.description,
    metadata: data.metadata || null,
  });
}

// ─── Project ─────────────────────────────────────────────────────────────────

export async function getProjectDetail(id: string): Promise<ProjectDetail | null> {
  const { data: project, error } = await db()
    .from('projects')
    .select('*')
    .eq('id', id)
    .is('archived_at', null)
    .single();

  if (error || !project) return null;

  const { data: client } = await db()
    .from('clients')
    .select('name, color')
    .eq('id', project.client_id)
    .single();

  // Get task IDs for this project, then sum time_entries
  const { data: projectTasks } = await db()
    .from('tasks')
    .select('id')
    .eq('project_id', id)
    .is('archived_at', null);

  const taskIds = (projectTasks || []).map((t: { id: string }) => t.id);
  let totalMinutes = 0;
  if (taskIds.length > 0) {
    const { data: timeEntries } = await db()
      .from('time_entries')
      .select('duration_minutes')
      .in('task_id', taskIds);
    totalMinutes = (timeEntries || []).reduce(
      (sum: number, te: { duration_minutes: number }) => sum + (te.duration_minutes || 0), 0
    );
  }

  // Get task count
  const { count: taskCount } = await db()
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', id)
    .is('archived_at', null);

  // Get member count
  const { count: memberCount } = await db()
    .from('project_members')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', id);

  return {
    id: project.id,
    clientId: project.client_id,
    clientName: client?.name || '',
    clientColor: client?.color || '#3B5BDB',
    name: project.name,
    description: project.description || '',
    status: project.status,
    startDate: project.start_date,
    endDate: project.end_date,
    progress: project.progress || 0,
    icon: project.icon || '',
    iconColor: project.icon_color || '#3B5BDB',
    strategyId: project.strategy_id,
    pillarId: project.pillar_id,
    workflowTemplateId: project.workflow_template_id,
    totalHours: Math.round(totalMinutes / 60),
    taskCount: taskCount || 0,
    memberCount: memberCount || 0,
  };
}

export async function updateProject(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    clientId: string;
    status: string;
    startDate: string;
    endDate: string;
    icon: string;
    iconColor: string;
    strategyId: string | null;
    progress: number;
  }>
) {
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;
  if (data.clientId !== undefined) update.client_id = data.clientId;
  if (data.status !== undefined) update.status = data.status;
  if (data.startDate !== undefined) update.start_date = data.startDate;
  if (data.endDate !== undefined) update.end_date = data.endDate;
  if (data.icon !== undefined) update.icon = data.icon;
  if (data.iconColor !== undefined) update.icon_color = data.iconColor;
  if (data.strategyId !== undefined) update.strategy_id = data.strategyId;
  if (data.progress !== undefined) update.progress = data.progress;

  const { error } = await db().from('projects').update(update).eq('id', id);
  if (error) throw new Error(error.message);

  await logProjectActivity(id, {
    actionType: 'settings_updated',
    description: 'Project settings updated',
  });

  revalidatePath(`/projects/${id}`);
  revalidatePath('/projects');
}

export async function archiveProjectById(id: string) {
  const { error } = await db()
    .from('projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/projects');
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const { data: tasks } = await db()
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (!tasks || tasks.length === 0) return [];

  const assigneeIds = [...new Set(tasks.map((t: { assignee_id: string }) => t.assignee_id))];
  const { data: members } = await db()
    .from('team_members')
    .select('id, name, initials, color')
    .in('id', assigneeIds);

  const memberMap = new Map((members || []).map((m: { id: string; name: string; initials: string; color: string }) => [m.id, m]));

  return tasks.map((t: {
    id: string; title: string; client_id: string; assignee_id: string;
    status: string; priority: string; due_date: string; start_date: string;
    end_date: string; description: string; project_id: string;
  }) => {
    const m = memberMap.get(t.assignee_id);
    return {
      id: t.id,
      title: t.title,
      clientId: t.client_id,
      assigneeId: t.assignee_id,
      assigneeName: m?.name || '',
      assigneeInitials: m?.initials || '?',
      assigneeColor: m?.color || '#6366f1',
      status: t.status,
      priority: t.priority,
      dueDate: t.due_date,
      startDate: t.start_date,
      endDate: t.end_date,
      description: t.description || '',
      projectId: t.project_id,
    };
  });
}

export async function createProjectTask(
  projectId: string,
  data: {
    title: string;
    clientId: string;
    assigneeId: string;
    status: string;
    priority: string;
    dueDate: string;
    startDate: string;
    endDate: string;
    description?: string;
    type?: string;
  }
) {
  const { data: task, error } = await db()
    .from('tasks')
    .insert({
      id: `task-${Date.now()}`,
      title: data.title,
      client_id: data.clientId,
      assignee_id: data.assigneeId,
      status: data.status || 'todo',
      priority: data.priority || 'Medium',
      due_date: data.dueDate,
      start_date: data.startDate,
      end_date: data.endDate,
      description: data.description || '',
      type: data.type || 'other',
      project_id: projectId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logProjectActivity(projectId, {
    actionType: 'task_created',
    entityType: 'task',
    entityId: task?.id,
    description: `Joe created task "${data.title}"`,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/kanban');
  return task;
}

// ─── Members ─────────────────────────────────────────────────────────────────

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const { data: members } = await db()
    .from('project_members')
    .select(`
      id,
      team_member_id,
      team_members (id, name, role, initials, color)
    `)
    .eq('project_id', projectId);

  if (!members) return [];

  // Get task counts per member
  const memberIds = members.map((m: { team_member_id: string }) => m.team_member_id);
  const { data: tasks } = await db()
    .from('tasks')
    .select('assignee_id')
    .eq('project_id', projectId)
    .is('archived_at', null)
    .in('assignee_id', memberIds);

  const taskCounts = new Map<string, number>();
  (tasks || []).forEach((t: { assignee_id: string }) => {
    taskCounts.set(t.assignee_id, (taskCounts.get(t.assignee_id) || 0) + 1);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (members as any[]).map((m) => {
    const tm = Array.isArray(m.team_members) ? m.team_members[0] : m.team_members;
    return {
      id: m.id as string,
      teamMemberId: m.team_member_id as string,
      name: (tm?.name as string) || '',
      role: (tm?.role as string) || '',
      initials: (tm?.initials as string) || '?',
      color: (tm?.color as string) || '#6366f1',
      taskCount: taskCounts.get(m.team_member_id as string) || 0,
      hoursLogged: 0,
    };
  });
}

export async function getAllTeamMembers() {
  const { data } = await db()
    .from('team_members')
    .select('id, name, role, initials, color')
    .is('archived_at', null)
    .order('name');
  return data || [];
}

export async function addProjectMember(projectId: string, teamMemberId: string) {
  const { error } = await db()
    .from('project_members')
    .insert({ project_id: projectId, team_member_id: teamMemberId });
  if (error && !error.message.includes('duplicate') && !error.message.includes('unique')) {
    throw new Error(error.message);
  }

  const { data: member } = await db()
    .from('team_members')
    .select('name')
    .eq('id', teamMemberId)
    .single();

  await logProjectActivity(projectId, {
    actionType: 'member_added',
    entityType: 'member',
    entityId: teamMemberId,
    description: `${member?.name || teamMemberId} was added to the project`,
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function removeProjectMember(projectId: string, teamMemberId: string) {
  const { data: member } = await db()
    .from('team_members')
    .select('name')
    .eq('id', teamMemberId)
    .single();

  const { error } = await db()
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('team_member_id', teamMemberId);
  if (error) throw new Error(error.message);

  await logProjectActivity(projectId, {
    actionType: 'member_removed',
    entityType: 'member',
    entityId: teamMemberId,
    description: `${member?.name || teamMemberId} was removed from the project`,
  });

  revalidatePath(`/projects/${projectId}`);
}

// ─── Budget ──────────────────────────────────────────────────────────────────

export async function getProjectBudget(projectId: string): Promise<ProjectBudget | null> {
  const { data } = await db()
    .from('project_budget')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (!data) {
    // Create if none
    const { data: created } = await db()
      .from('project_budget')
      .insert({ project_id: projectId, total_budget: 0 })
      .select()
      .single();
    return created ? {
      id: created.id,
      projectId: created.project_id,
      totalBudget: Number(created.total_budget),
      currency: created.currency,
      notes: created.notes,
    } : null;
  }

  return {
    id: data.id,
    projectId: data.project_id,
    totalBudget: Number(data.total_budget),
    currency: data.currency,
    notes: data.notes,
  };
}

export async function updateProjectBudget(projectId: string, totalBudget: number) {
  const { data: existing } = await db()
    .from('project_budget')
    .select('id')
    .eq('project_id', projectId)
    .single();

  if (existing) {
    await db()
      .from('project_budget')
      .update({ total_budget: totalBudget, updated_at: new Date().toISOString() })
      .eq('project_id', projectId);
  } else {
    await db()
      .from('project_budget')
      .insert({ project_id: projectId, total_budget: totalBudget });
  }

  await logProjectActivity(projectId, {
    actionType: 'budget_updated',
    description: `Budget updated to $${totalBudget.toLocaleString()}`,
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function getProjectExpenses(projectId: string): Promise<ProjectExpense[]> {
  const { data } = await db()
    .from('project_expenses')
    .select('*')
    .eq('project_id', projectId)
    .is('archived_at', null)
    .order('expense_date', { ascending: false });

  return (data || []).map((e: {
    id: string; project_id: string; description: string; amount: number;
    category: string; expense_date: string; created_by: string | null; created_at: string;
  }) => ({
    id: e.id,
    projectId: e.project_id,
    description: e.description,
    amount: Number(e.amount),
    category: e.category,
    expenseDate: e.expense_date,
    createdBy: e.created_by,
    createdAt: e.created_at,
  }));
}

export async function createProjectExpense(
  projectId: string,
  data: {
    description: string;
    amount: number;
    category: string;
    expenseDate: string;
  }
) {
  const { data: expense, error } = await db()
    .from('project_expenses')
    .insert({
      project_id: projectId,
      description: data.description,
      amount: data.amount,
      category: data.category,
      expense_date: data.expenseDate,
      created_by: 'Joe',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logProjectActivity(projectId, {
    actionType: 'expense_added',
    entityType: 'expense',
    entityId: expense?.id,
    description: `Joe added expense: "${data.description}" ($${data.amount.toLocaleString()})`,
  });

  revalidatePath(`/projects/${projectId}`);
  return expense;
}

export async function deleteProjectExpense(expenseId: string, projectId: string) {
  const { data: expense } = await db()
    .from('project_expenses')
    .select('description')
    .eq('id', expenseId)
    .single();

  const { error } = await db()
    .from('project_expenses')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', expenseId);
  if (error) throw new Error(error.message);

  await logProjectActivity(projectId, {
    actionType: 'expense_deleted',
    description: `Joe deleted expense: "${expense?.description || expenseId}"`,
  });

  revalidatePath(`/projects/${projectId}`);
}

// ─── Activity ────────────────────────────────────────────────────────────────

export async function getProjectActivity(
  projectId: string,
  limit = 50,
  offset = 0
): Promise<ProjectActivity[]> {
  const { data } = await db()
    .from('project_activity_log')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return (data || []).map((a: {
    id: string; project_id: string; user_name: string; action_type: string;
    entity_type: string | null; entity_id: string | null; description: string; created_at: string;
  }) => ({
    id: a.id,
    projectId: a.project_id,
    userName: a.user_name,
    actionType: a.action_type,
    entityType: a.entity_type,
    entityId: a.entity_id,
    description: a.description,
    createdAt: a.created_at,
  }));
}

// ─── Assets/Files ─────────────────────────────────────────────────────────────

export async function getProjectAssets(projectId: string): Promise<ProjectAsset[]> {
  const { data } = await db()
    .from('assets')
    .select('*')
    .eq('project_id', projectId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  return (data || []).map((a: {
    id: string; filename: string; storage_url: string; size: number; file_type: string;
    uploaded_by: string | null; project_id: string | null; created_at: string;
  }) => ({
    id: a.id,
    name: a.filename || '',
    url: a.storage_url || '',
    size: a.size || 0,
    type: a.file_type || 'unknown',
    uploadedBy: a.uploaded_by,
    projectId: a.project_id,
    createdAt: a.created_at,
  }));
}

export async function deleteProjectAsset(assetId: string, projectId: string, assetName: string) {
  const { error } = await db()
    .from('assets')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', assetId);
  if (error) throw new Error(error.message);

  await logProjectActivity(projectId, {
    actionType: 'file_deleted',
    entityType: 'file',
    entityId: assetId,
    description: `Joe deleted "${assetName}"`,
  });

  revalidatePath(`/projects/${projectId}`);
}

// ─── Project Comments ──────────────────────────────────────────────────────────

export type ProjectComment = {
  id: string;
  project_id: string;
  author_id: string;
  text: string;
  parent_comment_id: string | null;
  created_at: string;
  resolved: boolean;
};

export async function createProjectComment(data: {
  projectId: string;
  authorId: string;
  text: string;
  parentCommentId?: string;
}): Promise<ProjectComment> {
  const { data: row, error } = await db()
    .from('project_comments')
    .insert({
      project_id: data.projectId,
      author_id: data.authorId,
      text: data.text,
      parent_comment_id: data.parentCommentId || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/initiatives/${data.projectId}`);
  return row as ProjectComment;
}

export async function getProjectComments(projectId: string): Promise<ProjectComment[]> {
  const { data, error } = await db()
    .from('project_comments')
    .select('*')
    .eq('project_id', projectId)
    .is('archived_at', null)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as ProjectComment[];
}

export async function updateProjectComment(data: { id: string; text: string }): Promise<void> {
  const { error } = await db()
    .from('project_comments')
    .update({ text: data.text })
    .eq('id', data.id);
  if (error) throw new Error(error.message);
}

export async function deleteProjectComment(id: string): Promise<void> {
  const { error } = await db()
    .from('project_comments')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
