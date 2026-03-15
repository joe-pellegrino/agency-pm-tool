/**
 * Supabase data queries — returns data in the same shape as lib/data.ts
 * so UI components need no changes beyond swapping the import.
 */
import { createServerClient } from './client';
import type {
  Client, TeamMember, Task, ApprovalEntry, Document, Comment, DocumentVersion,
  DocumentFolder,
  TaskTemplate, Automation, TimeEntry, Asset, WorkflowTemplate,
  WorkflowStep, Strategy, StrategyPillar, KPI, Project, Service,
  ClientService, ServiceStrategy, ServiceStrategyPillar, ServiceStrategyKPI,
  KBCategory, KBArticle, KBArticleVersion,
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
  TEAM_MEMBERS: TeamMember[];
  TASKS: Task[];
  DOCUMENTS: Document[];
  DOCUMENT_FOLDERS: DocumentFolder[];
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
    docsRes, docCollabRes, docVersionsRes, commentsRes,
    templatesRes, automationsRes, timeRes,
    assetsRes, assetVersionsRes, assetTagsRes,
    wfTemplatesRes, wfStepsRes, wfStepDepsRes,
    strategiesRes, stratPillarsRes, stratKpisRes, stratPillarProjectsRes,
    projectsRes, projectTasksRes,
    servicesRes, clientServicesRes, csProjectsRes,
    ssRes, ssPillarsRes, ssKpisRes,
    kbCategoriesRes, kbArticlesRes,
    docFoldersRes,
  ] = await Promise.all([
    db.from('clients').select('*').is('archived_at', null),
    db.from('team_members').select('*').is('archived_at', null),
    db.from('tasks').select('*').is('archived_at', null),
    db.from('task_dependencies').select('*'),
    db.from('approval_history').select('*'),
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
  ]);

  const clients = clientsRes.data ?? [];
  const teamMembers = teamRes.data ?? [];
  const taskRows = tasksRes.data ?? [];
  const taskDeps = taskDepsRes.data ?? [];
  const approvalRows = approvalsRes.data ?? [];
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
    TEAM_MEMBERS: teamMembers.map(toTeamMember),
    TASKS,
    DOCUMENTS,
    DOCUMENT_FOLDERS: docFolderRows.map(toDocumentFolder),
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
  };
}
