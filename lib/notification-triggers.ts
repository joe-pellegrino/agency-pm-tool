'use server';

/**
 * Notification trigger helpers.
 * Called from server actions after DB writes. Never throws — notifications are
 * best-effort and must not break core flows.
 */

import { createNotification } from '@/app/actions/notifications';
import { createServerClient } from '@/lib/supabase/client';
import { extractMentionedUserIds } from '@/lib/mention-parser';

const db = () => createServerClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getTaskWithClient(taskId: string) {
  const { data } = await db()
    .from('tasks')
    .select('id, title, client_id, assignee_id, status, is_milestone, is_adhoc, due_date')
    .eq('id', taskId)
    .single();
  return data;
}

async function getMemberName(memberId: string): Promise<string> {
  const { data } = await db()
    .from('team_members')
    .select('name')
    .eq('id', memberId)
    .single();
  return data?.name ?? 'Someone';
}

async function getClientName(clientId: string): Promise<string> {
  const { data } = await db()
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .single();
  return data?.name ?? 'a client';
}

async function getClientOwner(clientId: string): Promise<string | null> {
  const { data } = await db()
    .from('clients')
    .select('owner_id')
    .eq('id', clientId)
    .single();
  return data?.owner_id ?? null;
}

// ─── Phase 1 Triggers ────────────────────────────────────────────────────────

/** Fire when a task is created or reassigned to a new assignee */
export async function notifyTaskAssigned(
  taskId: string,
  newAssigneeId: string,
  assignedByName?: string
): Promise<void> {
  try {
    const task = await getTaskWithClient(taskId);
    if (!task) return;

    const clientName = await getClientName(task.client_id);
    const byText = assignedByName ? ` by ${assignedByName}` : '';

    await createNotification(
      newAssigneeId,
      'task_assigned',
      'Task Assigned to You',
      `"${task.title}" (${clientName}) was assigned to you${byText}.`,
      `/kanban?task=${taskId}`,
      { taskId, clientId: task.client_id }
    );
  } catch (err) {
    console.error('notifyTaskAssigned error:', err);
  }
}

/** Fire when task status changes */
export async function notifyTaskStatusChanged(
  taskId: string,
  oldStatus: string,
  newStatus: string,
  changedByName?: string
): Promise<void> {
  try {
    const task = await getTaskWithClient(taskId);
    if (!task || !task.assignee_id) return;

    // Notify assignee
    await createNotification(
      task.assignee_id,
      'task_status_changed',
      'Task Status Updated',
      `"${task.title}" moved from ${oldStatus} → ${newStatus}${changedByName ? ` by ${changedByName}` : ''}.`,
      `/kanban?task=${taskId}`,
      { taskId, oldStatus, newStatus }
    );

    // If moved to review → approval requested
    if (newStatus.toLowerCase().includes('review')) {
      const clientOwner = await getClientOwner(task.client_id);
      if (clientOwner && clientOwner !== task.assignee_id) {
        await createNotification(
          clientOwner,
          'approval_requested',
          'Approval Requested',
          `"${task.title}" is ready for your review.`,
          `/kanban?task=${taskId}`,
          { taskId }
        );
      }
    }

    // Milestone reached
    if (task.is_milestone && (newStatus.toLowerCase() === 'done' || newStatus.toLowerCase() === 'complete')) {
      const clientOwner = await getClientOwner(task.client_id);
      if (clientOwner) {
        await createNotification(
          clientOwner,
          'milestone_reached',
          '🎯 Milestone Reached',
          `Milestone "${task.title}" has been completed!`,
          `/kanban?task=${taskId}`,
          { taskId }
        );
      }
    }
  } catch (err) {
    console.error('notifyTaskStatusChanged error:', err);
  }
}

/** Fire when a comment is posted on a task */
export async function notifyTaskComment(
  taskId: string,
  authorId: string,
  commentText: string
): Promise<void> {
  try {
    const task = await getTaskWithClient(taskId);
    if (!task || !task.assignee_id) return;
    if (task.assignee_id === authorId) return; // Don't self-notify

    const authorName = await getMemberName(authorId);
    const preview = commentText.length > 80 ? commentText.slice(0, 80) + '…' : commentText;

    await createNotification(
      task.assignee_id,
      'task_comment',
      'New Comment on Your Task',
      `${authorName} commented on "${task.title}": "${preview}"`,
      `/kanban?task=${taskId}`,
      { taskId, authorId }
    );
  } catch (err) {
    console.error('notifyTaskComment error:', err);
  }
}

/** Fire when someone is mentioned in a task comment */
export async function notifyMentions(
  taskId: string,
  authorId: string,
  commentText: string
): Promise<void> {
  try {
    const task = await getTaskWithClient(taskId);
    if (!task) return;

    const mentionedUserIds = extractMentionedUserIds(commentText);
    if (mentionedUserIds.length === 0) return;

    const authorName = await getMemberName(authorId);

    for (const userId of mentionedUserIds) {
      // Don't notify the author
      if (userId === authorId) continue;

      await createNotification(
        userId,
        'mention',
        'You Were Mentioned',
        `${authorName} mentioned you in a comment on "${task.title}".`,
        `/kanban?task=${taskId}`,
        { taskId, authorId }
      );
    }
  } catch (err) {
    console.error('notifyMentions error:', err);
  }
}

/** Fire when task dependency is unblocked (blocking task completed) */
export async function notifyDependencyUnblocked(completedTaskId: string): Promise<void> {
  try {
    // Find all tasks that depend on this one
    const { data: deps } = await db()
      .from('task_dependencies')
      .select('task_id')
      .eq('depends_on_id', completedTaskId);

    if (!deps || deps.length === 0) return;

    const completedTask = await getTaskWithClient(completedTaskId);
    if (!completedTask) return;

    for (const dep of deps) {
      const dependentTask = await getTaskWithClient(dep.task_id);
      if (!dependentTask?.assignee_id) continue;

      await createNotification(
        dependentTask.assignee_id,
        'dependency_unblocked',
        'Dependency Unblocked',
        `"${dependentTask.title}" is now unblocked — "${completedTask.title}" was completed.`,
        `/kanban?task=${dep.task_id}`,
        { taskId: dep.task_id, unblockedBy: completedTaskId }
      );
    }
  } catch (err) {
    console.error('notifyDependencyUnblocked error:', err);
  }
}

// ─── Phase 2 Triggers ────────────────────────────────────────────────────────

/** Fire when a new task is created on a client */
export async function notifyNewTaskOnClient(
  taskId: string,
  createdByName?: string
): Promise<void> {
  try {
    const task = await getTaskWithClient(taskId);
    if (!task) return;

    const clientOwner = await getClientOwner(task.client_id);
    if (!clientOwner) return;
    if (clientOwner === task.assignee_id) return; // same person created it

    const clientName = await getClientName(task.client_id);

    await createNotification(
      clientOwner,
      'new_task_on_client',
      'New Task Created',
      `New task "${task.title}" was added for ${clientName}${createdByName ? ` by ${createdByName}` : ''}.`,
      `/kanban?task=${taskId}`,
      { taskId, clientId: task.client_id }
    );

    // Ad-hoc request
    if (task.is_adhoc) {
      await createNotification(
        clientOwner,
        'adhoc_request',
        '⚡ Ad Hoc Request',
        `Ad hoc request "${task.title}" was submitted for ${clientName}.`,
        `/kanban?task=${taskId}`,
        { taskId, clientId: task.client_id }
      );
    }
  } catch (err) {
    console.error('notifyNewTaskOnClient error:', err);
  }
}

/** Fire when an initiative (project) status changes */
export async function notifyInitiativeStatusChanged(
  projectId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  try {
    const { data: project } = await db()
      .from('projects')
      .select('id, name, client_id, owner_id')
      .eq('id', projectId)
      .single();
    if (!project) return;

    const ownerId = project.owner_id || (await getClientOwner(project.client_id));
    if (!ownerId) return;

    await createNotification(
      ownerId,
      'initiative_status_changed',
      'Initiative Status Updated',
      `Initiative "${project.name}" moved from ${oldStatus} → ${newStatus}.`,
      `/initiatives/${projectId}`,
      { projectId, oldStatus, newStatus }
    );

    // Completed — notify all linked assignees
    if (newStatus.toLowerCase() === 'complete' || newStatus.toLowerCase() === 'done') {
      await createNotification(
        ownerId,
        'initiative_completed',
        '✅ Initiative Completed',
        `Initiative "${project.name}" has been completed!`,
        `/initiatives/${projectId}`,
        { projectId }
      );
    }
  } catch (err) {
    console.error('notifyInitiativeStatusChanged error:', err);
  }
}

/** Fire when a recurring task is generated */
export async function notifyRecurringTaskCreated(
  taskId: string,
  assigneeId: string
): Promise<void> {
  try {
    const task = await getTaskWithClient(taskId);
    if (!task || !assigneeId) return;

    await createNotification(
      assigneeId,
      'recurring_task_created',
      'Recurring Task Created',
      `Your recurring task "${task.title}" has been generated and is due ${task.due_date ?? 'soon'}.`,
      `/kanban?task=${taskId}`,
      { taskId }
    );
  } catch (err) {
    console.error('notifyRecurringTaskCreated error:', err);
  }
}

// ─── Phase 3 Triggers ────────────────────────────────────────────────────────

/** Fire when collaborators are added to a document */
export async function notifyDocumentShared(
  documentId: string,
  documentTitle: string,
  newCollaboratorIds: string[],
  sharedByName?: string
): Promise<void> {
  try {
    for (const uid of newCollaboratorIds) {
      await createNotification(
        uid,
        'document_shared',
        'Document Shared With You',
        `"${documentTitle}" was shared with you${sharedByName ? ` by ${sharedByName}` : ''}.`,
        `/documents/${documentId}`,
        { documentId }
      );
    }
  } catch (err) {
    console.error('notifyDocumentShared error:', err);
  }
}

/** Fire when a document version is saved */
export async function notifyDocumentUpdated(
  documentId: string,
  documentTitle: string,
  authorId: string,
  authorName?: string
): Promise<void> {
  try {
    // Notify all collaborators except the author
    const { data: collabs } = await db()
      .from('document_collaborators')
      .select('team_member_id')
      .eq('document_id', documentId)
      .neq('team_member_id', authorId);

    if (!collabs || collabs.length === 0) return;

    const byText = authorName ? ` by ${authorName}` : '';
    for (const c of collabs) {
      await createNotification(
        c.team_member_id,
        'document_updated',
        'Document Updated',
        `"${documentTitle}" was updated${byText}.`,
        `/documents/${documentId}`,
        { documentId, authorId }
      );
    }
  } catch (err) {
    console.error('notifyDocumentUpdated error:', err);
  }
}

/** Fire when a comment is posted on a document */
export async function notifyDocumentComment(
  documentId: string,
  documentTitle: string,
  authorId: string,
  commentPreview: string
): Promise<void> {
  try {
    const authorName = await getMemberName(authorId);

    // Notify owner and collaborators (excluding commenter)
    const { data: collabs } = await db()
      .from('document_collaborators')
      .select('team_member_id')
      .eq('document_id', documentId)
      .neq('team_member_id', authorId);

    const recipients = new Set((collabs ?? []).map((c) => c.team_member_id));

    // Also get document owner/creator
    const { data: doc } = await db()
      .from('documents')
      .select('created_by')
      .eq('id', documentId)
      .single();
    if (doc?.created_by && doc.created_by !== authorId) recipients.add(doc.created_by);

    const preview = commentPreview.length > 80 ? commentPreview.slice(0, 80) + '…' : commentPreview;
    for (const uid of recipients) {
      await createNotification(
        uid,
        'document_comment',
        'New Comment on Document',
        `${authorName} commented on "${documentTitle}": "${preview}"`,
        `/documents/${documentId}`,
        { documentId, authorId }
      );
    }
  } catch (err) {
    console.error('notifyDocumentComment error:', err);
  }
}

/** Fire when a strategy is published */
export async function notifyStrategyPublished(
  strategyId: string,
  strategyName: string,
  clientId: string
): Promise<void> {
  try {
    const clientOwner = await getClientOwner(clientId);
    if (!clientOwner) return;

    const clientName = await getClientName(clientId);
    await createNotification(
      clientOwner,
      'strategy_published',
      'Strategy Published',
      `Strategy "${strategyName}" for ${clientName} has been published.`,
      `/strategy/${strategyId}`,
      { strategyId, clientId }
    );
  } catch (err) {
    console.error('notifyStrategyPublished error:', err);
  }
}
