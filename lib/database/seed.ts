/**
 * seed.ts
 *
 * Populates the SQLite database from the existing lib/data.ts constants.
 * Run with: npx ts-node --project tsconfig.json lib/database/seed.ts
 * Or (if tsx is available): npx tsx lib/database/seed.ts
 *
 * Safe to re-run — deletes all rows before re-inserting.
 */

import Database from 'better-sqlite3';
import path from 'path';
import {
  TEAM_MEMBERS,
  CLIENTS,
  TASKS,
  DOCUMENTS,
  TASK_TEMPLATES,
  AUTOMATIONS,
  TIME_ENTRIES,
  ASSETS,
  WORKFLOW_TEMPLATES,
  PROJECTS,
  STRATEGIES,
  SERVICES,
  CLIENT_SERVICES,
  SERVICE_STRATEGIES,
} from '../data';

const DB_PATH = path.join(__dirname, 'agency-pm.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

import fs from 'fs';

function openDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = OFF'); // off during seed to allow forward references
  db.pragma('journal_mode = WAL');
  return db;
}

function applySchema(db: Database.Database) {
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(sql);
  console.log('✓ Schema applied');
}

function clearAllTables(db: Database.Database) {
  // Order matters: children before parents
  const tables = [
    'service_strategy_kpis',
    'service_strategy_pillars',
    'service_strategies',
    'client_service_projects',
    'client_services',
    'services',
    'workflow_step_dependencies',
    'workflow_steps',
    'workflow_templates',
    'project_task_links',
    'projects',
    'strategy_pillar_projects',
    'strategy_kpis',
    'strategy_pillars',
    'strategies',
    'asset_tags',
    'asset_versions',
    'assets',
    'time_entries',
    'automations',
    'task_templates',
    'document_collaborators',
    'document_versions',
    'comments',
    'documents',
    'approval_history',
    'task_dependencies',
    'tasks',
    'clients',
    'team_members',
  ];
  for (const t of tables) {
    db.prepare(`DELETE FROM ${t}`).run();
  }
  console.log('✓ Tables cleared');
}

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

function seedTeamMembers(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO team_members (id, name, role, initials, color, is_owner)
    VALUES (@id, @name, @role, @initials, @color, @is_owner)
  `);
  const run = db.transaction(() => {
    for (const m of TEAM_MEMBERS) {
      insert.run({ ...m, is_owner: m.isOwner ? 1 : 0 });
    }
  });
  run();
  console.log(`✓ team_members: ${TEAM_MEMBERS.length} rows`);
}

function seedClients(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO clients (id, name, industry, location, color, logo)
    VALUES (@id, @name, @industry, @location, @color, @logo)
  `);
  const run = db.transaction(() => {
    for (const c of CLIENTS) insert.run(c);
  });
  run();
  console.log(`✓ clients: ${CLIENTS.length} rows`);
}

function seedTasks(db: Database.Database) {
  const insertTask = db.prepare(`
    INSERT INTO tasks (id, title, client_id, assignee_id, status, priority,
                       due_date, start_date, end_date, description, is_milestone, type)
    VALUES (@id, @title, @clientId, @assigneeId, @status, @priority,
            @dueDate, @startDate, @endDate, @description, @is_milestone, @type)
  `);
  const insertDep = db.prepare(`
    INSERT OR IGNORE INTO task_dependencies (task_id, depends_on_id)
    VALUES (@task_id, @depends_on_id)
  `);
  const insertApproval = db.prepare(`
    INSERT INTO approval_history (id, task_id, action, approver_id, timestamp, note)
    VALUES (@id, @task_id, @action, @approverId, @timestamp, @note)
  `);

  const run = db.transaction(() => {
    for (const t of TASKS) {
      insertTask.run({
        ...t,
        is_milestone: t.isMilestone ? 1 : 0,
        type: t.type ?? null,
      });

      for (const depId of t.dependencies ?? []) {
        insertDep.run({ task_id: t.id, depends_on_id: depId });
      }

      for (const ah of t.approvalHistory ?? []) {
        insertApproval.run({
          id: ah.id,
          task_id: t.id,
          action: ah.action,
          approverId: ah.approverId,
          timestamp: ah.timestamp,
          note: ah.note ?? null,
        });
      }
    }
  });
  run();
  console.log(`✓ tasks: ${TASKS.length} rows`);
}

function seedDocuments(db: Database.Database) {
  const insertDoc = db.prepare(`
    INSERT INTO documents (id, title, client_id, content, created_at, updated_at)
    VALUES (@id, @title, @clientId, @content, @createdAt, @updatedAt)
  `);
  const insertCollab = db.prepare(`
    INSERT OR IGNORE INTO document_collaborators (document_id, team_member_id)
    VALUES (@document_id, @team_member_id)
  `);
  const insertVersion = db.prepare(`
    INSERT INTO document_versions (id, document_id, version, author_id, summary, created_at)
    VALUES (@id, @document_id, @version, @authorId, @summary, @createdAt)
  `);
  const insertComment = db.prepare(`
    INSERT INTO comments (id, document_id, author_id, parent_comment_id, text, created_at)
    VALUES (@id, @document_id, @author_id, @parent_comment_id, @text, @created_at)
  `);

  const run = db.transaction(() => {
    for (const doc of DOCUMENTS) {
      insertDoc.run(doc);

      for (const memberId of doc.collaborators) {
        insertCollab.run({ document_id: doc.id, team_member_id: memberId });
      }

      for (const v of doc.versions) {
        insertVersion.run({
          // Version IDs in data.ts are local to each document (v1, v2, etc.)
          // Prefix with document ID to make them globally unique
          id: `${doc.id}__${v.id}`,
          document_id: doc.id,
          version: v.version,
          authorId: v.authorId,
          summary: v.summary,
          createdAt: v.createdAt,
        });
      }

      // Comments and replies (2-level max in data.ts)
      for (const c of doc.comments) {
        insertComment.run({
          id: c.id,
          document_id: doc.id,
          author_id: c.authorId,
          parent_comment_id: null,
          text: c.text,
          created_at: c.createdAt,
        });
        for (const r of c.replies ?? []) {
          insertComment.run({
            id: r.id,
            document_id: doc.id,
            author_id: r.authorId,
            parent_comment_id: c.id,
            text: r.text,
            created_at: r.createdAt,
          });
        }
      }
    }
  });
  run();
  console.log(`✓ documents: ${DOCUMENTS.length} rows`);
}

function seedTaskTemplates(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO task_templates (id, title, description, default_assignee_role,
                                default_priority, estimated_duration, type, due_rule, category)
    VALUES (@id, @title, @description, @defaultAssigneeRole,
            @defaultPriority, @estimatedDuration, @type, @dueRule, @category)
  `);
  const run = db.transaction(() => {
    for (const t of TASK_TEMPLATES) insert.run({ ...t, type: t.type ?? null });
  });
  run();
  console.log(`✓ task_templates: ${TASK_TEMPLATES.length} rows`);
}

function seedAutomations(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO automations (id, client_id, template_id, frequency, custom_frequency,
                             assignee_id, status, next_run_date, last_run_date, created_at)
    VALUES (@id, @clientId, @templateId, @frequency, @customFrequency,
            @assigneeId, @status, @nextRunDate, @lastRunDate, @createdAt)
  `);
  const run = db.transaction(() => {
    for (const a of AUTOMATIONS) {
      insert.run({
        ...a,
        customFrequency: a.customFrequency ?? null,
      });
    }
  });
  run();
  console.log(`✓ automations: ${AUTOMATIONS.length} rows`);
}

function seedTimeEntries(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO time_entries (id, task_id, client_id, member_id, date, duration_minutes, note)
    VALUES (@id, @taskId, @clientId, @memberId, @date, @durationMinutes, @note)
  `);
  const run = db.transaction(() => {
    for (const te of TIME_ENTRIES) insert.run({ ...te, note: te.note ?? null });
  });
  run();
  console.log(`✓ time_entries: ${TIME_ENTRIES.length} rows`);
}

function seedAssets(db: Database.Database) {
  const insertAsset = db.prepare(`
    INSERT INTO assets (id, client_id, filename, file_type, upload_date, uploaded_by, size, color)
    VALUES (@id, @clientId, @filename, @fileType, @uploadDate, @uploadedBy, @size, @color)
  `);
  const insertTag = db.prepare(`
    INSERT OR IGNORE INTO asset_tags (asset_id, tag) VALUES (@asset_id, @tag)
  `);
  const insertVersion = db.prepare(`
    INSERT INTO asset_versions (id, asset_id, date, note)
    VALUES (@id, @asset_id, @date, @note)
  `);

  const run = db.transaction(() => {
    for (const a of ASSETS) {
      insertAsset.run(a);
      for (const tag of a.tags) insertTag.run({ asset_id: a.id, tag });
      for (const v of a.versions) {
        // Version IDs in data.ts are local to each asset — prefix to ensure global uniqueness
        insertVersion.run({ id: `${a.id}__${v.id}`, asset_id: a.id, date: v.date, note: v.note });
      }
    }
  });
  run();
  console.log(`✓ assets: ${ASSETS.length} rows`);
}

function seedWorkflowTemplates(db: Database.Database) {
  const insertTmpl = db.prepare(`
    INSERT INTO workflow_templates (id, name, description, category, default_duration_days)
    VALUES (@id, @name, @description, @category, @defaultDurationDays)
  `);
  const insertStep = db.prepare(`
    INSERT INTO workflow_steps (id, workflow_template_id, step_order, title, description,
                                default_duration_days, assignee_role)
    VALUES (@id, @workflow_template_id, @order, @title, @description,
            @defaultDurationDays, @assigneeRole)
  `);
  const insertDep = db.prepare(`
    INSERT OR IGNORE INTO workflow_step_dependencies (step_id, depends_on_id)
    VALUES (@step_id, @depends_on_id)
  `);

  const run = db.transaction(() => {
    for (const wt of WORKFLOW_TEMPLATES) {
      insertTmpl.run(wt);
      for (const s of wt.steps) {
        insertStep.run({ ...s, workflow_template_id: wt.id });
        for (const depId of s.dependsOn) {
          insertDep.run({ step_id: s.id, depends_on_id: depId });
        }
      }
    }
  });
  run();
  console.log(`✓ workflow_templates: ${WORKFLOW_TEMPLATES.length} rows`);
}

function seedStrategies(db: Database.Database) {
  const insertStrat = db.prepare(`
    INSERT INTO strategies (id, client_id, name, quarter, start_date, end_date, status)
    VALUES (@id, @clientId, @name, @quarter, @startDate, @endDate, @status)
  `);
  const insertPillar = db.prepare(`
    INSERT INTO strategy_pillars (id, strategy_id, name, description)
    VALUES (@id, @strategy_id, @name, @description)
  `);
  const insertPillarProject = db.prepare(`
    INSERT OR IGNORE INTO strategy_pillar_projects (pillar_id, project_id)
    VALUES (@pillar_id, @project_id)
  `);
  const insertKpi = db.prepare(`
    INSERT INTO strategy_kpis (id, pillar_id, name, target, current, unit)
    VALUES (@id, @pillar_id, @name, @target, @current, @unit)
  `);

  const run = db.transaction(() => {
    for (const s of STRATEGIES) {
      insertStrat.run(s);
      for (const p of s.pillars) {
        insertPillar.run({ id: p.id, strategy_id: s.id, name: p.name, description: p.description });
        for (const projId of p.projectIds) {
          insertPillarProject.run({ pillar_id: p.id, project_id: projId });
        }
        for (const kpi of p.kpis) {
          insertKpi.run({ ...kpi, pillar_id: p.id });
        }
      }
    }
  });
  run();
  console.log(`✓ strategies: ${STRATEGIES.length} rows`);
}

function seedProjects(db: Database.Database) {
  const insertProj = db.prepare(`
    INSERT INTO projects (id, client_id, strategy_id, pillar_id, name, description,
                          status, start_date, end_date, progress, workflow_template_id)
    VALUES (@id, @clientId, @strategyId, @pillarId, @name, @description,
            @status, @startDate, @endDate, @progress, @workflowTemplateId)
  `);
  const insertLink = db.prepare(`
    INSERT OR IGNORE INTO project_task_links (project_id, task_id) VALUES (@project_id, @task_id)
  `);

  const run = db.transaction(() => {
    for (const p of PROJECTS) {
      insertProj.run({
        ...p,
        strategyId: p.strategyId ?? null,
        pillarId: p.pillarId ?? null,
        workflowTemplateId: p.workflowTemplateId ?? null,
      });
      for (const taskId of p.taskIds) {
        insertLink.run({ project_id: p.id, task_id: taskId });
      }
    }
  });
  run();
  console.log(`✓ projects: ${PROJECTS.length} rows`);
}

function seedServices(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO services (id, name, category, description, icon, default_cadence)
    VALUES (@id, @name, @category, @description, @icon, @defaultCadence)
  `);
  const run = db.transaction(() => {
    for (const s of SERVICES) insert.run(s);
  });
  run();
  console.log(`✓ services: ${SERVICES.length} rows`);
}

function seedClientServices(db: Database.Database) {
  const insertCs = db.prepare(`
    INSERT INTO client_services (id, client_id, service_id, status, start_date,
                                 monthly_cadence, linked_strategy_id)
    VALUES (@id, @clientId, @serviceId, @status, @startDate,
            @monthlyCadence, @linkedStrategyId)
  `);
  const insertLink = db.prepare(`
    INSERT OR IGNORE INTO client_service_projects (client_service_id, project_id)
    VALUES (@client_service_id, @project_id)
  `);

  const run = db.transaction(() => {
    for (const cs of CLIENT_SERVICES) {
      insertCs.run({
        ...cs,
        monthlyCadence: cs.monthlyCadence ?? null,
        linkedStrategyId: cs.linkedStrategyId ?? null,
      });
      for (const projId of cs.linkedProjects) {
        insertLink.run({ client_service_id: cs.id, project_id: projId });
      }
    }
  });
  run();
  console.log(`✓ client_services: ${CLIENT_SERVICES.length} rows`);
}

function seedServiceStrategies(db: Database.Database) {
  const insertSs = db.prepare(`
    INSERT INTO service_strategies (id, client_service_id, client_strategy_id, name, summary)
    VALUES (@id, @clientServiceId, @clientStrategyId, @name, @summary)
  `);
  const insertPillar = db.prepare(`
    INSERT INTO service_strategy_pillars (id, service_strategy_id, name, description)
    VALUES (@id, @service_strategy_id, @name, @description)
  `);
  const insertKpi = db.prepare(`
    INSERT INTO service_strategy_kpis (id, service_strategy_id, name, target, current, unit)
    VALUES (@id, @service_strategy_id, @name, @target, @current, @unit)
  `);

  const run = db.transaction(() => {
    for (const ss of SERVICE_STRATEGIES) {
      insertSs.run(ss);
      for (const p of ss.pillars) {
        insertPillar.run({ id: p.id, service_strategy_id: ss.id, name: p.name, description: p.description });
      }
      for (const kpi of ss.kpis) {
        insertKpi.run({ ...kpi, service_strategy_id: ss.id });
      }
    }
  });
  run();
  console.log(`✓ service_strategies: ${SERVICE_STRATEGIES.length} rows`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nSeeding database: ${DB_PATH}\n`);

  const db = openDb();

  try {
    applySchema(db);
    clearAllTables(db);

    seedTeamMembers(db);
    seedClients(db);
    seedTasks(db);
    seedDocuments(db);
    seedTaskTemplates(db);
    seedAutomations(db);
    seedTimeEntries(db);
    seedAssets(db);
    seedWorkflowTemplates(db);
    seedStrategies(db);
    seedProjects(db);
    seedServices(db);
    seedClientServices(db);
    seedServiceStrategies(db);

    console.log('\n✅ Seed complete.\n');
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
