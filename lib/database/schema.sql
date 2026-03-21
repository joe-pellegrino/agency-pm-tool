-- =============================================================================
-- agency-pm-tool: SQLite Schema (Supabase/PostgreSQL-ready)
-- =============================================================================
-- Design principles:
--   • String IDs (UUID-style slugs matching existing data.ts IDs)
--   • ISO 8601 TEXT timestamps → maps to TIMESTAMPTZ in Postgres
--   • snake_case column names (Supabase convention)
--   • Proper FK constraints enforced via PRAGMA foreign_keys = ON
--   • Junction tables for all many-to-many relationships
--   • No JSON blobs — all nested objects normalised into child tables
-- =============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ---------------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,
  initials    TEXT NOT NULL,
  color       TEXT NOT NULL,
  is_owner    INTEGER NOT NULL DEFAULT 0 CHECK (is_owner IN (0, 1)),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

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
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

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
  is_milestone INTEGER NOT NULL DEFAULT 0 CHECK (is_milestone IN (0, 1)),
  type         TEXT CHECK (type IN ('social', 'ad', 'blog', 'report', 'meeting', 'design', 'other')),
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- task → task dependency (many-to-many self-join)
CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id       TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_id)
);

-- ---------------------------------------------------------------------------
-- approval_history  (one-to-many on tasks)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_history (
  id          TEXT PRIMARY KEY,
  task_id     TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  action      TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  approver_id TEXT NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  timestamp   TEXT NOT NULL,
  note        TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- ---------------------------------------------------------------------------
-- comments  (polymorphic on documents; nested via parent_comment_id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id                TEXT PRIMARY KEY,
  document_id       TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  author_id         TEXT NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  text              TEXT NOT NULL,
  created_at        TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  client_id   TEXT NOT NULL,          -- 'all' is a valid sentinel value
  content     TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- document → collaborator (team_member) junction
CREATE TABLE IF NOT EXISTS document_collaborators (
  document_id    TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  team_member_id TEXT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, team_member_id)
);

-- document versions
CREATE TABLE IF NOT EXISTS document_versions (
  id          TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version     TEXT NOT NULL,
  author_id   TEXT NOT NULL REFERENCES team_members(id) ON DELETE RESTRICT,
  summary     TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL
);

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
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

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
  created_at        TEXT NOT NULL
);

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
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

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
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- asset versions
CREATE TABLE IF NOT EXISTS asset_versions (
  id         TEXT PRIMARY KEY,
  asset_id   TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  note       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- asset → tag (junction; tags stored as plain text labels)
CREATE TABLE IF NOT EXISTS asset_tags (
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  tag      TEXT NOT NULL,
  PRIMARY KEY (asset_id, tag)
);

-- ---------------------------------------------------------------------------
-- strategies  (client-level quarterly strategies)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS strategies (
  id         TEXT PRIMARY KEY,
  client_id  TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  quarter    TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date   TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('planning', 'active', 'complete')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- strategy pillars
CREATE TABLE IF NOT EXISTS strategy_pillars (
  id          TEXT PRIMARY KEY,
  strategy_id TEXT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- strategy pillar → project links (many-to-many)
CREATE TABLE IF NOT EXISTS strategy_pillar_projects (
  pillar_id  TEXT NOT NULL REFERENCES strategy_pillars(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,   -- FK to projects enforced at app layer (circular dep)
  PRIMARY KEY (pillar_id, project_id)
);

-- strategy KPIs (child of pillars)
CREATE TABLE IF NOT EXISTS strategy_kpis (
  id         TEXT PRIMARY KEY,
  pillar_id  TEXT NOT NULL REFERENCES strategy_pillars(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  target     REAL NOT NULL DEFAULT 0,
  current    REAL NOT NULL DEFAULT 0,
  unit       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

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
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- project → task links (many-to-many)
CREATE TABLE IF NOT EXISTS project_task_links (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, task_id)
);

-- ---------------------------------------------------------------------------
-- workflow_templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_templates (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  description           TEXT NOT NULL DEFAULT '',
  category              TEXT NOT NULL DEFAULT '',
  default_duration_days INTEGER NOT NULL DEFAULT 1,
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- workflow steps
CREATE TABLE IF NOT EXISTS workflow_steps (
  id                    TEXT PRIMARY KEY,
  workflow_template_id  TEXT NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  step_order            INTEGER NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT NOT NULL DEFAULT '',
  default_duration_days INTEGER NOT NULL DEFAULT 1,
  assignee_role         TEXT NOT NULL DEFAULT '',
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- workflow step dependencies (self-join on steps within same template)
CREATE TABLE IF NOT EXISTS workflow_step_dependencies (
  step_id        TEXT NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  depends_on_id  TEXT NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  PRIMARY KEY (step_id, depends_on_id)
);

-- ---------------------------------------------------------------------------
-- services  (global service catalogue)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  category         TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  icon             TEXT NOT NULL DEFAULT '',
  default_cadence  TEXT NOT NULL CHECK (default_cadence IN ('monthly', 'quarterly', 'one-time')),
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- ---------------------------------------------------------------------------
-- client_services  (which services a client is subscribed to)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_services (
  id                  TEXT PRIMARY KEY,
  client_id           TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id          TEXT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  status              TEXT NOT NULL CHECK (status IN ('active', 'paused', 'cancelled', 'planning')),
  start_date          TEXT NOT NULL DEFAULT '',
  monthly_cadence     TEXT,
  linked_strategy_id  TEXT REFERENCES strategies(id) ON DELETE SET NULL,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- client_service → project links (many-to-many)
CREATE TABLE IF NOT EXISTS client_service_projects (
  client_service_id TEXT NOT NULL REFERENCES client_services(id) ON DELETE CASCADE,
  project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY (client_service_id, project_id)
);

-- ---------------------------------------------------------------------------
-- service_strategies  (per-service strategy detail under a client service)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_strategies (
  id                 TEXT PRIMARY KEY,
  client_service_id  TEXT NOT NULL REFERENCES client_services(id) ON DELETE CASCADE,
  client_strategy_id TEXT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  summary            TEXT NOT NULL DEFAULT '',
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- service_strategy pillars
CREATE TABLE IF NOT EXISTS service_strategy_pillars (
  id                  TEXT PRIMARY KEY,
  service_strategy_id TEXT NOT NULL REFERENCES service_strategies(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- service_strategy KPIs
CREATE TABLE IF NOT EXISTS service_strategy_kpis (
  id                  TEXT PRIMARY KEY,
  service_strategy_id TEXT NOT NULL REFERENCES service_strategies(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  target              REAL NOT NULL DEFAULT 0,
  current             REAL NOT NULL DEFAULT 0,
  unit                TEXT NOT NULL DEFAULT '',
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_client_id       ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id     ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status          ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date        ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_approval_task_id      ON approval_history(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_document_id  ON comments(document_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id    ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_doc_versions_doc_id   ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id  ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_client   ON time_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_member   ON time_entries(member_id);
CREATE INDEX IF NOT EXISTS idx_assets_client_id      ON assets(client_id);
CREATE INDEX IF NOT EXISTS idx_asset_versions_asset  ON asset_versions(asset_id);
CREATE INDEX IF NOT EXISTS idx_strat_pillars_strat   ON strategy_pillars(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_kpis_pillar  ON strategy_kpis(pillar_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id    ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_strategy_id  ON projects(strategy_id);
CREATE INDEX IF NOT EXISTS idx_wf_steps_template     ON workflow_steps(workflow_template_id);
CREATE INDEX IF NOT EXISTS idx_client_services_cid   ON client_services(client_id);
CREATE INDEX IF NOT EXISTS idx_svc_strategies_csid   ON service_strategies(client_service_id);
CREATE INDEX IF NOT EXISTS idx_svc_strat_pillars     ON service_strategy_pillars(service_strategy_id);
CREATE INDEX IF NOT EXISTS idx_svc_strat_kpis        ON service_strategy_kpis(service_strategy_id);
CREATE INDEX IF NOT EXISTS idx_client_team_assign_cid ON client_team_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_team_assign_mid ON client_team_assignments(team_member_id);

-- ---------------------------------------------------------------------------
-- client_team_assignments  (which team members are assigned to a client)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_team_assignments (
  id              TEXT PRIMARY KEY,
  client_id       TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  team_member_id  TEXT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('Account Manager', 'Designer', 'Strategist', 'Developer', 'Other')),
  is_primary       INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(client_id, team_member_id)
);
