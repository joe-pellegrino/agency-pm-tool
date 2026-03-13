-- =============================================================================
-- agency-pm-tool: PostgreSQL Schema for Supabase
-- =============================================================================

-- ---------------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,
  initials    TEXT NOT NULL,
  color       TEXT NOT NULL,
  is_owner    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  industry    TEXT NOT NULL,
  location    TEXT NOT NULL,
  color       TEXT NOT NULL,
  logo        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  client_id    TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assignee_id  TEXT NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  status       TEXT NOT NULL CHECK (status IN ('todo', 'inprogress', 'review', 'done')),
  priority     TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  due_date     TEXT NOT NULL,
  start_date   TEXT NOT NULL,
  end_date     TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  is_milestone BOOLEAN NOT NULL DEFAULT false,
  type         TEXT CHECK (type IN ('social', 'ad', 'blog', 'report', 'meeting', 'design', 'other')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tasks_client_id   ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date    ON tasks(due_date);

-- task dependencies (self-join)
CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id       TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_id)
);

ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- approval_history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_history (
  id          TEXT PRIMARY KEY,
  task_id     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  action      TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  approver_id TEXT NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  timestamp   TEXT NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_approval_task_id ON approval_history(task_id);

-- ---------------------------------------------------------------------------
-- documents (no FK on client_id since 'all' is a sentinel value)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  client_id   TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- document collaborators
CREATE TABLE IF NOT EXISTS document_collaborators (
  document_id    TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  team_member_id TEXT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, team_member_id)
);

ALTER TABLE document_collaborators ENABLE ROW LEVEL SECURITY;

-- document versions
CREATE TABLE IF NOT EXISTS document_versions (
  id          TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version     TEXT NOT NULL,
  author_id   TEXT NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  summary     TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_doc_versions_doc_id ON document_versions(document_id);

-- comments (on documents)
CREATE TABLE IF NOT EXISTS comments (
  id                TEXT PRIMARY KEY,
  document_id       TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  author_id         TEXT NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  text              TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_comments_document_id ON comments(document_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id   ON comments(parent_comment_id);

-- ---------------------------------------------------------------------------
-- task_templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_templates (
  id                    TEXT PRIMARY KEY,
  title                 TEXT NOT NULL,
  description           TEXT NOT NULL DEFAULT '',
  default_assignee_role TEXT NOT NULL,
  default_priority      TEXT NOT NULL CHECK (default_priority IN ('Low', 'Medium', 'High', 'Urgent')),
  estimated_duration    INTEGER NOT NULL DEFAULT 1,
  type                  TEXT CHECK (type IN ('social', 'ad', 'blog', 'report', 'meeting', 'design', 'other')),
  due_rule              TEXT NOT NULL DEFAULT '',
  category              TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- automations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automations (
  id                TEXT PRIMARY KEY,
  client_id         TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id       TEXT NOT NULL REFERENCES task_templates(id) ON DELETE RESTRICT,
  frequency         TEXT NOT NULL CHECK (frequency IN ('monthly', 'weekly', 'custom')),
  custom_frequency  TEXT,
  assignee_id       TEXT NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  status            TEXT NOT NULL CHECK (status IN ('active', 'paused')),
  next_run_date     TEXT NOT NULL,
  last_run_date     TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- time_entries
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS time_entries (
  id                TEXT PRIMARY KEY,
  task_id           TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  client_id         TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  member_id         TEXT NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  date              TEXT NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 0,
  note              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_client  ON time_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_member  ON time_entries(member_id);

-- ---------------------------------------------------------------------------
-- assets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assets (
  id           TEXT PRIMARY KEY,
  client_id    TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  file_type    TEXT NOT NULL CHECK (file_type IN ('image', 'document', 'video', 'logo')),
  upload_date  TEXT NOT NULL,
  uploaded_by  TEXT NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  size         TEXT NOT NULL DEFAULT '',
  color        TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_assets_client_id ON assets(client_id);

-- asset versions
CREATE TABLE IF NOT EXISTS asset_versions (
  id         TEXT PRIMARY KEY,
  asset_id   TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  note       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE asset_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_asset_versions_asset ON asset_versions(asset_id);

-- asset tags
CREATE TABLE IF NOT EXISTS asset_tags (
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  tag      TEXT NOT NULL,
  PRIMARY KEY (asset_id, tag)
);

ALTER TABLE asset_tags ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- workflow_templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_templates (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  description           TEXT NOT NULL DEFAULT '',
  category              TEXT NOT NULL DEFAULT '',
  default_duration_days INTEGER NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- workflow steps
CREATE TABLE IF NOT EXISTS workflow_steps (
  id                    TEXT PRIMARY KEY,
  workflow_template_id  TEXT NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  step_order            INTEGER NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT NOT NULL DEFAULT '',
  default_duration_days INTEGER NOT NULL DEFAULT 1,
  assignee_role         TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_wf_steps_template ON workflow_steps(workflow_template_id);

-- workflow step dependencies
CREATE TABLE IF NOT EXISTS workflow_step_dependencies (
  step_id        TEXT NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  depends_on_id  TEXT NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, depends_on_id)
);

ALTER TABLE workflow_step_dependencies ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- strategies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS strategies (
  id         TEXT PRIMARY KEY,
  client_id  TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  quarter    TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date   TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('planning', 'active', 'complete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

-- strategy pillars
CREATE TABLE IF NOT EXISTS strategy_pillars (
  id          TEXT PRIMARY KEY,
  strategy_id TEXT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE strategy_pillars ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_strat_pillars_strat ON strategy_pillars(strategy_id);

-- strategy pillar → project links
CREATE TABLE IF NOT EXISTS strategy_pillar_projects (
  pillar_id  TEXT NOT NULL REFERENCES strategy_pillars(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  PRIMARY KEY (pillar_id, project_id)
);

ALTER TABLE strategy_pillar_projects ENABLE ROW LEVEL SECURITY;

-- strategy KPIs
CREATE TABLE IF NOT EXISTS strategy_kpis (
  id         TEXT PRIMARY KEY,
  pillar_id  TEXT NOT NULL REFERENCES strategy_pillars(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  target     REAL NOT NULL DEFAULT 0,
  current    REAL NOT NULL DEFAULT 0,
  unit       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE strategy_kpis ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_strategy_kpis_pillar ON strategy_kpis(pillar_id);

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id                   TEXT PRIMARY KEY,
  client_id            TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  strategy_id          TEXT REFERENCES strategies(id) ON DELETE SET NULL,
  pillar_id            TEXT REFERENCES strategy_pillars(id) ON DELETE SET NULL,
  name                 TEXT NOT NULL,
  description          TEXT NOT NULL DEFAULT '',
  status               TEXT NOT NULL CHECK (status IN ('planning', 'active', 'complete', 'on-hold')),
  start_date           TEXT NOT NULL,
  end_date             TEXT NOT NULL,
  progress             INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  workflow_template_id TEXT REFERENCES workflow_templates(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_projects_client_id   ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_strategy_id ON projects(strategy_id);

-- project task links
CREATE TABLE IF NOT EXISTS project_task_links (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, task_id)
);

ALTER TABLE project_task_links ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  icon             TEXT NOT NULL DEFAULT '',
  default_cadence  TEXT NOT NULL CHECK (default_cadence IN ('monthly', 'quarterly', 'one-time')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- client_services
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_services (
  id                  TEXT PRIMARY KEY,
  client_id           TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id          TEXT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  status              TEXT NOT NULL CHECK (status IN ('active', 'paused', 'cancelled', 'planning')),
  start_date          TEXT NOT NULL DEFAULT '',
  monthly_cadence     TEXT,
  linked_strategy_id  TEXT REFERENCES strategies(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE client_services ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_client_services_cid ON client_services(client_id);

-- client_service → project links
CREATE TABLE IF NOT EXISTS client_service_projects (
  client_service_id TEXT NOT NULL REFERENCES client_services(id) ON DELETE CASCADE,
  project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY (client_service_id, project_id)
);

ALTER TABLE client_service_projects ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- service_strategies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_strategies (
  id                 TEXT PRIMARY KEY,
  client_service_id  TEXT NOT NULL REFERENCES client_services(id) ON DELETE CASCADE,
  client_strategy_id TEXT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  summary            TEXT NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE service_strategies ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_svc_strategies_csid ON service_strategies(client_service_id);

-- service_strategy pillars
CREATE TABLE IF NOT EXISTS service_strategy_pillars (
  id                  TEXT PRIMARY KEY,
  service_strategy_id TEXT NOT NULL REFERENCES service_strategies(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE service_strategy_pillars ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_svc_strat_pillars ON service_strategy_pillars(service_strategy_id);

-- service_strategy KPIs
CREATE TABLE IF NOT EXISTS service_strategy_kpis (
  id                  TEXT PRIMARY KEY,
  service_strategy_id TEXT NOT NULL REFERENCES service_strategies(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  target              REAL NOT NULL DEFAULT 0,
  current             REAL NOT NULL DEFAULT 0,
  unit                TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE service_strategy_kpis ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_svc_strat_kpis ON service_strategy_kpis(service_strategy_id);
