/**
 * Supabase data queries — returns data in the same shape as lib/data.ts
 * so UI components need no changes beyond swapping the import.
 */
import { createServerClient } from './client';
import type {
  Client, ClientPillar, ClientPillarKpi, TeamMember, Task, ApprovalEntry, Document, Comment, DocumentVersion,
  DocumentFolder, RecurringTemplate,
  TaskTemplate, Automation, TimeEntry, Asset, WorkflowTemplate,
  WorkflowStep, Strategy, StrategyPillar, KPI, Project, Service,
  ClientService, ServiceStrategy, ServiceStrategyPillar, ServiceStrategyKPI,
  KBCategory, KBArticle, KBArticleVersion,
  ClientGoal, GoalPillarLink, FocusArea, Outcome, StrategyGoalLink,
} from '@/lib/data';

type AssetVersion = { id: string; date: string; note: string };

// ─── Row types (snake_case from Supabase) ────────────────────────────────────

type Row = Record<string, unknown>;

// ─── Transform helpers ────────────────────────────────────────────────────────

function toClient(r: Row): Client {
  return {
    id: r.id as string,
    name: r.name as string,
    industry: r.industry as string,
    location: r.location as string,
    color: r.color as string,
    logo: r.logo as string,
  };
}

function toTeamMember(r: Row): TeamMember {
  return {
    id: r.id as string,
    name: r.name as string,
    role: r.role as string,
    initials: r.initials as string,
    color: r.color as string,
    isOwner: r.is_owner as boolean,
  };
}

function toClientPillar(r: Row): ClientPillar {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    name: r.name as string,
    color: r.color as string,
    description: r.description as string,
    createdAt: r.created_at as string,
    document: r.document as Record<string, unknown> | null,
  };
}

function toClientPillarKpi(r: Row): ClientPillarKpi {
  return {
    id: r.id as string,
    clientPillarId: r.client_pillar_id as string,
    name: r.name as string,
    target: parseFloat(r.target as string) || 0,
    current: parseFloat(r.current as string) || 0,
    unit: (r.unit as string) || '',
  };
}

function toTask(r: Row, deps: string[], approvals: ApprovalEntry[]): Task {
  return {
    id: r.id as string,
    title: r.title as string,
    clientId: r.client_id as string,
    assigneeId: r.assignee_id as string,
    status: r.status as Task['status'],
    priority: r.priority as Task['priority'],
    dueDate: r.due_date as string,
    startDate: r.start_date as string,
    endDate: r.end_date as string,
    description: r.description as string,
    isMilestone: r.is_milestone as boolean,
    type: r.type as Task['type'],
    dependencies: deps,
    approvalHistory: approvals,
    pillarId: (r.pillar_id as string) || undefined,
    clientPillarId: (r.client_pillar_id as string) || null,
    isAdhoc: Boolean(r.is_adhoc),
    requestNotes: (r.request_notes as string) || undefined,
    recurringTemplateId: (r.recurring_template_id as string) || null,
    recurrenceInstanceDate: (r.recurrence_instance_date as string) || null,
  };
}

function toRecurringTemplate(r: Row): RecurringTemplate {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    pillarId: (r.pillar_id as string) || null,
    clientPillarId: (r.client_pillar_id as string) || null,
    title: r.title as string,
    description: r.description as string,
    assigneeId: (r.assignee_id as string) || null,
    priority: r.priority as string,
    type: r.type as string,
    recurrenceType: r.recurrence_type as 'daily' | 'weekly' | 'biweekly' | 'monthly',
    recurrenceDays: (r.recurrence_days as number[] | null) || null,
    recurrenceDayOfMonth: (r.recurrence_day_of_month as number) || null,
    advanceDays: r.advance_days as number,
    active: r.active as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function toApprovalEntry(r: Row): ApprovalEntry {
  return {
    id: r.id as string,
    action: r.action as 'approved' | 'rejected',
    approverId: r.approver_id as string,
    timestamp: r.timestamp as string,
    note: (r.note as string) || undefined,
  };
}

function toDocument(r: Row, collaborators: string[], versions: DocumentVersion[], comments: Comment[]): Document & { type?: string; yjsState?: string } {
  return {
    id: r.id as string,
    title: r.title as string,
    clientId: r.client_id as string,
    content: r.content as string,
    type: ((r.type as string) || 'client') as 'client' | 'internal',
    yjsState: r.yjs_state as string | undefined,
    folderId: (r.folder_id as string | null) || null,
    createdAt: (r.created_at as string).split('T')[0],
    updatedAt: (r.updated_at as string).split('T')[0],
    collaborators,
    versions,
    comments,
  };
}

function toDocumentFolder(r: Row): DocumentFolder {
  return {
    id: r.id as string,
    name: r.name as string,
    parentId: (r.parent_id as string | null) || null,
    clientId: (r.client_id as string | null) || null,
    color: (r.color as string) || '#6366f1',
    createdAt: r.created_at as string,
    archivedAt: (r.archived_at as string | null) || null,
  };
}

function toDocumentVersion(r: Row): DocumentVersion {
  return {
    id: r.id as string,
    version: r.version as string,
    authorId: r.author_id as string,
    createdAt: (r.created_at as string).substring(0, 10),
    summary: r.summary as string,
  };
}

function toComment(r: Row, replies: Comment[]): Comment {
  return {
    id: r.id as string,
    authorId: r.author_id as string,
    text: r.text as string,
    createdAt: r.created_at as string,
    replies,
  };
}

function toTaskTemplate(r: Row): TaskTemplate {
  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    defaultAssigneeRole: r.default_assignee_role as string,
    defaultPriority: r.default_priority as Task['priority'],
    estimatedDuration: r.estimated_duration as number,
    type: r.type as Task['type'],
    dueRule: r.due_rule as string,
    category: r.category as string,
  };
}

function toAutomation(r: Row): Automation {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    templateId: r.template_id as string,
    frequency: r.frequency as 'monthly' | 'weekly' | 'custom',
    customFrequency: r.custom_frequency as string | undefined,
    assigneeId: r.assignee_id as string,
    status: r.status as 'active' | 'paused',
    nextRunDate: r.next_run_date as string,
    lastRunDate: r.last_run_date as string,
    createdAt: (r.created_at as string) || '',
  };
}

function toTimeEntry(r: Row): TimeEntry {
  return {
    id: r.id as string,
    taskId: r.task_id as string,
    clientId: r.client_id as string,
    memberId: r.member_id as string,
    date: r.date as string,
    durationMinutes: r.duration_minutes as number,
    note: r.note as string | undefined,
  };
}

function toAsset(r: Row, tags: string[], versions: AssetVersion[]): Asset & { storagePath?: string; storageUrl?: string } {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    filename: r.filename as string,
    fileType: r.file_type as Asset['fileType'],
    uploadDate: r.upload_date as string,
    uploadedBy: r.uploaded_by as string,
    size: r.size as string,
    color: r.color as string,
    storagePath: (r.storage_path as string) || undefined,
    storageUrl: (r.storage_url as string) || undefined,
    tags,
    versions,
  };
}

function toAssetVersion(r: Row): AssetVersion {
  return {
    id: r.id as string,
    date: r.date as string,
    note: r.note as string,
  };
}

function toWorkflowTemplate(r: Row, steps: WorkflowStep[]): WorkflowTemplate {
  return {
    id: r.id as string,
    name: r.name as string,
    description: r.description as string,
    category: r.category as string,
    defaultDurationDays: r.default_duration_days as number,
    steps,
  };
}

function toWorkflowStep(r: Row, dependsOn: string[]): WorkflowStep {
  return {
    id: r.id as string,
    order: r.step_order as number,
    title: r.title as string,
    description: r.description as string,
    defaultDurationDays: r.default_duration_days as number,
    assigneeRole: r.assignee_role as string,
    dependsOn,
  };
}

function toStrategy(r: Row, pillars: StrategyPillar[]): Strategy {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    name: r.name as string,
    description: r.description as string ?? '',
    quarter: r.quarter as string,
    startDate: r.start_date as string,
    endDate: r.end_date as string,
    status: r.status as Strategy['status'],
    pillars,
  };
}

function toStrategyPillar(r: Row, projectIds: string[], kpis: KPI[]): StrategyPillar {
  return {
    id: r.id as string,
    name: r.name as string,
    description: r.description as string,
    projectIds,
    kpis,
  };
}

function toKPI(r: Row): KPI {
  return {
    id: r.id as string,
    name: r.name as string,
    target: r.target as number,
    current: r.current as number,
    unit: r.unit as string,
  };
}

function toProject(r: Row, taskIds: string[]): Project {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    strategyId: r.strategy_id as string | undefined,
    pillarId: r.pillar_id as string | undefined,
    clientPillarId: (r.client_pillar_id as string) || null,
    focusAreaId: (r.focus_area_id as string) || null,
    name: r.name as string,
    description: r.description as string,
    status: r.status as Project['status'],
    startDate: r.start_date as string,
    endDate: r.end_date as string,
    progress: r.progress as number,
    workflowTemplateId: r.workflow_template_id as string | undefined,
    taskIds,
    type: r.type as string | undefined,
  };
}

function toService(r: Row): Service {
  return {
    id: r.id as string,
    name: r.name as string,
    category: r.category as Service['category'],
    description: r.description as string,
    icon: r.icon as string,
    defaultCadence: r.default_cadence as Service['defaultCadence'],
  };
}

function toClientService(r: Row, linkedProjects: string[]): ClientService {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    serviceId: r.service_id as string,
    status: r.status as ClientService['status'],
    startDate: r.start_date as string,
    monthlyCadence: r.monthly_cadence as string | undefined,
    linkedStrategyId: r.linked_strategy_id as string | undefined,
    linkedProjects,
  };
}

function toServiceStrategy(r: Row, pillars: ServiceStrategyPillar[], kpis: ServiceStrategyKPI[]): ServiceStrategy {
  return {
    id: r.id as string,
    clientServiceId: r.client_service_id as string,
    clientStrategyId: r.client_strategy_id as string,
    name: r.name as string,
    summary: r.summary as string,
    pillars,
    kpis,
  };
}

function toServiceStrategyPillar(r: Row): ServiceStrategyPillar {
  return {
    id: r.id as string,
    name: r.name as string,
    description: r.description as string,
  };
}

function toServiceStrategyKPI(r: Row): ServiceStrategyKPI {
  return {
    id: r.id as string,
    name: r.name as string,
    target: r.target as number,
    current: r.current as number,
    unit: r.unit as string,
  };
}

function toKBCategory(r: Row): KBCategory {
  return {
    id: r.id as string,
    name: r.name as string,
    description: r.description as string | undefined,
    createdAt: r.created_at as string,
  };
}

function toKBArticle(r: Row): KBArticle {
  return {
    id: r.id as string,
    title: r.title as string,
    content: r.content as Record<string, unknown> | null,
    yjsState: r.yjs_state as string | undefined,
    categoryId: r.category_id as string | undefined,
    tags: (r.tags as string[]) || [],
    visibility: r.visibility as 'internal' | 'all',
    authorId: r.author_id as string | undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

// ─── Main data fetcher ────────────────────────────────────────────────────────

export interface AppData {
  CLIENTS: Client[];
  CLIENT_PILLARS: ClientPillar[];
  CLIENT_PILLAR_KPIS: ClientPillarKpi[];
  STRATEGY_TARGETED_PILLARS: Row[];
  TEAM_MEMBERS: TeamMember[];
  TASKS: Task[];
  DOCUMENTS: Document[];
  DOCUMENT_FOLDERS: DocumentFolder[];
  RECURRING_TEMPLATES: RecurringTemplate[];
  TASK_TEMPLATES: TaskTemplate[];
  AUTOMATIONS: Automation[];
  TIME_ENTRIES: TimeEntry[];
  ASSETS: Asset[];
  WORKFLOW_TEMPLATES: WorkflowTemplate[];
  STRATEGIES: Strategy[];
  PROJECTS: Project[];
  SERVICES: Service[];
  CLIENT_SERVICES: ClientService[];
  SERVICE_STRATEGIES: ServiceStrategy[];
  KB_CATEGORIES: KBCategory[];
  KB_ARTICLES: KBArticle[];
  PRIORITY_DOT: Record<string, string>;
  CLIENT_GOALS: ClientGoal[];
  GOAL_PILLAR_LINKS: GoalPillarLink[];
  STRATEGY_GOAL_LINKS: StrategyGoalLink[];
  FOCUS_AREAS: FocusArea[];
  OUTCOMES: Outcome[];
}

// ─── Goals & Outcomes transform helpers ──────────────────────────────────────

function toClientGoal(r: Row): ClientGoal {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    title: r.title as string,
    description: (r.description as string) || null,
    targetMetric: (r.target_metric as string) || null,
    status: r.status as ClientGoal['status'],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function toGoalPillarLink(r: Row): GoalPillarLink {
  return {
    id: r.id as string,
    goalId: r.goal_id as string,
    pillarId: r.pillar_id as string,
  };
}

function toStrategyGoalLink(r: Row): StrategyGoalLink {
  return {
    id: r.id as string,
    strategyId: r.strategy_id as string,
    goalId: r.goal_id as string,
    createdAt: r.created_at as string,
  };
}

function toFocusArea(r: Row): FocusArea {
  return {
    id: r.id as string,
    pillarId: r.pillar_id as string,
    clientId: r.client_id as string,
    name: r.name as string,
    description: (r.description as string) || null,
    status: r.status as FocusArea['status'],
    createdAt: r.created_at as string,
  };
}

function toOutcome(r: Row): Outcome {
  return {
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
  };
}

// ─── Standalone fetch functions ───────────────────────────────────────────────

export async function fetchClientGoals(clientId: string): Promise<ClientGoal[]> {
  const db = createServerClient();
  const { data, error } = await db
    .from('client_goals')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toClientGoal);
}

export async function fetchGoalPillarLinks(clientId: string): Promise<GoalPillarLink[]> {
  const db = createServerClient();
  const { data, error } = await db
    .from('goal_pillar_links')
    .select('*, client_goals!inner(client_id)')
    .eq('client_goals.client_id', clientId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(toGoalPillarLink);
}

export async function fetchAllGoalPillarLinks(): Promise<GoalPillarLink[]> {
  const db = createServerClient();
  const { data, error } = await db.from('goal_pillar_links').select('*');
  if (error) throw new Error(error.message);
  return (data ?? []).map(toGoalPillarLink);
}

export async function fetchFocusAreas(clientId: string): Promise<FocusArea[]> {
  const db = createServerClient();
  const { data, error } = await db
    .from('focus_areas')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toFocusArea);
}

export async function fetchOutcomes(clientId: string): Promise<Outcome[]> {
  const db = createServerClient();
  const { data, error } = await db
    .from('outcomes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toOutcome);
}

export const PRIORITY_DOT: Record<string, string> = {
  Low: 'bg-gray-400',
  Medium: 'bg-blue-400',
  High: 'bg-amber-400',
  Urgent: 'bg-red-500',
};

export async function getAllData(): Promise<AppData> {
  const db = createServerClient();

  // Fetch all tables in parallel
  const [
    clientsRes, teamRes, tasksRes, taskDepsRes, approvalsRes,
    clientPillarsRes, clientPillarKpisRes,
    docsRes, docCollabRes, docVersionsRes, commentsRes,
    templatesRes, automationsRes, timeRes,
    assetsRes, assetVersionsRes, assetTagsRes,
    wfTemplatesRes, wfStepsRes, wfStepDepsRes,
    strategiesRes, stratPillarsRes, stratKpisRes, stratPillarProjectsRes, strategyTargetedPillarsRes,
    projectsRes, projectTasksRes,
    servicesRes, clientServicesRes, csProjectsRes,
    ssRes, ssPillarsRes, ssKpisRes,
    kbCategoriesRes, kbArticlesRes,
    docFoldersRes,
    recurringTemplatesRes,
    clientGoalsRes, goalPillarLinksRes, strategyGoalLinksRes, focusAreasRes, outcomesRes,
  ] = await Promise.all([
    db.from('clients').select('*').is('archived_at', null),
    db.from('team_members').select('*').is('archived_at', null),
    db.from('tasks').select('*').is('archived_at', null),
    db.from('task_dependencies').select('*'),
    db.from('approval_history').select('*'),
    db.from('client_pillars').select('*'),
    db.from('client_pillar_kpis').select('*'),
    db.from('documents').select('*'),
    db.from('document_collaborators').select('*'),
    db.from('document_versions').select('*'),
    db.from('comments').select('*'),
    db.from('task_templates').select('*'),
    db.from('automations').select('*').is('archived_at', null),
    db.from('time_entries').select('*').is('archived_at', null),
    db.from('assets').select('*').is('archived_at', null),
    db.from('asset_versions').select('*'),
    db.from('asset_tags').select('*'),
    db.from('workflow_templates').select('*'),
    db.from('workflow_steps').select('*'),
    db.from('workflow_step_dependencies').select('*'),
    db.from('strategies').select('*').is('archived_at', null),
    db.from('strategy_pillars').select('*').is('archived_at', null),
    db.from('strategy_kpis').select('*').is('archived_at', null),
    db.from('strategy_pillar_projects').select('*'),
    db.from('strategy_targeted_pillars').select('*'),
    db.from('projects').select('*').is('archived_at', null),
    db.from('project_task_links').select('*'),
    db.from('services').select('*'),
    db.from('client_services').select('*').is('archived_at', null),
    db.from('client_service_projects').select('*'),
    db.from('service_strategies').select('*'),
    db.from('service_strategy_pillars').select('*'),
    db.from('service_strategy_kpis').select('*'),
    db.from('kb_categories').select('*').is('archived_at', null),
    db.from('kb_articles').select('*').is('archived_at', null),
    db.from('document_folders').select('*').is('archived_at', null),
    db.from('recurring_task_templates').select('*').eq('active', true),
    db.from('client_goals').select('*'),
    db.from('goal_pillar_links').select('*'),
    db.from('strategy_goal_links').select('*'),
    db.from('focus_areas').select('*'),
    db.from('outcomes').select('*'),
  ]);

  const clients = clientsRes.data ?? [];
  const teamMembers = teamRes.data ?? [];
  const taskRows = tasksRes.data ?? [];
  const taskDeps = taskDepsRes.data ?? [];
  const approvalRows = approvalsRes.data ?? [];
  const clientPillarRows = clientPillarsRes.data ?? [];
  const clientPillarKpiRows = clientPillarKpisRes.data ?? [];
  const docRows = docsRes.data ?? [];
  const docCollabs = docCollabRes.data ?? [];
  const docVersionRows = docVersionsRes.data ?? [];
  const commentRows = commentsRes.data ?? [];
  const templateRows = templatesRes.data ?? [];
  const automationRows = automationsRes.data ?? [];
  const timeRows = timeRes.data ?? [];
  const assetRows = assetsRes.data ?? [];
  const assetVersionRows = assetVersionsRes.data ?? [];
  const assetTagRows = assetTagsRes.data ?? [];
  const wfTemplateRows = wfTemplatesRes.data ?? [];
  const wfStepRows = wfStepsRes.data ?? [];
  const wfStepDepRows = wfStepDepsRes.data ?? [];
  const strategyRows = strategiesRes.data ?? [];
  const stratPillarRows = stratPillarsRes.data ?? [];
  const stratKpiRows = stratKpisRes.data ?? [];
  const stratPillarProjectRows = stratPillarProjectsRes.data ?? [];
  const strategyTargetedPillarRows = strategyTargetedPillarsRes.data ?? [];
  const projectRows = projectsRes.data ?? [];
  const projectTaskRows = projectTasksRes.data ?? [];
  const serviceRows = servicesRes.data ?? [];
  const clientServiceRows = clientServicesRes.data ?? [];
  const csProjectRows = csProjectsRes.data ?? [];
  const ssRows = ssRes.data ?? [];
  const ssPillarRows = ssPillarsRes.data ?? [];
  const ssKpiRows = ssKpisRes.data ?? [];
  const kbCategoryRows = kbCategoriesRes.data ?? [];
  const kbArticleRows = kbArticlesRes.data ?? [];
  const docFolderRows = docFoldersRes.data ?? [];

  // ── Build TASKS ──
  const TASKS: Task[] = taskRows.map((r) => {
    const deps = taskDeps.filter(d => d.task_id === r.id).map(d => d.depends_on_id as string);
    const approvals = approvalRows
      .filter(a => a.task_id === r.id)
      .map(toApprovalEntry);
    return toTask(r, deps, approvals);
  });

  // ── Build DOCUMENTS ──
  // Build nested comments (replies)
  const topComments = commentRows.filter(c => !c.parent_comment_id);
  const buildComment = (r: Row): Comment => {
    const replies = commentRows
      .filter(c => c.parent_comment_id === r.id)
      .map(buildComment);
    return toComment(r, replies);
  };
  const DOCUMENTS: Document[] = docRows.map((r) => {
    const collaborators = docCollabs
      .filter(dc => dc.document_id === r.id)
      .map(dc => dc.team_member_id as string);
    const versions = docVersionRows
      .filter(v => v.document_id === r.id)
      .map(toDocumentVersion);
    const comments = topComments
      .filter(c => c.document_id === r.id)
      .map(buildComment);
    return toDocument(r, collaborators, versions, comments);
  });

  // ── Build ASSETS ──
  const ASSETS: Asset[] = assetRows.map((r) => {
    const tags = assetTagRows
      .filter(t => t.asset_id === r.id)
      .map(t => t.tag as string);
    const versions = assetVersionRows
      .filter(v => v.asset_id === r.id)
      .map(toAssetVersion);
    return toAsset(r, tags, versions);
  });

  // ── Build WORKFLOW_TEMPLATES ──
  const wfStepsWithDeps: WorkflowStep[] = wfStepRows.map((r) => {
    const deps = wfStepDepRows
      .filter(d => d.step_id === r.id)
      .map(d => d.depends_on_id as string);
    return toWorkflowStep(r, deps);
  });
  const WORKFLOW_TEMPLATES: WorkflowTemplate[] = wfTemplateRows.map((r) => {
    const steps = wfStepsWithDeps
      .filter(s => (wfStepRows.find(sr => sr.id === s.id) as Row)?.workflow_template_id === r.id)
      .sort((a, b) => a.order - b.order);
    return toWorkflowTemplate(r, steps);
  });

  // ── Build STRATEGIES ──
  const stratKpisMap = new Map<string, KPI[]>();
  stratKpiRows.forEach(r => {
    const pillarId = r.pillar_id as string;
    if (!stratKpisMap.has(pillarId)) stratKpisMap.set(pillarId, []);
    stratKpisMap.get(pillarId)!.push(toKPI(r));
  });
  const stratPillarProjectMap = new Map<string, string[]>();
  stratPillarProjectRows.forEach(r => {
    const pillarId = r.pillar_id as string;
    if (!stratPillarProjectMap.has(pillarId)) stratPillarProjectMap.set(pillarId, []);
    stratPillarProjectMap.get(pillarId)!.push(r.project_id as string);
  });
  const pillarsWithData: StrategyPillar[] = stratPillarRows.map(r => {
    const kpis = stratKpisMap.get(r.id as string) ?? [];
    const projects = stratPillarProjectMap.get(r.id as string) ?? [];
    return toStrategyPillar(r, projects, kpis);
  });
  const STRATEGIES: Strategy[] = strategyRows.map(r => {
    const pillars = pillarsWithData.filter(
      p => stratPillarRows.find(sr => sr.id === p.id)?.strategy_id === r.id
    );
    return toStrategy(r, pillars);
  });

  // ── Build PROJECTS ──
  const PROJECTS: Project[] = projectRows.map(r => {
    const tasks = projectTaskRows
      .filter(pt => pt.project_id === r.id)
      .map(pt => pt.task_id as string);
    return toProject(r, tasks);
  });

  // ── Build CLIENT_SERVICES ──
  const CLIENT_SERVICES: ClientService[] = clientServiceRows.map(r => {
    const linked = csProjectRows
      .filter(csp => csp.client_service_id === r.id)
      .map(csp => csp.project_id as string);
    return toClientService(r, linked);
  });

  // ── Build SERVICE_STRATEGIES ──
  const ssPillarMap = new Map<string, ServiceStrategyPillar[]>();
  ssPillarRows.forEach(r => {
    const ssId = r.service_strategy_id as string;
    if (!ssPillarMap.has(ssId)) ssPillarMap.set(ssId, []);
    ssPillarMap.get(ssId)!.push(toServiceStrategyPillar(r));
  });
  const ssKpiMap = new Map<string, ServiceStrategyKPI[]>();
  ssKpiRows.forEach(r => {
    const ssId = r.service_strategy_id as string;
    if (!ssKpiMap.has(ssId)) ssKpiMap.set(ssId, []);
    ssKpiMap.get(ssId)!.push(toServiceStrategyKPI(r));
  });
  const SERVICE_STRATEGIES: ServiceStrategy[] = ssRows.map(r => {
    const pillars = ssPillarMap.get(r.id as string) ?? [];
    const kpis = ssKpiMap.get(r.id as string) ?? [];
    return toServiceStrategy(r, pillars, kpis);
  });

  return {
    CLIENTS: clients.map(toClient),
    CLIENT_PILLARS: clientPillarRows.map(toClientPillar),
    CLIENT_PILLAR_KPIS: clientPillarKpiRows.map(toClientPillarKpi),
    STRATEGY_TARGETED_PILLARS: strategyTargetedPillarRows,
    TEAM_MEMBERS: teamMembers.map(toTeamMember),
    TASKS,
    DOCUMENTS,
    DOCUMENT_FOLDERS: docFolderRows.map(toDocumentFolder),
    RECURRING_TEMPLATES: recurringTemplatesRes.data?.map(toRecurringTemplate) ?? [],
    TASK_TEMPLATES: templateRows.map(toTaskTemplate),
    AUTOMATIONS: automationRows.map(toAutomation),
    TIME_ENTRIES: timeRows.map(toTimeEntry),
    ASSETS,
    WORKFLOW_TEMPLATES,
    STRATEGIES,
    PROJECTS,
    SERVICES: serviceRows.map(toService),
    CLIENT_SERVICES,
    SERVICE_STRATEGIES,
    KB_CATEGORIES: kbCategoryRows.map(toKBCategory),
    KB_ARTICLES: kbArticleRows.map(toKBArticle),
    PRIORITY_DOT,
    CLIENT_GOALS: (clientGoalsRes.data ?? []).map(toClientGoal),
    GOAL_PILLAR_LINKS: (goalPillarLinksRes.data ?? []).map(toGoalPillarLink),
    STRATEGY_GOAL_LINKS: (strategyGoalLinksRes.data ?? []).map(toStrategyGoalLink),
    FOCUS_AREAS: (focusAreasRes.data ?? []).map(toFocusArea),
    OUTCOMES: (outcomesRes.data ?? []).map(toOutcome),
  };
}

// ─── Page-specific data fetchers ─────────────────────────────────────────────
// These replace the mega getAllData() for individual pages.
// Only query the tables each page actually needs.

export type DashboardData = Pick<AppData,
  'CLIENTS' | 'CLIENT_PILLARS' | 'CLIENT_PILLAR_KPIS' | 'TEAM_MEMBERS' | 'TASKS' |
  'PROJECTS' | 'STRATEGY_TARGETED_PILLARS' | 'PRIORITY_DOT'
>;

export async function getDashboardData(): Promise<DashboardData> {
  const db = createServerClient();

  const [
    clientsRes, teamRes, tasksRes, taskDepsRes, approvalsRes,
    clientPillarsRes, clientPillarKpisRes,
    projectsRes, projectTasksRes, strategyTargetedPillarsRes,
  ] = await Promise.all([
    db.from('clients').select('*').is('archived_at', null),
    db.from('team_members').select('*').is('archived_at', null),
    db.from('tasks').select('*').is('archived_at', null),
    db.from('task_dependencies').select('*'),
    db.from('approval_history').select('*'),
    db.from('client_pillars').select('*'),
    db.from('client_pillar_kpis').select('*'),
    db.from('projects').select('*').is('archived_at', null),
    db.from('project_task_links').select('*'),
    db.from('strategy_targeted_pillars').select('*'),
  ]);

  const taskRows = tasksRes.data ?? [];
  const taskDeps = taskDepsRes.data ?? [];
  const approvalRows = approvalsRes.data ?? [];
  const projectRows = projectsRes.data ?? [];
  const projectTaskRows = projectTasksRes.data ?? [];

  const TASKS: Task[] = taskRows.map((r) => {
    const deps = taskDeps.filter(d => d.task_id === r.id).map(d => d.depends_on_id as string);
    const approvals = approvalRows.filter(a => a.task_id === r.id).map(toApprovalEntry);
    return toTask(r, deps, approvals);
  });

  const PROJECTS: Project[] = projectRows.map(r => {
    const tasks = projectTaskRows.filter(pt => pt.project_id === r.id).map(pt => pt.task_id as string);
    return toProject(r, tasks);
  });

  return {
    CLIENTS: (clientsRes.data ?? []).map(toClient),
    CLIENT_PILLARS: (clientPillarsRes.data ?? []).map(toClientPillar),
    CLIENT_PILLAR_KPIS: (clientPillarKpisRes.data ?? []).map(toClientPillarKpi),
    STRATEGY_TARGETED_PILLARS: strategyTargetedPillarsRes.data ?? [],
    TEAM_MEMBERS: (teamRes.data ?? []).map(toTeamMember),
    TASKS,
    PROJECTS,
    PRIORITY_DOT,
  };
}

export type KanbanData = Pick<AppData,
  'TASKS' | 'CLIENTS' | 'CLIENT_PILLARS' | 'TEAM_MEMBERS' | 'RECURRING_TEMPLATES' | 'PRIORITY_DOT'
>;

export async function getKanbanData(): Promise<KanbanData> {
  const db = createServerClient();

  const [
    clientsRes, teamRes, tasksRes, taskDepsRes, approvalsRes,
    clientPillarsRes, recurringTemplatesRes,
  ] = await Promise.all([
    db.from('clients').select('*').is('archived_at', null),
    db.from('team_members').select('*').is('archived_at', null),
    db.from('tasks').select('*').is('archived_at', null),
    db.from('task_dependencies').select('*'),
    db.from('approval_history').select('*'),
    db.from('client_pillars').select('*'),
    db.from('recurring_task_templates').select('*').eq('active', true),
  ]);

  const taskRows = tasksRes.data ?? [];
  const taskDeps = taskDepsRes.data ?? [];
  const approvalRows = approvalsRes.data ?? [];

  const TASKS: Task[] = taskRows.map((r) => {
    const deps = taskDeps.filter(d => d.task_id === r.id).map(d => d.depends_on_id as string);
    const approvals = approvalRows.filter(a => a.task_id === r.id).map(toApprovalEntry);
    return toTask(r, deps, approvals);
  });

  return {
    CLIENTS: (clientsRes.data ?? []).map(toClient),
    CLIENT_PILLARS: (clientPillarsRes.data ?? []).map(toClientPillar),
    TEAM_MEMBERS: (teamRes.data ?? []).map(toTeamMember),
    TASKS,
    RECURRING_TEMPLATES: (recurringTemplatesRes.data ?? []).map(toRecurringTemplate),
    PRIORITY_DOT,
  };
}

export type DocumentsData = Pick<AppData,
  'DOCUMENTS' | 'DOCUMENT_FOLDERS' | 'CLIENTS' | 'TEAM_MEMBERS' | 'PRIORITY_DOT'
>;

export async function getDocumentsData(): Promise<DocumentsData> {
  const db = createServerClient();

  const [
    clientsRes, teamRes,
    docsRes, docCollabRes, docVersionsRes, commentsRes, docFoldersRes,
  ] = await Promise.all([
    db.from('clients').select('*').is('archived_at', null),
    db.from('team_members').select('*').is('archived_at', null),
    db.from('documents').select('*'),
    db.from('document_collaborators').select('*'),
    db.from('document_versions').select('*'),
    db.from('comments').select('*'),
    db.from('document_folders').select('*').is('archived_at', null),
  ]);

  const docRows = docsRes.data ?? [];
  const docCollabs = docCollabRes.data ?? [];
  const docVersionRows = docVersionsRes.data ?? [];
  const commentRows = commentsRes.data ?? [];

  const buildComment = (r: Row): Comment => {
    const replies = commentRows.filter(c => c.parent_comment_id === r.id).map(buildComment);
    return toComment(r, replies);
  };
  const topComments = commentRows.filter(c => !c.parent_comment_id);

  const DOCUMENTS: Document[] = docRows.map((r) => {
    const collaborators = docCollabs.filter(dc => dc.document_id === r.id).map(dc => dc.team_member_id as string);
    const versions = docVersionRows.filter(v => v.document_id === r.id).map(toDocumentVersion);
    const comments = topComments.filter(c => c.document_id === r.id).map(buildComment);
    return toDocument(r, collaborators, versions, comments);
  });

  return {
    CLIENTS: (clientsRes.data ?? []).map(toClient),
    TEAM_MEMBERS: (teamRes.data ?? []).map(toTeamMember),
    DOCUMENTS,
    DOCUMENT_FOLDERS: (docFoldersRes.data ?? []).map(toDocumentFolder),
    PRIORITY_DOT,
  };
}

export type StrategiesData = Pick<AppData,
  'STRATEGIES' | 'PROJECTS' | 'CLIENTS' | 'CLIENT_PILLARS' | 'STRATEGY_TARGETED_PILLARS' | 'PRIORITY_DOT' |
  'CLIENT_GOALS' | 'GOAL_PILLAR_LINKS'
>;

export async function getStrategiesData(): Promise<StrategiesData> {
  const db = createServerClient();

  const [
    clientsRes, clientPillarsRes,
    strategiesRes, stratPillarsRes, stratKpisRes, stratPillarProjectsRes, strategyTargetedPillarsRes,
    projectsRes, projectTasksRes,
    clientGoalsRes, goalPillarLinksRes,
  ] = await Promise.all([
    db.from('clients').select('*').is('archived_at', null),
    db.from('client_pillars').select('*'),
    db.from('strategies').select('*').is('archived_at', null),
    db.from('strategy_pillars').select('*').is('archived_at', null),
    db.from('strategy_kpis').select('*').is('archived_at', null),
    db.from('strategy_pillar_projects').select('*'),
    db.from('strategy_targeted_pillars').select('*'),
    db.from('projects').select('*').is('archived_at', null),
    db.from('project_task_links').select('*'),
    db.from('client_goals').select('*'),
    db.from('goal_pillar_links').select('*'),
  ]);

  const stratPillarRows = stratPillarsRes.data ?? [];
  const stratKpiRows = stratKpisRes.data ?? [];
  const stratPillarProjectRows = stratPillarProjectsRes.data ?? [];
  const projectRows = projectsRes.data ?? [];
  const projectTaskRows = projectTasksRes.data ?? [];
  const strategyRows = strategiesRes.data ?? [];

  const stratKpisMap = new Map<string, KPI[]>();
  stratKpiRows.forEach(r => {
    const pillarId = r.pillar_id as string;
    if (!stratKpisMap.has(pillarId)) stratKpisMap.set(pillarId, []);
    stratKpisMap.get(pillarId)!.push(toKPI(r));
  });
  const stratPillarProjectMap = new Map<string, string[]>();
  stratPillarProjectRows.forEach(r => {
    const pillarId = r.pillar_id as string;
    if (!stratPillarProjectMap.has(pillarId)) stratPillarProjectMap.set(pillarId, []);
    stratPillarProjectMap.get(pillarId)!.push(r.project_id as string);
  });
  const pillarsWithData: StrategyPillar[] = stratPillarRows.map(r => {
    return toStrategyPillar(r, stratPillarProjectMap.get(r.id as string) ?? [], stratKpisMap.get(r.id as string) ?? []);
  });
  const STRATEGIES: Strategy[] = strategyRows.map(r => {
    const pillars = pillarsWithData.filter(p => stratPillarRows.find(sr => sr.id === p.id)?.strategy_id === r.id);
    return toStrategy(r, pillars);
  });

  const PROJECTS: Project[] = projectRows.map(r => {
    const tasks = projectTaskRows.filter(pt => pt.project_id === r.id).map(pt => pt.task_id as string);
    return toProject(r, tasks);
  });

  return {
    CLIENTS: (clientsRes.data ?? []).map(toClient),
    CLIENT_PILLARS: (clientPillarsRes.data ?? []).map(toClientPillar),
    STRATEGY_TARGETED_PILLARS: strategyTargetedPillarsRes.data ?? [],
    STRATEGIES,
    PROJECTS,
    PRIORITY_DOT,
    CLIENT_GOALS: (clientGoalsRes.data ?? []).map(toClientGoal),
    GOAL_PILLAR_LINKS: (goalPillarLinksRes.data ?? []).map(toGoalPillarLink),
  };
}

export type ServicesData = Pick<AppData,
  'SERVICES' | 'CLIENT_SERVICES' | 'SERVICE_STRATEGIES' | 'CLIENTS' | 'PRIORITY_DOT'
>;

export async function getServicesData(): Promise<ServicesData> {
  const db = createServerClient();

  const [
    clientsRes, servicesRes, clientServicesRes, csProjectsRes,
    ssRes, ssPillarsRes, ssKpisRes,
  ] = await Promise.all([
    db.from('clients').select('*').is('archived_at', null),
    db.from('services').select('*'),
    db.from('client_services').select('*').is('archived_at', null),
    db.from('client_service_projects').select('*'),
    db.from('service_strategies').select('*'),
    db.from('service_strategy_pillars').select('*'),
    db.from('service_strategy_kpis').select('*'),
  ]);

  const clientServiceRows = clientServicesRes.data ?? [];
  const csProjectRows = csProjectsRes.data ?? [];
  const ssRows = ssRes.data ?? [];
  const ssPillarRows = ssPillarsRes.data ?? [];
  const ssKpiRows = ssKpisRes.data ?? [];

  const ssPillarMap = new Map<string, ServiceStrategyPillar[]>();
  ssPillarRows.forEach(r => {
    const ssId = r.service_strategy_id as string;
    if (!ssPillarMap.has(ssId)) ssPillarMap.set(ssId, []);
    ssPillarMap.get(ssId)!.push(toServiceStrategyPillar(r));
  });
  const ssKpiMap = new Map<string, ServiceStrategyKPI[]>();
  ssKpiRows.forEach(r => {
    const ssId = r.service_strategy_id as string;
    if (!ssKpiMap.has(ssId)) ssKpiMap.set(ssId, []);
    ssKpiMap.get(ssId)!.push(toServiceStrategyKPI(r));
  });

  const CLIENT_SERVICES: ClientService[] = clientServiceRows.map(r => {
    const linked = csProjectRows.filter(csp => csp.client_service_id === r.id).map(csp => csp.project_id as string);
    return toClientService(r, linked);
  });
  const SERVICE_STRATEGIES: ServiceStrategy[] = ssRows.map(r => {
    return toServiceStrategy(r, ssPillarMap.get(r.id as string) ?? [], ssKpiMap.get(r.id as string) ?? []);
  });

  return {
    CLIENTS: (clientsRes.data ?? []).map(toClient),
    SERVICES: (servicesRes.data ?? []).map(toService),
    CLIENT_SERVICES,
    SERVICE_STRATEGIES,
    PRIORITY_DOT,
  };
}

export type AssetsData = Pick<AppData, 'ASSETS' | 'CLIENTS' | 'TEAM_MEMBERS' | 'PRIORITY_DOT'>;

export async function getAssetsData(): Promise<AssetsData> {
  const db = createServerClient();

  const [clientsRes, teamRes, assetsRes, assetVersionsRes, assetTagsRes] = await Promise.all([
    db.from('clients').select('*').is('archived_at', null),
    db.from('team_members').select('*').is('archived_at', null),
    db.from('assets').select('*').is('archived_at', null),
    db.from('asset_versions').select('*'),
    db.from('asset_tags').select('*'),
  ]);

  const assetRows = assetsRes.data ?? [];
  const assetVersionRows = assetVersionsRes.data ?? [];
  const assetTagRows = assetTagsRes.data ?? [];

  const ASSETS: Asset[] = assetRows.map((r) => {
    const tags = assetTagRows.filter(t => t.asset_id === r.id).map(t => t.tag as string);
    const versions = assetVersionRows.filter(v => v.asset_id === r.id).map(toAssetVersion);
    return toAsset(r, tags, versions);
  });

  return {
    CLIENTS: (clientsRes.data ?? []).map(toClient),
    TEAM_MEMBERS: (teamRes.data ?? []).map(toTeamMember),
    ASSETS,
    PRIORITY_DOT,
  };
}

export type SettingsData = Pick<AppData,
  'TEAM_MEMBERS' | 'AUTOMATIONS' | 'TASK_TEMPLATES' | 'WORKFLOW_TEMPLATES' | 'TIME_ENTRIES' | 'CLIENTS' | 'PRIORITY_DOT'
>;

export async function getSettingsData(): Promise<SettingsData> {
  const db = createServerClient();

  const [
    clientsRes, teamRes, automationsRes, templatesRes, timeRes,
    wfTemplatesRes, wfStepsRes, wfStepDepsRes,
  ] = await Promise.all([
    db.from('clients').select('*').is('archived_at', null),
    db.from('team_members').select('*').is('archived_at', null),
    db.from('automations').select('*').is('archived_at', null),
    db.from('task_templates').select('*'),
    db.from('time_entries').select('*').is('archived_at', null),
    db.from('workflow_templates').select('*'),
    db.from('workflow_steps').select('*'),
    db.from('workflow_step_dependencies').select('*'),
  ]);

  const wfStepRows = wfStepsRes.data ?? [];
  const wfStepDepRows = wfStepDepsRes.data ?? [];
  const wfTemplateRows = wfTemplatesRes.data ?? [];

  const wfStepsWithDeps: WorkflowStep[] = wfStepRows.map((r) => {
    const deps = wfStepDepRows.filter(d => d.step_id === r.id).map(d => d.depends_on_id as string);
    return toWorkflowStep(r, deps);
  });
  const WORKFLOW_TEMPLATES: WorkflowTemplate[] = wfTemplateRows.map((r) => {
    const steps = wfStepsWithDeps
      .filter(s => (wfStepRows.find(sr => sr.id === s.id) as Row)?.workflow_template_id === r.id)
      .sort((a, b) => a.order - b.order);
    return toWorkflowTemplate(r, steps);
  });

  return {
    CLIENTS: (clientsRes.data ?? []).map(toClient),
    TEAM_MEMBERS: (teamRes.data ?? []).map(toTeamMember),
    AUTOMATIONS: (automationsRes.data ?? []).map(toAutomation),
    TASK_TEMPLATES: (templatesRes.data ?? []).map(toTaskTemplate),
    TIME_ENTRIES: (timeRes.data ?? []).map(toTimeEntry),
    WORKFLOW_TEMPLATES,
    PRIORITY_DOT,
  };
}

export type KBData = Pick<AppData, 'KB_CATEGORIES' | 'KB_ARTICLES' | 'PRIORITY_DOT'>;

export async function getKBData(): Promise<KBData> {
  const db = createServerClient();

  const [kbCategoriesRes, kbArticlesRes] = await Promise.all([
    db.from('kb_categories').select('*').is('archived_at', null),
    db.from('kb_articles').select('*').is('archived_at', null),
  ]);

  return {
    KB_CATEGORIES: (kbCategoriesRes.data ?? []).map(toKBCategory),
    KB_ARTICLES: (kbArticlesRes.data ?? []).map(toKBArticle),
    PRIORITY_DOT,
  };
}

// ─── Client Page Data (Scoped) ─────────────────────────────────────────────────
// Fetches only the data needed for a single client's detail page
// Filters all arrays to show only records related to the given client
export type ClientPageData = Pick<AppData,
  'CLIENTS' | 'CLIENT_PILLARS' | 'CLIENT_PILLAR_KPIS' | 'TEAM_MEMBERS' | 
  'TASKS' | 'DOCUMENTS' | 'ASSETS' | 'SERVICES' | 'CLIENT_SERVICES' | 
  'SERVICE_STRATEGIES' | 'STRATEGIES' | 'PROJECTS' | 'RECURRING_TEMPLATES' | 
  'CLIENT_GOALS' | 'GOAL_PILLAR_LINKS' | 'FOCUS_AREAS' | 'OUTCOMES' | 'PRIORITY_DOT'
>;

export async function getClientPageData(clientId: string): Promise<ClientPageData> {
  const db = createServerClient();

  // Fetch all needed tables in parallel
  const [
    clientsRes, teamRes, tasksRes, taskDepsRes, approvalsRes,
    clientPillarsRes, clientPillarKpisRes,
    docsRes, docCollabRes, docVersionsRes, commentsRes,
    assetsRes, assetVersionsRes, assetTagsRes,
    servicesRes, clientServicesRes,
    ssRes, ssPillarsRes, ssKpisRes,
    strategiesRes, stratPillarsRes, stratKpisRes, stratPillarProjectsRes,
    projectsRes, projectTasksRes,
    recurringTemplatesRes,
    clientGoalsRes, goalPillarLinksRes, focusAreasRes, outcomesRes,
  ] = await Promise.all([
    db.from('clients').select('*').eq('id', clientId).is('archived_at', null),
    db.from('team_members').select('*').is('archived_at', null),
    db.from('tasks').select('*').eq('client_id', clientId).is('archived_at', null),
    db.from('task_dependencies').select('*'),
    db.from('approval_history').select('*'),
    db.from('client_pillars').select('*').eq('client_id', clientId),
    db.from('client_pillar_kpis').select('*'),
    db.from('documents').select('*').eq('client_id', clientId),
    db.from('document_collaborators').select('*'),
    db.from('document_versions').select('*'),
    db.from('comments').select('*'),
    db.from('assets').select('*').eq('client_id', clientId).is('archived_at', null),
    db.from('asset_versions').select('*'),
    db.from('asset_tags').select('*'),
    db.from('services').select('*'),
    db.from('client_services').select('*').eq('client_id', clientId).is('archived_at', null),
    db.from('service_strategies').select('*'),
    db.from('service_strategy_pillars').select('*'),
    db.from('service_strategy_kpis').select('*'),
    db.from('strategies').select('*').eq('client_id', clientId).is('archived_at', null),
    db.from('strategy_pillars').select('*').is('archived_at', null),
    db.from('strategy_kpis').select('*').is('archived_at', null),
    db.from('strategy_pillar_projects').select('*'),
    db.from('projects').select('*').is('archived_at', null),
    db.from('project_task_links').select('*'),
    db.from('recurring_task_templates').select('*').eq('client_id', clientId).eq('active', true),
    db.from('client_goals').select('*').eq('client_id', clientId),
    db.from('goal_pillar_links').select('*'),
    db.from('focus_areas').select('*').eq('client_id', clientId),
    db.from('outcomes').select('*').eq('client_id', clientId),
  ]);

  const clients = clientsRes.data ?? [];
  const teamMembers = teamRes.data ?? [];
  const taskRows = tasksRes.data ?? [];
  const taskDeps = taskDepsRes.data ?? [];
  const approvalRows = approvalsRes.data ?? [];
  const clientPillarRows = clientPillarsRes.data ?? [];
  const clientPillarKpiRows = clientPillarKpisRes.data ?? [];
  const docRows = docsRes.data ?? [];
  const docCollabs = docCollabRes.data ?? [];
  const docVersionRows = docVersionsRes.data ?? [];
  const commentRows = commentsRes.data ?? [];
  const assetRows = assetsRes.data ?? [];
  const assetVersionRows = assetVersionsRes.data ?? [];
  const assetTagRows = assetTagsRes.data ?? [];
  const serviceRows = servicesRes.data ?? [];
  const clientServiceRows = clientServicesRes.data ?? [];
  const ssRows = ssRes.data ?? [];
  const ssPillarRows = ssPillarsRes.data ?? [];
  const ssKpiRows = ssKpisRes.data ?? [];
  const strategyRows = strategiesRes.data ?? [];
  const stratPillarRows = stratPillarsRes.data ?? [];
  const stratKpiRows = stratKpisRes.data ?? [];
  const stratPillarProjectRows = stratPillarProjectsRes.data ?? [];
  const projectRows = projectsRes.data ?? [];
  const projectTaskRows = projectTasksRes.data ?? [];
  const recurringTemplateRows = recurringTemplatesRes.data ?? [];
  const clientGoalRows = clientGoalsRes.data ?? [];
  const goalPillarLinkRows = goalPillarLinksRes.data ?? [];
  const focusAreaRows = focusAreasRes.data ?? [];
  const outcomeRows = outcomesRes.data ?? [];

  // ── Build TASKS for this client ──
  const TASKS: Task[] = taskRows.map((r) => {
    const deps = taskDeps.filter(d => d.task_id === r.id).map(d => d.depends_on_id as string);
    const approvals = approvalRows
      .filter(a => a.task_id === r.id)
      .map(toApprovalEntry);
    return toTask(r, deps, approvals);
  });

  // ── Build DOCUMENTS for this client ──
  const topComments = commentRows.filter(c => !c.parent_comment_id);
  const buildComment = (r: Row): Comment => {
    const replies = commentRows
      .filter(c => c.parent_comment_id === r.id)
      .map(buildComment);
    return toComment(r, replies);
  };
  const DOCUMENTS: Document[] = docRows.map((r) => {
    const collaborators = docCollabs
      .filter(dc => dc.document_id === r.id)
      .map(dc => dc.team_member_id as string);
    const versions = docVersionRows
      .filter(v => v.document_id === r.id)
      .map(toDocumentVersion);
    const comments = topComments
      .filter(c => c.document_id === r.id)
      .map(buildComment);
    return toDocument(r, collaborators, versions, comments);
  });

  // ── Build ASSETS for this client ──
  const ASSETS: Asset[] = assetRows.map((r) => {
    const tags = assetTagRows
      .filter(t => t.asset_id === r.id)
      .map(t => t.tag as string);
    const versions = assetVersionRows
      .filter(v => v.asset_id === r.id)
      .map(toAssetVersion);
    return toAsset(r, tags, versions);
  });

  // ── Build STRATEGIES for this client ──
  // Filter strategy pillars and KPIs to those belonging to strategies for this client
  const strategyIdsForClient = new Set(strategyRows.map(s => s.id as string));
  const clientStratPillarRows = stratPillarRows.filter(sp => strategyIdsForClient.has(sp.strategy_id as string));
  const clientStratKpiRows = stratKpiRows.filter(kpi => clientStratPillarRows.some(p => p.id === kpi.pillar_id));
  const clientStratPillarProjectRows = stratPillarProjectRows.filter(pp => clientStratPillarRows.some(p => p.id === pp.pillar_id));

  const stratKpisMap = new Map<string, KPI[]>();
  clientStratKpiRows.forEach(r => {
    const pillarId = r.pillar_id as string;
    if (!stratKpisMap.has(pillarId)) stratKpisMap.set(pillarId, []);
    stratKpisMap.get(pillarId)!.push(toKPI(r));
  });
  const stratPillarProjectMap = new Map<string, string[]>();
  clientStratPillarProjectRows.forEach(r => {
    const pillarId = r.pillar_id as string;
    if (!stratPillarProjectMap.has(pillarId)) stratPillarProjectMap.set(pillarId, []);
    stratPillarProjectMap.get(pillarId)!.push(r.project_id as string);
  });

  const pillarsWithData: StrategyPillar[] = clientStratPillarRows.map(r => {
    const kpis = stratKpisMap.get(r.id as string) ?? [];
    const projects = stratPillarProjectMap.get(r.id as string) ?? [];
    return toStrategyPillar(r, projects, kpis);
  });

  const STRATEGIES: Strategy[] = strategyRows.map(r => {
    const pillars = pillarsWithData.filter(
      p => clientStratPillarRows.find(sr => sr.id === p.id)?.strategy_id === r.id
    );
    return toStrategy(r, pillars);
  });

  // ── Build PROJECTS (all projects, but filtered task references) ──
  // Projects can be shared across clients, but we only include tasks for this client
  const clientTaskIds = new Set(taskRows.map(t => t.id as string));
  const filteredProjectTaskRows = projectTaskRows.filter(pt => clientTaskIds.has(pt.task_id as string));
  const PROJECTS: Project[] = projectRows.map(r => {
    const tasks = filteredProjectTaskRows
      .filter(pt => pt.project_id === r.id)
      .map(pt => pt.task_id as string);
    // Only include project if it has tasks for this client
    if (tasks.length === 0) return null as any;
    return toProject(r, tasks);
  }).filter(Boolean);

  // ── Build CLIENT_SERVICES for this client ──
  const CLIENT_SERVICES: ClientService[] = clientServiceRows.map(r => {
    const linked = (ssRes.data ?? [])
      .filter(ss => ss.client_service_id === r.id)
      .map(ss => ss.id as string);
    return toClientService(r, linked);
  });

  // ── Build SERVICE_STRATEGIES for services linked to this client ──
  const clientServiceIds = new Set(clientServiceRows.map(cs => cs.id as string));
  const clientSsRows = ssRows.filter(ss => clientServiceIds.has(ss.client_service_id as string));
  const clientSsPillarRows = ssPillarRows.filter(sp => clientSsRows.some(ss => ss.id === sp.service_strategy_id));
  const clientSsKpiRows = ssKpiRows.filter(kpi => clientSsRows.some(ss => ss.id === kpi.service_strategy_id));

  const ssPillarMap = new Map<string, ServiceStrategyPillar[]>();
  clientSsPillarRows.forEach(r => {
    const ssId = r.service_strategy_id as string;
    if (!ssPillarMap.has(ssId)) ssPillarMap.set(ssId, []);
    ssPillarMap.get(ssId)!.push(toServiceStrategyPillar(r));
  });
  const ssKpiMap = new Map<string, ServiceStrategyKPI[]>();
  clientSsKpiRows.forEach(r => {
    const ssId = r.service_strategy_id as string;
    if (!ssKpiMap.has(ssId)) ssKpiMap.set(ssId, []);
    ssKpiMap.get(ssId)!.push(toServiceStrategyKPI(r));
  });

  const SERVICE_STRATEGIES: ServiceStrategy[] = clientSsRows.map(r => {
    const pillars = ssPillarMap.get(r.id as string) ?? [];
    const kpis = ssKpiMap.get(r.id as string) ?? [];
    return toServiceStrategy(r, pillars, kpis);
  });

  // ── Build RECURRING_TEMPLATES for this client ──
  const RECURRING_TEMPLATES: RecurringTemplate[] = recurringTemplateRows.map(toRecurringTemplate);

  // ── Build CLIENT_GOALS and GOAL_PILLAR_LINKS for this client ──
  const CLIENT_GOALS = clientGoalRows.map(toClientGoal);
  const clientGoalIds = new Set(clientGoalRows.map(cg => cg.id as string));
  const filteredGoalPillarLinkRows = goalPillarLinkRows.filter(gpl => clientGoalIds.has(gpl.client_goal_id as string));
  const GOAL_PILLAR_LINKS = filteredGoalPillarLinkRows.map(toGoalPillarLink);

  // ── Build FOCUS_AREAS and OUTCOMES for this client ──
  const FOCUS_AREAS = focusAreaRows.map(toFocusArea);
  const OUTCOMES = outcomeRows.map(toOutcome);

  return {
    CLIENTS: clients.map(toClient),
    CLIENT_PILLARS: clientPillarRows.map(toClientPillar),
    CLIENT_PILLAR_KPIS: clientPillarKpiRows
      .filter(kpi => clientPillarRows.some(cp => cp.id === kpi.client_pillar_id))
      .map(toClientPillarKpi),
    TEAM_MEMBERS: teamMembers.map(toTeamMember),
    TASKS,
    DOCUMENTS,
    ASSETS,
    SERVICES: serviceRows.map(toService),
    CLIENT_SERVICES,
    SERVICE_STRATEGIES,
    STRATEGIES,
    PROJECTS,
    RECURRING_TEMPLATES,
    CLIENT_GOALS,
    GOAL_PILLAR_LINKS,
    FOCUS_AREAS,
    OUTCOMES,
    PRIORITY_DOT,
  };
}



// ─── Campaigns (projects where type = 'campaign') ────────────────────────────

export type CampaignsData = Pick<AppData, 'PROJECTS' | 'CLIENTS' | 'TEAM_MEMBERS' | 'PRIORITY_DOT'>;

export async function getCampaignsData(): Promise<CampaignsData> {
  const db = createServerClient();

  const [projectsRes, projectTasksRes, clientsRes, teamRes] = await Promise.all([
    db.from('projects').select('*').eq('type', 'campaign').is('archived_at', null),
    db.from('project_task_links').select('*'),
    db.from('clients').select('*').is('archived_at', null),
    db.from('team_members').select('*'),
  ]);

  const projectRows = projectsRes.data ?? [];
  const projectTaskRows = projectTasksRes.data ?? [];

  const PROJECTS: Project[] = projectRows.map(r => {
    const tasks = projectTaskRows.filter(pt => pt.project_id === r.id).map(pt => pt.task_id as string);
    return toProject(r, tasks);
  });

  return {
    PROJECTS,
    CLIENTS: (clientsRes.data ?? []).map(toClient),
    TEAM_MEMBERS: (teamRes.data ?? []).map(toTeamMember),
    PRIORITY_DOT,
  };
}
