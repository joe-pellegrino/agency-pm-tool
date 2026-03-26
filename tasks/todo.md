# Goals Feature — Implementation Plan

## Context
Rick wants clients to define their business goals in their own language ("I want more catering sales"). The agency then maps those goals to pillars and KPIs. The loop closes when KPI performance reports back against the client's original goals.

## Existing Infrastructure
- Supabase project: `najrksokhyyhqgokxbys`
- Existing tables: `client_pillars` (with CRUD in `lib/actions.ts`), `client_pillar_kpis`
- Existing pages: `app/clients/[clientId]/pillars/page.tsx`, `app/clients/[clientId]/pillars/[pillarId]/page.tsx`
- UI framework: Next.js, Tailwind, Lucide icons, Sonner toasts, Radix primitives
- Supabase client: `lib/supabase/` directory, `db()` helper in `lib/actions.ts`

## Database Changes (Supabase Migration)

### New table: `client_goals`
```sql
CREATE TABLE client_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,                    -- Client's own words: "I want more catering sales"
  description TEXT DEFAULT '',            -- Optional elaboration
  client_pillar_id TEXT REFERENCES client_pillars(id) ON DELETE SET NULL,  -- Agency maps goal → pillar
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_goals_client ON client_goals(client_id);
CREATE INDEX idx_client_goals_pillar ON client_goals(client_pillar_id);
```

### New junction table: `client_goal_kpis`
Maps goals to KPIs (many-to-many: a goal can have multiple KPIs proving it, a KPI can serve multiple goals)
```sql
CREATE TABLE client_goal_kpis (
  goal_id UUID NOT NULL REFERENCES client_goals(id) ON DELETE CASCADE,
  kpi_id TEXT NOT NULL REFERENCES client_pillar_kpis(id) ON DELETE CASCADE,
  PRIMARY KEY (goal_id, kpi_id)
);
```

### RLS Policies
Add anon read/write policies matching existing `client_pillars` pattern.

## Backend Changes (`lib/actions.ts`)

Add these functions following the existing pattern (use `db()` helper):
- `getClientGoals(clientId: string)` — fetch all goals for a client, join with pillar name and linked KPIs
- `createClientGoal(clientId, data)` — insert goal
- `updateClientGoal(id, data)` — update goal (title, description, pillar mapping, status)
- `deleteClientGoal(id)` — delete goal + cascade removes junction rows
- `linkGoalToKpi(goalId, kpiId)` — insert into junction table
- `unlinkGoalFromKpi(goalId, kpiId)` — delete from junction table

## TypeScript Types (`lib/data.ts`)

```typescript
export interface ClientGoal {
  id: string;
  clientId: string;
  title: string;
  description: string;
  clientPillarId: string | null;
  pillarName?: string;        // joined from client_pillars
  pillarColor?: string;       // joined from client_pillars
  status: 'active' | 'achieved' | 'paused';
  linkedKpis?: ClientPillarKpi[];  // joined from junction
  createdAt: string;
  updatedAt: string;
}
```

## Frontend: New Page `app/clients/[clientId]/goals/page.tsx`

### Layout
- TopBar with client name and "Goals" title
- "Add Goal" button top-right
- Goals displayed as cards, grouped by pillar (unmapped goals shown in "Unmapped" section at top)

### Goal Card
- Title (client's words, prominently displayed)
- Description (if present, smaller text below)
- Pillar badge (colored dot + pillar name, or "Unmapped" in gray)
- Linked KPIs as small chips showing name + current/target
- Status indicator (active = green, achieved = blue, paused = gray)
- Edit/Delete actions

### Create/Edit Modal
- Title input (required) — placeholder: "What does the client want to achieve?"
- Description textarea (optional)
- Pillar dropdown — select from existing client pillars, or leave unmapped
- KPI multi-select — show KPIs from the selected pillar (or all KPIs if no pillar selected)
- Status dropdown (active/achieved/paused)

## Navigation Update

### Sidebar (`app/MainLayout.tsx` or equivalent)
Add "Goals" nav item under the client section, between existing items. Icon: `Target` from Lucide.

### Pillar Detail Page Enhancement (`app/clients/[clientId]/pillars/[pillarId]/page.tsx`)
Add a "Linked Goals" section showing which client goals map to this pillar. Read-only display with links to the goals page.

## Implementation Order
1. Create Supabase migration file: `supabase/migrations/YYYYMMDD_client_goals.sql`
2. Run migration against `najrksokhyyhqgokxbys`
3. Add TypeScript types to `lib/data.ts`
4. Add action functions to `lib/actions.ts`
5. Build the goals page `app/clients/[clientId]/goals/page.tsx`
6. Add navigation link in sidebar/layout
7. Add "Linked Goals" section to pillar detail page
8. Run `npx tsc --noEmit` and `npx next build`
9. Screenshot with Pinchtab
10. Commit, push, deploy

## DO NOT
- Do not modify existing pillar or KPI functionality
- Do not change the Supabase project or connection config
- Do not add any npm dependencies unless absolutely necessary
- Do not create stub/placeholder components — everything must be functional

## Delivery
When complete, post results summary directly to Slack channel #rj-client-portal (C0AKS1KDZT5) using:
`message(action='send', channel='slack', target='C0AKS1KDZT5', message='<results>')`
