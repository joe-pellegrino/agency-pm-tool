# Database Layer — agency-pm-tool

SQLite database backed by `better-sqlite3`. Schema is designed to be **Supabase/PostgreSQL-ready** with minimal changes.

---

## Files

| File | Purpose |
|------|---------|
| `schema.sql` | Full DDL — creates all tables and indexes |
| `seed.ts` | Populates the DB from `lib/data.ts` constants |
| `db.ts` | Typed connection + query helpers (returns interfaces matching `lib/data.ts`) |
| `agency-pm.db` | The SQLite database file (created by seed) |

---

## Setup & Seed

Install dependencies (already done if you ran `npm install`):

```bash
npm install better-sqlite3 @types/better-sqlite3
```

Run the seed script:

```bash
# With tsx (recommended)
npx tsx lib/database/seed.ts

# With ts-node
npx ts-node --project tsconfig.json lib/database/seed.ts
```

The seed script:
1. Applies `schema.sql` (creates tables if they don't exist)
2. Clears all rows
3. Re-inserts all data from `lib/data.ts`

Safe to re-run at any time.

---

## Using the DB Layer

```typescript
import { db } from '@/lib/database/db';

// All data
const tasks      = db.tasks.getAll();
const clients    = db.clients.getAll();
const documents  = db.documents.getAll();

// Filtered queries
const hdTasks    = db.tasks.getByClientId('happy-days');
const myTasks    = db.tasks.getByAssignee('sarah');
const doneTasks  = db.tasks.getByStatus('done');

// Analytics
const summary    = db.analytics.getTaskSummary('happy-days');
const hoursBy    = db.analytics.getTotalHoursByMember();

// Advanced — raw SQL
const result = db.raw().prepare('SELECT ...').all();
```

All query methods return TypeScript interfaces matching `lib/data.ts` — the same shapes the UI components expect.

---

## Schema Notes

### ID Strategy
IDs are `TEXT PRIMARY KEY` using the existing slug-style IDs from `data.ts` (e.g. `happy-days`, `hd-1`). When migrating to Supabase, swap these for `UUID` with `DEFAULT gen_random_uuid()`.

### Booleans
SQLite stores booleans as `INTEGER (0/1)`. The DB layer converts them back to TypeScript booleans. In Postgres, change these columns to `BOOLEAN`.

### Timestamps
All timestamps are `TEXT` in ISO 8601 format (`2026-03-07T20:00:00Z`). In Postgres, change to `TIMESTAMPTZ`.

### Circular FK (strategy_pillar_projects → projects)
`strategy_pillar_projects.project_id` does not have a DB-level FK because `strategy_pillars` and `projects` have a circular dependency (projects reference pillars, pillars reference projects). The FK is enforced at the app layer. In Supabase, use a deferrable constraint:
```sql
ALTER TABLE strategy_pillar_projects
  ADD CONSTRAINT fk_spp_project
  FOREIGN KEY (project_id) REFERENCES projects(id) DEFERRABLE INITIALLY DEFERRED;
```

---

## Supabase Migration Checklist

When porting to Supabase (PostgreSQL):

1. **IDs** — Replace `TEXT PRIMARY KEY` with `UUID PRIMARY KEY DEFAULT gen_random_uuid()`. Update all FK columns to `UUID`.
2. **Booleans** — Change `INTEGER` boolean columns (`is_owner`, `is_milestone`) to `BOOLEAN`.
3. **Timestamps** — Change `TEXT` timestamp columns to `TIMESTAMPTZ`.
4. **Enums** — Create PostgreSQL `ENUM` types for `status`, `priority`, `type`, `frequency`, etc. or use `CHECK` constraints (already in schema).
5. **Deferrable FKs** — Add deferrable constraints for circular deps (see above).
6. **RLS** — Enable Row Level Security on all tables and define policies.
7. **Seed** — Replace `better-sqlite3` calls with `@supabase/supabase-js` client or direct SQL inserts.
8. **Connection** — Replace the `Database` singleton with a Supabase client or PostgreSQL pool (e.g. `pg`, `postgres.js`).
9. **Driver types** — Remove `@types/better-sqlite3`. Update raw row types in `db.ts` to use `snake_case` from the Supabase client.

---

## Table Map

```
team_members
clients
tasks
  └── task_dependencies (junction)
  └── approval_history
documents
  └── document_collaborators (junction)
  └── document_versions
  └── comments (self-referencing parent_comment_id)
task_templates
automations
time_entries
assets
  └── asset_versions
  └── asset_tags (junction)
strategies
  └── strategy_pillars
       └── strategy_pillar_projects (junction → projects)
       └── strategy_kpis
projects
  └── project_task_links (junction)
workflow_templates
  └── workflow_steps
       └── workflow_step_dependencies (junction)
services
client_services
  └── client_service_projects (junction)
service_strategies
  └── service_strategy_pillars
  └── service_strategy_kpis
```
