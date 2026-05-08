# Fix: Dashboard mega-fetch causing 10-second load time

## Problem
`app/dashboard/page.tsx` (server component) calls `getAllData()` which runs 40+ parallel Supabase queries. This blocks SSR, so the entire page (including the sidebar with client names) doesn't render until all queries complete. The dashboard only uses TASKS, CLIENTS, and TEAM_MEMBERS.

## Fix

### File: `app/dashboard/page.tsx`

1. Change the import on line 2:
   - FROM: `import { getAllData, PRIORITY_DOT } from '@/lib/supabase/queries';`
   - TO: `import { getDashboardData, PRIORITY_DOT } from '@/lib/supabase/queries';`

2. Change the data fetch call (~line 64):
   - FROM: `const { TASKS, CLIENTS, TEAM_MEMBERS } = await getAllData();`
   - TO: `const { TASKS, CLIENTS, TEAM_MEMBERS } = await getDashboardData();`

3. Verify that `getDashboardData()` returns all fields the dashboard page destructures. Check the full page for any other fields used from the data call (PROJECTS is returned by getDashboardData too, so if it's used elsewhere on the page, it's covered).

### Verification
- `npx tsc --noEmit` must pass
- `npx next build` must pass
- The dashboard page should load significantly faster (10 queries instead of 40+)
- Sidebar client list should still populate correctly
- Screenshot the dashboard with Pinchtab

### Commit & Push
Commit message: `fix: dashboard uses scoped getDashboardData instead of mega-fetch getAllData`

## Delivery
Post results directly to Slack channel #agency-pm-tool (C0AKQJN2VGF) using:
```
message(action='send', channel='slack', target='C0AKQJN2VGF', message='<results>')
```

---

# Leadership overview route

## Plan
- [x] Build `/leadership-overview` as a full-viewport overlay that matches the mockup
- [x] Add the left sidebar, leadership header, KPI row, portfolio table, action rail, thread summary, and pulse cards
- [x] Keep the implementation static/sample-data first and avoid touching Supabase
- [x] Run `npx tsc --noEmit` and `npx next build`
- [x] Capture a Pinchtab screenshot and report back in Slack

## Notes
- This page should visually cover the existing app shell so the mockup reads as a standalone executive dashboard


## Review
- Leadership overview route implemented and validated with TypeScript and Next.js production build.
- The real issue was the global app sidebar still mounting on `/leadership-overview`; hiding it restored the standalone full-viewport dashboard.
- Chromium headless on a clean local build confirmed the fixed layout and removed the white-strip/glow bleed.
---

# Urgent: Leadership overview full-width + remove top glow

## Problem
Joe reported that `/leadership-overview` is visually constrained to the left, leaves empty space on the right, and has a distracting light/glow at the top. The page also needs to fully cover the viewport without exposing body/background at the bottom.

## Fix

### File: `app/leadership-overview/page.tsx`

1. Remove the centered/max-width shell and make the page wrapper full-bleed across the viewport.
2. Remove the page-level top glow/spotlight radial gradients.
3. Keep the dark premium background, but ensure it fills the whole viewport and hides any bottom/body strip.
4. Preserve the dashboard cards/layout while widening the content so it reads as an intentionally full-screen executive dashboard.

## Verification
- `npx tsc --noEmit` must pass
- `npx next build` must pass
- Confirm live route loads at 200 and visually fills the screen
- Capture a screenshot for Slack proof

## Delivery
Post the fixed route, commit hash, build status, and screenshot to Slack channel `#agency-pm-tool` (`C0AKQJN2VGF`).
