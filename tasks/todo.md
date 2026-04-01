# Agency PM Tool — Campaign Calendar View + Lato Font

## Task 1: Change App Font to Lato

**What:** Replace the current system font stack with Google Fonts Lato across the entire application.

**Files to modify:**
- `app/layout.tsx` — Import Lato from `next/font/google` and apply to `<body>`
- `app/globals.css` — Update the `font-family` declaration in `body` rule (line with `-apple-system, BlinkMacSystemFont...`) to use the Lato CSS variable

**Implementation:**
1. In `app/layout.tsx`:
   ```tsx
   import { Lato } from 'next/font/google';
   
   const lato = Lato({ 
     subsets: ['latin'], 
     weight: ['300', '400', '700', '900'],
     display: 'swap',
   });
   ```
   Apply `lato.className` to the `<body>` tag.

2. In `app/globals.css`:
   Replace the `font-family` line in `body` with:
   ```css
   font-family: 'Lato', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
   ```
   Keep the system fonts as fallback.

**Verification:** Every page should render in Lato. Check sidebar, top bar, tables, modals.

---

## Task 2: Campaign Calendar View (Workfront-Style)

**What:** Add a calendar view toggle to the Campaigns page. Users can switch between the existing table view and a new weekly/monthly calendar view showing campaign cards on a time grid.

**Reference:** Adobe Workfront Planning calendar — campaigns displayed as horizontal bars/cards spanning their date range on a weekly grid, with status colors and assignee avatars.

**Project:** `/home/ubuntu/projects/agency-pm-tool/`

### Data Model
No schema changes needed. The existing `Project` interface already has everything:
- `startDate`, `endDate` — date range for calendar placement
- `status` — color coding (planning=blue, active=green, complete=gray, on-hold=amber)
- `name` — card label
- `clientId` — for client name/color grouping
- `type` — filter to `'campaign'` (same as current CampaignsBoard)
- `progress` — optional progress bar on card

### Architecture

**New files to create:**
- `components/campaigns/CampaignCalendar.tsx` — The main calendar grid component
- `components/campaigns/CampaignCalendarCard.tsx` — Individual campaign card rendered on the calendar

**Files to modify:**
- `components/campaigns/CampaignsBoard.tsx` — Add view toggle (table vs calendar), render CampaignCalendar when calendar mode is active
- `components/campaigns/CampaignToolbar.tsx` — Add view toggle buttons (table icon / calendar icon) to the toolbar

### CampaignCalendar.tsx — Detailed Spec

**Layout:** 
- Full-width grid with day columns
- Two modes: *Week* (7 columns, Mon-Sun) and *Month* (full month grid, ~4-5 rows of weeks)
- Default to Week view
- Navigation arrows (< >) to move forward/backward in time
- "Today" button to snap back to current week/month
- Current day column gets a subtle highlight (light indigo background)

**Campaign Cards:**
- Rendered as horizontal bars spanning from `startDate` to `endDate`
- Cards span across day columns proportionally
- If a campaign spans beyond the visible range, the bar clips at the edge with a visual indicator (rounded on visible end, flat/arrow on clipped end)
- Card content: campaign name (bold, truncated with ellipsis), client name (smaller, muted), optional small status dot
- Card height: ~32-36px, stacked vertically when multiple campaigns overlap on the same days
- Click a card → opens the existing `CampaignDrawer` (same as table view click)

**Card Colors by Status:**
- `planning` — `var(--color-primary-light)` bg, `var(--color-primary)` left border
- `active` — light green bg (#ECFDF5), green left border (#10B981)
- `complete` — light gray bg (#F3F4F6), gray left border (#9CA3AF)
- `on-hold` — light amber bg (#FFFBEB), amber left border (#F59E0B)

**Grid Styling:**
- Day column headers: abbreviated day name + date number (e.g., "Mon 31")
- Light gray vertical dividers between days
- Weekend columns slightly dimmed background
- Rows auto-expand to fit stacked campaigns

**Empty State:**
- If no campaigns exist in the visible date range, show centered text: "No campaigns scheduled this week" with a subtle calendar icon

### CampaignCalendarCard.tsx — Detailed Spec

**Props:** `project: Project`, `client: Client`, `daySpan: number`, `startOffset: number`, `isClippedLeft: boolean`, `isClippedRight: boolean`, `onClick: () => void`

**Rendering:**
- Absolutely positioned within the calendar row
- Width calculated from `daySpan` × column width
- Left offset from `startOffset` × column width
- 4px left border in status color
- Rounded corners (6px), except flat on clipped sides
- On hover: slight elevation (box-shadow), cursor pointer
- Text: campaign name (font-weight 600, 13px), client name below (font-weight 400, 11px, muted color)

### CampaignsBoard.tsx — Modifications

**Add state:**
```tsx
const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
```

**Conditional render:**
- When `viewMode === 'table'`: render existing table layout (groups, rows, etc.) — NO changes to current behavior
- When `viewMode === 'calendar'`: render `<CampaignCalendar projects={filtered} clients={CLIENTS} onSelectProject={setSelectedProject} />`
- The `CampaignDrawer` stays the same in both views, triggered by `selectedProject`

### CampaignToolbar.tsx — Modifications

**Add props:**
```tsx
viewMode: 'table' | 'calendar';
onViewModeChange: (mode: 'table' | 'calendar') => void;
```

**Add toggle buttons** to the right side of the toolbar (next to the "+ New Campaign" button):
- Two icon buttons: `LayoutList` (table) and `Calendar` (calendar) from lucide-react
- Active button gets indigo background, inactive gets transparent with gray icon
- Small button group with border, similar to how Workfront does it

### Interaction Flow
1. User lands on `/campaigns` → sees current table view (default)
2. User clicks calendar icon in toolbar → view switches to calendar
3. Calendar shows current week by default
4. User clicks < / > arrows to navigate weeks
5. User clicks a campaign card → CampaignDrawer opens (same as clicking a table row)
6. User can toggle back to table view anytime
7. Filters (search, client, status) apply to both views — the `filtered` array is shared

### Important Notes
- Do NOT modify the existing table view rendering. Only add the toggle and calendar as additive code.
- Use CSS variables from globals.css for all colors (light AND dark mode support).
- The calendar should work in dark mode: check `[data-theme=dark]` selectors in globals.css for the correct dark palette.
- All styling must be inline styles or CSS-in-JS consistent with the rest of the app (the project uses inline `style={{}}` props, not CSS modules).
- Import `Calendar`, `LayoutList` from `lucide-react` for the toggle icons.

---

## Pre-Commit Checklist
1. `npx tsc --noEmit` — must pass
2. `npx next build` — must pass  
3. Screenshot the campaigns page in both table and calendar view using Pinchtab
4. Commit and push

## Delivery
Post results summary with screenshots directly to Slack channel #agency-pm-tool (C0AKQJN2VGF) using:
```
message(action='send', channel='slack', target='C0AKQJN2VGF', message='<results>')
```
