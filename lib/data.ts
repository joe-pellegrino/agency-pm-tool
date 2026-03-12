export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type Status = 'todo' | 'inprogress' | 'review' | 'done';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  location: string;
  color: string;
  logo: string;
}

export interface Task {
  id: string;
  title: string;
  clientId: string;
  assigneeId: string;
  status: Status;
  priority: Priority;
  dueDate: string;
  startDate: string;
  endDate: string;
  description: string;
  dependencies?: string[];
  isMilestone?: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  replies?: Comment[];
}

export interface DocumentVersion {
  id: string;
  version: string;
  authorId: string;
  createdAt: string;
  summary: string;
}

export interface Document {
  id: string;
  title: string;
  clientId: string;
  collaborators: string[];
  content: string;
  comments: Comment[];
  versions: DocumentVersion[];
  createdAt: string;
  updatedAt: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'joe', name: 'Joe Pellegrino', role: 'Owner', initials: 'JP', color: '#6366f1' },
  { id: 'rick', name: 'Rick McDonald', role: 'Owner', initials: 'RM', color: '#8b5cf6' },
  { id: 'sarah', name: 'Sarah Chen', role: 'Content Manager', initials: 'SC', color: '#ec4899' },
  { id: 'marcus', name: 'Marcus Rivera', role: 'Social Media Specialist', initials: 'MR', color: '#f59e0b' },
];

export const CLIENTS: Client[] = [
  {
    id: 'happy-days',
    name: 'Happy Days',
    industry: 'Medical Cannabis Dispensary',
    location: 'Farmingdale, NY',
    color: '#10b981',
    logo: 'HD',
  },
  {
    id: 'k-pacho',
    name: 'K. Pacho',
    industry: 'Mexican Restaurant',
    location: 'New Hyde Park, NY',
    color: '#f59e0b',
    logo: 'KP',
  },
  {
    id: 'the-refuge',
    name: 'The Refuge',
    industry: 'Restaurant',
    location: 'Melville, NY',
    color: '#3b82f6',
    logo: 'TR',
  },
];

export const TASKS: Task[] = [
  // Happy Days
  {
    id: 'hd-1',
    title: 'Social Media Content Calendar — March',
    clientId: 'happy-days',
    assigneeId: 'sarah',
    status: 'done',
    priority: 'High',
    dueDate: '2026-03-05',
    startDate: '2026-02-17',
    endDate: '2026-03-05',
    description: 'Plan and schedule 30 days of social content across Instagram, Facebook, and X for Happy Days dispensary.',
    dependencies: [],
  },
  {
    id: 'hd-2',
    title: 'Facebook Ad Campaign Setup & Optimization',
    clientId: 'happy-days',
    assigneeId: 'marcus',
    status: 'inprogress',
    priority: 'Urgent',
    dueDate: '2026-03-18',
    startDate: '2026-03-03',
    endDate: '2026-03-18',
    description: 'Launch targeted Facebook ad campaign for new product arrivals. Optimize for dispensary foot traffic.',
    dependencies: ['hd-1'],
  },
  {
    id: 'hd-3',
    title: 'Google Business Profile Update',
    clientId: 'happy-days',
    assigneeId: 'sarah',
    status: 'done',
    priority: 'Medium',
    dueDate: '2026-02-28',
    startDate: '2026-02-24',
    endDate: '2026-02-28',
    description: 'Update hours, photos, services, and menu on Google Business Profile.',
    dependencies: [],
  },
  {
    id: 'hd-4',
    title: 'Website Homepage Redesign',
    clientId: 'happy-days',
    assigneeId: 'joe',
    status: 'review',
    priority: 'High',
    dueDate: '2026-03-25',
    startDate: '2026-03-01',
    endDate: '2026-03-25',
    description: 'Full redesign of homepage with new hero section, product highlights, and compliance-friendly copy.',
    dependencies: ['hd-3'],
  },
  {
    id: 'hd-5',
    title: 'Monthly Analytics Report — February',
    clientId: 'happy-days',
    assigneeId: 'rick',
    status: 'done',
    priority: 'Medium',
    dueDate: '2026-03-07',
    startDate: '2026-03-04',
    endDate: '2026-03-07',
    description: 'Compile GA4, Meta Ads, and Google Business insights for February performance review.',
    dependencies: [],
  },
  {
    id: 'hd-6',
    title: 'Menu Photography Coordination',
    clientId: 'happy-days',
    assigneeId: 'sarah',
    status: 'todo',
    priority: 'Medium',
    dueDate: '2026-04-02',
    startDate: '2026-03-20',
    endDate: '2026-04-02',
    description: 'Coordinate product photography session for new spring inventory. Source photographer and prep shot list.',
    dependencies: ['hd-4'],
  },
  {
    id: 'hd-7',
    title: 'Email Newsletter — Spring Promotions',
    clientId: 'happy-days',
    assigneeId: 'sarah',
    status: 'inprogress',
    priority: 'High',
    dueDate: '2026-03-20',
    startDate: '2026-03-10',
    endDate: '2026-03-20',
    description: 'Draft and design March email newsletter highlighting spring product drops and loyalty rewards.',
    dependencies: ['hd-1'],
  },
  {
    id: 'hd-8',
    title: 'Review Response Management',
    clientId: 'happy-days',
    assigneeId: 'marcus',
    status: 'inprogress',
    priority: 'Low',
    dueDate: '2026-03-31',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    description: 'Monitor and respond to Google and Yelp reviews weekly. Escalate negative reviews within 24hrs.',
    dependencies: [],
  },
  {
    id: 'hd-9',
    title: 'Blog Post: Cannabis Wellness Trends 2026',
    clientId: 'happy-days',
    assigneeId: 'sarah',
    status: 'todo',
    priority: 'Low',
    dueDate: '2026-04-10',
    startDate: '2026-03-28',
    endDate: '2026-04-10',
    description: 'SEO-optimized blog post covering wellness and medical cannabis trends to drive organic traffic.',
    dependencies: [],
  },
  {
    id: 'hd-10',
    title: '420 Event Promotion Graphics',
    clientId: 'happy-days',
    assigneeId: 'marcus',
    status: 'todo',
    priority: 'Urgent',
    dueDate: '2026-04-01',
    startDate: '2026-03-15',
    endDate: '2026-04-01',
    description: 'Design suite of graphics for 420 celebration event — social posts, stories, flyers, and email header.',
    dependencies: ['hd-7'],
    isMilestone: false,
  },
  {
    id: 'hd-m1',
    title: '🎯 Q2 Campaign Launch',
    clientId: 'happy-days',
    assigneeId: 'joe',
    status: 'todo',
    priority: 'Urgent',
    dueDate: '2026-04-01',
    startDate: '2026-04-01',
    endDate: '2026-04-01',
    description: 'Q2 campaign goes live across all channels.',
    dependencies: ['hd-2', 'hd-10'],
    isMilestone: true,
  },

  // K. Pacho
  {
    id: 'kp-1',
    title: 'Social Media Content Calendar — March',
    clientId: 'k-pacho',
    assigneeId: 'marcus',
    status: 'done',
    priority: 'High',
    dueDate: '2026-03-01',
    startDate: '2026-02-20',
    endDate: '2026-03-01',
    description: 'Create content calendar for March featuring Taco Tuesday promotions, seasonal specials, and behind-the-scenes.',
    dependencies: [],
  },
  {
    id: 'kp-2',
    title: 'Facebook Ad Campaign — Happy Hour Promo',
    clientId: 'k-pacho',
    assigneeId: 'marcus',
    status: 'review',
    priority: 'High',
    dueDate: '2026-03-14',
    startDate: '2026-03-05',
    endDate: '2026-03-14',
    description: 'Run targeted local Facebook ads for new happy hour specials (3–6 PM weekdays).',
    dependencies: ['kp-1'],
  },
  {
    id: 'kp-3',
    title: 'Google Business Profile Update',
    clientId: 'k-pacho',
    assigneeId: 'sarah',
    status: 'done',
    priority: 'Medium',
    dueDate: '2026-02-25',
    startDate: '2026-02-22',
    endDate: '2026-02-25',
    description: 'Add spring menu items, update photos, and respond to pending reviews.',
    dependencies: [],
  },
  {
    id: 'kp-4',
    title: 'Menu Photography — Spring Menu',
    clientId: 'k-pacho',
    assigneeId: 'sarah',
    status: 'inprogress',
    priority: 'High',
    dueDate: '2026-03-22',
    startDate: '2026-03-08',
    endDate: '2026-03-22',
    description: 'Full food photography session for new spring menu items. Deliverables: 25+ edited photos.',
    dependencies: ['kp-3'],
  },
  {
    id: 'kp-5',
    title: 'Monthly Analytics Report — February',
    clientId: 'k-pacho',
    assigneeId: 'rick',
    status: 'done',
    priority: 'Medium',
    dueDate: '2026-03-06',
    startDate: '2026-03-04',
    endDate: '2026-03-06',
    description: 'February performance report covering website, social, and ad metrics.',
    dependencies: [],
  },
  {
    id: 'kp-6',
    title: 'Email Newsletter — Cinco de Mayo Preview',
    clientId: 'k-pacho',
    assigneeId: 'sarah',
    status: 'todo',
    priority: 'Medium',
    dueDate: '2026-04-15',
    startDate: '2026-04-01',
    endDate: '2026-04-15',
    description: 'Early preview newsletter for Cinco de Mayo specials and reservations.',
    dependencies: ['kp-4'],
  },
  {
    id: 'kp-7',
    title: 'Website Menu Page Refresh',
    clientId: 'k-pacho',
    assigneeId: 'joe',
    status: 'todo',
    priority: 'Medium',
    dueDate: '2026-03-28',
    startDate: '2026-03-20',
    endDate: '2026-03-28',
    description: 'Update website menu page with new spring items and updated pricing.',
    dependencies: ['kp-4'],
  },
  {
    id: 'kp-8',
    title: 'Review Response Management',
    clientId: 'k-pacho',
    assigneeId: 'marcus',
    status: 'inprogress',
    priority: 'Low',
    dueDate: '2026-03-31',
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    description: 'Weekly review monitoring and response for Google, Yelp, and TripAdvisor.',
    dependencies: [],
  },
  {
    id: 'kp-9',
    title: 'Blog Post: Authentic Mexican Cuisine in Long Island',
    clientId: 'k-pacho',
    assigneeId: 'sarah',
    status: 'todo',
    priority: 'Low',
    dueDate: '2026-04-08',
    startDate: '2026-03-25',
    endDate: '2026-04-08',
    description: 'SEO blog targeting local food discovery searches.',
    dependencies: [],
  },
  {
    id: 'kp-m1',
    title: '🎯 Spring Menu Launch',
    clientId: 'k-pacho',
    assigneeId: 'rick',
    status: 'todo',
    priority: 'High',
    dueDate: '2026-03-22',
    startDate: '2026-03-22',
    endDate: '2026-03-22',
    description: 'Spring menu officially launches across all platforms.',
    dependencies: ['kp-4', 'kp-7'],
    isMilestone: true,
  },

  // The Refuge
  {
    id: 'tr-1',
    title: 'Grand Opening Campaign Strategy',
    clientId: 'the-refuge',
    assigneeId: 'joe',
    status: 'done',
    priority: 'Urgent',
    dueDate: '2026-02-20',
    startDate: '2026-02-10',
    endDate: '2026-02-20',
    description: 'Full campaign strategy for The Refuge grand opening event in Melville.',
    dependencies: [],
  },
  {
    id: 'tr-2',
    title: 'Social Media Content Calendar — Launch Month',
    clientId: 'the-refuge',
    assigneeId: 'marcus',
    status: 'done',
    priority: 'Urgent',
    dueDate: '2026-02-28',
    startDate: '2026-02-21',
    endDate: '2026-02-28',
    description: 'Content calendar for pre-launch hype, grand opening day, and post-opening buzz.',
    dependencies: ['tr-1'],
  },
  {
    id: 'tr-3',
    title: 'Facebook & Instagram Ad Campaign — Grand Opening',
    clientId: 'the-refuge',
    assigneeId: 'marcus',
    status: 'done',
    priority: 'Urgent',
    dueDate: '2026-03-07',
    startDate: '2026-02-28',
    endDate: '2026-03-07',
    description: 'Paid social campaign targeting Melville/Huntington area for grand opening awareness and RSVPs.',
    dependencies: ['tr-2'],
  },
  {
    id: 'tr-4',
    title: 'Grand Opening Event Promotion Graphics',
    clientId: 'the-refuge',
    assigneeId: 'marcus',
    status: 'done',
    priority: 'Urgent',
    dueDate: '2026-02-27',
    startDate: '2026-02-21',
    endDate: '2026-02-27',
    description: 'Full graphic suite: social posts, stories, event flyer, email header, and digital signage.',
    dependencies: ['tr-1'],
  },
  {
    id: 'tr-5',
    title: 'Google Business Profile Setup',
    clientId: 'the-refuge',
    assigneeId: 'sarah',
    status: 'done',
    priority: 'High',
    dueDate: '2026-02-25',
    startDate: '2026-02-18',
    endDate: '2026-02-25',
    description: 'Complete Google Business Profile from scratch — hours, menu, photos, category, and description.',
    dependencies: ['tr-1'],
  },
  {
    id: 'tr-6',
    title: 'Website Launch & Homepage Build',
    clientId: 'the-refuge',
    assigneeId: 'joe',
    status: 'review',
    priority: 'Urgent',
    dueDate: '2026-03-14',
    startDate: '2026-02-25',
    endDate: '2026-03-14',
    description: 'Build and launch restaurant website with menu, reservations, about, and contact pages.',
    dependencies: ['tr-4', 'tr-5'],
  },
  {
    id: 'tr-7',
    title: 'Monthly Analytics Report — First 30 Days',
    clientId: 'the-refuge',
    assigneeId: 'rick',
    status: 'inprogress',
    priority: 'High',
    dueDate: '2026-03-14',
    startDate: '2026-03-08',
    endDate: '2026-03-14',
    description: 'Inaugural analytics report covering grand opening campaign performance and baseline metrics.',
    dependencies: ['tr-3'],
  },
  {
    id: 'tr-8',
    title: 'Menu Photography',
    clientId: 'the-refuge',
    assigneeId: 'sarah',
    status: 'inprogress',
    priority: 'High',
    dueDate: '2026-03-20',
    startDate: '2026-03-10',
    endDate: '2026-03-20',
    description: 'Professional food photography for menu and website. 30+ edited hero shots.',
    dependencies: ['tr-6'],
  },
  {
    id: 'tr-9',
    title: 'Email Newsletter — Welcome to The Refuge',
    clientId: 'the-refuge',
    assigneeId: 'sarah',
    status: 'todo',
    priority: 'Medium',
    dueDate: '2026-03-22',
    startDate: '2026-03-15',
    endDate: '2026-03-22',
    description: 'Launch email to collected reservations list introducing the brand story and upcoming events.',
    dependencies: ['tr-8'],
  },
  {
    id: 'tr-10',
    title: 'Review Response Management Setup',
    clientId: 'the-refuge',
    assigneeId: 'marcus',
    status: 'todo',
    priority: 'Medium',
    dueDate: '2026-03-20',
    startDate: '2026-03-15',
    endDate: '2026-03-20',
    description: 'Establish review monitoring workflow and respond to first wave of opening reviews.',
    dependencies: ['tr-5'],
  },
  {
    id: 'tr-11',
    title: 'Blog Post: The Story Behind The Refuge',
    clientId: 'the-refuge',
    assigneeId: 'sarah',
    status: 'todo',
    priority: 'Low',
    dueDate: '2026-04-05',
    startDate: '2026-03-22',
    endDate: '2026-04-05',
    description: 'Brand story blog post covering the owners vision, concept, and Melville community connection.',
    dependencies: [],
  },
  {
    id: 'tr-m1',
    title: '🎯 Grand Opening',
    clientId: 'the-refuge',
    assigneeId: 'joe',
    status: 'done',
    priority: 'Urgent',
    dueDate: '2026-03-07',
    startDate: '2026-03-07',
    endDate: '2026-03-07',
    description: 'The Refuge officially opens to the public.',
    dependencies: ['tr-2', 'tr-4', 'tr-5'],
    isMilestone: true,
  },
  {
    id: 'tr-m2',
    title: '🎯 Website Live',
    clientId: 'the-refuge',
    assigneeId: 'joe',
    status: 'review',
    priority: 'Urgent',
    dueDate: '2026-03-14',
    startDate: '2026-03-14',
    endDate: '2026-03-14',
    description: 'Website goes live and is fully indexed.',
    dependencies: ['tr-6'],
    isMilestone: true,
  },
];

export const DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    title: 'Q1 2026 Marketing Strategy',
    clientId: 'all',
    collaborators: ['joe', 'rick', 'sarah'],
    content: `# Q1 2026 Marketing Strategy — RJ Media

## Executive Summary

This document outlines the integrated marketing strategy for RJ Media's three primary clients in Q1 2026: Happy Days Cannabis Dispensary, K. Pacho Mexican Restaurant, and The Refuge Restaurant. Our focus this quarter is establishing strong digital foundations, launching paid social campaigns, and building organic growth through content and SEO.

## Client Objectives

### Happy Days — Medical Cannabis Dispensary
**Primary Goal:** Increase foot traffic by 25% and build email list to 1,500 subscribers.

Key initiatives:
- Launch Facebook awareness campaign targeting 25–45 demographic in Nassau County
- Publish twice-weekly educational content on cannabis wellness
- Optimize Google Business Profile for "dispensary near me" searches
- Launch loyalty program promoted via email and social

### K. Pacho — Mexican Restaurant
**Primary Goal:** Drive reservation volume and build social following to 2,000 by April.

Key initiatives:
- Spring menu reveal campaign across Instagram and Facebook
- Local SEO improvements targeting "Mexican restaurant New Hyde Park"
- Weekly food photography stories and Reels
- Cinco de Mayo campaign kickoff in April

### The Refuge — Restaurant (New Client)
**Primary Goal:** Successful grand opening with 500+ attendees and strong first-month reviews.

Key initiatives:
- Full digital launch: website, Google Business, social profiles
- Paid social grand opening campaign
- Press outreach to Long Island food blogs
- Post-opening reputation management

## Content Pillars

All three clients share these strategic content pillars, adapted to their brand voice:

1. **Community Connection** — Local roots, neighborhood involvement
2. **Product/Menu Showcase** — High-quality visual content
3. **Social Proof** — Reviews, testimonials, user-generated content
4. **Education/Entertainment** — Value-add content that earns attention

## Budget Allocation (Q1)

| Client | Paid Social | Content | SEO/Web | Total |
|--------|-------------|---------|---------|-------|
| Happy Days | $2,400 | $1,200 | $800 | $4,400 |
| K. Pacho | $1,800 | $900 | $600 | $3,300 |
| The Refuge | $3,200 | $1,500 | $1,200 | $5,900 |

## KPIs & Measurement

We track performance weekly using GA4, Meta Ads Manager, and Google Business Insights. Monthly reports are delivered by the 7th of each month.

**Key metrics:**
- Reach & Impressions (awareness)
- Website sessions & conversions (traffic quality)
- Cost per click & ROAS (paid efficiency)
- Review count & rating (reputation)
- Email open rate & CTR (engagement)

## Timeline

- **February:** Strategy finalization, The Refuge launch prep
- **March:** Full execution across all three clients
- **April:** Q2 planning begins, Cinco de Mayo campaign, 420 event

---

*Document Owner: Joe Pellegrino | Last Updated: March 5, 2026*`,
    comments: [
      {
        id: 'c1',
        authorId: 'rick',
        text: 'Budget allocation looks solid. Can we add a line item for influencer marketing under The Refuge? I think micro-influencers in the Long Island food scene could amplify the grand opening.',
        createdAt: '2026-03-05T10:30:00Z',
        replies: [
          {
            id: 'c1-r1',
            authorId: 'joe',
            text: 'Agree. I\'ll allocate $500 from the content budget and identify 3-5 LI food bloggers with 5k-20k followers. Sarah, can you put together a shortlist?',
            createdAt: '2026-03-05T11:15:00Z',
          },
          {
            id: 'c1-r2',
            authorId: 'sarah',
            text: 'On it. I already follow a few — @lifeonlongisland and @linyc_eats are good candidates. Will send a list by EOD.',
            createdAt: '2026-03-05T14:00:00Z',
          },
        ],
      },
      {
        id: 'c2',
        authorId: 'sarah',
        text: 'The KPIs section should include TikTok metrics for Happy Days — they\'ve been getting traction there and I think we should make it an official channel this quarter.',
        createdAt: '2026-03-06T09:00:00Z',
        replies: [
          {
            id: 'c2-r1',
            authorId: 'joe',
            text: 'Good call. Let\'s add TikTok as a secondary channel. Be mindful of cannabis advertising restrictions though — mostly lifestyle and education content.',
            createdAt: '2026-03-06T10:45:00Z',
          },
        ],
      },
    ],
    versions: [
      {
        id: 'v3',
        version: 'v3.0',
        authorId: 'joe',
        createdAt: '2026-03-05T09:00:00Z',
        summary: 'Added budget table, finalized KPIs section, updated The Refuge timeline',
      },
      {
        id: 'v2',
        version: 'v2.0',
        authorId: 'sarah',
        createdAt: '2026-02-28T16:30:00Z',
        summary: 'Expanded content pillars section, added K. Pacho spring menu objectives',
      },
      {
        id: 'v1',
        version: 'v1.0',
        authorId: 'rick',
        createdAt: '2026-02-20T11:00:00Z',
        summary: 'Initial draft — executive summary and client objectives',
      },
    ],
    createdAt: '2026-02-20T11:00:00Z',
    updatedAt: '2026-03-05T09:00:00Z',
  },
  {
    id: 'doc-2',
    title: 'Happy Days Brand Guidelines',
    clientId: 'happy-days',
    collaborators: ['sarah'],
    content: `# Happy Days — Brand Guidelines
*Medical Cannabis Dispensary | Farmingdale, NY*

## Brand Overview

Happy Days is a warm, welcoming medical cannabis dispensary focused on patient education and wellness. The brand balances approachability with credibility — we want patients to feel comfortable, informed, and confident in their choices.

**Brand Personality:** Knowledgeable, Compassionate, Trustworthy, Approachable

**Tone of Voice:** Friendly but professional. Educational without being clinical. Never slang or stoner stereotypes. Always compliance-aware.

---

## Color Palette

### Primary Colors
- **Happy Green:** #10B981 — Used for CTAs, accents, and brand emphasis
- **Deep Forest:** #065F46 — Headlines, footers, depth
- **Off-White:** #F9FAFB — Backgrounds, breathing room

### Secondary Colors
- **Warm Gold:** #F59E0B — Special offers, highlights
- **Charcoal:** #374151 — Body copy, descriptions
- **Light Sage:** #D1FAE5 — Soft backgrounds, cards

---

## Typography

**Primary Font:** Inter (Google Fonts)
- H1: 48px / Bold / Deep Forest
- H2: 36px / SemiBold / Deep Forest
- H3: 24px / SemiBold / Charcoal
- Body: 16px / Regular / Charcoal
- Caption: 14px / Regular / #6B7280

**Accent Font:** Playfair Display
- Used for lifestyle headlines and feature callouts only
- Never for compliance copy

---

## Logo Usage

- Minimum size: 120px wide
- Clear space: 1x logo height on all sides
- Approved backgrounds: White, Off-White, Happy Green (reversed)
- Never stretch, rotate, or recolor the logo
- Never place on busy photographic backgrounds

---

## Photography Style

**Do:**
- Warm, natural lighting
- Lifestyle and wellness contexts (reading, yoga, outdoors)
- Diverse, professional patients 35-65
- Clean, minimalist product shots with white/sage backgrounds
- Staff in professional yet approachable settings

**Don't:**
- Anything resembling recreational use imagery
- Paraphernalia or smoking imagery
- Youth-adjacent settings or talent
- Overly clinical or pharmaceutical aesthetics

---

## Social Media Guidelines

**Instagram:** 1:1 and 4:5 feed posts, Stories with link sticker, Reels for education
**Facebook:** Event posts, educational articles, community engagement
**Content Ratio:** 60% educational / 30% product showcase / 10% promotions

**Compliance note:** All cannabis content must comply with NY State cannabis advertising rules. No health claims. No targeting under 21. Always include "For adult medical patients only."

---

## Content Dos and Don'ts

**DO use:**
- "Wellness," "relief," "comfort," "plant-based"
- Educational framing ("Did you know...")
- Patient testimonials (pre-approved)

**DON'T use:**
- "Get high," "stoned," recreational slang
- Specific medical claims ("cures," "treats," "heals")
- Price-first messaging

---

*Document Owner: Sarah Chen | Version 1.2 | Updated February 2026*`,
    comments: [],
    versions: [
      {
        id: 'v2',
        version: 'v1.2',
        authorId: 'sarah',
        createdAt: '2026-02-15T14:00:00Z',
        summary: 'Added compliance section, updated photography guidelines',
      },
      {
        id: 'v1',
        version: 'v1.0',
        authorId: 'sarah',
        createdAt: '2026-01-20T10:00:00Z',
        summary: 'Initial brand guidelines document',
      },
    ],
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-02-15T14:00:00Z',
  },
  {
    id: 'doc-3',
    title: 'The Refuge Grand Opening Campaign Brief',
    clientId: 'the-refuge',
    collaborators: ['joe', 'rick', 'marcus'],
    content: `# The Refuge — Grand Opening Campaign Brief
*Restaurant | Melville, NY | Opening: March 7, 2026*

## Campaign Overview

**Campaign Name:** "Find Your Refuge"
**Duration:** February 21 – March 14, 2026 (3-week campaign)
**Budget:** $3,200 paid social + production
**Goal:** 500+ grand opening attendees, 1,000 social followers, 50+ first-week reviews

---

## The Restaurant

The Refuge is a modern American restaurant in Melville, NY focused on elevated comfort food in a welcoming, neighborhood atmosphere. Think warm wood interiors, an open kitchen, craft cocktails, and dishes that feel like home — but better.

**Concept:** Modern American comfort food
**Price Point:** Mid-to-upscale ($18–$42 entrees)
**Target Audience:** Melville/Huntington/Dix Hills residents, 30–55, dining enthusiasts

---

## Campaign Phases

### Phase 1: Pre-Launch Hype (Feb 21 – Mar 6)
**Objective:** Build anticipation and grow social following before opening day

Tactics:
- Teaser content: behind-the-scenes kitchen prep, interior reveals
- "Coming Soon" countdown on Instagram Stories
- Soft launch invite to local food influencers (5 micro-influencers)
- Facebook event creation with RSVP tracking
- Paid campaign: Awareness targeting Melville/Huntington radius (15 miles)
- Local press outreach: Newsday, Long Island Restaurant News, HuntingtonNow.com

**Creative Concept:** Dark, moody restaurant interior photos with text overlay "Something special is coming to Melville."

### Phase 2: Grand Opening (Mar 7)
**Objective:** Maximum attendance and social buzz on opening day

Tactics:
- Live Stories coverage: chef interviews, crowd shots, first dishes
- Influencer check-ins with tagged posts
- Paid boost on opening announcement post
- Email blast to reservation list (pre-collected)
- Respond to all comments and DMs within 2 hours

**Creative Concept:** Warm, celebratory imagery. "We're open. Come find your Refuge."

### Phase 3: Post-Launch Momentum (Mar 8 – 14)
**Objective:** Sustain buzz, collect reviews, drive repeat visits

Tactics:
- Retargeting campaign to event RSVPs and page visitors
- Review request email to attendees
- "Behind the menu" content series (chef spotlights)
- Weekly analytics report to client by March 14

---

## Ad Creative Specifications

### Facebook/Instagram Feed
- Format: Single image + carousel
- Dimensions: 1080x1080 (1:1), 1080x1350 (4:5)
- Copy: Short-form, curiosity-driven. Max 125 characters primary text.
- CTA: "Learn More" (Phase 1), "Get Directions" (Phase 2+)

### Instagram Stories
- Format: Vertical video + static
- Dimensions: 1080x1920
- Duration: 7–15 seconds for video
- Interactive elements: Poll, countdown sticker, link sticker

---

## Messaging Framework

**Headline options:**
- "Melville's new favorite table is set."
- "Find Your Refuge. Now Open in Melville."
- "Modern American comfort. Right here."
- "The neighborhood needed this. We delivered."

**Value propositions:**
- Locally owned, community-first
- Farm-to-table inspired sourcing
- Award-winning cocktail program
- Private dining for events

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Grand opening attendance | 500+ |
| Instagram followers (by 3/14) | 1,000 |
| Facebook page likes (by 3/14) | 750 |
| Google reviews (first week) | 25+ |
| Average review rating | 4.5+ |
| Website visits (launch month) | 2,500+ |
| Email list signups | 300+ |

---

## Approvals Required

- [ ] Client sign-off on creative brief — **DUE: Feb 25**
- [ ] Final ad creative approval — **DUE: Feb 27**
- [ ] Campaign launch confirmation — **DUE: Feb 28**
- [x] ~~Strategy document approved~~ — Completed Feb 20

---

*Document Owner: Joe Pellegrino | Contributors: Rick McDonald, Marcus Rivera*
*Created: February 20, 2026 | Last Updated: March 1, 2026*`,
    comments: [
      {
        id: 'c3',
        authorId: 'rick',
        text: 'The influencer strategy looks good. I connected with @linyc_eats and they\'re interested. Their rate is $300 for a story set + feed post. Should we move forward?',
        createdAt: '2026-02-22T09:15:00Z',
        replies: [
          {
            id: 'c3-r1',
            authorId: 'joe',
            text: 'Yes — $300 is reasonable for their engagement rate. Sign them up. Marcus, can you coordinate the logistics and brief them on the shoot date?',
            createdAt: '2026-02-22T10:00:00Z',
          },
          {
            id: 'c3-r2',
            authorId: 'marcus',
            text: 'Will do. I\'ll reach out today and schedule a walkthrough the day before soft launch so they can get content ahead of opening day.',
            createdAt: '2026-02-22T11:30:00Z',
          },
        ],
      },
      {
        id: 'c4',
        authorId: 'marcus',
        text: 'Phase 1 teaser content performed really well — the kitchen reveal reel hit 3,200 views organically in 48 hours. We\'re already at 340 followers before we\'ve even opened.',
        createdAt: '2026-03-01T16:00:00Z',
        replies: [],
      },
    ],
    versions: [
      {
        id: 'v3',
        version: 'v3.0',
        authorId: 'joe',
        createdAt: '2026-03-01T10:00:00Z',
        summary: 'Added Phase 3 details, updated success metrics based on early engagement data',
      },
      {
        id: 'v2',
        version: 'v2.0',
        authorId: 'marcus',
        createdAt: '2026-02-24T15:00:00Z',
        summary: 'Added ad creative specs and messaging framework',
      },
      {
        id: 'v1',
        version: 'v1.0',
        authorId: 'joe',
        createdAt: '2026-02-20T12:00:00Z',
        summary: 'Initial campaign brief — phases 1 and 2, objectives, budget',
      },
    ],
    createdAt: '2026-02-20T12:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
];

export const STATUS_LABELS: Record<Status, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-amber-100 text-amber-700',
  Urgent: 'bg-red-100 text-red-700',
};

export const PRIORITY_DOT: Record<Priority, string> = {
  Low: 'bg-slate-400',
  Medium: 'bg-blue-500',
  High: 'bg-amber-500',
  Urgent: 'bg-red-500',
};
