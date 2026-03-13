/**
 * db.ts
 *
 * Database connection and query helpers.
 * Returns data in shapes matching the TypeScript interfaces from lib/data.ts
 * so existing UI components can switch to DB-backed data with minimal changes.
 *
 * Usage:
 *   import { db } from '@/lib/database/db';
 *   const tasks = db.tasks.getAll();
 */

import Database from 'better-sqlite3';
import path from 'path';
import type {
  TeamMember,
  Client,
  Task,
  ApprovalEntry,
  Comment,
  Document,
  DocumentVersion,
  TaskTemplate,
  Automation,
  TimeEntry,
  Asset,
  Strategy,
  StrategyPillar,
  KPI,
  Project,
  WorkflowTemplate,
  WorkflowStep,
  Service,
  ClientService,
  ServiceStrategy,
  ServiceStrategyPillar,
  ServiceStrategyKPI,
} from '../data';

// ---------------------------------------------------------------------------
// Singleton connection
// ---------------------------------------------------------------------------

const DB_PATH = path.join(__dirname, 'agency-pm.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('foreign_keys = ON');
    _db.pragma('journal_mode = WAL');
  }
  return _db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

// ---------------------------------------------------------------------------
// Raw row types returned by SQLite (snake_case, integers for booleans)
// ---------------------------------------------------------------------------

interface TeamMemberRow {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  is_owner: number;
}

interface ClientRow {
  id: string;
  name: string;
  industry: string;
  location: string;
  color: string;
  logo: string;
}

interface TaskRow {
  id: string;
  title: string;
  client_id: string;
  assignee_id: string;
  status: string;
  priority: string;
  due_date: string;
  start_date: string;
  end_date: string;
  description: string;
  is_milestone: number;
  type: string | null;
}

interface ApprovalRow {
  id: string;
  task_id: string;
  action: string;
  approver_id: string;
  timestamp: string;
  note: string | null;
}

interface CommentRow {
  id: string;
  document_id: string;
  author_id: string;
  parent_comment_id: string | null;
  text: string;
  created_at: string;
}

interface DocumentRow {
  id: string;
  title: string;
  client_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface DocumentVersionRow {
  id: string;
  document_id: string;
  version: string;
  author_id: string;
  summary: string;
  created_at: string;
}

interface TaskTemplateRow {
  id: string;
  title: string;
  description: string;
  default_assignee_role: string;
  default_priority: string;
  estimated_duration: number;
  type: string | null;
  due_rule: string;
  category: string;
}

interface AutomationRow {
  id: string;
  client_id: string;
  template_id: string;
  frequency: string;
  custom_frequency: string | null;
  assignee_id: string;
  status: string;
  next_run_date: string;
  last_run_date: string;
  created_at: string;
}

interface TimeEntryRow {
  id: string;
  task_id: string;
  client_id: string;
  member_id: string;
  date: string;
  duration_minutes: number;
  note: string | null;
}

interface AssetRow {
  id: string;
  client_id: string;
  filename: string;
  file_type: string;
  upload_date: string;
  uploaded_by: string;
  size: string;
  color: string;
}

interface AssetVersionRow {
  id: string;
  asset_id: string;
  date: string;
  note: string;
}

interface StrategyRow {
  id: string;
  client_id: string;
  name: string;
  quarter: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface StrategyPillarRow {
  id: string;
  strategy_id: string;
  name: string;
  description: string;
}

interface KPIRow {
  id: string;
  pillar_id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
}

interface ProjectRow {
  id: string;
  client_id: string;
  strategy_id: string | null;
  pillar_id: string | null;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  progress: number;
  workflow_template_id: string | null;
}

interface WorkflowTemplateRow {
  id: string;
  name: string;
  description: string;
  category: string;
  default_duration_days: number;
}

interface WorkflowStepRow {
  id: string;
  workflow_template_id: string;
  step_order: number;
  title: string;
  description: string;
  default_duration_days: number;
  assignee_role: string;
}

interface ServiceRow {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  default_cadence: string;
}

interface ClientServiceRow {
  id: string;
  client_id: string;
  service_id: string;
  status: string;
  start_date: string;
  monthly_cadence: string | null;
  linked_strategy_id: string | null;
}

interface ServiceStrategyRow {
  id: string;
  client_service_id: string;
  client_strategy_id: string;
  name: string;
  summary: string;
}

interface ServiceStrategyPillarRow {
  id: string;
  service_strategy_id: string;
  name: string;
  description: string;
}

interface ServiceStrategyKPIRow {
  id: string;
  service_strategy_id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
}

// ---------------------------------------------------------------------------
// Row → interface mappers
// ---------------------------------------------------------------------------

function mapTeamMember(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    initials: row.initials,
    color: row.color,
    isOwner: row.is_owner === 1 ? true : undefined,
  };
}

function mapClient(row: ClientRow): Client {
  return { id: row.id, name: row.name, industry: row.industry, location: row.location, color: row.color, logo: row.logo };
}

function mapTask(row: TaskRow, approvals: ApprovalEntry[], dependencies: string[]): Task {
  return {
    id: row.id,
    title: row.title,
    clientId: row.client_id,
    assigneeId: row.assignee_id,
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
    dueDate: row.due_date,
    startDate: row.start_date,
    endDate: row.end_date,
    description: row.description,
    isMilestone: row.is_milestone === 1 ? true : undefined,
    type: (row.type as Task['type']) ?? undefined,
    dependencies,
    approvalHistory: approvals,
  };
}

function mapApproval(row: ApprovalRow): ApprovalEntry {
  return {
    id: row.id,
    action: row.action as ApprovalEntry['action'],
    approverId: row.approver_id,
    timestamp: row.timestamp,
    note: row.note ?? undefined,
  };
}

function mapComment(row: CommentRow, replies: Comment[]): Comment {
  return {
    id: row.id,
    authorId: row.author_id,
    text: row.text,
    createdAt: row.created_at,
    replies,
  };
}

function mapDocumentVersion(row: DocumentVersionRow): DocumentVersion {
  return {
    id: row.id,
    version: row.version,
    authorId: row.author_id,
    createdAt: row.created_at,
    summary: row.summary,
  };
}

function mapDocument(
  row: DocumentRow,
  collaborators: string[],
  comments: Comment[],
  versions: DocumentVersion[]
): Document {
  return {
    id: row.id,
    title: row.title,
    clientId: row.client_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    collaborators,
    comments,
    versions,
  };
}

function mapTaskTemplate(row: TaskTemplateRow): TaskTemplate {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    defaultAssigneeRole: row.default_assignee_role,
    defaultPriority: row.default_priority as TaskTemplate['defaultPriority'],
    estimatedDuration: row.estimated_duration,
    type: (row.type as TaskTemplate['type']) ?? undefined,
    dueRule: row.due_rule,
    category: row.category,
  };
}

function mapAutomation(row: AutomationRow): Automation {
  return {
    id: row.id,
    clientId: row.client_id,
    templateId: row.template_id,
    frequency: row.frequency as Automation['frequency'],
    customFrequency: row.custom_frequency ?? undefined,
    assigneeId: row.assignee_id,
    status: row.status as Automation['status'],
    nextRunDate: row.next_run_date,
    lastRunDate: row.last_run_date,
    createdAt: row.created_at,
  };
}

function mapTimeEntry(row: TimeEntryRow): TimeEntry {
  return {
    id: row.id,
    taskId: row.task_id,
    clientId: row.client_id,
    memberId: row.member_id,
    date: row.date,
    durationMinutes: row.duration_minutes,
    note: row.note ?? undefined,
  };
}

function mapAsset(row: AssetRow, tags: string[], versions: Asset['versions']): Asset {
  return {
    id: row.id,
    clientId: row.client_id,
    filename: row.filename,
    fileType: row.file_type as Asset['fileType'],
    uploadDate: row.upload_date,
    uploadedBy: row.uploaded_by,
    size: row.size,
    color: row.color,
    tags,
    versions,
  };
}

function mapWorkflowStep(row: WorkflowStepRow, dependsOn: string[]): WorkflowStep {
  return {
    id: row.id,
    order: row.step_order,
    title: row.title,
    description: row.description,
    defaultDurationDays: row.default_duration_days,
    assigneeRole: row.assignee_role,
    dependsOn,
  };
}

function mapWorkflowTemplate(row: WorkflowTemplateRow, steps: WorkflowStep[]): WorkflowTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    defaultDurationDays: row.default_duration_days,
    steps,
  };
}

function mapStrategyPillar(row: StrategyPillarRow, projectIds: string[], kpis: KPI[]): StrategyPillar {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    projectIds,
    kpis,
  };
}

function mapStrategy(row: StrategyRow, pillars: StrategyPillar[]): Strategy {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    quarter: row.quarter,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as Strategy['status'],
    pillars,
  };
}

function mapProject(row: ProjectRow, taskIds: string[]): Project {
  return {
    id: row.id,
    clientId: row.client_id,
    strategyId: row.strategy_id ?? undefined,
    pillarId: row.pillar_id ?? undefined,
    name: row.name,
    description: row.description,
    status: row.status as Project['status'],
    startDate: row.start_date,
    endDate: row.end_date,
    progress: row.progress,
    workflowTemplateId: row.workflow_template_id ?? undefined,
    taskIds,
  };
}

function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Service['category'],
    description: row.description,
    icon: row.icon,
    defaultCadence: row.default_cadence as Service['defaultCadence'],
  };
}

function mapClientService(row: ClientServiceRow, linkedProjects: string[]): ClientService {
  return {
    id: row.id,
    clientId: row.client_id,
    serviceId: row.service_id,
    status: row.status as ClientService['status'],
    startDate: row.start_date,
    monthlyCadence: row.monthly_cadence ?? undefined,
    linkedStrategyId: row.linked_strategy_id ?? undefined,
    linkedProjects,
  };
}

function mapServiceStrategy(
  row: ServiceStrategyRow,
  pillars: ServiceStrategyPillar[],
  kpis: ServiceStrategyKPI[]
): ServiceStrategy {
  return {
    id: row.id,
    clientServiceId: row.client_service_id,
    clientStrategyId: row.client_strategy_id,
    name: row.name,
    summary: row.summary,
    pillars,
    kpis,
  };
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

const teamMembers = {
  getAll(): TeamMember[] {
    const rows = getDb().prepare('SELECT * FROM team_members').all() as TeamMemberRow[];
    return rows.map(mapTeamMember);
  },
  getById(id: string): TeamMember | undefined {
    const row = getDb().prepare('SELECT * FROM team_members WHERE id = ?').get(id) as TeamMemberRow | undefined;
    return row ? mapTeamMember(row) : undefined;
  },
};

const clients = {
  getAll(): Client[] {
    const rows = getDb().prepare('SELECT * FROM clients').all() as ClientRow[];
    return rows.map(mapClient);
  },
  getById(id: string): Client | undefined {
    const row = getDb().prepare('SELECT * FROM clients WHERE id = ?').get(id) as ClientRow | undefined;
    return row ? mapClient(row) : undefined;
  },
};

function loadTaskById(db: Database.Database, id: string): Task | undefined {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
  if (!row) return undefined;

  const approvalRows = db.prepare('SELECT * FROM approval_history WHERE task_id = ?').all(id) as ApprovalRow[];
  const depRows = db.prepare('SELECT depends_on_id FROM task_dependencies WHERE task_id = ?').all(id) as { depends_on_id: string }[];

  return mapTask(row, approvalRows.map(mapApproval), depRows.map(r => r.depends_on_id));
}

const tasks = {
  getAll(): Task[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM tasks').all() as TaskRow[];
    return rows.map(row => {
      const approvalRows = db.prepare('SELECT * FROM approval_history WHERE task_id = ?').all(row.id) as ApprovalRow[];
      const depRows = db.prepare('SELECT depends_on_id FROM task_dependencies WHERE task_id = ?').all(row.id) as { depends_on_id: string }[];
      return mapTask(row, approvalRows.map(mapApproval), depRows.map(r => r.depends_on_id));
    });
  },
  getById(id: string): Task | undefined {
    return loadTaskById(getDb(), id);
  },
  getByClientId(clientId: string): Task[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM tasks WHERE client_id = ?').all(clientId) as TaskRow[];
    return rows.map(row => {
      const approvalRows = db.prepare('SELECT * FROM approval_history WHERE task_id = ?').all(row.id) as ApprovalRow[];
      const depRows = db.prepare('SELECT depends_on_id FROM task_dependencies WHERE task_id = ?').all(row.id) as { depends_on_id: string }[];
      return mapTask(row, approvalRows.map(mapApproval), depRows.map(r => r.depends_on_id));
    });
  },
  getByStatus(status: Task['status']): Task[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM tasks WHERE status = ?').all(status) as TaskRow[];
    return rows.map(row => {
      const approvalRows = db.prepare('SELECT * FROM approval_history WHERE task_id = ?').all(row.id) as ApprovalRow[];
      const depRows = db.prepare('SELECT depends_on_id FROM task_dependencies WHERE task_id = ?').all(row.id) as { depends_on_id: string }[];
      return mapTask(row, approvalRows.map(mapApproval), depRows.map(r => r.depends_on_id));
    });
  },
  getByAssignee(assigneeId: string): Task[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM tasks WHERE assignee_id = ?').all(assigneeId) as TaskRow[];
    return rows.map(row => {
      const approvalRows = db.prepare('SELECT * FROM approval_history WHERE task_id = ?').all(row.id) as ApprovalRow[];
      const depRows = db.prepare('SELECT depends_on_id FROM task_dependencies WHERE task_id = ?').all(row.id) as { depends_on_id: string }[];
      return mapTask(row, approvalRows.map(mapApproval), depRows.map(r => r.depends_on_id));
    });
  },
};

function loadDocumentById(db: Database.Database, id: string): Document | undefined {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as DocumentRow | undefined;
  if (!row) return undefined;

  const collabRows = db.prepare('SELECT team_member_id FROM document_collaborators WHERE document_id = ?').all(id) as { team_member_id: string }[];
  const collaborators = collabRows.map(r => r.team_member_id);

  const versionRows = db.prepare('SELECT * FROM document_versions WHERE document_id = ? ORDER BY created_at DESC').all(id) as DocumentVersionRow[];
  const versions = versionRows.map(mapDocumentVersion);

  const allCommentRows = db.prepare('SELECT * FROM comments WHERE document_id = ? ORDER BY created_at ASC').all(id) as CommentRow[];
  const topLevel = allCommentRows.filter(c => !c.parent_comment_id);
  const replies = allCommentRows.filter(c => !!c.parent_comment_id);

  const comments: Comment[] = topLevel.map(c => {
    const commentReplies = replies
      .filter(r => r.parent_comment_id === c.id)
      .map(r => mapComment(r, []));
    return mapComment(c, commentReplies);
  });

  return mapDocument(row, collaborators, comments, versions);
}

const documents = {
  getAll(): Document[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM documents').all() as DocumentRow[];
    return rows.map(row => loadDocumentById(db, row.id)!);
  },
  getById(id: string): Document | undefined {
    return loadDocumentById(getDb(), id);
  },
  getByClientId(clientId: string): Document[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM documents WHERE client_id = ? OR client_id = 'all'").all(clientId) as DocumentRow[];
    return rows.map(row => loadDocumentById(db, row.id)!);
  },
};

const taskTemplates = {
  getAll(): TaskTemplate[] {
    const rows = getDb().prepare('SELECT * FROM task_templates').all() as TaskTemplateRow[];
    return rows.map(mapTaskTemplate);
  },
  getById(id: string): TaskTemplate | undefined {
    const row = getDb().prepare('SELECT * FROM task_templates WHERE id = ?').get(id) as TaskTemplateRow | undefined;
    return row ? mapTaskTemplate(row) : undefined;
  },
};

const automations = {
  getAll(): Automation[] {
    const rows = getDb().prepare('SELECT * FROM automations').all() as AutomationRow[];
    return rows.map(mapAutomation);
  },
  getByClientId(clientId: string): Automation[] {
    const rows = getDb().prepare('SELECT * FROM automations WHERE client_id = ?').all(clientId) as AutomationRow[];
    return rows.map(mapAutomation);
  },
};

const timeEntries = {
  getAll(): TimeEntry[] {
    const rows = getDb().prepare('SELECT * FROM time_entries').all() as TimeEntryRow[];
    return rows.map(mapTimeEntry);
  },
  getByTaskId(taskId: string): TimeEntry[] {
    const rows = getDb().prepare('SELECT * FROM time_entries WHERE task_id = ?').all(taskId) as TimeEntryRow[];
    return rows.map(mapTimeEntry);
  },
  getByClientId(clientId: string): TimeEntry[] {
    const rows = getDb().prepare('SELECT * FROM time_entries WHERE client_id = ?').all(clientId) as TimeEntryRow[];
    return rows.map(mapTimeEntry);
  },
  getByMemberId(memberId: string): TimeEntry[] {
    const rows = getDb().prepare('SELECT * FROM time_entries WHERE member_id = ?').all(memberId) as TimeEntryRow[];
    return rows.map(mapTimeEntry);
  },
};

function loadAssetById(db: Database.Database, id: string): Asset | undefined {
  const row = db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as AssetRow | undefined;
  if (!row) return undefined;

  const tagRows = db.prepare('SELECT tag FROM asset_tags WHERE asset_id = ?').all(id) as { tag: string }[];
  const tags = tagRows.map(r => r.tag);

  const versionRows = db.prepare('SELECT * FROM asset_versions WHERE asset_id = ? ORDER BY date ASC').all(id) as AssetVersionRow[];
  const versions = versionRows.map(v => ({ id: v.id, date: v.date, note: v.note }));

  return mapAsset(row, tags, versions);
}

const assets = {
  getAll(): Asset[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM assets').all() as AssetRow[];
    return rows.map(row => loadAssetById(db, row.id)!);
  },
  getById(id: string): Asset | undefined {
    return loadAssetById(getDb(), id);
  },
  getByClientId(clientId: string): Asset[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM assets WHERE client_id = ?').all(clientId) as AssetRow[];
    return rows.map(row => loadAssetById(db, row.id)!);
  },
};

function loadWorkflowTemplateById(db: Database.Database, id: string): WorkflowTemplate | undefined {
  const row = db.prepare('SELECT * FROM workflow_templates WHERE id = ?').get(id) as WorkflowTemplateRow | undefined;
  if (!row) return undefined;

  const stepRows = db.prepare('SELECT * FROM workflow_steps WHERE workflow_template_id = ? ORDER BY step_order ASC').all(id) as WorkflowStepRow[];
  const steps: WorkflowStep[] = stepRows.map(s => {
    const depRows = db.prepare('SELECT depends_on_id FROM workflow_step_dependencies WHERE step_id = ?').all(s.id) as { depends_on_id: string }[];
    return mapWorkflowStep(s, depRows.map(d => d.depends_on_id));
  });

  return mapWorkflowTemplate(row, steps);
}

const workflowTemplates = {
  getAll(): WorkflowTemplate[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM workflow_templates').all() as WorkflowTemplateRow[];
    return rows.map(row => loadWorkflowTemplateById(db, row.id)!);
  },
  getById(id: string): WorkflowTemplate | undefined {
    return loadWorkflowTemplateById(getDb(), id);
  },
};

function loadStrategyById(db: Database.Database, id: string): Strategy | undefined {
  const row = db.prepare('SELECT * FROM strategies WHERE id = ?').get(id) as StrategyRow | undefined;
  if (!row) return undefined;

  const pillarRows = db.prepare('SELECT * FROM strategy_pillars WHERE strategy_id = ?').all(id) as StrategyPillarRow[];
  const pillars: StrategyPillar[] = pillarRows.map(p => {
    const projRows = db.prepare('SELECT project_id FROM strategy_pillar_projects WHERE pillar_id = ?').all(p.id) as { project_id: string }[];
    const kpiRows = db.prepare('SELECT * FROM strategy_kpis WHERE pillar_id = ?').all(p.id) as KPIRow[];
    const kpis: KPI[] = kpiRows.map(k => ({
      id: k.id,
      name: k.name,
      target: k.target,
      current: k.current,
      unit: k.unit,
    }));
    return mapStrategyPillar(p, projRows.map(r => r.project_id), kpis);
  });

  return mapStrategy(row, pillars);
}

const strategies = {
  getAll(): Strategy[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM strategies').all() as StrategyRow[];
    return rows.map(row => loadStrategyById(db, row.id)!);
  },
  getById(id: string): Strategy | undefined {
    return loadStrategyById(getDb(), id);
  },
  getByClientId(clientId: string): Strategy[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM strategies WHERE client_id = ?').all(clientId) as StrategyRow[];
    return rows.map(row => loadStrategyById(db, row.id)!);
  },
};

function loadProjectById(db: Database.Database, id: string): Project | undefined {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow | undefined;
  if (!row) return undefined;

  const taskRows = db.prepare('SELECT task_id FROM project_task_links WHERE project_id = ?').all(id) as { task_id: string }[];
  return mapProject(row, taskRows.map(r => r.task_id));
}

const projects = {
  getAll(): Project[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM projects').all() as ProjectRow[];
    return rows.map(row => loadProjectById(db, row.id)!);
  },
  getById(id: string): Project | undefined {
    return loadProjectById(getDb(), id);
  },
  getByClientId(clientId: string): Project[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM projects WHERE client_id = ?').all(clientId) as ProjectRow[];
    return rows.map(row => loadProjectById(db, row.id)!);
  },
  getByStrategyId(strategyId: string): Project[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM projects WHERE strategy_id = ?').all(strategyId) as ProjectRow[];
    return rows.map(row => loadProjectById(db, row.id)!);
  },
};

const services = {
  getAll(): Service[] {
    const rows = getDb().prepare('SELECT * FROM services').all() as ServiceRow[];
    return rows.map(mapService);
  },
  getById(id: string): Service | undefined {
    const row = getDb().prepare('SELECT * FROM services WHERE id = ?').get(id) as ServiceRow | undefined;
    return row ? mapService(row) : undefined;
  },
};

function loadClientServiceById(db: Database.Database, id: string): ClientService | undefined {
  const row = db.prepare('SELECT * FROM client_services WHERE id = ?').get(id) as ClientServiceRow | undefined;
  if (!row) return undefined;

  const projRows = db.prepare('SELECT project_id FROM client_service_projects WHERE client_service_id = ?').all(id) as { project_id: string }[];
  return mapClientService(row, projRows.map(r => r.project_id));
}

const clientServices = {
  getAll(): ClientService[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM client_services').all() as ClientServiceRow[];
    return rows.map(row => loadClientServiceById(db, row.id)!);
  },
  getByClientId(clientId: string): ClientService[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM client_services WHERE client_id = ?').all(clientId) as ClientServiceRow[];
    return rows.map(row => loadClientServiceById(db, row.id)!);
  },
  getById(id: string): ClientService | undefined {
    return loadClientServiceById(getDb(), id);
  },
};

function loadServiceStrategyById(db: Database.Database, id: string): ServiceStrategy | undefined {
  const row = db.prepare('SELECT * FROM service_strategies WHERE id = ?').get(id) as ServiceStrategyRow | undefined;
  if (!row) return undefined;

  const pillarRows = db.prepare('SELECT * FROM service_strategy_pillars WHERE service_strategy_id = ?').all(id) as ServiceStrategyPillarRow[];
  const kpiRows = db.prepare('SELECT * FROM service_strategy_kpis WHERE service_strategy_id = ?').all(id) as ServiceStrategyKPIRow[];

  const pillars: ServiceStrategyPillar[] = pillarRows.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
  }));
  const kpis: ServiceStrategyKPI[] = kpiRows.map(k => ({
    id: k.id,
    name: k.name,
    target: k.target,
    current: k.current,
    unit: k.unit,
  }));

  return mapServiceStrategy(row, pillars, kpis);
}

const serviceStrategies = {
  getAll(): ServiceStrategy[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM service_strategies').all() as ServiceStrategyRow[];
    return rows.map(row => loadServiceStrategyById(db, row.id)!);
  },
  getByClientServiceId(clientServiceId: string): ServiceStrategy[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM service_strategies WHERE client_service_id = ?').all(clientServiceId) as ServiceStrategyRow[];
    return rows.map(row => loadServiceStrategyById(db, row.id)!);
  },
};

// ---------------------------------------------------------------------------
// Summary query helpers
// ---------------------------------------------------------------------------

interface TaskSummary {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

const analytics = {
  getTaskSummary(clientId?: string): TaskSummary {
    const db = getDb();
    const where = clientId ? 'WHERE client_id = ?' : '';
    const params = clientId ? [clientId] : [];

    const total = (db.prepare(`SELECT COUNT(*) as n FROM tasks ${where}`).get(...params) as { n: number }).n;

    const statusRows = db
      .prepare(`SELECT status, COUNT(*) as n FROM tasks ${where} GROUP BY status`)
      .all(...params) as { status: string; n: number }[];
    const byStatus: Record<string, number> = {};
    for (const r of statusRows) byStatus[r.status] = r.n;

    const priorityRows = db
      .prepare(`SELECT priority, COUNT(*) as n FROM tasks ${where} GROUP BY priority`)
      .all(...params) as { priority: string; n: number }[];
    const byPriority: Record<string, number> = {};
    for (const r of priorityRows) byPriority[r.priority] = r.n;

    return { total, byStatus, byPriority };
  },

  getTotalHoursByMember(): { memberId: string; totalMinutes: number }[] {
    const rows = getDb()
      .prepare('SELECT member_id, SUM(duration_minutes) as total_minutes FROM time_entries GROUP BY member_id')
      .all() as { member_id: string; total_minutes: number }[];
    return rows.map(r => ({ memberId: r.member_id, totalMinutes: r.total_minutes }));
  },

  getTotalHoursByClient(): { clientId: string; totalMinutes: number }[] {
    const rows = getDb()
      .prepare('SELECT client_id, SUM(duration_minutes) as total_minutes FROM time_entries GROUP BY client_id')
      .all() as { client_id: string; total_minutes: number }[];
    return rows.map(r => ({ clientId: r.client_id, totalMinutes: r.total_minutes }));
  },
};

// ---------------------------------------------------------------------------
// Exported db object
// ---------------------------------------------------------------------------

export const db = {
  teamMembers,
  clients,
  tasks,
  documents,
  taskTemplates,
  automations,
  timeEntries,
  assets,
  workflowTemplates,
  strategies,
  projects,
  services,
  clientServices,
  serviceStrategies,
  analytics,
  /** Expose raw connection for advanced queries */
  raw: getDb,
  close: closeDb,
};

export default db;
