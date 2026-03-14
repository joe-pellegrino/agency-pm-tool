# Setup Instructions for Agency PM Tool Sidebar Improvements

## Database Migration

The sidebar improvements require a new table `agency_settings` in Supabase to store the agency logo URL.

### Option 1: Using Supabase Dashboard (Recommended for Manual Setup)

1. Go to [Supabase Dashboard](https://app.supabase.com) for project `najrksokhyyhqgokxbys`
2. Navigate to **SQL Editor**
3. Create a new query and paste the contents of `migrations/001_create_agency_settings.sql`
4. Click **Run**

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

### Option 3: Manual Script

Run the setup script (requires Node.js):

```bash
node scripts/setup-supabase.js
```

## Features Implemented

### 1. Collapsible Sidebar (Desktop)
- Hamburger button in the TopBar toggles sidebar collapse
- Expanded state: 240px wide with full labels
- Collapsed state: 60px wide with icons only
- Tooltips appear on hover when collapsed
- User preference persisted in localStorage (`sidebar_collapsed`)

### 2. Customizable Logo
- Settings page now has "Branding" section
- Enter logo URL and save
- Logo appears in sidebar (expanded state) instead of hardcoded "RJ Media" text
- Logo URL stored in Supabase `agency_settings` table

### 3. Improved Sidebar UX
- X button removed from desktop sidebar (only on mobile)
- Clean icon-only state for focused UI
- Smooth transitions between states

## Testing

1. **Test Collapse/Expand:**
   - Refresh the page
   - Click hamburger menu in TopBar
   - Sidebar should collapse to icons only
   - Click again to expand
   - Refresh page - sidebar should remember preference

2. **Test Logo Upload:**
   - Go to Settings
   - Enter logo URL in "Branding" section
   - Click "Save Logo"
   - Page will reload
   - Logo should appear in sidebar (when expanded)

## Environment Variables

The following are already configured in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- `AGENCY_PM_SERVICE_KEY` - Service role key for admin operations

## Troubleshooting

### "Could not find the table 'public.agency_settings'"
- Run the migration SQL from the Supabase SQL Editor
- Or use one of the setup options above

### Logo not loading
- Check that the URL is valid and publicly accessible
- Logo URL is expected to be an HTTPS URL to an image file
- Try a public image URL first (e.g., from a CDN)

### Collapse state not persisting
- Check browser console for errors
- Ensure localStorage is enabled in browser
- Clear localStorage and reload: `localStorage.clear()`

## Files Changed

- `components/layout/Sidebar.tsx` - Added collapse state, icons-only view, logo fetching
- `components/layout/SidebarContext.tsx` - Added collapsed state management with localStorage
- `components/layout/TopBar.tsx` - Added desktop hamburger button, dynamic logo width
- `app/layout.tsx` - Updated to use new MainLayout component
- `app/MainLayout.tsx` - New component for dynamic margin management
- `app/settings/page.tsx` - Added Branding section
- `migrations/001_create_agency_settings.sql` - New database table definition
