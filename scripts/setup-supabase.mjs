/**
 * Supabase setup script: creates tables and seeds all real client data.
 * Run with: node scripts/setup-supabase.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const creds = JSON.parse(readFileSync(join(__dirname, '../.supabase-credentials.json'), 'utf8'));

const supabase = createClient(creds.url, creds.service_role_key);

// ─── Execute raw SQL via Supabase REST (pg meta) ──────────────────────────────
async function execSQL(sql) {
  const resp = await fetch(`${creds.url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': creds.service_role_key,
      'Authorization': `Bearer ${creds.service_role_key}`,
    },
    body: JSON.stringify({ sql }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`SQL exec failed: ${text}`);
  }
  return resp.json();
}

// ─── Create tables by executing SQL file ──────────────────────────────────────
async function createTables() {
  console.log('Creating tables...');
  const sql = readFileSync(join(__dirname, 'create-tables.sql'), 'utf8');
  
  // Split by statement and execute each (Supabase REST needs single statements)
  // Actually use the Postgres query endpoint directly
  const resp = await fetch(`${creds.url}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': creds.service_role_key,
      'Authorization': `Bearer ${creds.service_role_key}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  
  if (!resp.ok) {
    const text = await resp.text();
    console.log('pg/query not available, trying alternative...');
    // Try executing via Supabase's management API
    return createTablesViaUpsert();
  }
  console.log('Tables created via pg/query');
}

// Alternative: try using Supabase management API
async function createTablesViaUpsert() {
  console.log('Using management API to run SQL...');
  const sql = readFileSync(join(__dirname, 'create-tables.sql'), 'utf8');
  
  const resp = await fetch(`https://api.supabase.com/v1/projects/${creds.project_ref}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${creds.service_role_key}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  
  if (!resp.ok) {
    const text = await resp.text();
    console.error('Management API failed:', text);
    throw new Error('Could not create tables via management API');
  }
  console.log('Tables created via management API');
}

// ─── Seed helpers ─────────────────────────────────────────────────────────────
async function upsert(table, data) {
  const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
  if (error) {
    console.error(`Error upserting ${table}:`, error.message);
    throw error;
  }
  console.log(`  ✓ ${table} (${Array.isArray(data) ? data.length : 1} rows)`);
}

async function upsertNoPK(table, data, conflictCols) {
  const { error } = await supabase.from(table).upsert(data, { onConflict: conflictCols });
  if (error) {
    console.error(`Error upserting ${table}:`, error.message);
    throw error;
  }
  console.log(`  ✓ ${table} (${Array.isArray(data) ? data.length : 1} rows)`);
}

// ─── Seed data ────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\nSeeding team members...');
  await upsert('team_members', [
    { id: 'joe', name: 'Joe Pellegrino', role: 'Owner', initials: 'JP', color: '#6366f1', is_owner: true },
    { id: 'rick', name: 'Rick McDonald', role: 'Owner', initials: 'RM', color: '#8b5cf6', is_owner: true },
    { id: 'sarah', name: 'Sarah Chen', role: 'Content Manager', initials: 'SC', color: '#ec4899', is_owner: false },
    { id: 'marcus', name: 'Marcus Rivera', role: 'Social Media Specialist', initials: 'MR', color: '#f59e0b', is_owner: false },
  ]);

  console.log('Seeding clients...');
  await upsert('clients', [
    { id: 'happy-days', name: 'Happy Days', industry: 'Medical Cannabis Dispensary', location: 'Farmingdale, NY', color: '#10b981', logo: 'HD' },
    { id: 'k-pacho', name: 'K. Pacho', industry: 'Mexican Restaurant', location: 'New Hyde Park, NY', color: '#f59e0b', logo: 'KP' },
    { id: 'the-refuge', name: 'The Refuge', industry: 'Restaurant', location: 'Melville, NY', color: '#3b82f6', logo: 'TR' },
  ]);

  console.log('Seeding tasks...');
  const tasks = [
    // Happy Days
    { id: 'hd-1', title: 'Social Media Content Calendar — March', client_id: 'happy-days', assignee_id: 'sarah', status: 'done', priority: 'High', due_date: '2026-03-05', start_date: '2026-02-17', end_date: '2026-03-05', description: 'Plan and schedule 30 days of social content across Instagram, Facebook, and X for Happy Days dispensary.', is_milestone: false, type: 'social' },
    { id: 'hd-2', title: 'Facebook Ad Campaign Setup & Optimization', client_id: 'happy-days', assignee_id: 'marcus', status: 'inprogress', priority: 'Urgent', due_date: '2026-03-18', start_date: '2026-03-03', end_date: '2026-03-18', description: 'Launch targeted Facebook ad campaign for new product arrivals. Optimize for dispensary foot traffic.', is_milestone: false, type: 'ad' },
    { id: 'hd-3', title: 'Google Business Profile Update', client_id: 'happy-days', assignee_id: 'sarah', status: 'done', priority: 'Medium', due_date: '2026-02-28', start_date: '2026-02-24', end_date: '2026-02-28', description: 'Update hours, photos, services, and menu on Google Business Profile.', is_milestone: false, type: 'other' },
    { id: 'hd-4', title: 'Website Homepage Redesign', client_id: 'happy-days', assignee_id: 'joe', status: 'review', priority: 'High', due_date: '2026-03-25', start_date: '2026-03-01', end_date: '2026-03-25', description: 'Full redesign of homepage with new hero section, product highlights, and compliance-friendly copy.', is_milestone: false, type: 'other' },
    { id: 'hd-5', title: 'Monthly Analytics Report — February', client_id: 'happy-days', assignee_id: 'rick', status: 'done', priority: 'Medium', due_date: '2026-03-07', start_date: '2026-03-04', end_date: '2026-03-07', description: 'Compile GA4, Meta Ads, and Google Business insights for February performance review.', is_milestone: false, type: 'report' },
    { id: 'hd-6', title: 'Menu Photography Coordination', client_id: 'happy-days', assignee_id: 'sarah', status: 'todo', priority: 'Medium', due_date: '2026-04-02', start_date: '2026-03-20', end_date: '2026-04-02', description: 'Coordinate product photography session for new spring inventory. Source photographer and prep shot list.', is_milestone: false, type: 'other' },
    { id: 'hd-7', title: 'Email Newsletter — Spring Promotions', client_id: 'happy-days', assignee_id: 'sarah', status: 'inprogress', priority: 'High', due_date: '2026-03-20', start_date: '2026-03-10', end_date: '2026-03-20', description: 'Draft and design March email newsletter highlighting spring product drops and loyalty rewards.', is_milestone: false, type: 'social' },
    { id: 'hd-8', title: 'Review Response Management', client_id: 'happy-days', assignee_id: 'marcus', status: 'inprogress', priority: 'Low', due_date: '2026-03-31', start_date: '2026-03-01', end_date: '2026-03-31', description: 'Monitor and respond to Google and Yelp reviews weekly. Escalate negative reviews within 24hrs.', is_milestone: false, type: 'other' },
    { id: 'hd-9', title: 'Blog Post: Cannabis Wellness Trends 2026', client_id: 'happy-days', assignee_id: 'sarah', status: 'todo', priority: 'Low', due_date: '2026-04-10', start_date: '2026-03-28', end_date: '2026-04-10', description: 'SEO-optimized blog post covering wellness and medical cannabis trends to drive organic traffic.', is_milestone: false, type: 'blog' },
    { id: 'hd-10', title: '420 Event Promotion Graphics', client_id: 'happy-days', assignee_id: 'marcus', status: 'todo', priority: 'Urgent', due_date: '2026-04-01', start_date: '2026-03-15', end_date: '2026-04-01', description: 'Design suite of graphics for 420 celebration event — social posts, stories, flyers, and email header.', is_milestone: false, type: 'design' },
    { id: 'hd-11', title: 'Monthly Client Meeting — March', client_id: 'happy-days', assignee_id: 'joe', status: 'done', priority: 'High', due_date: '2026-03-28', start_date: '2026-03-28', end_date: '2026-03-28', description: 'Monthly strategy meeting with Happy Days ownership team.', is_milestone: false, type: 'meeting' },
    { id: 'hd-m1', title: '🎯 Q2 Campaign Launch', client_id: 'happy-days', assignee_id: 'joe', status: 'todo', priority: 'Urgent', due_date: '2026-04-01', start_date: '2026-04-01', end_date: '2026-04-01', description: 'Q2 campaign goes live across all channels.', is_milestone: true, type: 'ad' },
    // K. Pacho
    { id: 'kp-1', title: 'Social Media Content Calendar — March', client_id: 'k-pacho', assignee_id: 'marcus', status: 'done', priority: 'High', due_date: '2026-03-01', start_date: '2026-02-20', end_date: '2026-03-01', description: 'Create content calendar for March featuring Taco Tuesday promotions, seasonal specials, and behind-the-scenes.', is_milestone: false, type: 'social' },
    { id: 'kp-2', title: 'Facebook Ad Campaign — Happy Hour Promo', client_id: 'k-pacho', assignee_id: 'marcus', status: 'review', priority: 'High', due_date: '2026-03-14', start_date: '2026-03-05', end_date: '2026-03-14', description: 'Run targeted local Facebook ads for new happy hour specials (3–6 PM weekdays).', is_milestone: false, type: 'ad' },
    { id: 'kp-3', title: 'Google Business Profile Update', client_id: 'k-pacho', assignee_id: 'sarah', status: 'done', priority: 'Medium', due_date: '2026-02-25', start_date: '2026-02-22', end_date: '2026-02-25', description: 'Add spring menu items, update photos, and respond to pending reviews.', is_milestone: false, type: 'other' },
    { id: 'kp-4', title: 'Menu Photography — Spring Menu', client_id: 'k-pacho', assignee_id: 'sarah', status: 'inprogress', priority: 'High', due_date: '2026-03-22', start_date: '2026-03-08', end_date: '2026-03-22', description: 'Full food photography session for new spring menu items. Deliverables: 25+ edited photos.', is_milestone: false, type: 'design' },
    { id: 'kp-5', title: 'Monthly Analytics Report — February', client_id: 'k-pacho', assignee_id: 'rick', status: 'done', priority: 'Medium', due_date: '2026-03-06', start_date: '2026-03-04', end_date: '2026-03-06', description: 'February performance report covering website, social, and ad metrics.', is_milestone: false, type: 'report' },
    { id: 'kp-6', title: 'Email Newsletter — Cinco de Mayo Preview', client_id: 'k-pacho', assignee_id: 'sarah', status: 'todo', priority: 'Medium', due_date: '2026-04-15', start_date: '2026-04-01', end_date: '2026-04-15', description: 'Early preview newsletter for Cinco de Mayo specials and reservations.', is_milestone: false, type: 'social' },
    { id: 'kp-7', title: 'Website Menu Page Refresh', client_id: 'k-pacho', assignee_id: 'joe', status: 'todo', priority: 'Medium', due_date: '2026-03-28', start_date: '2026-03-20', end_date: '2026-03-28', description: 'Update website menu page with new spring items and updated pricing.', is_milestone: false, type: 'other' },
    { id: 'kp-8', title: 'Review Response Management', client_id: 'k-pacho', assignee_id: 'marcus', status: 'inprogress', priority: 'Low', due_date: '2026-03-31', start_date: '2026-03-01', end_date: '2026-03-31', description: 'Weekly review monitoring and response for Google, Yelp, and TripAdvisor.', is_milestone: false, type: 'other' },
    { id: 'kp-9', title: 'Blog Post: Authentic Mexican Cuisine in Long Island', client_id: 'k-pacho', assignee_id: 'sarah', status: 'todo', priority: 'Low', due_date: '2026-04-08', start_date: '2026-03-25', end_date: '2026-04-08', description: 'SEO blog targeting local food discovery searches.', is_milestone: false, type: 'blog' },
    { id: 'kp-10', title: 'Monthly Client Meeting — March', client_id: 'k-pacho', assignee_id: 'rick', status: 'done', priority: 'High', due_date: '2026-03-27', start_date: '2026-03-27', end_date: '2026-03-27', description: 'Monthly strategy review with K. Pacho ownership.', is_milestone: false, type: 'meeting' },
    { id: 'kp-m1', title: '🎯 Spring Menu Launch', client_id: 'k-pacho', assignee_id: 'rick', status: 'todo', priority: 'High', due_date: '2026-03-22', start_date: '2026-03-22', end_date: '2026-03-22', description: 'Spring menu officially launches across all platforms.', is_milestone: true, type: 'other' },
    // The Refuge
    { id: 'tr-1', title: 'Grand Opening Campaign Strategy', client_id: 'the-refuge', assignee_id: 'joe', status: 'done', priority: 'Urgent', due_date: '2026-02-20', start_date: '2026-02-10', end_date: '2026-02-20', description: 'Full campaign strategy for The Refuge grand opening event in Melville.', is_milestone: false, type: 'ad' },
    { id: 'tr-2', title: 'Social Media Content Calendar — Launch Month', client_id: 'the-refuge', assignee_id: 'marcus', status: 'done', priority: 'Urgent', due_date: '2026-02-28', start_date: '2026-02-21', end_date: '2026-02-28', description: 'Content calendar for pre-launch hype, grand opening day, and post-opening buzz.', is_milestone: false, type: 'social' },
    { id: 'tr-3', title: 'Facebook & Instagram Ad Campaign — Grand Opening', client_id: 'the-refuge', assignee_id: 'marcus', status: 'done', priority: 'Urgent', due_date: '2026-03-07', start_date: '2026-02-28', end_date: '2026-03-07', description: 'Paid social campaign targeting Melville/Huntington area for grand opening awareness and RSVPs.', is_milestone: false, type: 'ad' },
    { id: 'tr-4', title: 'Grand Opening Event Promotion Graphics', client_id: 'the-refuge', assignee_id: 'marcus', status: 'done', priority: 'Urgent', due_date: '2026-02-27', start_date: '2026-02-21', end_date: '2026-02-27', description: 'Full graphic suite: social posts, stories, event flyer, email header, and digital signage.', is_milestone: false, type: 'design' },
    { id: 'tr-5', title: 'Google Business Profile Setup', client_id: 'the-refuge', assignee_id: 'sarah', status: 'done', priority: 'High', due_date: '2026-02-25', start_date: '2026-02-18', end_date: '2026-02-25', description: 'Complete Google Business Profile from scratch — hours, menu, photos, category, and description.', is_milestone: false, type: 'other' },
    { id: 'tr-6', title: 'Website Launch & Homepage Build', client_id: 'the-refuge', assignee_id: 'joe', status: 'review', priority: 'Urgent', due_date: '2026-03-14', start_date: '2026-02-25', end_date: '2026-03-14', description: 'Build and launch restaurant website with menu, reservations, about, and contact pages.', is_milestone: false, type: 'other' },
    { id: 'tr-7', title: 'Monthly Analytics Report — First 30 Days', client_id: 'the-refuge', assignee_id: 'rick', status: 'inprogress', priority: 'High', due_date: '2026-03-14', start_date: '2026-03-08', end_date: '2026-03-14', description: 'Inaugural analytics report covering grand opening campaign performance and baseline metrics.', is_milestone: false, type: 'report' },
    { id: 'tr-8', title: 'Menu Photography', client_id: 'the-refuge', assignee_id: 'sarah', status: 'inprogress', priority: 'High', due_date: '2026-03-20', start_date: '2026-03-10', end_date: '2026-03-20', description: 'Professional food photography for menu and website. 30+ edited hero shots.', is_milestone: false, type: 'design' },
    { id: 'tr-9', title: 'Email Newsletter — Welcome to The Refuge', client_id: 'the-refuge', assignee_id: 'sarah', status: 'todo', priority: 'Medium', due_date: '2026-03-22', start_date: '2026-03-15', end_date: '2026-03-22', description: 'Launch email to collected reservations list introducing the brand story and upcoming events.', is_milestone: false, type: 'social' },
    { id: 'tr-10', title: 'Review Response Management Setup', client_id: 'the-refuge', assignee_id: 'marcus', status: 'todo', priority: 'Medium', due_date: '2026-03-20', start_date: '2026-03-15', end_date: '2026-03-20', description: 'Establish review monitoring workflow and respond to first wave of opening reviews.', is_milestone: false, type: 'other' },
    { id: 'tr-11', title: 'Blog Post: The Story Behind The Refuge', client_id: 'the-refuge', assignee_id: 'sarah', status: 'todo', priority: 'Low', due_date: '2026-04-05', start_date: '2026-03-22', end_date: '2026-04-05', description: 'Brand story blog post covering the owners vision, concept, and Melville community connection.', is_milestone: false, type: 'blog' },
    { id: 'tr-12', title: 'Monthly Client Meeting — March', client_id: 'the-refuge', assignee_id: 'joe', status: 'review', priority: 'High', due_date: '2026-03-31', start_date: '2026-03-31', end_date: '2026-03-31', description: 'Monthly strategy meeting with The Refuge ownership.', is_milestone: false, type: 'meeting' },
    { id: 'tr-m1', title: '🎯 Grand Opening', client_id: 'the-refuge', assignee_id: 'joe', status: 'done', priority: 'Urgent', due_date: '2026-03-07', start_date: '2026-03-07', end_date: '2026-03-07', description: 'The Refuge officially opens to the public.', is_milestone: true, type: 'other' },
    { id: 'tr-m2', title: '🎯 Website Live', client_id: 'the-refuge', assignee_id: 'joe', status: 'review', priority: 'Urgent', due_date: '2026-03-14', start_date: '2026-03-14', end_date: '2026-03-14', description: 'Website goes live and is fully indexed.', is_milestone: true, type: 'other' },
    // April tasks
    { id: 'hd-apr-1', title: 'Ad Campaign Review — April', client_id: 'happy-days', assignee_id: 'marcus', status: 'todo', priority: 'High', due_date: '2026-04-15', start_date: '2026-04-13', end_date: '2026-04-15', description: 'Monthly ad campaign performance review and optimization.', is_milestone: false, type: 'report' },
    { id: 'kp-apr-1', title: 'Cinco de Mayo Campaign Launch', client_id: 'k-pacho', assignee_id: 'marcus', status: 'todo', priority: 'Urgent', due_date: '2026-04-20', start_date: '2026-04-15', end_date: '2026-04-20', description: 'Launch Cinco de Mayo promotional campaign across all channels.', is_milestone: false, type: 'ad' },
    { id: 'tr-apr-1', title: 'Social Media Content Calendar — April', client_id: 'the-refuge', assignee_id: 'marcus', status: 'todo', priority: 'High', due_date: '2026-03-25', start_date: '2026-03-22', end_date: '2026-03-25', description: 'April content calendar for The Refuge.', is_milestone: false, type: 'social' },
    { id: 'hd-apr-2', title: 'Social Media Content Calendar — April', client_id: 'happy-days', assignee_id: 'sarah', status: 'todo', priority: 'High', due_date: '2026-03-25', start_date: '2026-03-22', end_date: '2026-03-25', description: 'April content calendar for Happy Days.', is_milestone: false, type: 'social' },
    { id: 'kp-apr-2', title: 'Monthly Analytics Report — March', client_id: 'k-pacho', assignee_id: 'rick', status: 'todo', priority: 'Medium', due_date: '2026-04-07', start_date: '2026-04-05', end_date: '2026-04-07', description: 'March performance analytics report for K. Pacho.', is_milestone: false, type: 'report' },
    { id: 'hd-apr-3', title: 'Monthly Analytics Report — March', client_id: 'happy-days', assignee_id: 'rick', status: 'todo', priority: 'Medium', due_date: '2026-04-07', start_date: '2026-04-05', end_date: '2026-04-07', description: 'March performance analytics report for Happy Days.', is_milestone: false, type: 'report' },
    { id: 'tr-apr-2', title: 'Monthly Analytics Report — March', client_id: 'the-refuge', assignee_id: 'rick', status: 'todo', priority: 'Medium', due_date: '2026-04-07', start_date: '2026-04-05', end_date: '2026-04-07', description: 'March performance analytics report for The Refuge.', is_milestone: false, type: 'report' },
    { id: 'hd-apr-4', title: 'Google Business Profile Update — April', client_id: 'happy-days', assignee_id: 'sarah', status: 'todo', priority: 'Medium', due_date: '2026-04-01', start_date: '2026-04-01', end_date: '2026-04-01', description: 'Monthly Google Business Profile update.', is_milestone: false, type: 'other' },
    { id: 'tr-apr-3', title: 'Monthly Client Meeting — April', client_id: 'the-refuge', assignee_id: 'joe', status: 'todo', priority: 'High', due_date: '2026-04-30', start_date: '2026-04-30', end_date: '2026-04-30', description: 'Monthly strategy meeting with The Refuge.', is_milestone: false, type: 'meeting' },
  ];
  await upsert('tasks', tasks);

  console.log('Seeding task dependencies...');
  const taskDeps = [
    { task_id: 'hd-2', depends_on_id: 'hd-1' },
    { task_id: 'hd-4', depends_on_id: 'hd-3' },
    { task_id: 'hd-6', depends_on_id: 'hd-4' },
    { task_id: 'hd-7', depends_on_id: 'hd-1' },
    { task_id: 'hd-10', depends_on_id: 'hd-7' },
    { task_id: 'hd-m1', depends_on_id: 'hd-2' },
    { task_id: 'hd-m1', depends_on_id: 'hd-10' },
    { task_id: 'kp-2', depends_on_id: 'kp-1' },
    { task_id: 'kp-4', depends_on_id: 'kp-3' },
    { task_id: 'kp-6', depends_on_id: 'kp-4' },
    { task_id: 'kp-7', depends_on_id: 'kp-4' },
    { task_id: 'kp-m1', depends_on_id: 'kp-4' },
    { task_id: 'kp-m1', depends_on_id: 'kp-7' },
    { task_id: 'tr-2', depends_on_id: 'tr-1' },
    { task_id: 'tr-3', depends_on_id: 'tr-2' },
    { task_id: 'tr-4', depends_on_id: 'tr-1' },
    { task_id: 'tr-5', depends_on_id: 'tr-1' },
    { task_id: 'tr-6', depends_on_id: 'tr-4' },
    { task_id: 'tr-6', depends_on_id: 'tr-5' },
    { task_id: 'tr-8', depends_on_id: 'tr-6' },
    { task_id: 'tr-9', depends_on_id: 'tr-8' },
    { task_id: 'tr-10', depends_on_id: 'tr-5' },
    { task_id: 'tr-m1', depends_on_id: 'tr-2' },
    { task_id: 'tr-m1', depends_on_id: 'tr-4' },
    { task_id: 'tr-m1', depends_on_id: 'tr-5' },
    { task_id: 'tr-m2', depends_on_id: 'tr-6' },
  ];
  await upsertNoPK('task_dependencies', taskDeps, 'task_id,depends_on_id');

  console.log('Seeding approval history...');
  const approvals = [
    { id: 'ah-1', task_id: 'hd-1', action: 'approved', approver_id: 'joe', timestamp: '2026-03-05T16:00:00Z', note: 'Great work — calendar looks solid.' },
    { id: 'ah-2', task_id: 'hd-3', action: 'approved', approver_id: 'rick', timestamp: '2026-02-28T14:00:00Z', note: null },
    { id: 'ah-3', task_id: 'hd-5', action: 'approved', approver_id: 'joe', timestamp: '2026-03-07T17:00:00Z', note: null },
    { id: 'ah-11', task_id: 'hd-11', action: 'approved', approver_id: 'rick', timestamp: '2026-03-28T18:00:00Z', note: 'Meeting completed — great session.' },
    { id: 'ah-4', task_id: 'kp-1', action: 'approved', approver_id: 'joe', timestamp: '2026-03-01T12:00:00Z', note: null },
    { id: 'ah-5', task_id: 'kp-2', action: 'rejected', approver_id: 'rick', timestamp: '2026-03-10T09:00:00Z', note: 'Creative needs revision — headline too generic. Try "Happy Hour just got happier" angle.' },
    { id: 'ah-6', task_id: 'kp-3', action: 'approved', approver_id: 'joe', timestamp: '2026-02-25T16:30:00Z', note: null },
    { id: 'ah-7', task_id: 'kp-5', action: 'approved', approver_id: 'joe', timestamp: '2026-03-06T15:00:00Z', note: null },
    { id: 'ah-kp10', task_id: 'kp-10', action: 'approved', approver_id: 'joe', timestamp: '2026-03-27T17:00:00Z', note: null },
    { id: 'ah-8', task_id: 'tr-1', action: 'approved', approver_id: 'rick', timestamp: '2026-02-20T18:00:00Z', note: null },
    { id: 'ah-9', task_id: 'tr-2', action: 'approved', approver_id: 'joe', timestamp: '2026-02-28T14:00:00Z', note: null },
    { id: 'ah-10', task_id: 'tr-3', action: 'approved', approver_id: 'rick', timestamp: '2026-03-07T10:00:00Z', note: null },
    { id: 'ah-tr4', task_id: 'tr-4', action: 'approved', approver_id: 'joe', timestamp: '2026-02-27T16:00:00Z', note: null },
    { id: 'ah-tr5', task_id: 'tr-5', action: 'approved', approver_id: 'rick', timestamp: '2026-02-25T15:00:00Z', note: null },
    { id: 'ah-tr-m1', task_id: 'tr-m1', action: 'approved', approver_id: 'rick', timestamp: '2026-03-07T20:00:00Z', note: 'Grand opening was a massive success!' },
  ];
  await upsert('approval_history', approvals);

  console.log('Seeding documents...');
  await upsert('documents', [
    { id: 'doc-1', title: 'Q1 2026 Marketing Strategy', client_id: 'all', content: '# Q1 2026 Marketing Strategy — RJ Media\n\nSee the app for full content.', created_at: '2026-02-20T11:00:00Z', updated_at: '2026-03-05T09:00:00Z' },
    { id: 'doc-2', title: 'Happy Days Brand Guidelines', client_id: 'happy-days', content: '# Happy Days — Brand Guidelines\n*Medical Cannabis Dispensary | Farmingdale, NY*\n\n## Brand Overview\n\nHappy Days is a warm, welcoming medical cannabis dispensary focused on patient education and wellness.', created_at: '2026-01-20T10:00:00Z', updated_at: '2026-02-15T14:00:00Z' },
    { id: 'doc-3', title: 'The Refuge Grand Opening Campaign Brief', client_id: 'the-refuge', content: '# The Refuge — Grand Opening Campaign Brief\n*Restaurant | Melville, NY | Opening: March 7, 2026*\n\n## Campaign Overview\n\n**Campaign Name:** "Find Your Refuge"\n**Duration:** February 21 – March 14, 2026\n**Budget:** $3,200 paid social + production\n**Goal:** 500+ grand opening attendees, 1,000 social followers, 50+ first-week reviews', created_at: '2026-02-20T12:00:00Z', updated_at: '2026-03-01T10:00:00Z' },
  ]);

  console.log('Seeding document collaborators...');
  await upsertNoPK('document_collaborators', [
    { document_id: 'doc-1', team_member_id: 'joe' },
    { document_id: 'doc-1', team_member_id: 'rick' },
    { document_id: 'doc-1', team_member_id: 'sarah' },
    { document_id: 'doc-2', team_member_id: 'sarah' },
    { document_id: 'doc-3', team_member_id: 'joe' },
    { document_id: 'doc-3', team_member_id: 'rick' },
    { document_id: 'doc-3', team_member_id: 'marcus' },
  ], 'document_id,team_member_id');

  console.log('Seeding document versions...');
  await upsert('document_versions', [
    { id: 'v3', document_id: 'doc-1', version: 'v3.0', author_id: 'joe', created_at: '2026-03-05T09:00:00Z', summary: 'Added budget table, finalized KPIs section' },
    { id: 'v2-doc1', document_id: 'doc-1', version: 'v2.0', author_id: 'sarah', created_at: '2026-02-28T16:30:00Z', summary: 'Expanded content pillars section' },
    { id: 'v1-doc1', document_id: 'doc-1', version: 'v1.0', author_id: 'rick', created_at: '2026-02-20T11:00:00Z', summary: 'Initial draft' },
    { id: 'v2-doc2', document_id: 'doc-2', version: 'v1.2', author_id: 'sarah', created_at: '2026-02-15T14:00:00Z', summary: 'Added compliance section' },
    { id: 'v1-doc2', document_id: 'doc-2', version: 'v1.0', author_id: 'sarah', created_at: '2026-01-20T10:00:00Z', summary: 'Initial brand guidelines' },
    { id: 'v3-doc3', document_id: 'doc-3', version: 'v3.0', author_id: 'joe', created_at: '2026-03-01T10:00:00Z', summary: 'Added Phase 3 details' },
    { id: 'v1-doc3', document_id: 'doc-3', version: 'v1.0', author_id: 'joe', created_at: '2026-02-20T12:00:00Z', summary: 'Initial campaign brief' },
  ]);

  console.log('Seeding comments...');
  await upsert('comments', [
    { id: 'c1', document_id: 'doc-1', author_id: 'rick', parent_comment_id: null, text: 'Budget allocation looks solid. Can we add a line item for influencer marketing under The Refuge?', created_at: '2026-03-05T10:30:00Z' },
    { id: 'c1-r1', document_id: 'doc-1', author_id: 'joe', parent_comment_id: 'c1', text: "Agree. I'll allocate $500 from the content budget and identify 3-5 LI food bloggers.", created_at: '2026-03-05T11:15:00Z' },
    { id: 'c3', document_id: 'doc-3', author_id: 'rick', parent_comment_id: null, text: "The influencer strategy looks good. I connected with @linyc_eats and they're interested.", created_at: '2026-02-22T09:15:00Z' },
  ]);

  console.log('Seeding task templates...');
  await upsert('task_templates', [
    { id: 'tmpl-1', title: 'Monthly Analytics Report', description: "Compile GA4, Meta Ads, and Google Business insights for the previous month's performance review. Deliver by the 5th of each month.", default_assignee_role: 'Owner', default_priority: 'Medium', estimated_duration: 3, type: 'report', due_rule: '5th of each month', category: 'Reporting' },
    { id: 'tmpl-2', title: 'Social Media Content Calendar', description: 'Plan and schedule 30 days of social content across Instagram, Facebook, and X. Due the 25th of the prior month.', default_assignee_role: 'Content Manager', default_priority: 'High', estimated_duration: 5, type: 'social', due_rule: '25th of prior month', category: 'Content' },
    { id: 'tmpl-3', title: 'Ad Campaign Review', description: 'Monthly review and optimization of all active paid social and search campaigns. Check ROAS, adjust bids, refresh creatives as needed.', default_assignee_role: 'Social Media Specialist', default_priority: 'High', estimated_duration: 2, type: 'ad', due_rule: '15th of each month', category: 'Paid Media' },
    { id: 'tmpl-4', title: 'Google Business Profile Update', description: 'Update hours, photos, posts, and Q&A on Google Business Profile. Respond to any new reviews.', default_assignee_role: 'Content Manager', default_priority: 'Medium', estimated_duration: 1, type: 'other', due_rule: '1st of each month', category: 'Local SEO' },
    { id: 'tmpl-5', title: 'Monthly Client Meeting Prep', description: 'Prepare monthly client meeting agenda, pull performance data, and draft talking points. Includes scheduling and post-meeting notes.', default_assignee_role: 'Owner', default_priority: 'High', estimated_duration: 1, type: 'meeting', due_rule: 'Last business day of month', category: 'Client Relations' },
    { id: 'tmpl-6', title: 'Review Response Management', description: 'Monitor and respond to Google, Yelp, and TripAdvisor reviews. Escalate negative reviews within 24 hours.', default_assignee_role: 'Social Media Specialist', default_priority: 'Low', estimated_duration: 1, type: 'other', due_rule: 'Weekly (every Monday)', category: 'Reputation' },
    { id: 'tmpl-7', title: 'SEO Blog Post', description: 'Research, write, and publish an SEO-optimized blog post targeting a local or industry keyword. Includes keyword research and on-page optimization.', default_assignee_role: 'Content Manager', default_priority: 'Low', estimated_duration: 5, type: 'blog', due_rule: 'Monthly (custom date)', category: 'Content' },
    { id: 'tmpl-8', title: 'Email Newsletter', description: 'Draft, design, and schedule the monthly email newsletter. Includes list segmentation, A/B subject line testing, and post-send reporting.', default_assignee_role: 'Content Manager', default_priority: 'Medium', estimated_duration: 3, type: 'social', due_rule: 'Monthly (20th)', category: 'Email Marketing' },
  ]);

  console.log('Seeding automations...');
  await upsert('automations', [
    { id: 'auto-1', client_id: 'happy-days', template_id: 'tmpl-1', frequency: 'monthly', assignee_id: 'rick', status: 'active', next_run_date: '2026-04-05', last_run_date: '2026-03-05', created_at: '2026-01-01' },
    { id: 'auto-2', client_id: 'happy-days', template_id: 'tmpl-2', frequency: 'monthly', assignee_id: 'sarah', status: 'active', next_run_date: '2026-03-25', last_run_date: '2026-02-25', created_at: '2026-01-01' },
    { id: 'auto-3', client_id: 'happy-days', template_id: 'tmpl-3', frequency: 'monthly', assignee_id: 'marcus', status: 'active', next_run_date: '2026-04-15', last_run_date: '2026-03-15', created_at: '2026-01-01' },
    { id: 'auto-4', client_id: 'happy-days', template_id: 'tmpl-4', frequency: 'monthly', assignee_id: 'sarah', status: 'paused', next_run_date: '2026-04-01', last_run_date: '2026-03-01', created_at: '2026-01-01' },
    { id: 'auto-5', client_id: 'k-pacho', template_id: 'tmpl-1', frequency: 'monthly', assignee_id: 'rick', status: 'active', next_run_date: '2026-04-05', last_run_date: '2026-03-05', created_at: '2026-01-15' },
    { id: 'auto-6', client_id: 'k-pacho', template_id: 'tmpl-2', frequency: 'monthly', assignee_id: 'marcus', status: 'active', next_run_date: '2026-03-25', last_run_date: '2026-02-25', created_at: '2026-01-15' },
    { id: 'auto-7', client_id: 'k-pacho', template_id: 'tmpl-6', frequency: 'weekly', assignee_id: 'marcus', status: 'active', next_run_date: '2026-03-16', last_run_date: '2026-03-09', created_at: '2026-01-15' },
    { id: 'auto-8', client_id: 'k-pacho', template_id: 'tmpl-5', frequency: 'monthly', assignee_id: 'joe', status: 'active', next_run_date: '2026-03-31', last_run_date: '2026-02-28', created_at: '2026-01-15' },
    { id: 'auto-9', client_id: 'the-refuge', template_id: 'tmpl-1', frequency: 'monthly', assignee_id: 'rick', status: 'active', next_run_date: '2026-04-05', last_run_date: '2026-03-14', created_at: '2026-02-15' },
    { id: 'auto-10', client_id: 'the-refuge', template_id: 'tmpl-2', frequency: 'monthly', assignee_id: 'marcus', status: 'active', next_run_date: '2026-03-25', last_run_date: '2026-02-28', created_at: '2026-02-15' },
    { id: 'auto-11', client_id: 'the-refuge', template_id: 'tmpl-4', frequency: 'monthly', assignee_id: 'sarah', status: 'active', next_run_date: '2026-04-01', last_run_date: '2026-03-01', created_at: '2026-02-15' },
    { id: 'auto-12', client_id: 'the-refuge', template_id: 'tmpl-3', frequency: 'monthly', assignee_id: 'marcus', status: 'paused', next_run_date: '2026-04-15', last_run_date: '2026-03-15', created_at: '2026-02-15' },
  ]);

  console.log('Seeding time entries...');
  await upsert('time_entries', [
    { id: 'te-1', task_id: 'hd-1', client_id: 'happy-days', member_id: 'sarah', date: '2026-02-17', duration_minutes: 120, note: 'Initial calendar planning' },
    { id: 'te-2', task_id: 'hd-1', client_id: 'happy-days', member_id: 'sarah', date: '2026-02-19', duration_minutes: 180, note: 'Content writing and scheduling' },
    { id: 'te-3', task_id: 'hd-1', client_id: 'happy-days', member_id: 'sarah', date: '2026-02-24', duration_minutes: 90, note: 'Final review and approval' },
    { id: 'te-4', task_id: 'hd-2', client_id: 'happy-days', member_id: 'marcus', date: '2026-03-03', duration_minutes: 150, note: 'Campaign setup and targeting' },
    { id: 'te-5', task_id: 'hd-2', client_id: 'happy-days', member_id: 'marcus', date: '2026-03-06', duration_minutes: 120, note: 'Ad creative build' },
    { id: 'te-6', task_id: 'hd-2', client_id: 'happy-days', member_id: 'marcus', date: '2026-03-10', duration_minutes: 60, note: 'Performance check and bid adjustments' },
    { id: 'te-7', task_id: 'hd-4', client_id: 'happy-days', member_id: 'joe', date: '2026-03-01', duration_minutes: 240, note: 'Design and dev work' },
    { id: 'te-8', task_id: 'hd-4', client_id: 'happy-days', member_id: 'joe', date: '2026-03-05', duration_minutes: 180, note: 'Revisions round 1' },
    { id: 'te-9', task_id: 'hd-5', client_id: 'happy-days', member_id: 'rick', date: '2026-03-04', duration_minutes: 90, note: 'Data pull and analysis' },
    { id: 'te-10', task_id: 'hd-5', client_id: 'happy-days', member_id: 'rick', date: '2026-03-06', duration_minutes: 60, note: 'Report finalization' },
    { id: 'te-11', task_id: 'hd-7', client_id: 'happy-days', member_id: 'sarah', date: '2026-03-10', duration_minutes: 120, note: 'Newsletter draft' },
    { id: 'te-12', task_id: 'hd-7', client_id: 'happy-days', member_id: 'sarah', date: '2026-03-12', duration_minutes: 90, note: 'Design and layout' },
    { id: 'te-13', task_id: 'kp-1', client_id: 'k-pacho', member_id: 'marcus', date: '2026-02-20', duration_minutes: 120, note: 'Calendar planning' },
    { id: 'te-14', task_id: 'kp-1', client_id: 'k-pacho', member_id: 'marcus', date: '2026-02-25', duration_minutes: 150, note: 'Content writing' },
    { id: 'te-15', task_id: 'kp-2', client_id: 'k-pacho', member_id: 'marcus', date: '2026-03-05', duration_minutes: 180, note: 'Ad setup and creative' },
    { id: 'te-16', task_id: 'kp-2', client_id: 'k-pacho', member_id: 'marcus', date: '2026-03-08', duration_minutes: 90, note: 'Optimization and reporting' },
    { id: 'te-17', task_id: 'kp-4', client_id: 'k-pacho', member_id: 'sarah', date: '2026-03-08', duration_minutes: 240, note: 'Photography session coordination' },
    { id: 'te-18', task_id: 'kp-4', client_id: 'k-pacho', member_id: 'sarah', date: '2026-03-12', duration_minutes: 180, note: 'Photo editing and delivery' },
    { id: 'te-19', task_id: 'kp-5', client_id: 'k-pacho', member_id: 'rick', date: '2026-03-04', duration_minutes: 75, note: 'Data pull' },
    { id: 'te-20', task_id: 'kp-5', client_id: 'k-pacho', member_id: 'rick', date: '2026-03-06', duration_minutes: 45, note: 'Report write-up' },
    { id: 'te-21', task_id: 'tr-1', client_id: 'the-refuge', member_id: 'joe', date: '2026-02-10', duration_minutes: 300, note: 'Full strategy build' },
    { id: 'te-22', task_id: 'tr-2', client_id: 'the-refuge', member_id: 'marcus', date: '2026-02-21', duration_minutes: 180, note: 'Content planning' },
    { id: 'te-23', task_id: 'tr-3', client_id: 'the-refuge', member_id: 'marcus', date: '2026-02-28', duration_minutes: 240, note: 'Campaign setup' },
    { id: 'te-24', task_id: 'tr-3', client_id: 'the-refuge', member_id: 'marcus', date: '2026-03-03', duration_minutes: 120, note: 'Performance monitoring' },
    { id: 'te-25', task_id: 'tr-4', client_id: 'the-refuge', member_id: 'marcus', date: '2026-02-21', duration_minutes: 360, note: 'Full graphic suite design' },
    { id: 'te-26', task_id: 'tr-5', client_id: 'the-refuge', member_id: 'sarah', date: '2026-02-18', duration_minutes: 120, note: 'Profile setup' },
    { id: 'te-27', task_id: 'tr-6', client_id: 'the-refuge', member_id: 'joe', date: '2026-02-25', duration_minutes: 480, note: 'Website dev kickoff' },
    { id: 'te-28', task_id: 'tr-6', client_id: 'the-refuge', member_id: 'joe', date: '2026-03-02', duration_minutes: 360, note: 'Content pages and menu' },
    { id: 'te-29', task_id: 'tr-7', client_id: 'the-refuge', member_id: 'rick', date: '2026-03-08', duration_minutes: 120, note: 'First 30-day data pull' },
    { id: 'te-30', task_id: 'tr-8', client_id: 'the-refuge', member_id: 'sarah', date: '2026-03-10', duration_minutes: 300, note: 'Photo session' },
    { id: 'te-31', task_id: 'tr-8', client_id: 'the-refuge', member_id: 'sarah', date: '2026-03-12', duration_minutes: 180, note: 'Editing and delivery' },
  ]);

  console.log('Seeding assets...');
  await upsert('assets', [
    { id: 'ast-1', client_id: 'happy-days', filename: 'HappyDays_Logo_Primary.svg', file_type: 'logo', upload_date: '2026-01-15', uploaded_by: 'joe', size: '42 KB', color: '#10b981' },
    { id: 'ast-2', client_id: 'happy-days', filename: 'HappyDays_Logo_White.svg', file_type: 'logo', upload_date: '2026-01-15', uploaded_by: 'joe', size: '38 KB', color: '#065f46' },
    { id: 'ast-3', client_id: 'happy-days', filename: 'Menu_Photo_Tinctures_001.jpg', file_type: 'image', upload_date: '2026-02-05', uploaded_by: 'sarah', size: '2.4 MB', color: '#6ee7b7' },
    { id: 'ast-4', client_id: 'happy-days', filename: 'Menu_Photo_Edibles_002.jpg', file_type: 'image', upload_date: '2026-02-05', uploaded_by: 'sarah', size: '1.9 MB', color: '#a7f3d0' },
    { id: 'ast-5', client_id: 'happy-days', filename: 'Ad_Creative_Spring_Banner.jpg', file_type: 'image', upload_date: '2026-03-01', uploaded_by: 'marcus', size: '856 KB', color: '#34d399' },
    { id: 'ast-6', client_id: 'happy-days', filename: 'Ad_Creative_Spring_Story.jpg', file_type: 'image', upload_date: '2026-03-01', uploaded_by: 'marcus', size: '724 KB', color: '#10b981' },
    { id: 'ast-7', client_id: 'happy-days', filename: 'HappyDays_BrandGuide_2026.pdf', file_type: 'document', upload_date: '2026-01-20', uploaded_by: 'sarah', size: '4.2 MB', color: '#059669' },
    { id: 'ast-8', client_id: 'happy-days', filename: 'StoreFront_Video_Tour.mp4', file_type: 'video', upload_date: '2026-02-20', uploaded_by: 'marcus', size: '48 MB', color: '#047857' },
    { id: 'ast-9', client_id: 'k-pacho', filename: 'KPacho_Logo_Color.svg', file_type: 'logo', upload_date: '2026-01-10', uploaded_by: 'joe', size: '56 KB', color: '#f59e0b' },
    { id: 'ast-10', client_id: 'k-pacho', filename: 'KPacho_Logo_Dark.svg', file_type: 'logo', upload_date: '2026-01-10', uploaded_by: 'joe', size: '51 KB', color: '#92400e' },
    { id: 'ast-11', client_id: 'k-pacho', filename: 'FoodPhoto_Tacos_Hero.jpg', file_type: 'image', upload_date: '2026-02-10', uploaded_by: 'sarah', size: '3.1 MB', color: '#fcd34d' },
    { id: 'ast-12', client_id: 'k-pacho', filename: 'FoodPhoto_Margaritas.jpg', file_type: 'image', upload_date: '2026-02-10', uploaded_by: 'sarah', size: '2.7 MB', color: '#fbbf24' },
    { id: 'ast-13', client_id: 'k-pacho', filename: 'EventFlyer_HappyHour_March.jpg', file_type: 'image', upload_date: '2026-03-04', uploaded_by: 'marcus', size: '1.1 MB', color: '#f59e0b' },
    { id: 'ast-14', client_id: 'k-pacho', filename: 'SocialTemplate_TacoTuesday.psd', file_type: 'document', upload_date: '2026-02-15', uploaded_by: 'marcus', size: '8.4 MB', color: '#d97706' },
    { id: 'ast-15', client_id: 'the-refuge', filename: 'TheRefuge_Logo_Primary.svg', file_type: 'logo', upload_date: '2026-02-01', uploaded_by: 'joe', size: '63 KB', color: '#3b82f6' },
    { id: 'ast-16', client_id: 'the-refuge', filename: 'TheRefuge_Logo_Gold.svg', file_type: 'logo', upload_date: '2026-02-01', uploaded_by: 'joe', size: '59 KB', color: '#1d4ed8' },
    { id: 'ast-17', client_id: 'the-refuge', filename: 'Interior_Bar_Area.jpg', file_type: 'image', upload_date: '2026-02-25', uploaded_by: 'sarah', size: '4.2 MB', color: '#60a5fa' },
    { id: 'ast-18', client_id: 'the-refuge', filename: 'Interior_Dining_Room.jpg', file_type: 'image', upload_date: '2026-02-25', uploaded_by: 'sarah', size: '3.8 MB', color: '#93c5fd' },
    { id: 'ast-19', client_id: 'the-refuge', filename: 'MenuDesign_Dinner_v3.pdf', file_type: 'document', upload_date: '2026-03-01', uploaded_by: 'joe', size: '2.1 MB', color: '#2563eb' },
    { id: 'ast-20', client_id: 'the-refuge', filename: 'EventGraphics_GrandOpening.zip', file_type: 'document', upload_date: '2026-02-27', uploaded_by: 'marcus', size: '22 MB', color: '#3b82f6' },
    { id: 'ast-21', client_id: 'the-refuge', filename: 'GrandOpening_Recap_Video.mp4', file_type: 'video', upload_date: '2026-03-08', uploaded_by: 'marcus', size: '112 MB', color: '#1e40af' },
  ]);

  console.log('Seeding asset versions...');
  await upsert('asset_versions', [
    { id: 'av1-1', asset_id: 'ast-1', date: '2026-01-15', note: 'Initial upload' },
    { id: 'av2-1', asset_id: 'ast-2', date: '2026-01-15', note: 'Initial upload' },
    { id: 'av3-1', asset_id: 'ast-3', date: '2026-02-05', note: 'Raw upload' },
    { id: 'av3-2', asset_id: 'ast-3', date: '2026-02-10', note: 'Color corrected' },
    { id: 'av4-1', asset_id: 'ast-4', date: '2026-02-05', note: 'Raw upload' },
    { id: 'av5-1', asset_id: 'ast-5', date: '2026-03-01', note: 'v1' },
    { id: 'av5-2', asset_id: 'ast-5', date: '2026-03-05', note: 'Headline update' },
    { id: 'av6-1', asset_id: 'ast-6', date: '2026-03-01', note: 'v1' },
    { id: 'av7-1', asset_id: 'ast-7', date: '2026-01-20', note: 'Initial guide' },
    { id: 'av7-2', asset_id: 'ast-7', date: '2026-02-15', note: 'Updated compliance section' },
    { id: 'av8-1', asset_id: 'ast-8', date: '2026-02-20', note: 'Raw footage' },
    { id: 'av9-1', asset_id: 'ast-9', date: '2026-01-10', note: 'Initial upload' },
    { id: 'av10-1', asset_id: 'ast-10', date: '2026-01-10', note: 'Initial upload' },
    { id: 'av11-1', asset_id: 'ast-11', date: '2026-02-10', note: 'Session 1' },
    { id: 'av11-2', asset_id: 'ast-11', date: '2026-02-18', note: 'Final edit' },
    { id: 'av12-1', asset_id: 'ast-12', date: '2026-02-10', note: 'Session 1' },
    { id: 'av13-1', asset_id: 'ast-13', date: '2026-03-04', note: 'v1' },
    { id: 'av13-2', asset_id: 'ast-13', date: '2026-03-06', note: 'Date/time updated' },
    { id: 'av14-1', asset_id: 'ast-14', date: '2026-02-15', note: 'Master template' },
    { id: 'av15-1', asset_id: 'ast-15', date: '2026-02-01', note: 'Initial upload' },
    { id: 'av15-2', asset_id: 'ast-15', date: '2026-02-10', note: 'Tag line added' },
    { id: 'av16-1', asset_id: 'ast-16', date: '2026-02-01', note: 'Initial upload' },
    { id: 'av17-1', asset_id: 'ast-17', date: '2026-02-25', note: 'Pre-opening shoot' },
    { id: 'av18-1', asset_id: 'ast-18', date: '2026-02-25', note: 'Pre-opening shoot' },
    { id: 'av19-1', asset_id: 'ast-19', date: '2026-02-20', note: 'Initial' },
    { id: 'av19-2', asset_id: 'ast-19', date: '2026-02-25', note: 'Pricing update' },
    { id: 'av19-3', asset_id: 'ast-19', date: '2026-03-01', note: 'Final' },
    { id: 'av20-1', asset_id: 'ast-20', date: '2026-02-27', note: 'Full package delivered' },
    { id: 'av21-1', asset_id: 'ast-21', date: '2026-03-08', note: 'Rough cut' },
    { id: 'av21-2', asset_id: 'ast-21', date: '2026-03-10', note: 'Final edit' },
  ]);

  console.log('Seeding asset tags...');
  const assetTagData = [
    ['ast-1', ['logo', 'brand', 'primary']], ['ast-2', ['logo', 'brand', 'white']],
    ['ast-3', ['product', 'tinctures', 'photography']], ['ast-4', ['product', 'edibles', 'photography']],
    ['ast-5', ['ad', 'creative', 'spring', 'banner']], ['ast-6', ['ad', 'creative', 'spring', 'story']],
    ['ast-7', ['brand', 'guidelines', 'PDF']], ['ast-8', ['video', 'storefront', 'social']],
    ['ast-9', ['logo', 'brand', 'color']], ['ast-10', ['logo', 'brand', 'dark']],
    ['ast-11', ['food', 'photography', 'tacos', 'hero']], ['ast-12', ['food', 'photography', 'drinks']],
    ['ast-13', ['event', 'flyer', 'happy hour']], ['ast-14', ['template', 'social', 'taco tuesday']],
    ['ast-15', ['logo', 'brand', 'primary']], ['ast-16', ['logo', 'brand', 'gold', 'alternate']],
    ['ast-17', ['interior', 'bar', 'ambiance']], ['ast-18', ['interior', 'dining', 'ambiance']],
    ['ast-19', ['menu', 'design', 'PDF', 'dinner']], ['ast-20', ['event', 'grand opening', 'graphics', 'package']],
    ['ast-21', ['video', 'grand opening', 'recap', 'social']],
  ];
  const tagRows = assetTagData.flatMap(([assetId, tags]) => tags.map(tag => ({ asset_id: assetId, tag })));
  await upsertNoPK('asset_tags', tagRows, 'asset_id,tag');

  console.log('Seeding workflow templates...');
  await upsert('workflow_templates', [
    { id: 'wt-1', name: 'Monthly Ad Campaign Management', description: 'Full-cycle paid media campaign management from strategy to end-of-month reporting.', category: 'Paid Media', default_duration_days: 30 },
    { id: 'wt-2', name: 'Website Build', description: 'Full website design and development from discovery to launch.', category: 'Web Dev', default_duration_days: 60 },
    { id: 'wt-3', name: 'Monthly Social Media Management', description: 'End-to-end monthly social media execution from content planning to analytics.', category: 'Social Media', default_duration_days: 30 },
    { id: 'wt-4', name: 'New Client Onboarding', description: 'Structured onboarding process to get a new client fully set up and strategy-ready.', category: 'Onboarding', default_duration_days: 14 },
    { id: 'wt-5', name: 'Monthly SEO Management', description: 'Comprehensive SEO management covering technical audits, content, and link building.', category: 'SEO', default_duration_days: 30 },
    { id: 'wt-6', name: 'Quarterly Strategy Review', description: 'End-of-quarter performance review and strategy planning for the next quarter.', category: 'Strategy', default_duration_days: 14 },
  ]);

  console.log('Seeding workflow steps...');
  await upsert('workflow_steps', [
    // wt-1 steps
    { id: 'wt1-s1', workflow_template_id: 'wt-1', step_order: 1, title: 'Strategy & Budget Review', description: 'Review monthly budget allocation, audience targeting, and campaign goals.', default_duration_days: 2, assignee_role: 'Owner' },
    { id: 'wt1-s2', workflow_template_id: 'wt-1', step_order: 2, title: 'Creative Brief', description: 'Document creative direction, messaging, CTAs, and visual requirements.', default_duration_days: 2, assignee_role: 'Content Manager' },
    { id: 'wt1-s3', workflow_template_id: 'wt-1', step_order: 3, title: 'Ad Creative Design', description: 'Design static images, video assets, and copy variations for all placements.', default_duration_days: 4, assignee_role: 'Content Manager' },
    { id: 'wt1-s4', workflow_template_id: 'wt-1', step_order: 4, title: 'Campaign Setup', description: 'Build campaigns in Meta Ads Manager — audiences, placements, budgets, and tracking.', default_duration_days: 2, assignee_role: 'Social Media Specialist' },
    { id: 'wt1-s5', workflow_template_id: 'wt-1', step_order: 5, title: 'Launch & Monitor', description: 'Launch campaigns and monitor daily performance for first 5 days.', default_duration_days: 5, assignee_role: 'Social Media Specialist' },
    { id: 'wt1-s6', workflow_template_id: 'wt-1', step_order: 6, title: 'Mid-Month Optimization', description: 'Adjust bids, budgets, and creative based on 2-week performance data.', default_duration_days: 2, assignee_role: 'Social Media Specialist' },
    { id: 'wt1-s7', workflow_template_id: 'wt-1', step_order: 7, title: 'End-of-Month Report', description: 'Compile full performance report with ROAS, CPC, reach, and recommendations.', default_duration_days: 2, assignee_role: 'Owner' },
    // wt-2 steps
    { id: 'wt2-s1', workflow_template_id: 'wt-2', step_order: 1, title: 'Discovery & Requirements', description: 'Gather brand assets, define site structure, and document all requirements.', default_duration_days: 5, assignee_role: 'Owner' },
    { id: 'wt2-s2', workflow_template_id: 'wt-2', step_order: 2, title: 'Sitemap & Wireframes', description: 'Build site architecture and low-fidelity wireframes for all key pages.', default_duration_days: 5, assignee_role: 'Owner' },
    { id: 'wt2-s3', workflow_template_id: 'wt-2', step_order: 3, title: 'Visual Design', description: 'Create high-fidelity mockups applying brand guidelines.', default_duration_days: 8, assignee_role: 'Content Manager' },
    { id: 'wt2-s4', workflow_template_id: 'wt-2', step_order: 4, title: 'Development', description: 'Build out all pages in WordPress/Next.js with responsive layouts.', default_duration_days: 15, assignee_role: 'Owner' },
    { id: 'wt2-s5', workflow_template_id: 'wt-2', step_order: 5, title: 'Content Population', description: 'Add all copy, images, menu items, and media to the CMS.', default_duration_days: 5, assignee_role: 'Content Manager' },
    { id: 'wt2-s6', workflow_template_id: 'wt-2', step_order: 6, title: 'QA & Testing', description: 'Cross-browser and mobile testing, performance checks, and bug fixes.', default_duration_days: 5, assignee_role: 'Owner' },
    { id: 'wt2-s7', workflow_template_id: 'wt-2', step_order: 7, title: 'Client Review', description: 'Client walkthrough, feedback round, and revision implementation.', default_duration_days: 5, assignee_role: 'Owner' },
    { id: 'wt2-s8', workflow_template_id: 'wt-2', step_order: 8, title: 'Launch', description: 'DNS cutover, final QA, Google indexing submission, and analytics verification.', default_duration_days: 2, assignee_role: 'Owner' },
    // wt-3 steps
    { id: 'wt3-s1', workflow_template_id: 'wt-3', step_order: 1, title: 'Content Calendar Planning', description: 'Map out all posts for the month — topics, formats, and publishing schedule.', default_duration_days: 3, assignee_role: 'Content Manager' },
    { id: 'wt3-s2', workflow_template_id: 'wt-3', step_order: 2, title: 'Content Creation (Copy)', description: 'Write all captions, hashtag sets, and story copy.', default_duration_days: 5, assignee_role: 'Content Manager' },
    { id: 'wt3-s3', workflow_template_id: 'wt-3', step_order: 3, title: 'Content Creation (Graphics)', description: 'Design all static images, carousels, and Reel covers.', default_duration_days: 5, assignee_role: 'Social Media Specialist' },
    { id: 'wt3-s4', workflow_template_id: 'wt-3', step_order: 4, title: 'Scheduling & Publishing', description: 'Schedule all content in Buffer/Later and publish time-sensitive posts manually.', default_duration_days: 2, assignee_role: 'Content Manager' },
    { id: 'wt3-s5', workflow_template_id: 'wt-3', step_order: 5, title: 'Community Engagement', description: 'Daily response to comments, DMs, mentions, and story interactions.', default_duration_days: 20, assignee_role: 'Social Media Specialist' },
    { id: 'wt3-s6', workflow_template_id: 'wt-3', step_order: 6, title: 'Monthly Analytics Report', description: 'Compile reach, engagement, follower growth, and top-performing content.', default_duration_days: 2, assignee_role: 'Owner' },
    // wt-4 steps
    { id: 'wt4-s1', workflow_template_id: 'wt-4', step_order: 1, title: 'Intake Call & Brief', description: 'Discovery call to capture brand story, goals, competitors, and target audience.', default_duration_days: 1, assignee_role: 'Owner' },
    { id: 'wt4-s2', workflow_template_id: 'wt-4', step_order: 2, title: 'Account Access Setup', description: 'Gain access to Meta Business, Google, website, and email platform.', default_duration_days: 2, assignee_role: 'Owner' },
    { id: 'wt4-s3', workflow_template_id: 'wt-4', step_order: 3, title: 'Brand Audit', description: 'Review existing brand assets, social presence, website, and online reputation.', default_duration_days: 3, assignee_role: 'Content Manager' },
    { id: 'wt4-s4', workflow_template_id: 'wt-4', step_order: 4, title: 'Competitor Analysis', description: 'Research 3-5 direct competitors across digital channels.', default_duration_days: 2, assignee_role: 'Owner' },
    { id: 'wt4-s5', workflow_template_id: 'wt-4', step_order: 5, title: 'Strategy Proposal', description: 'Present 90-day marketing strategy with goals, channels, and budget allocation.', default_duration_days: 3, assignee_role: 'Owner' },
    { id: 'wt4-s6', workflow_template_id: 'wt-4', step_order: 6, title: 'Client Kickoff Meeting', description: 'Present strategy, align on KPIs, set expectations, and begin execution.', default_duration_days: 1, assignee_role: 'Owner' },
    // wt-5 steps (abbreviated)
    { id: 'wt5-s1', workflow_template_id: 'wt-5', step_order: 1, title: 'Technical Audit', description: 'Check site speed, crawl errors, Core Web Vitals, and schema markup.', default_duration_days: 3, assignee_role: 'Owner' },
    { id: 'wt5-s2', workflow_template_id: 'wt-5', step_order: 2, title: 'Keyword Research', description: 'Identify target keywords, track rankings, and find gap opportunities.', default_duration_days: 3, assignee_role: 'Content Manager' },
    { id: 'wt5-s3', workflow_template_id: 'wt-5', step_order: 3, title: 'On-Page Optimization', description: 'Update title tags, meta descriptions, H-tags, and internal linking.', default_duration_days: 4, assignee_role: 'Owner' },
    { id: 'wt5-s4', workflow_template_id: 'wt-5', step_order: 4, title: 'Content Planning', description: 'Define blog topics, landing page updates, and FAQ content based on keyword data.', default_duration_days: 2, assignee_role: 'Content Manager' },
    { id: 'wt5-s5', workflow_template_id: 'wt-5', step_order: 5, title: 'Content Creation', description: 'Write and publish SEO blog posts and updated landing page copy.', default_duration_days: 7, assignee_role: 'Content Manager' },
    { id: 'wt5-s6', workflow_template_id: 'wt-5', step_order: 6, title: 'Link Building Outreach', description: 'Pitch local directories, industry blogs, and partners for backlinks.', default_duration_days: 5, assignee_role: 'Owner' },
    { id: 'wt5-s7', workflow_template_id: 'wt-5', step_order: 7, title: 'Monthly Report', description: 'Document ranking changes, traffic trends, and recommendations.', default_duration_days: 2, assignee_role: 'Owner' },
    // wt-6 steps
    { id: 'wt6-s1', workflow_template_id: 'wt-6', step_order: 1, title: 'Data Collection', description: 'Pull all quarterly data from Meta, Google Analytics, and email platforms.', default_duration_days: 2, assignee_role: 'Owner' },
    { id: 'wt6-s2', workflow_template_id: 'wt-6', step_order: 2, title: 'Performance Analysis', description: 'Analyze KPI performance against quarterly targets and identify trends.', default_duration_days: 3, assignee_role: 'Owner' },
    { id: 'wt6-s3', workflow_template_id: 'wt-6', step_order: 3, title: 'Competitive Landscape', description: 'Review competitor activity and market changes over the quarter.', default_duration_days: 2, assignee_role: 'Content Manager' },
    { id: 'wt6-s4', workflow_template_id: 'wt-6', step_order: 4, title: 'Strategy Recommendations', description: 'Draft next-quarter strategy with updated goals and channel mix.', default_duration_days: 3, assignee_role: 'Owner' },
    { id: 'wt6-s5', workflow_template_id: 'wt-6', step_order: 5, title: 'Client Presentation', description: 'Present quarterly recap and next-quarter strategy to client.', default_duration_days: 1, assignee_role: 'Owner' },
    { id: 'wt6-s6', workflow_template_id: 'wt-6', step_order: 6, title: 'Strategy Finalization', description: 'Incorporate client feedback and finalize approved strategy document.', default_duration_days: 2, assignee_role: 'Owner' },
  ]);

  console.log('Seeding workflow step dependencies...');
  await upsertNoPK('workflow_step_dependencies', [
    { step_id: 'wt1-s2', depends_on_id: 'wt1-s1' }, { step_id: 'wt1-s3', depends_on_id: 'wt1-s2' },
    { step_id: 'wt1-s4', depends_on_id: 'wt1-s3' }, { step_id: 'wt1-s5', depends_on_id: 'wt1-s4' },
    { step_id: 'wt1-s6', depends_on_id: 'wt1-s5' }, { step_id: 'wt1-s7', depends_on_id: 'wt1-s6' },
    { step_id: 'wt2-s2', depends_on_id: 'wt2-s1' }, { step_id: 'wt2-s3', depends_on_id: 'wt2-s2' },
    { step_id: 'wt2-s4', depends_on_id: 'wt2-s3' }, { step_id: 'wt2-s5', depends_on_id: 'wt2-s4' },
    { step_id: 'wt2-s6', depends_on_id: 'wt2-s5' }, { step_id: 'wt2-s7', depends_on_id: 'wt2-s6' },
    { step_id: 'wt2-s8', depends_on_id: 'wt2-s7' },
    { step_id: 'wt3-s2', depends_on_id: 'wt3-s1' }, { step_id: 'wt3-s3', depends_on_id: 'wt3-s1' },
    { step_id: 'wt3-s4', depends_on_id: 'wt3-s2' }, { step_id: 'wt3-s4', depends_on_id: 'wt3-s3' },
    { step_id: 'wt3-s5', depends_on_id: 'wt3-s4' }, { step_id: 'wt3-s6', depends_on_id: 'wt3-s5' },
    { step_id: 'wt4-s2', depends_on_id: 'wt4-s1' }, { step_id: 'wt4-s3', depends_on_id: 'wt4-s2' },
    { step_id: 'wt4-s4', depends_on_id: 'wt4-s3' }, { step_id: 'wt4-s5', depends_on_id: 'wt4-s4' },
    { step_id: 'wt4-s6', depends_on_id: 'wt4-s5' },
    { step_id: 'wt5-s3', depends_on_id: 'wt5-s1' }, { step_id: 'wt5-s3', depends_on_id: 'wt5-s2' },
    { step_id: 'wt5-s4', depends_on_id: 'wt5-s2' }, { step_id: 'wt5-s5', depends_on_id: 'wt5-s4' },
    { step_id: 'wt5-s6', depends_on_id: 'wt5-s3' }, { step_id: 'wt5-s7', depends_on_id: 'wt5-s5' },
    { step_id: 'wt5-s7', depends_on_id: 'wt5-s6' },
    { step_id: 'wt6-s2', depends_on_id: 'wt6-s1' }, { step_id: 'wt6-s3', depends_on_id: 'wt6-s1' },
    { step_id: 'wt6-s4', depends_on_id: 'wt6-s2' }, { step_id: 'wt6-s4', depends_on_id: 'wt6-s3' },
    { step_id: 'wt6-s5', depends_on_id: 'wt6-s4' }, { step_id: 'wt6-s6', depends_on_id: 'wt6-s5' },
  ], 'step_id,depends_on_id');

  console.log('Seeding strategies...');
  await upsert('strategies', [
    { id: 'strat-hd-1', client_id: 'happy-days', name: 'Q2 2026 Growth Strategy', quarter: 'Q2 2026', start_date: '2026-04-01', end_date: '2026-06-30', status: 'active' },
    { id: 'strat-kp-1', client_id: 'k-pacho', name: 'Q2 2026 Engagement Strategy', quarter: 'Q2 2026', start_date: '2026-04-01', end_date: '2026-06-30', status: 'planning' },
    { id: 'strat-tr-1', client_id: 'the-refuge', name: 'Q2 2026 Launch Strategy', quarter: 'Q2 2026', start_date: '2026-04-01', end_date: '2026-06-30', status: 'active' },
  ]);

  console.log('Seeding strategy pillars...');
  await upsert('strategy_pillars', [
    { id: 'pillar-hd-1', strategy_id: 'strat-hd-1', name: 'Brand Awareness', description: 'Grow social following and increase local visibility in Farmingdale and surrounding areas.' },
    { id: 'pillar-hd-2', strategy_id: 'strat-hd-1', name: 'Revenue Growth', description: 'Drive dispensary foot traffic and convert paid ad spend into measurable store visits.' },
    { id: 'pillar-hd-3', strategy_id: 'strat-hd-1', name: 'Digital Presence', description: 'Redesign website and improve SEO to capture organic search traffic.' },
    { id: 'pillar-kp-1', strategy_id: 'strat-kp-1', name: 'Community Engagement', description: 'Build a loyal local community through events, social engagement, and Cinco de Mayo activation.' },
    { id: 'pillar-kp-2', strategy_id: 'strat-kp-1', name: 'Reputation Management', description: 'Improve Google rating and build a steady stream of positive reviews.' },
    { id: 'pillar-tr-1', strategy_id: 'strat-tr-1', name: 'Grand Opening Push', description: 'Maximize launch visibility and establish The Refuge as the premier dining destination in Melville.' },
    { id: 'pillar-tr-2', strategy_id: 'strat-tr-1', name: 'Ongoing Marketing Foundation', description: 'Establish recurring monthly marketing to build long-term awareness and lead flow.' },
  ]);

  console.log('Seeding strategy KPIs...');
  await upsert('strategy_kpis', [
    { id: 'kpi-hd-1', pillar_id: 'pillar-hd-1', name: 'Social Followers', target: 5000, current: 3200, unit: 'followers' },
    { id: 'kpi-hd-2', pillar_id: 'pillar-hd-1', name: 'Monthly Impressions', target: 100000, current: 65000, unit: 'impressions' },
    { id: 'kpi-hd-3', pillar_id: 'pillar-hd-2', name: 'Ad ROAS', target: 4.0, current: 3.2, unit: 'x' },
    { id: 'kpi-hd-4', pillar_id: 'pillar-hd-2', name: 'Monthly Store Visits from Ads', target: 500, current: 320, unit: 'visits' },
    { id: 'kpi-hd-5', pillar_id: 'pillar-hd-3', name: 'Website Traffic', target: 8000, current: 5500, unit: '/mo' },
    { id: 'kpi-hd-6', pillar_id: 'pillar-hd-3', name: 'Bounce Rate', target: 35, current: 48, unit: '%' },
    { id: 'kpi-kp-1', pillar_id: 'pillar-kp-1', name: 'Event RSVPs', target: 200, current: 0, unit: 'RSVPs' },
    { id: 'kpi-kp-2', pillar_id: 'pillar-kp-1', name: 'Engagement Rate', target: 5, current: 3.1, unit: '%' },
    { id: 'kpi-kp-3', pillar_id: 'pillar-kp-2', name: 'Google Rating', target: 4.7, current: 4.4, unit: '★' },
    { id: 'kpi-kp-4', pillar_id: 'pillar-kp-2', name: 'Monthly Reviews', target: 20, current: 12, unit: 'reviews' },
    { id: 'kpi-tr-1', pillar_id: 'pillar-tr-1', name: 'Opening Week Covers', target: 800, current: 0, unit: 'covers' },
    { id: 'kpi-tr-2', pillar_id: 'pillar-tr-1', name: 'Press Mentions', target: 5, current: 2, unit: 'mentions' },
    { id: 'kpi-tr-3', pillar_id: 'pillar-tr-2', name: 'Social Following', target: 3000, current: 1200, unit: 'followers' },
    { id: 'kpi-tr-4', pillar_id: 'pillar-tr-2', name: 'Monthly Ad Leads', target: 150, current: 45, unit: 'leads' },
  ]);

  console.log('Seeding strategy pillar projects...');
  await upsertNoPK('strategy_pillar_projects', [
    { pillar_id: 'pillar-hd-1', project_id: 'proj-hd-2' },
    { pillar_id: 'pillar-hd-2', project_id: 'proj-hd-1' },
    { pillar_id: 'pillar-hd-3', project_id: 'proj-hd-3' },
    { pillar_id: 'pillar-kp-1', project_id: 'proj-kp-1' },
    { pillar_id: 'pillar-kp-1', project_id: 'proj-kp-2' },
    { pillar_id: 'pillar-kp-2', project_id: 'proj-kp-3' },
    { pillar_id: 'pillar-tr-1', project_id: 'proj-tr-1' },
    { pillar_id: 'pillar-tr-1', project_id: 'proj-tr-2' },
    { pillar_id: 'pillar-tr-2', project_id: 'proj-tr-3' },
    { pillar_id: 'pillar-tr-2', project_id: 'proj-tr-4' },
  ], 'pillar_id,project_id');

  console.log('Seeding projects...');
  await upsert('projects', [
    { id: 'proj-hd-1', client_id: 'happy-days', strategy_id: 'strat-hd-1', pillar_id: 'pillar-hd-2', name: 'Monthly Ad Campaign — April 2026', description: 'Full paid media campaign management for Happy Days April.', status: 'active', start_date: '2026-04-01', end_date: '2026-04-30', progress: 35, workflow_template_id: 'wt-1' },
    { id: 'proj-hd-2', client_id: 'happy-days', strategy_id: 'strat-hd-1', pillar_id: 'pillar-hd-1', name: 'Monthly Social Media — April 2026', description: 'April social media content calendar, copy, graphics, scheduling, and community engagement.', status: 'active', start_date: '2026-03-25', end_date: '2026-04-30', progress: 20, workflow_template_id: 'wt-3' },
    { id: 'proj-hd-3', client_id: 'happy-days', strategy_id: 'strat-hd-1', pillar_id: 'pillar-hd-3', name: 'Website Redesign', description: 'Full homepage and product page redesign with updated compliance-friendly copy and photography.', status: 'active', start_date: '2026-03-01', end_date: '2026-04-15', progress: 60, workflow_template_id: 'wt-2' },
    { id: 'proj-kp-1', client_id: 'k-pacho', strategy_id: 'strat-kp-1', pillar_id: 'pillar-kp-1', name: 'Monthly Social Media — April 2026', description: 'April content calendar, Cinco de Mayo prep content, and community engagement for K. Pacho.', status: 'planning', start_date: '2026-03-25', end_date: '2026-04-30', progress: 10, workflow_template_id: 'wt-3' },
    { id: 'proj-kp-2', client_id: 'k-pacho', strategy_id: 'strat-kp-1', pillar_id: 'pillar-kp-1', name: 'Cinco de Mayo Event Campaign', description: 'Full campaign for Cinco de Mayo including ads, graphics, email, and social.', status: 'planning', start_date: '2026-04-01', end_date: '2026-05-05', progress: 5 },
    { id: 'proj-kp-3', client_id: 'k-pacho', strategy_id: 'strat-kp-1', pillar_id: 'pillar-kp-2', name: 'Monthly SEO — April 2026', description: 'Technical SEO, local keyword optimization, and content for K. Pacho April cycle.', status: 'planning', start_date: '2026-04-01', end_date: '2026-04-30', progress: 0, workflow_template_id: 'wt-5' },
    { id: 'proj-tr-1', client_id: 'the-refuge', strategy_id: 'strat-tr-1', pillar_id: 'pillar-tr-1', name: 'Grand Opening Campaign', description: 'Full launch campaign for The Refuge grand opening.', status: 'complete', start_date: '2026-02-10', end_date: '2026-03-14', progress: 100, workflow_template_id: 'wt-1' },
    { id: 'proj-tr-2', client_id: 'the-refuge', strategy_id: 'strat-tr-1', pillar_id: 'pillar-tr-1', name: 'PR Outreach', description: 'Media outreach to Long Island food press, influencers, and local bloggers.', status: 'active', start_date: '2026-02-25', end_date: '2026-04-01', progress: 40 },
    { id: 'proj-tr-3', client_id: 'the-refuge', strategy_id: 'strat-tr-1', pillar_id: 'pillar-tr-2', name: 'Monthly Social Media — April 2026', description: 'First full month of ongoing social media management for The Refuge.', status: 'planning', start_date: '2026-03-25', end_date: '2026-04-30', progress: 5, workflow_template_id: 'wt-3' },
    { id: 'proj-tr-4', client_id: 'the-refuge', strategy_id: 'strat-tr-1', pillar_id: 'pillar-tr-2', name: 'New Client Onboarding', description: 'Full onboarding process for The Refuge.', status: 'complete', start_date: '2026-02-10', end_date: '2026-02-24', progress: 100, workflow_template_id: 'wt-4' },
  ]);

  console.log('Seeding project task links...');
  await upsertNoPK('project_task_links', [
    { project_id: 'proj-hd-1', task_id: 'hd-2' }, { project_id: 'proj-hd-1', task_id: 'hd-m1' }, { project_id: 'proj-hd-1', task_id: 'hd-apr-1' },
    { project_id: 'proj-hd-2', task_id: 'hd-apr-2' }, { project_id: 'proj-hd-2', task_id: 'hd-1' }, { project_id: 'proj-hd-2', task_id: 'hd-7' },
    { project_id: 'proj-hd-3', task_id: 'hd-3' }, { project_id: 'proj-hd-3', task_id: 'hd-4' }, { project_id: 'proj-hd-3', task_id: 'hd-6' }, { project_id: 'proj-hd-3', task_id: 'hd-9' },
    { project_id: 'proj-kp-1', task_id: 'kp-1' }, { project_id: 'proj-kp-1', task_id: 'kp-apr-2' }, { project_id: 'proj-kp-1', task_id: 'kp-6' },
    { project_id: 'proj-kp-2', task_id: 'kp-apr-1' }, { project_id: 'proj-kp-2', task_id: 'kp-2' }, { project_id: 'proj-kp-2', task_id: 'kp-4' },
    { project_id: 'proj-kp-3', task_id: 'kp-3' }, { project_id: 'proj-kp-3', task_id: 'kp-7' }, { project_id: 'proj-kp-3', task_id: 'kp-9' },
    { project_id: 'proj-tr-1', task_id: 'tr-1' }, { project_id: 'proj-tr-1', task_id: 'tr-2' }, { project_id: 'proj-tr-1', task_id: 'tr-3' }, { project_id: 'proj-tr-1', task_id: 'tr-4' }, { project_id: 'proj-tr-1', task_id: 'tr-m1' },
    { project_id: 'proj-tr-2', task_id: 'tr-5' }, { project_id: 'proj-tr-2', task_id: 'tr-10' }, { project_id: 'proj-tr-2', task_id: 'tr-11' },
    { project_id: 'proj-tr-3', task_id: 'tr-apr-1' }, { project_id: 'proj-tr-3', task_id: 'tr-2' }, { project_id: 'proj-tr-3', task_id: 'tr-9' },
    { project_id: 'proj-tr-4', task_id: 'tr-5' }, { project_id: 'proj-tr-4', task_id: 'tr-6' }, { project_id: 'proj-tr-4', task_id: 'tr-7' },
  ], 'project_id,task_id');

  console.log('Seeding services...');
  await upsert('services', [
    { id: 'paid-ads', name: 'Paid Ads', category: 'Paid Media', description: 'Meta, Google, and local paid advertising campaigns — managed start to finish.', icon: '📣', default_cadence: 'monthly' },
    { id: 'seo', name: 'SEO', category: 'SEO', description: 'Technical SEO, on-page optimization, local listings, and content strategy.', icon: '🔍', default_cadence: 'monthly' },
    { id: 'content-creation', name: 'Content Creation', category: 'Content', description: 'Video production, photography, and creative content for social and web.', icon: '🎬', default_cadence: 'monthly' },
    { id: 'social-media', name: 'Social Media Management', category: 'Social Media', description: 'Full social media management: calendars, publishing, community engagement, and reporting.', icon: '📱', default_cadence: 'monthly' },
    { id: 'email-marketing', name: 'Email Marketing', category: 'Email Marketing', description: 'Email list management, newsletter design, automation flows, and deliverability.', icon: '✉️', default_cadence: 'monthly' },
    { id: 'web-development', name: 'Web Development', category: 'Web Development', description: 'Website design, development, launch, and ongoing maintenance.', icon: '🌐', default_cadence: 'one-time' },
    { id: 'tech-support', name: 'Tech Support / Virtual CIO', category: 'Tech Support', description: 'Technical operations support, platform management, and virtual CIO advisory.', icon: '🛠️', default_cadence: 'monthly' },
    { id: 'strategy-consulting', name: 'Strategy Consulting', category: 'Strategy Consulting', description: 'Quarterly strategy planning, competitive analysis, and growth roadmaps.', icon: '🎯', default_cadence: 'quarterly' },
  ]);

  console.log('Seeding client services...');
  await upsert('client_services', [
    { id: 'cs-hd-paid-ads', client_id: 'happy-days', service_id: 'paid-ads', status: 'active', start_date: '2026-01-01', monthly_cadence: 'Full monthly Meta Ads management + ad creative', linked_strategy_id: 'strat-hd-1' },
    { id: 'cs-hd-seo', client_id: 'happy-days', service_id: 'seo', status: 'active', start_date: '2026-01-01', monthly_cadence: 'Monthly SEO — technical audit + local optimization + blog content', linked_strategy_id: 'strat-hd-1' },
    { id: 'cs-hd-social', client_id: 'happy-days', service_id: 'social-media', status: 'active', start_date: '2026-01-01', monthly_cadence: 'Monthly social media management — calendar, copy, graphics, scheduling', linked_strategy_id: 'strat-hd-1' },
    { id: 'cs-hd-content', client_id: 'happy-days', service_id: 'content-creation', status: 'active', start_date: '2026-02-01', monthly_cadence: 'Monthly photo/video content sessions for product and lifestyle', linked_strategy_id: 'strat-hd-1' },
    { id: 'cs-hd-web', client_id: 'happy-days', service_id: 'web-development', status: 'active', start_date: '2026-03-01', monthly_cadence: 'Website redesign + ongoing maintenance', linked_strategy_id: 'strat-hd-1' },
    { id: 'cs-hd-email', client_id: 'happy-days', service_id: 'email-marketing', status: 'cancelled', start_date: '' },
    { id: 'cs-hd-tech', client_id: 'happy-days', service_id: 'tech-support', status: 'cancelled', start_date: '' },
    { id: 'cs-kp-paid-ads', client_id: 'k-pacho', service_id: 'paid-ads', status: 'active', start_date: '2026-01-15', monthly_cadence: 'Monthly Meta Ads — restaurant specials and event promotion', linked_strategy_id: 'strat-kp-1' },
    { id: 'cs-kp-social', client_id: 'k-pacho', service_id: 'social-media', status: 'active', start_date: '2026-01-15', monthly_cadence: 'Monthly social management — calendar, Reels, community engagement', linked_strategy_id: 'strat-kp-1' },
    { id: 'cs-kp-seo', client_id: 'k-pacho', service_id: 'seo', status: 'active', start_date: '2026-01-15', monthly_cadence: 'Monthly local SEO — Google Business, reviews, directory listings', linked_strategy_id: 'strat-kp-1' },
    { id: 'cs-kp-content', client_id: 'k-pacho', service_id: 'content-creation', status: 'active', start_date: '2026-02-01', monthly_cadence: 'Monthly food photography + short-form video content', linked_strategy_id: 'strat-kp-1' },
    { id: 'cs-kp-email', client_id: 'k-pacho', service_id: 'email-marketing', status: 'active', start_date: '2026-02-01', monthly_cadence: 'Monthly email newsletter + event announcements', linked_strategy_id: 'strat-kp-1' },
    { id: 'cs-kp-web', client_id: 'k-pacho', service_id: 'web-development', status: 'cancelled', start_date: '' },
    { id: 'cs-kp-tech', client_id: 'k-pacho', service_id: 'tech-support', status: 'cancelled', start_date: '' },
    { id: 'cs-tr-web', client_id: 'the-refuge', service_id: 'web-development', status: 'active', start_date: '2026-02-15', monthly_cadence: 'Website build + launch + maintenance', linked_strategy_id: 'strat-tr-1' },
    { id: 'cs-tr-seo', client_id: 'the-refuge', service_id: 'seo', status: 'active', start_date: '2026-02-15', monthly_cadence: 'Local SEO launch — Google Business setup + ongoing optimization', linked_strategy_id: 'strat-tr-1' },
    { id: 'cs-tr-social', client_id: 'the-refuge', service_id: 'social-media', status: 'active', start_date: '2026-02-15', monthly_cadence: 'Monthly social management — launch content + ongoing growth', linked_strategy_id: 'strat-tr-1' },
    { id: 'cs-tr-paid-ads', client_id: 'the-refuge', service_id: 'paid-ads', status: 'planning', start_date: '2026-04-01', monthly_cadence: 'Monthly Meta Ads — post-launch growth campaigns', linked_strategy_id: 'strat-tr-1' },
    { id: 'cs-tr-content', client_id: 'the-refuge', service_id: 'content-creation', status: 'cancelled', start_date: '' },
    { id: 'cs-tr-email', client_id: 'the-refuge', service_id: 'email-marketing', status: 'cancelled', start_date: '' },
    { id: 'cs-tr-tech', client_id: 'the-refuge', service_id: 'tech-support', status: 'active', start_date: '2026-02-15', monthly_cadence: 'Platform management: POS, reservations, Google integrations', linked_strategy_id: 'strat-tr-1' },
  ]);

  console.log('Seeding client service projects...');
  await upsertNoPK('client_service_projects', [
    { client_service_id: 'cs-hd-paid-ads', project_id: 'proj-hd-1' },
    { client_service_id: 'cs-hd-seo', project_id: 'proj-hd-3' },
    { client_service_id: 'cs-hd-social', project_id: 'proj-hd-2' },
    { client_service_id: 'cs-hd-content', project_id: 'proj-hd-2' },
    { client_service_id: 'cs-hd-web', project_id: 'proj-hd-3' },
    { client_service_id: 'cs-kp-paid-ads', project_id: 'proj-kp-2' },
    { client_service_id: 'cs-kp-social', project_id: 'proj-kp-1' },
    { client_service_id: 'cs-kp-seo', project_id: 'proj-kp-3' },
    { client_service_id: 'cs-kp-content', project_id: 'proj-kp-1' },
    { client_service_id: 'cs-kp-content', project_id: 'proj-kp-2' },
    { client_service_id: 'cs-kp-email', project_id: 'proj-kp-1' },
    { client_service_id: 'cs-tr-web', project_id: 'proj-tr-4' },
    { client_service_id: 'cs-tr-seo', project_id: 'proj-tr-2' },
    { client_service_id: 'cs-tr-social', project_id: 'proj-tr-1' },
    { client_service_id: 'cs-tr-social', project_id: 'proj-tr-3' },
    { client_service_id: 'cs-tr-tech', project_id: 'proj-tr-4' },
  ], 'client_service_id,project_id');

  console.log('Seeding service strategies...');
  await upsert('service_strategies', [
    { id: 'ss-hd-paid-ads', client_service_id: 'cs-hd-paid-ads', client_strategy_id: 'strat-hd-1', name: 'Happy Days — Paid Ads Q2 Strategy', summary: 'Drive dispensary foot traffic via hyper-local Meta campaigns targeting 25–54 wellness-conscious adults in Nassau County.' },
    { id: 'ss-hd-seo', client_service_id: 'cs-hd-seo', client_strategy_id: 'strat-hd-1', name: 'Happy Days — SEO Q2 Strategy', summary: 'Own "dispensary near me" and "medical cannabis Long Island" search intent.' },
    { id: 'ss-hd-social', client_service_id: 'cs-hd-social', client_strategy_id: 'strat-hd-1', name: 'Happy Days — Social Media Q2 Strategy', summary: 'Build a loyal community of cannabis wellness advocates.' },
    { id: 'ss-hd-content', client_service_id: 'cs-hd-content', client_strategy_id: 'strat-hd-1', name: 'Happy Days — Content Creation Q2 Strategy', summary: 'Produce high-quality visual content that elevates the Happy Days brand.' },
    { id: 'ss-hd-web', client_service_id: 'cs-hd-web', client_strategy_id: 'strat-hd-1', name: 'Happy Days — Web Dev Q2 Strategy', summary: 'Redesign homepage and product pages to improve conversions.' },
    { id: 'ss-kp-paid-ads', client_service_id: 'cs-kp-paid-ads', client_strategy_id: 'strat-kp-1', name: 'K. Pacho — Paid Ads Q2 Strategy', summary: 'Drive reservation volume and event attendance through local Meta campaigns.' },
    { id: 'ss-kp-social', client_service_id: 'cs-kp-social', client_strategy_id: 'strat-kp-1', name: 'K. Pacho — Social Media Q2 Strategy', summary: "Build an engaged local following around K. Pacho's authentic Mexican cuisine." },
    { id: 'ss-kp-seo', client_service_id: 'cs-kp-seo', client_strategy_id: 'strat-kp-1', name: 'K. Pacho — SEO Q2 Strategy', summary: 'Dominate "Mexican restaurant New Hyde Park" and surrounding local search terms.' },
    { id: 'ss-kp-content', client_service_id: 'cs-kp-content', client_strategy_id: 'strat-kp-1', name: 'K. Pacho — Content Creation Q2 Strategy', summary: 'Produce crave-worthy food photography and short-form video.' },
    { id: 'ss-kp-email', client_service_id: 'cs-kp-email', client_strategy_id: 'strat-kp-1', name: 'K. Pacho — Email Marketing Q2 Strategy', summary: 'Build and monetize an email list around events, specials, and loyalty.' },
    { id: 'ss-tr-web', client_service_id: 'cs-tr-web', client_strategy_id: 'strat-tr-1', name: 'The Refuge — Web Dev Strategy', summary: 'Build and launch a polished restaurant website that drives reservations.' },
    { id: 'ss-tr-seo', client_service_id: 'cs-tr-seo', client_strategy_id: 'strat-tr-1', name: 'The Refuge — SEO Strategy', summary: 'Establish The Refuge in local search from day one.' },
    { id: 'ss-tr-social', client_service_id: 'cs-tr-social', client_strategy_id: 'strat-tr-1', name: 'The Refuge — Social Media Strategy', summary: 'Build the brand from zero through the grand opening buzz.' },
    { id: 'ss-tr-tech', client_service_id: 'cs-tr-tech', client_strategy_id: 'strat-tr-1', name: 'The Refuge — Tech Support Strategy', summary: 'Stand up and maintain the full tech stack for The Refuge.' },
  ]);

  console.log('Seeding service strategy pillars...');
  await upsert('service_strategy_pillars', [
    { id: 'ss-hd-pa-p1', service_strategy_id: 'ss-hd-paid-ads', name: 'Audience Expansion', description: 'Broaden targeting to lookalike audiences based on existing customer list.' },
    { id: 'ss-hd-pa-p2', service_strategy_id: 'ss-hd-paid-ads', name: 'Creative Refresh', description: 'Monthly creative rotation to reduce ad fatigue and test new angles.' },
    { id: 'ss-hd-pa-p3', service_strategy_id: 'ss-hd-paid-ads', name: 'Conversion Tracking', description: 'Implement in-store visit attribution and pixel events.' },
    { id: 'ss-hd-seo-p1', service_strategy_id: 'ss-hd-seo', name: 'Local Pack Dominance', description: 'Optimize Google Business Profile to rank in the local 3-pack.' },
    { id: 'ss-hd-seo-p2', service_strategy_id: 'ss-hd-seo', name: 'Content SEO', description: 'Publish 2 optimized blog posts/month targeting high-intent wellness keywords.' },
    { id: 'ss-hd-seo-p3', service_strategy_id: 'ss-hd-seo', name: 'Technical Health', description: 'Improve Core Web Vitals and fix crawl errors.' },
    { id: 'ss-hd-sm-p1', service_strategy_id: 'ss-hd-social', name: 'Educational Content', description: 'Weekly wellness education posts addressing common cannabis questions.' },
    { id: 'ss-hd-sm-p2', service_strategy_id: 'ss-hd-social', name: 'Product Showcasing', description: 'Monthly product feature series across Instagram and Facebook.' },
    { id: 'ss-hd-sm-p3', service_strategy_id: 'ss-hd-social', name: 'UGC Amplification', description: 'Repost and incentivize customer-generated content.' },
    { id: 'ss-hd-cc-p1', service_strategy_id: 'ss-hd-content', name: 'Product Photography', description: 'Monthly photo sessions showcasing new arrivals and featured products.' },
    { id: 'ss-hd-cc-p2', service_strategy_id: 'ss-hd-content', name: 'Short-Form Video', description: 'Weekly Reels covering product education, staff features, and store atmosphere.' },
    { id: 'ss-hd-wd-p1', service_strategy_id: 'ss-hd-web', name: 'Compliance-First Design', description: 'Ensure all copy and design meets state cannabis advertising regulations.' },
    { id: 'ss-hd-wd-p2', service_strategy_id: 'ss-hd-web', name: 'Conversion Optimization', description: 'Add clear CTAs, product filtering, and store directions.' },
    { id: 'ss-kp-pa-p1', service_strategy_id: 'ss-kp-paid-ads', name: 'Event-Based Campaigns', description: 'Dedicated ad flights for Happy Hour, Taco Tuesday, and Cinco de Mayo.' },
    { id: 'ss-kp-pa-p2', service_strategy_id: 'ss-kp-paid-ads', name: 'Local Awareness', description: 'Always-on reach campaign targeting 5-mile radius of New Hyde Park.' },
    { id: 'ss-kp-sm-p1', service_strategy_id: 'ss-kp-social', name: 'Food Content Series', description: 'Weekly hero food shots and Reels featuring seasonal specials.' },
    { id: 'ss-kp-sm-p2', service_strategy_id: 'ss-kp-social', name: 'Community Building', description: 'Engage local food communities, share user photos, and run monthly giveaways.' },
    { id: 'ss-kp-seo-p1', service_strategy_id: 'ss-kp-seo', name: 'Google Business Optimization', description: 'Weekly posts, photo updates, and Q&A management on GBP.' },
    { id: 'ss-kp-seo-p2', service_strategy_id: 'ss-kp-seo', name: 'Review Generation', description: 'Implement post-visit review request system via SMS and receipts.' },
    { id: 'ss-kp-cc-p1', service_strategy_id: 'ss-kp-content', name: 'Spring Menu Shoot', description: 'Full photography session for new spring menu items.' },
    { id: 'ss-kp-cc-p2', service_strategy_id: 'ss-kp-content', name: 'Cinco de Mayo Content', description: 'Video and photo package for the Cinco de Mayo campaign creative.' },
    { id: 'ss-kp-em-p1', service_strategy_id: 'ss-kp-email', name: 'List Growth', description: 'QR code opt-ins at tables and website pop-up to grow the list.' },
    { id: 'ss-kp-em-p2', service_strategy_id: 'ss-kp-email', name: 'Event Sequences', description: 'Multi-email sequences for Happy Hour promotion and Cinco de Mayo.' },
    { id: 'ss-tr-wd-p1', service_strategy_id: 'ss-tr-web', name: 'Launch Readiness', description: 'Full website live before grand opening with menu, reservations, and brand story.' },
    { id: 'ss-tr-wd-p2', service_strategy_id: 'ss-tr-web', name: 'Post-Launch Optimization', description: 'Performance monitoring, SEO tuning, and content updates in first 30 days.' },
    { id: 'ss-tr-seo-p1', service_strategy_id: 'ss-tr-seo', name: 'GBP Launch', description: 'Fully optimized Google Business Profile live before opening day.' },
    { id: 'ss-tr-seo-p2', service_strategy_id: 'ss-tr-seo', name: 'Review Velocity', description: 'Generate 50+ Google reviews in the first 60 days post-opening.' },
    { id: 'ss-tr-sm-p1', service_strategy_id: 'ss-tr-social', name: 'Launch Campaign', description: 'Pre-opening hype, opening day live coverage, and first-week recap content.' },
    { id: 'ss-tr-sm-p2', service_strategy_id: 'ss-tr-social', name: 'Monthly Rhythm', description: 'Consistent posting cadence with food, ambiance, events, and community content.' },
    { id: 'ss-tr-tech-p1', service_strategy_id: 'ss-tr-tech', name: 'Stack Setup', description: 'POS integration with Toast, OpenTable reservations, and Google Maps sync.' },
    { id: 'ss-tr-tech-p2', service_strategy_id: 'ss-tr-tech', name: 'Ongoing Support', description: 'Monthly check-in, platform updates, and staff troubleshooting.' },
  ]);

  console.log('Seeding service strategy KPIs...');
  await upsert('service_strategy_kpis', [
    { id: 'ss-hd-pa-k1', service_strategy_id: 'ss-hd-paid-ads', name: 'Ad ROAS', target: 4.0, current: 3.2, unit: 'x' },
    { id: 'ss-hd-pa-k2', service_strategy_id: 'ss-hd-paid-ads', name: 'Monthly Ad Spend', target: 2400, current: 2400, unit: '$' },
    { id: 'ss-hd-pa-k3', service_strategy_id: 'ss-hd-paid-ads', name: 'CPC (avg)', target: 0.85, current: 1.12, unit: '$' },
    { id: 'ss-hd-seo-k1', service_strategy_id: 'ss-hd-seo', name: 'Organic Sessions/mo', target: 8000, current: 5500, unit: 'sessions' },
    { id: 'ss-hd-seo-k2', service_strategy_id: 'ss-hd-seo', name: 'Google Ranking (top KW)', target: 3, current: 7, unit: 'pos' },
    { id: 'ss-hd-seo-k3', service_strategy_id: 'ss-hd-seo', name: 'Backlinks', target: 80, current: 54, unit: 'links' },
    { id: 'ss-hd-sm-k1', service_strategy_id: 'ss-hd-social', name: 'Followers', target: 5000, current: 3200, unit: 'followers' },
    { id: 'ss-hd-sm-k2', service_strategy_id: 'ss-hd-social', name: 'Avg Engagement Rate', target: 4.5, current: 3.1, unit: '%' },
    { id: 'ss-hd-sm-k3', service_strategy_id: 'ss-hd-social', name: 'Monthly Reach', target: 100000, current: 65000, unit: 'reach' },
    { id: 'ss-hd-cc-k1', service_strategy_id: 'ss-hd-content', name: 'Content Pieces/mo', target: 20, current: 14, unit: 'pieces' },
    { id: 'ss-hd-cc-k2', service_strategy_id: 'ss-hd-content', name: 'Reel Avg Views', target: 5000, current: 2800, unit: 'views' },
    { id: 'ss-hd-wd-k1', service_strategy_id: 'ss-hd-web', name: 'Bounce Rate', target: 35, current: 48, unit: '%' },
    { id: 'ss-hd-wd-k2', service_strategy_id: 'ss-hd-web', name: 'Avg Session Duration', target: 180, current: 95, unit: 'sec' },
    { id: 'ss-kp-pa-k1', service_strategy_id: 'ss-kp-paid-ads', name: 'Ad ROAS', target: 3.5, current: 2.8, unit: 'x' },
    { id: 'ss-kp-pa-k2', service_strategy_id: 'ss-kp-paid-ads', name: 'Monthly Ad Spend', target: 1800, current: 1800, unit: '$' },
    { id: 'ss-kp-pa-k3', service_strategy_id: 'ss-kp-paid-ads', name: 'Event RSVPs from Ads', target: 120, current: 0, unit: 'RSVPs' },
    { id: 'ss-kp-sm-k1', service_strategy_id: 'ss-kp-social', name: 'Followers', target: 2000, current: 1450, unit: 'followers' },
    { id: 'ss-kp-sm-k2', service_strategy_id: 'ss-kp-social', name: 'Engagement Rate', target: 5.0, current: 3.1, unit: '%' },
    { id: 'ss-kp-sm-k3', service_strategy_id: 'ss-kp-social', name: 'Monthly Reach', target: 40000, current: 22000, unit: 'reach' },
    { id: 'ss-kp-seo-k1', service_strategy_id: 'ss-kp-seo', name: 'Google Rating', target: 4.7, current: 4.4, unit: '★' },
    { id: 'ss-kp-seo-k2', service_strategy_id: 'ss-kp-seo', name: 'Monthly Reviews', target: 20, current: 12, unit: 'reviews' },
    { id: 'ss-kp-seo-k3', service_strategy_id: 'ss-kp-seo', name: 'Local Pack Ranking', target: 2, current: 4, unit: 'pos' },
    { id: 'ss-kp-cc-k1', service_strategy_id: 'ss-kp-content', name: 'Content Pieces/mo', target: 16, current: 10, unit: 'pieces' },
    { id: 'ss-kp-cc-k2', service_strategy_id: 'ss-kp-content', name: 'Reel Avg Views', target: 3000, current: 1800, unit: 'views' },
    { id: 'ss-kp-em-k1', service_strategy_id: 'ss-kp-email', name: 'Email List Size', target: 800, current: 420, unit: 'subscribers' },
    { id: 'ss-kp-em-k2', service_strategy_id: 'ss-kp-email', name: 'Open Rate', target: 35, current: 28, unit: '%' },
    { id: 'ss-kp-em-k3', service_strategy_id: 'ss-kp-email', name: 'Click Rate', target: 8, current: 5.2, unit: '%' },
    { id: 'ss-tr-wd-k1', service_strategy_id: 'ss-tr-web', name: 'Launch Date', target: 1, current: 0, unit: 'milestone' },
    { id: 'ss-tr-wd-k2', service_strategy_id: 'ss-tr-web', name: 'PageSpeed Score', target: 90, current: 72, unit: 'score' },
    { id: 'ss-tr-wd-k3', service_strategy_id: 'ss-tr-web', name: 'Reservation Clicks/mo', target: 200, current: 45, unit: 'clicks' },
    { id: 'ss-tr-seo-k1', service_strategy_id: 'ss-tr-seo', name: 'Google Rating', target: 4.5, current: 4.2, unit: '★' },
    { id: 'ss-tr-seo-k2', service_strategy_id: 'ss-tr-seo', name: 'Reviews (60 days)', target: 50, current: 24, unit: 'reviews' },
    { id: 'ss-tr-seo-k3', service_strategy_id: 'ss-tr-seo', name: 'GBP Actions/mo', target: 500, current: 180, unit: 'actions' },
    { id: 'ss-tr-sm-k1', service_strategy_id: 'ss-tr-social', name: 'Followers', target: 3000, current: 1200, unit: 'followers' },
    { id: 'ss-tr-sm-k2', service_strategy_id: 'ss-tr-social', name: 'Engagement Rate', target: 5.0, current: 4.2, unit: '%' },
    { id: 'ss-tr-sm-k3', service_strategy_id: 'ss-tr-social', name: 'Monthly Impressions', target: 60000, current: 28000, unit: 'impressions' },
    { id: 'ss-tr-tech-k1', service_strategy_id: 'ss-tr-tech', name: 'Systems Online', target: 4, current: 3, unit: 'systems' },
    { id: 'ss-tr-tech-k2', service_strategy_id: 'ss-tr-tech', name: 'Uptime', target: 99.9, current: 99.2, unit: '%' },
  ]);

  console.log('\n✅ All data seeded successfully!');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
