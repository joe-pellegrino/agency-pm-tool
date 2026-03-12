export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type Status = 'todo' | 'inprogress' | 'review' | 'done';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  isOwner?: boolean;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  location: string;
  color: string;
  logo: string;
}

export interface ApprovalEntry {
  id: string;
  action: 'approved' | 'rejected';
  approverId: string;
  timestamp: string;
  note?: string;
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
  approvalHistory?: ApprovalEntry[];
  type?: 'social' | 'ad' | 'blog' | 'report' | 'meeting' | 'design' | 'other';
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

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  defaultAssigneeRole: string;
  defaultPriority: Priority;
  estimatedDuration: number; // days
  type: Task['type'];
  dueRule: string; // human-readable
  category: string;
}

export interface Automation {
  id: string;
  clientId: string;
  templateId: string;
  frequency: 'monthly' | 'weekly' | 'custom';
  customFrequency?: string;
  assigneeId: string;
  status: 'active' | 'paused';
  nextRunDate: string;
  lastRunDate: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  clientId: string;
  memberId: string;
  date: string;
  durationMinutes: number;
  note?: string;
}

export interface Asset {
  id: string;
  clientId: string;
  filename: string;
  fileType: 'image' | 'document' | 'video' | 'logo';
  uploadDate: string;
  uploadedBy: string;
  tags: string[];
  size: string;
  color: string; // for placeholder thumbnail bg
  versions: { id: string; date: string; note: string }[];
}

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'joe', name: 'Joe Pellegrino', role: 'Owner', initials: 'JP', color: '#6366f1', isOwner: true },
  { id: 'rick', name: 'Rick McDonald', role: 'Owner', initials: 'RM', color: '#8b5cf6', isOwner: true },
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
    type: 'social',
    approvalHistory: [
      { id: 'ah-1', action: 'approved', approverId: 'joe', timestamp: '2026-03-05T16:00:00Z', note: 'Great work — calendar looks solid.' },
    ],
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
    type: 'ad',
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
    type: 'other',
    approvalHistory: [
      { id: 'ah-2', action: 'approved', approverId: 'rick', timestamp: '2026-02-28T14:00:00Z' },
    ],
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
    type: 'other',
    approvalHistory: [],
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
    type: 'report',
    approvalHistory: [
      { id: 'ah-3', action: 'approved', approverId: 'joe', timestamp: '2026-03-07T17:00:00Z' },
    ],
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
    type: 'other',
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
    type: 'social',
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
    type: 'other',
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
    type: 'blog',
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
    type: 'design',
  },
  {
    id: 'hd-11',
    title: 'Monthly Client Meeting — March',
    clientId: 'happy-days',
    assigneeId: 'joe',
    status: 'done',
    priority: 'High',
    dueDate: '2026-03-28',
    startDate: '2026-03-28',
    endDate: '2026-03-28',
    description: 'Monthly strategy meeting with Happy Days ownership team.',
    dependencies: [],
    type: 'meeting',
    approvalHistory: [
      { id: 'ah-11', action: 'approved', approverId: 'rick', timestamp: '2026-03-28T18:00:00Z', note: 'Meeting completed — great session.' },
    ],
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
    type: 'ad',
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
    type: 'social',
    approvalHistory: [
      { id: 'ah-4', action: 'approved', approverId: 'joe', timestamp: '2026-03-01T12:00:00Z' },
    ],
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
    type: 'ad',
    approvalHistory: [
      { id: 'ah-5', action: 'rejected', approverId: 'rick', timestamp: '2026-03-10T09:00:00Z', note: 'Creative needs revision — headline too generic. Try "Happy Hour just got happier" angle.' },
    ],
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
    type: 'other',
    approvalHistory: [
      { id: 'ah-6', action: 'approved', approverId: 'joe', timestamp: '2026-02-25T16:30:00Z' },
    ],
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
    type: 'design',
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
    type: 'report',
    approvalHistory: [
      { id: 'ah-7', action: 'approved', approverId: 'joe', timestamp: '2026-03-06T15:00:00Z' },
    ],
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
    type: 'social',
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
    type: 'other',
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
    type: 'other',
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
    type: 'blog',
  },
  {
    id: 'kp-10',
    title: 'Monthly Client Meeting — March',
    clientId: 'k-pacho',
    assigneeId: 'rick',
    status: 'done',
    priority: 'High',
    dueDate: '2026-03-27',
    startDate: '2026-03-27',
    endDate: '2026-03-27',
    description: 'Monthly strategy review with K. Pacho ownership.',
    dependencies: [],
    type: 'meeting',
    approvalHistory: [
      { id: 'ah-kp10', action: 'approved', approverId: 'joe', timestamp: '2026-03-27T17:00:00Z' },
    ],
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
    type: 'other',
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
    type: 'ad',
    approvalHistory: [
      { id: 'ah-8', action: 'approved', approverId: 'rick', timestamp: '2026-02-20T18:00:00Z' },
    ],
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
    type: 'social',
    approvalHistory: [
      { id: 'ah-9', action: 'approved', approverId: 'joe', timestamp: '2026-02-28T14:00:00Z' },
    ],
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
    type: 'ad',
    approvalHistory: [
      { id: 'ah-10', action: 'approved', approverId: 'rick', timestamp: '2026-03-07T10:00:00Z' },
    ],
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
    type: 'design',
    approvalHistory: [
      { id: 'ah-tr4', action: 'approved', approverId: 'joe', timestamp: '2026-02-27T16:00:00Z' },
    ],
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
    type: 'other',
    approvalHistory: [
      { id: 'ah-tr5', action: 'approved', approverId: 'rick', timestamp: '2026-02-25T15:00:00Z' },
    ],
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
    type: 'other',
    approvalHistory: [],
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
    type: 'report',
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
    type: 'design',
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
    type: 'social',
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
    type: 'other',
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
    type: 'blog',
  },
  {
    id: 'tr-12',
    title: 'Monthly Client Meeting — March',
    clientId: 'the-refuge',
    assigneeId: 'joe',
    status: 'review',
    priority: 'High',
    dueDate: '2026-03-31',
    startDate: '2026-03-31',
    endDate: '2026-03-31',
    description: 'Monthly strategy meeting with The Refuge ownership.',
    dependencies: [],
    type: 'meeting',
    approvalHistory: [],
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
    type: 'other',
    approvalHistory: [
      { id: 'ah-tr-m1', action: 'approved', approverId: 'rick', timestamp: '2026-03-07T20:00:00Z', note: 'Grand opening was a massive success!' },
    ],
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
    type: 'other',
    approvalHistory: [],
  },

  // April tasks for Calendar
  {
    id: 'hd-apr-1',
    title: 'Ad Campaign Review — April',
    clientId: 'happy-days',
    assigneeId: 'marcus',
    status: 'todo',
    priority: 'High',
    dueDate: '2026-04-15',
    startDate: '2026-04-13',
    endDate: '2026-04-15',
    description: 'Monthly ad campaign performance review and optimization.',
    type: 'report',
  },
  {
    id: 'kp-apr-1',
    title: 'Cinco de Mayo Campaign Launch',
    clientId: 'k-pacho',
    assigneeId: 'marcus',
    status: 'todo',
    priority: 'Urgent',
    dueDate: '2026-04-20',
    startDate: '2026-04-15',
    endDate: '2026-04-20',
    description: 'Launch Cinco de Mayo promotional campaign across all channels.',
    type: 'ad',
  },
  {
    id: 'tr-apr-1',
    title: 'Social Media Content Calendar — April',
    clientId: 'the-refuge',
    assigneeId: 'marcus',
    status: 'todo',
    priority: 'High',
    dueDate: '2026-03-25',
    startDate: '2026-03-22',
    endDate: '2026-03-25',
    description: 'April content calendar for The Refuge.',
    type: 'social',
  },
  {
    id: 'hd-apr-2',
    title: 'Social Media Content Calendar — April',
    clientId: 'happy-days',
    assigneeId: 'sarah',
    status: 'todo',
    priority: 'High',
    dueDate: '2026-03-25',
    startDate: '2026-03-22',
    endDate: '2026-03-25',
    description: 'April content calendar for Happy Days.',
    type: 'social',
  },
  {
    id: 'kp-apr-2',
    title: 'Monthly Analytics Report — March',
    clientId: 'k-pacho',
    assigneeId: 'rick',
    status: 'todo',
    priority: 'Medium',
    dueDate: '2026-04-07',
    startDate: '2026-04-05',
    endDate: '2026-04-07',
    description: 'March performance analytics report for K. Pacho.',
    type: 'report',
  },
  {
    id: 'hd-apr-3',
    title: 'Monthly Analytics Report — March',
    clientId: 'happy-days',
    assigneeId: 'rick',
    status: 'todo',
    priority: 'Medium',
    dueDate: '2026-04-07',
    startDate: '2026-04-05',
    endDate: '2026-04-07',
    description: 'March performance analytics report for Happy Days.',
    type: 'report',
  },
  {
    id: 'tr-apr-2',
    title: 'Monthly Analytics Report — March',
    clientId: 'the-refuge',
    assigneeId: 'rick',
    status: 'todo',
    priority: 'Medium',
    dueDate: '2026-04-07',
    startDate: '2026-04-05',
    endDate: '2026-04-07',
    description: 'March performance analytics report for The Refuge.',
    type: 'report',
  },
  {
    id: 'hd-apr-4',
    title: 'Google Business Profile Update — April',
    clientId: 'happy-days',
    assigneeId: 'sarah',
    status: 'todo',
    priority: 'Medium',
    dueDate: '2026-04-01',
    startDate: '2026-04-01',
    endDate: '2026-04-01',
    description: 'Monthly Google Business Profile update.',
    type: 'other',
  },
  {
    id: 'tr-apr-3',
    title: 'Monthly Client Meeting — April',
    clientId: 'the-refuge',
    assigneeId: 'joe',
    status: 'todo',
    priority: 'High',
    dueDate: '2026-04-30',
    startDate: '2026-04-30',
    endDate: '2026-04-30',
    description: 'Monthly strategy meeting with The Refuge.',
    type: 'meeting',
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
        text: 'Budget allocation looks solid. Can we add a line item for influencer marketing under The Refuge?',
        createdAt: '2026-03-05T10:30:00Z',
        replies: [
          {
            id: 'c1-r1',
            authorId: 'joe',
            text: "Agree. I'll allocate $500 from the content budget and identify 3-5 LI food bloggers.",
            createdAt: '2026-03-05T11:15:00Z',
          },
        ],
      },
    ],
    versions: [
      { id: 'v3', version: 'v3.0', authorId: 'joe', createdAt: '2026-03-05T09:00:00Z', summary: 'Added budget table, finalized KPIs section' },
      { id: 'v2', version: 'v2.0', authorId: 'sarah', createdAt: '2026-02-28T16:30:00Z', summary: 'Expanded content pillars section' },
      { id: 'v1', version: 'v1.0', authorId: 'rick', createdAt: '2026-02-20T11:00:00Z', summary: 'Initial draft' },
    ],
    createdAt: '2026-02-20T11:00:00Z',
    updatedAt: '2026-03-05T09:00:00Z',
  },
  {
    id: 'doc-2',
    title: 'Happy Days Brand Guidelines',
    clientId: 'happy-days',
    collaborators: ['sarah'],
    content: `# Happy Days — Brand Guidelines\n*Medical Cannabis Dispensary | Farmingdale, NY*\n\n## Brand Overview\n\nHappy Days is a warm, welcoming medical cannabis dispensary focused on patient education and wellness.`,
    comments: [],
    versions: [
      { id: 'v2', version: 'v1.2', authorId: 'sarah', createdAt: '2026-02-15T14:00:00Z', summary: 'Added compliance section' },
      { id: 'v1', version: 'v1.0', authorId: 'sarah', createdAt: '2026-01-20T10:00:00Z', summary: 'Initial brand guidelines' },
    ],
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-02-15T14:00:00Z',
  },
  {
    id: 'doc-3',
    title: 'The Refuge Grand Opening Campaign Brief',
    clientId: 'the-refuge',
    collaborators: ['joe', 'rick', 'marcus'],
    content: `# The Refuge — Grand Opening Campaign Brief\n*Restaurant | Melville, NY | Opening: March 7, 2026*\n\n## Campaign Overview\n\n**Campaign Name:** "Find Your Refuge"\n**Duration:** February 21 – March 14, 2026\n**Budget:** $3,200 paid social + production\n**Goal:** 500+ grand opening attendees, 1,000 social followers, 50+ first-week reviews`,
    comments: [
      {
        id: 'c3',
        authorId: 'rick',
        text: "The influencer strategy looks good. I connected with @linyc_eats and they're interested.",
        createdAt: '2026-02-22T09:15:00Z',
        replies: [],
      },
    ],
    versions: [
      { id: 'v3', version: 'v3.0', authorId: 'joe', createdAt: '2026-03-01T10:00:00Z', summary: 'Added Phase 3 details' },
      { id: 'v1', version: 'v1.0', authorId: 'joe', createdAt: '2026-02-20T12:00:00Z', summary: 'Initial campaign brief' },
    ],
    createdAt: '2026-02-20T12:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
];

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'tmpl-1',
    title: 'Monthly Analytics Report',
    description: 'Compile GA4, Meta Ads, and Google Business insights for the previous month\'s performance review. Deliver by the 5th of each month.',
    defaultAssigneeRole: 'Owner',
    defaultPriority: 'Medium',
    estimatedDuration: 3,
    type: 'report',
    dueRule: '5th of each month',
    category: 'Reporting',
  },
  {
    id: 'tmpl-2',
    title: 'Social Media Content Calendar',
    description: 'Plan and schedule 30 days of social content across Instagram, Facebook, and X. Due the 25th of the prior month.',
    defaultAssigneeRole: 'Content Manager',
    defaultPriority: 'High',
    estimatedDuration: 5,
    type: 'social',
    dueRule: '25th of prior month',
    category: 'Content',
  },
  {
    id: 'tmpl-3',
    title: 'Ad Campaign Review',
    description: 'Monthly review and optimization of all active paid social and search campaigns. Check ROAS, adjust bids, refresh creatives as needed.',
    defaultAssigneeRole: 'Social Media Specialist',
    defaultPriority: 'High',
    estimatedDuration: 2,
    type: 'ad',
    dueRule: '15th of each month',
    category: 'Paid Media',
  },
  {
    id: 'tmpl-4',
    title: 'Google Business Profile Update',
    description: 'Update hours, photos, posts, and Q&A on Google Business Profile. Respond to any new reviews.',
    defaultAssigneeRole: 'Content Manager',
    defaultPriority: 'Medium',
    estimatedDuration: 1,
    type: 'other',
    dueRule: '1st of each month',
    category: 'Local SEO',
  },
  {
    id: 'tmpl-5',
    title: 'Monthly Client Meeting Prep',
    description: 'Prepare monthly client meeting agenda, pull performance data, and draft talking points. Includes scheduling and post-meeting notes.',
    defaultAssigneeRole: 'Owner',
    defaultPriority: 'High',
    estimatedDuration: 1,
    type: 'meeting',
    dueRule: 'Last business day of month',
    category: 'Client Relations',
  },
  {
    id: 'tmpl-6',
    title: 'Review Response Management',
    description: 'Monitor and respond to Google, Yelp, and TripAdvisor reviews. Escalate negative reviews within 24 hours.',
    defaultAssigneeRole: 'Social Media Specialist',
    defaultPriority: 'Low',
    estimatedDuration: 1,
    type: 'other',
    dueRule: 'Weekly (every Monday)',
    category: 'Reputation',
  },
  {
    id: 'tmpl-7',
    title: 'SEO Blog Post',
    description: 'Research, write, and publish an SEO-optimized blog post targeting a local or industry keyword. Includes keyword research and on-page optimization.',
    defaultAssigneeRole: 'Content Manager',
    defaultPriority: 'Low',
    estimatedDuration: 5,
    type: 'blog',
    dueRule: 'Monthly (custom date)',
    category: 'Content',
  },
  {
    id: 'tmpl-8',
    title: 'Email Newsletter',
    description: 'Draft, design, and schedule the monthly email newsletter. Includes list segmentation, A/B subject line testing, and post-send reporting.',
    defaultAssigneeRole: 'Content Manager',
    defaultPriority: 'Medium',
    estimatedDuration: 3,
    type: 'social',
    dueRule: 'Monthly (20th)',
    category: 'Email Marketing',
  },
];

export const AUTOMATIONS: Automation[] = [
  // Happy Days
  { id: 'auto-1', clientId: 'happy-days', templateId: 'tmpl-1', frequency: 'monthly', assigneeId: 'rick', status: 'active', nextRunDate: '2026-04-05', lastRunDate: '2026-03-05', createdAt: '2026-01-01' },
  { id: 'auto-2', clientId: 'happy-days', templateId: 'tmpl-2', frequency: 'monthly', assigneeId: 'sarah', status: 'active', nextRunDate: '2026-03-25', lastRunDate: '2026-02-25', createdAt: '2026-01-01' },
  { id: 'auto-3', clientId: 'happy-days', templateId: 'tmpl-3', frequency: 'monthly', assigneeId: 'marcus', status: 'active', nextRunDate: '2026-04-15', lastRunDate: '2026-03-15', createdAt: '2026-01-01' },
  { id: 'auto-4', clientId: 'happy-days', templateId: 'tmpl-4', frequency: 'monthly', assigneeId: 'sarah', status: 'paused', nextRunDate: '2026-04-01', lastRunDate: '2026-03-01', createdAt: '2026-01-01' },
  // K. Pacho
  { id: 'auto-5', clientId: 'k-pacho', templateId: 'tmpl-1', frequency: 'monthly', assigneeId: 'rick', status: 'active', nextRunDate: '2026-04-05', lastRunDate: '2026-03-05', createdAt: '2026-01-15' },
  { id: 'auto-6', clientId: 'k-pacho', templateId: 'tmpl-2', frequency: 'monthly', assigneeId: 'marcus', status: 'active', nextRunDate: '2026-03-25', lastRunDate: '2026-02-25', createdAt: '2026-01-15' },
  { id: 'auto-7', clientId: 'k-pacho', templateId: 'tmpl-6', frequency: 'weekly', assigneeId: 'marcus', status: 'active', nextRunDate: '2026-03-16', lastRunDate: '2026-03-09', createdAt: '2026-01-15' },
  { id: 'auto-8', clientId: 'k-pacho', templateId: 'tmpl-5', frequency: 'monthly', assigneeId: 'joe', status: 'active', nextRunDate: '2026-03-31', lastRunDate: '2026-02-28', createdAt: '2026-01-15' },
  // The Refuge
  { id: 'auto-9', clientId: 'the-refuge', templateId: 'tmpl-1', frequency: 'monthly', assigneeId: 'rick', status: 'active', nextRunDate: '2026-04-05', lastRunDate: '2026-03-14', createdAt: '2026-02-15' },
  { id: 'auto-10', clientId: 'the-refuge', templateId: 'tmpl-2', frequency: 'monthly', assigneeId: 'marcus', status: 'active', nextRunDate: '2026-03-25', lastRunDate: '2026-02-28', createdAt: '2026-02-15' },
  { id: 'auto-11', clientId: 'the-refuge', templateId: 'tmpl-4', frequency: 'monthly', assigneeId: 'sarah', status: 'active', nextRunDate: '2026-04-01', lastRunDate: '2026-03-01', createdAt: '2026-02-15' },
  { id: 'auto-12', clientId: 'the-refuge', templateId: 'tmpl-3', frequency: 'monthly', assigneeId: 'marcus', status: 'paused', nextRunDate: '2026-04-15', lastRunDate: '2026-03-15', createdAt: '2026-02-15' },
];

export const TIME_ENTRIES: TimeEntry[] = [
  // Happy Days
  { id: 'te-1', taskId: 'hd-1', clientId: 'happy-days', memberId: 'sarah', date: '2026-02-17', durationMinutes: 120, note: 'Initial calendar planning' },
  { id: 'te-2', taskId: 'hd-1', clientId: 'happy-days', memberId: 'sarah', date: '2026-02-19', durationMinutes: 180, note: 'Content writing and scheduling' },
  { id: 'te-3', taskId: 'hd-1', clientId: 'happy-days', memberId: 'sarah', date: '2026-02-24', durationMinutes: 90, note: 'Final review and approval' },
  { id: 'te-4', taskId: 'hd-2', clientId: 'happy-days', memberId: 'marcus', date: '2026-03-03', durationMinutes: 150, note: 'Campaign setup and targeting' },
  { id: 'te-5', taskId: 'hd-2', clientId: 'happy-days', memberId: 'marcus', date: '2026-03-06', durationMinutes: 120, note: 'Ad creative build' },
  { id: 'te-6', taskId: 'hd-2', clientId: 'happy-days', memberId: 'marcus', date: '2026-03-10', durationMinutes: 60, note: 'Performance check and bid adjustments' },
  { id: 'te-7', taskId: 'hd-4', clientId: 'happy-days', memberId: 'joe', date: '2026-03-01', durationMinutes: 240, note: 'Design and dev work' },
  { id: 'te-8', taskId: 'hd-4', clientId: 'happy-days', memberId: 'joe', date: '2026-03-05', durationMinutes: 180, note: 'Revisions round 1' },
  { id: 'te-9', taskId: 'hd-5', clientId: 'happy-days', memberId: 'rick', date: '2026-03-04', durationMinutes: 90, note: 'Data pull and analysis' },
  { id: 'te-10', taskId: 'hd-5', clientId: 'happy-days', memberId: 'rick', date: '2026-03-06', durationMinutes: 60, note: 'Report finalization' },
  { id: 'te-11', taskId: 'hd-7', clientId: 'happy-days', memberId: 'sarah', date: '2026-03-10', durationMinutes: 120, note: 'Newsletter draft' },
  { id: 'te-12', taskId: 'hd-7', clientId: 'happy-days', memberId: 'sarah', date: '2026-03-12', durationMinutes: 90, note: 'Design and layout' },
  // K. Pacho
  { id: 'te-13', taskId: 'kp-1', clientId: 'k-pacho', memberId: 'marcus', date: '2026-02-20', durationMinutes: 120, note: 'Calendar planning' },
  { id: 'te-14', taskId: 'kp-1', clientId: 'k-pacho', memberId: 'marcus', date: '2026-02-25', durationMinutes: 150, note: 'Content writing' },
  { id: 'te-15', taskId: 'kp-2', clientId: 'k-pacho', memberId: 'marcus', date: '2026-03-05', durationMinutes: 180, note: 'Ad setup and creative' },
  { id: 'te-16', taskId: 'kp-2', clientId: 'k-pacho', memberId: 'marcus', date: '2026-03-08', durationMinutes: 90, note: 'Optimization and reporting' },
  { id: 'te-17', taskId: 'kp-4', clientId: 'k-pacho', memberId: 'sarah', date: '2026-03-08', durationMinutes: 240, note: 'Photography session coordination' },
  { id: 'te-18', taskId: 'kp-4', clientId: 'k-pacho', memberId: 'sarah', date: '2026-03-12', durationMinutes: 180, note: 'Photo editing and delivery' },
  { id: 'te-19', taskId: 'kp-5', clientId: 'k-pacho', memberId: 'rick', date: '2026-03-04', durationMinutes: 75, note: 'Data pull' },
  { id: 'te-20', taskId: 'kp-5', clientId: 'k-pacho', memberId: 'rick', date: '2026-03-06', durationMinutes: 45, note: 'Report write-up' },
  // The Refuge
  { id: 'te-21', taskId: 'tr-1', clientId: 'the-refuge', memberId: 'joe', date: '2026-02-10', durationMinutes: 300, note: 'Full strategy build' },
  { id: 'te-22', taskId: 'tr-2', clientId: 'the-refuge', memberId: 'marcus', date: '2026-02-21', durationMinutes: 180, note: 'Content planning' },
  { id: 'te-23', taskId: 'tr-3', clientId: 'the-refuge', memberId: 'marcus', date: '2026-02-28', durationMinutes: 240, note: 'Campaign setup' },
  { id: 'te-24', taskId: 'tr-3', clientId: 'the-refuge', memberId: 'marcus', date: '2026-03-03', durationMinutes: 120, note: 'Performance monitoring' },
  { id: 'te-25', taskId: 'tr-4', clientId: 'the-refuge', memberId: 'marcus', date: '2026-02-21', durationMinutes: 360, note: 'Full graphic suite design' },
  { id: 'te-26', taskId: 'tr-5', clientId: 'the-refuge', memberId: 'sarah', date: '2026-02-18', durationMinutes: 120, note: 'Profile setup' },
  { id: 'te-27', taskId: 'tr-6', clientId: 'the-refuge', memberId: 'joe', date: '2026-02-25', durationMinutes: 480, note: 'Website dev kickoff' },
  { id: 'te-28', taskId: 'tr-6', clientId: 'the-refuge', memberId: 'joe', date: '2026-03-02', durationMinutes: 360, note: 'Content pages and menu' },
  { id: 'te-29', taskId: 'tr-7', clientId: 'the-refuge', memberId: 'rick', date: '2026-03-08', durationMinutes: 120, note: 'First 30-day data pull' },
  { id: 'te-30', taskId: 'tr-8', clientId: 'the-refuge', memberId: 'sarah', date: '2026-03-10', durationMinutes: 300, note: 'Photo session' },
  { id: 'te-31', taskId: 'tr-8', clientId: 'the-refuge', memberId: 'sarah', date: '2026-03-12', durationMinutes: 180, note: 'Editing and delivery' },
];

export const ASSETS: Asset[] = [
  // Happy Days
  { id: 'ast-1', clientId: 'happy-days', filename: 'HappyDays_Logo_Primary.svg', fileType: 'logo', uploadDate: '2026-01-15', uploadedBy: 'joe', tags: ['logo', 'brand', 'primary'], size: '42 KB', color: '#10b981', versions: [{ id: 'v1', date: '2026-01-15', note: 'Initial upload' }] },
  { id: 'ast-2', clientId: 'happy-days', filename: 'HappyDays_Logo_White.svg', fileType: 'logo', uploadDate: '2026-01-15', uploadedBy: 'joe', tags: ['logo', 'brand', 'white'], size: '38 KB', color: '#065f46', versions: [{ id: 'v1', date: '2026-01-15', note: 'Initial upload' }] },
  { id: 'ast-3', clientId: 'happy-days', filename: 'Menu_Photo_Tinctures_001.jpg', fileType: 'image', uploadDate: '2026-02-05', uploadedBy: 'sarah', tags: ['product', 'tinctures', 'photography'], size: '2.4 MB', color: '#6ee7b7', versions: [{ id: 'v1', date: '2026-02-05', note: 'Raw upload' }, { id: 'v2', date: '2026-02-10', note: 'Color corrected' }] },
  { id: 'ast-4', clientId: 'happy-days', filename: 'Menu_Photo_Edibles_002.jpg', fileType: 'image', uploadDate: '2026-02-05', uploadedBy: 'sarah', tags: ['product', 'edibles', 'photography'], size: '1.9 MB', color: '#a7f3d0', versions: [{ id: 'v1', date: '2026-02-05', note: 'Raw upload' }] },
  { id: 'ast-5', clientId: 'happy-days', filename: 'Ad_Creative_Spring_Banner.jpg', fileType: 'image', uploadDate: '2026-03-01', uploadedBy: 'marcus', tags: ['ad', 'creative', 'spring', 'banner'], size: '856 KB', color: '#34d399', versions: [{ id: 'v1', date: '2026-03-01', note: 'v1' }, { id: 'v2', date: '2026-03-05', note: 'Headline update' }] },
  { id: 'ast-6', clientId: 'happy-days', filename: 'Ad_Creative_Spring_Story.jpg', fileType: 'image', uploadDate: '2026-03-01', uploadedBy: 'marcus', tags: ['ad', 'creative', 'spring', 'story'], size: '724 KB', color: '#10b981', versions: [{ id: 'v1', date: '2026-03-01', note: 'v1' }] },
  { id: 'ast-7', clientId: 'happy-days', filename: 'HappyDays_BrandGuide_2026.pdf', fileType: 'document', uploadDate: '2026-01-20', uploadedBy: 'sarah', tags: ['brand', 'guidelines', 'PDF'], size: '4.2 MB', color: '#059669', versions: [{ id: 'v1', date: '2026-01-20', note: 'Initial guide' }, { id: 'v2', date: '2026-02-15', note: 'Updated compliance section' }] },
  { id: 'ast-8', clientId: 'happy-days', filename: 'StoreFront_Video_Tour.mp4', fileType: 'video', uploadDate: '2026-02-20', uploadedBy: 'marcus', tags: ['video', 'storefront', 'social'], size: '48 MB', color: '#047857', versions: [{ id: 'v1', date: '2026-02-20', note: 'Raw footage' }] },
  // K. Pacho
  { id: 'ast-9', clientId: 'k-pacho', filename: 'KPacho_Logo_Color.svg', fileType: 'logo', uploadDate: '2026-01-10', uploadedBy: 'joe', tags: ['logo', 'brand', 'color'], size: '56 KB', color: '#f59e0b', versions: [{ id: 'v1', date: '2026-01-10', note: 'Initial upload' }] },
  { id: 'ast-10', clientId: 'k-pacho', filename: 'KPacho_Logo_Dark.svg', fileType: 'logo', uploadDate: '2026-01-10', uploadedBy: 'joe', tags: ['logo', 'brand', 'dark'], size: '51 KB', color: '#92400e', versions: [{ id: 'v1', date: '2026-01-10', note: 'Initial upload' }] },
  { id: 'ast-11', clientId: 'k-pacho', filename: 'FoodPhoto_Tacos_Hero.jpg', fileType: 'image', uploadDate: '2026-02-10', uploadedBy: 'sarah', tags: ['food', 'photography', 'tacos', 'hero'], size: '3.1 MB', color: '#fcd34d', versions: [{ id: 'v1', date: '2026-02-10', note: 'Session 1' }, { id: 'v2', date: '2026-02-18', note: 'Final edit' }] },
  { id: 'ast-12', clientId: 'k-pacho', filename: 'FoodPhoto_Margaritas.jpg', fileType: 'image', uploadDate: '2026-02-10', uploadedBy: 'sarah', tags: ['food', 'photography', 'drinks'], size: '2.7 MB', color: '#fbbf24', versions: [{ id: 'v1', date: '2026-02-10', note: 'Session 1' }] },
  { id: 'ast-13', clientId: 'k-pacho', filename: 'EventFlyer_HappyHour_March.jpg', fileType: 'image', uploadDate: '2026-03-04', uploadedBy: 'marcus', tags: ['event', 'flyer', 'happy hour'], size: '1.1 MB', color: '#f59e0b', versions: [{ id: 'v1', date: '2026-03-04', note: 'v1' }, { id: 'v2', date: '2026-03-06', note: 'Date/time updated' }] },
  { id: 'ast-14', clientId: 'k-pacho', filename: 'SocialTemplate_TacoTuesday.psd', fileType: 'document', uploadDate: '2026-02-15', uploadedBy: 'marcus', tags: ['template', 'social', 'taco tuesday'], size: '8.4 MB', color: '#d97706', versions: [{ id: 'v1', date: '2026-02-15', note: 'Master template' }] },
  // The Refuge
  { id: 'ast-15', clientId: 'the-refuge', filename: 'TheRefuge_Logo_Primary.svg', fileType: 'logo', uploadDate: '2026-02-01', uploadedBy: 'joe', tags: ['logo', 'brand', 'primary'], size: '63 KB', color: '#3b82f6', versions: [{ id: 'v1', date: '2026-02-01', note: 'Initial upload' }, { id: 'v2', date: '2026-02-10', note: 'Tag line added' }] },
  { id: 'ast-16', clientId: 'the-refuge', filename: 'TheRefuge_Logo_Gold.svg', fileType: 'logo', uploadDate: '2026-02-01', uploadedBy: 'joe', tags: ['logo', 'brand', 'gold', 'alternate'], size: '59 KB', color: '#1d4ed8', versions: [{ id: 'v1', date: '2026-02-01', note: 'Initial upload' }] },
  { id: 'ast-17', clientId: 'the-refuge', filename: 'Interior_Bar_Area.jpg', fileType: 'image', uploadDate: '2026-02-25', uploadedBy: 'sarah', tags: ['interior', 'bar', 'ambiance'], size: '4.2 MB', color: '#60a5fa', versions: [{ id: 'v1', date: '2026-02-25', note: 'Pre-opening shoot' }] },
  { id: 'ast-18', clientId: 'the-refuge', filename: 'Interior_Dining_Room.jpg', fileType: 'image', uploadDate: '2026-02-25', uploadedBy: 'sarah', tags: ['interior', 'dining', 'ambiance'], size: '3.8 MB', color: '#93c5fd', versions: [{ id: 'v1', date: '2026-02-25', note: 'Pre-opening shoot' }] },
  { id: 'ast-19', clientId: 'the-refuge', filename: 'MenuDesign_Dinner_v3.pdf', fileType: 'document', uploadDate: '2026-03-01', uploadedBy: 'joe', tags: ['menu', 'design', 'PDF', 'dinner'], size: '2.1 MB', color: '#2563eb', versions: [{ id: 'v1', date: '2026-02-20', note: 'Initial' }, { id: 'v2', date: '2026-02-25', note: 'Pricing update' }, { id: 'v3', date: '2026-03-01', note: 'Final' }] },
  { id: 'ast-20', clientId: 'the-refuge', filename: 'EventGraphics_GrandOpening.zip', fileType: 'document', uploadDate: '2026-02-27', uploadedBy: 'marcus', tags: ['event', 'grand opening', 'graphics', 'package'], size: '22 MB', color: '#3b82f6', versions: [{ id: 'v1', date: '2026-02-27', note: 'Full package delivered' }] },
  { id: 'ast-21', clientId: 'the-refuge', filename: 'GrandOpening_Recap_Video.mp4', fileType: 'video', uploadDate: '2026-03-08', uploadedBy: 'marcus', tags: ['video', 'grand opening', 'recap', 'social'], size: '112 MB', color: '#1e40af', versions: [{ id: 'v1', date: '2026-03-08', note: 'Rough cut' }, { id: 'v2', date: '2026-03-10', note: 'Final edit' }] },
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

export const TYPE_ICONS: Record<NonNullable<Task['type']>, string> = {
  social: '📱',
  ad: '📣',
  blog: '✍️',
  report: '📊',
  meeting: '🤝',
  design: '🎨',
  other: '📋',
};

// ============================================================
// PHASE 3: Strategy, Projects, Workflow Templates
// ============================================================

export interface KPI {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
}

export interface StrategyPillar {
  id: string;
  name: string;
  description: string;
  projectIds: string[];
  kpis: KPI[];
}

export interface Strategy {
  id: string;
  clientId: string;
  name: string;
  quarter: string;
  startDate: string;
  endDate: string;
  pillars: StrategyPillar[];
  status: 'planning' | 'active' | 'complete';
}

export interface Project {
  id: string;
  clientId: string;
  strategyId?: string;
  pillarId?: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'complete' | 'on-hold';
  startDate: string;
  endDate: string;
  progress: number;
  workflowTemplateId?: string;
  taskIds: string[];
}

export interface WorkflowStep {
  id: string;
  order: number;
  title: string;
  description: string;
  defaultDurationDays: number;
  dependsOn: string[];
  assigneeRole: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultDurationDays: number;
  steps: WorkflowStep[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'wt-1',
    name: 'Monthly Ad Campaign Management',
    description: 'Full-cycle paid media campaign management from strategy to end-of-month reporting.',
    category: 'Paid Media',
    defaultDurationDays: 30,
    steps: [
      { id: 'wt1-s1', order: 1, title: 'Strategy & Budget Review', description: 'Review monthly budget allocation, audience targeting, and campaign goals.', defaultDurationDays: 2, dependsOn: [], assigneeRole: 'Owner' },
      { id: 'wt1-s2', order: 2, title: 'Creative Brief', description: 'Document creative direction, messaging, CTAs, and visual requirements.', defaultDurationDays: 2, dependsOn: ['wt1-s1'], assigneeRole: 'Content Manager' },
      { id: 'wt1-s3', order: 3, title: 'Ad Creative Design', description: 'Design static images, video assets, and copy variations for all placements.', defaultDurationDays: 4, dependsOn: ['wt1-s2'], assigneeRole: 'Content Manager' },
      { id: 'wt1-s4', order: 4, title: 'Campaign Setup', description: 'Build campaigns in Meta Ads Manager — audiences, placements, budgets, and tracking.', defaultDurationDays: 2, dependsOn: ['wt1-s3'], assigneeRole: 'Social Media Specialist' },
      { id: 'wt1-s5', order: 5, title: 'Launch & Monitor', description: 'Launch campaigns and monitor daily performance for first 5 days.', defaultDurationDays: 5, dependsOn: ['wt1-s4'], assigneeRole: 'Social Media Specialist' },
      { id: 'wt1-s6', order: 6, title: 'Mid-Month Optimization', description: 'Adjust bids, budgets, and creative based on 2-week performance data.', defaultDurationDays: 2, dependsOn: ['wt1-s5'], assigneeRole: 'Social Media Specialist' },
      { id: 'wt1-s7', order: 7, title: 'End-of-Month Report', description: 'Compile full performance report with ROAS, CPC, reach, and recommendations.', defaultDurationDays: 2, dependsOn: ['wt1-s6'], assigneeRole: 'Owner' },
    ],
  },
  {
    id: 'wt-2',
    name: 'Website Build',
    description: 'Full website design and development from discovery to launch.',
    category: 'Web Dev',
    defaultDurationDays: 60,
    steps: [
      { id: 'wt2-s1', order: 1, title: 'Discovery & Requirements', description: 'Gather brand assets, define site structure, and document all requirements.', defaultDurationDays: 5, dependsOn: [], assigneeRole: 'Owner' },
      { id: 'wt2-s2', order: 2, title: 'Sitemap & Wireframes', description: 'Build site architecture and low-fidelity wireframes for all key pages.', defaultDurationDays: 5, dependsOn: ['wt2-s1'], assigneeRole: 'Owner' },
      { id: 'wt2-s3', order: 3, title: 'Visual Design', description: 'Create high-fidelity mockups applying brand guidelines.', defaultDurationDays: 8, dependsOn: ['wt2-s2'], assigneeRole: 'Content Manager' },
      { id: 'wt2-s4', order: 4, title: 'Development', description: 'Build out all pages in WordPress/Next.js with responsive layouts.', defaultDurationDays: 15, dependsOn: ['wt2-s3'], assigneeRole: 'Owner' },
      { id: 'wt2-s5', order: 5, title: 'Content Population', description: 'Add all copy, images, menu items, and media to the CMS.', defaultDurationDays: 5, dependsOn: ['wt2-s4'], assigneeRole: 'Content Manager' },
      { id: 'wt2-s6', order: 6, title: 'QA & Testing', description: 'Cross-browser and mobile testing, performance checks, and bug fixes.', defaultDurationDays: 5, dependsOn: ['wt2-s5'], assigneeRole: 'Owner' },
      { id: 'wt2-s7', order: 7, title: 'Client Review', description: 'Client walkthrough, feedback round, and revision implementation.', defaultDurationDays: 5, dependsOn: ['wt2-s6'], assigneeRole: 'Owner' },
      { id: 'wt2-s8', order: 8, title: 'Launch', description: 'DNS cutover, final QA, Google indexing submission, and analytics verification.', defaultDurationDays: 2, dependsOn: ['wt2-s7'], assigneeRole: 'Owner' },
    ],
  },
  {
    id: 'wt-3',
    name: 'Monthly Social Media Management',
    description: 'End-to-end monthly social media execution from content planning to analytics.',
    category: 'Social Media',
    defaultDurationDays: 30,
    steps: [
      { id: 'wt3-s1', order: 1, title: 'Content Calendar Planning', description: 'Map out all posts for the month — topics, formats, and publishing schedule.', defaultDurationDays: 3, dependsOn: [], assigneeRole: 'Content Manager' },
      { id: 'wt3-s2', order: 2, title: 'Content Creation (Copy)', description: 'Write all captions, hashtag sets, and story copy.', defaultDurationDays: 5, dependsOn: ['wt3-s1'], assigneeRole: 'Content Manager' },
      { id: 'wt3-s3', order: 3, title: 'Content Creation (Graphics)', description: 'Design all static images, carousels, and Reel covers.', defaultDurationDays: 5, dependsOn: ['wt3-s1'], assigneeRole: 'Social Media Specialist' },
      { id: 'wt3-s4', order: 4, title: 'Scheduling & Publishing', description: 'Schedule all content in Buffer/Later and publish time-sensitive posts manually.', defaultDurationDays: 2, dependsOn: ['wt3-s2', 'wt3-s3'], assigneeRole: 'Content Manager' },
      { id: 'wt3-s5', order: 5, title: 'Community Engagement', description: 'Daily response to comments, DMs, mentions, and story interactions.', defaultDurationDays: 20, dependsOn: ['wt3-s4'], assigneeRole: 'Social Media Specialist' },
      { id: 'wt3-s6', order: 6, title: 'Monthly Analytics Report', description: 'Compile reach, engagement, follower growth, and top-performing content.', defaultDurationDays: 2, dependsOn: ['wt3-s5'], assigneeRole: 'Owner' },
    ],
  },
  {
    id: 'wt-4',
    name: 'New Client Onboarding',
    description: 'Structured onboarding process to get a new client fully set up and strategy-ready.',
    category: 'Onboarding',
    defaultDurationDays: 14,
    steps: [
      { id: 'wt4-s1', order: 1, title: 'Intake Call & Brief', description: 'Discovery call to capture brand story, goals, competitors, and target audience.', defaultDurationDays: 1, dependsOn: [], assigneeRole: 'Owner' },
      { id: 'wt4-s2', order: 2, title: 'Account Access Setup', description: 'Gain access to Meta Business, Google, website, and email platform.', defaultDurationDays: 2, dependsOn: ['wt4-s1'], assigneeRole: 'Owner' },
      { id: 'wt4-s3', order: 3, title: 'Brand Audit', description: 'Review existing brand assets, social presence, website, and online reputation.', defaultDurationDays: 3, dependsOn: ['wt4-s2'], assigneeRole: 'Content Manager' },
      { id: 'wt4-s4', order: 4, title: 'Competitor Analysis', description: 'Research 3-5 direct competitors across digital channels.', defaultDurationDays: 2, dependsOn: ['wt4-s3'], assigneeRole: 'Owner' },
      { id: 'wt4-s5', order: 5, title: 'Strategy Proposal', description: 'Present 90-day marketing strategy with goals, channels, and budget allocation.', defaultDurationDays: 3, dependsOn: ['wt4-s4'], assigneeRole: 'Owner' },
      { id: 'wt4-s6', order: 6, title: 'Client Kickoff Meeting', description: 'Present strategy, align on KPIs, set expectations, and begin execution.', defaultDurationDays: 1, dependsOn: ['wt4-s5'], assigneeRole: 'Owner' },
    ],
  },
  {
    id: 'wt-5',
    name: 'Monthly SEO Management',
    description: 'Comprehensive SEO management covering technical audits, content, and link building.',
    category: 'SEO',
    defaultDurationDays: 30,
    steps: [
      { id: 'wt5-s1', order: 1, title: 'Technical Audit', description: 'Check site speed, crawl errors, Core Web Vitals, and schema markup.', defaultDurationDays: 3, dependsOn: [], assigneeRole: 'Owner' },
      { id: 'wt5-s2', order: 2, title: 'Keyword Research', description: 'Identify target keywords, track rankings, and find gap opportunities.', defaultDurationDays: 3, dependsOn: [], assigneeRole: 'Content Manager' },
      { id: 'wt5-s3', order: 3, title: 'On-Page Optimization', description: 'Update title tags, meta descriptions, H-tags, and internal linking.', defaultDurationDays: 4, dependsOn: ['wt5-s1', 'wt5-s2'], assigneeRole: 'Owner' },
      { id: 'wt5-s4', order: 4, title: 'Content Planning', description: 'Define blog topics, landing page updates, and FAQ content based on keyword data.', defaultDurationDays: 2, dependsOn: ['wt5-s2'], assigneeRole: 'Content Manager' },
      { id: 'wt5-s5', order: 5, title: 'Content Creation', description: 'Write and publish SEO blog posts and updated landing page copy.', defaultDurationDays: 7, dependsOn: ['wt5-s4'], assigneeRole: 'Content Manager' },
      { id: 'wt5-s6', order: 6, title: 'Link Building Outreach', description: 'Pitch local directories, industry blogs, and partners for backlinks.', defaultDurationDays: 5, dependsOn: ['wt5-s3'], assigneeRole: 'Owner' },
      { id: 'wt5-s7', order: 7, title: 'Monthly Report', description: 'Document ranking changes, traffic trends, and recommendations.', defaultDurationDays: 2, dependsOn: ['wt5-s5', 'wt5-s6'], assigneeRole: 'Owner' },
    ],
  },
  {
    id: 'wt-6',
    name: 'Quarterly Strategy Review',
    description: 'End-of-quarter performance review and strategy planning for the next quarter.',
    category: 'Strategy',
    defaultDurationDays: 14,
    steps: [
      { id: 'wt6-s1', order: 1, title: 'Data Collection', description: 'Pull all quarterly data from Meta, Google Analytics, and email platforms.', defaultDurationDays: 2, dependsOn: [], assigneeRole: 'Owner' },
      { id: 'wt6-s2', order: 2, title: 'Performance Analysis', description: 'Analyze KPI performance against quarterly targets and identify trends.', defaultDurationDays: 3, dependsOn: ['wt6-s1'], assigneeRole: 'Owner' },
      { id: 'wt6-s3', order: 3, title: 'Competitive Landscape', description: 'Review competitor activity and market changes over the quarter.', defaultDurationDays: 2, dependsOn: ['wt6-s1'], assigneeRole: 'Content Manager' },
      { id: 'wt6-s4', order: 4, title: 'Strategy Recommendations', description: 'Draft next-quarter strategy with updated goals and channel mix.', defaultDurationDays: 3, dependsOn: ['wt6-s2', 'wt6-s3'], assigneeRole: 'Owner' },
      { id: 'wt6-s5', order: 5, title: 'Client Presentation', description: 'Present quarterly recap and next-quarter strategy to client.', defaultDurationDays: 1, dependsOn: ['wt6-s4'], assigneeRole: 'Owner' },
      { id: 'wt6-s6', order: 6, title: 'Strategy Finalization', description: 'Incorporate client feedback and finalize approved strategy document.', defaultDurationDays: 2, dependsOn: ['wt6-s5'], assigneeRole: 'Owner' },
    ],
  },
];

export const PROJECTS: Project[] = [
  // Happy Days
  {
    id: 'proj-hd-1',
    clientId: 'happy-days',
    strategyId: 'strat-hd-1',
    pillarId: 'pillar-hd-2',
    name: 'Monthly Ad Campaign — April 2026',
    description: 'Full paid media campaign management for Happy Days April, targeting local dispensary traffic.',
    status: 'active',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    progress: 35,
    workflowTemplateId: 'wt-1',
    taskIds: ['hd-2', 'hd-m1', 'hd-apr-1'],
  },
  {
    id: 'proj-hd-2',
    clientId: 'happy-days',
    strategyId: 'strat-hd-1',
    pillarId: 'pillar-hd-1',
    name: 'Monthly Social Media — April 2026',
    description: 'April social media content calendar, copy, graphics, scheduling, and community engagement.',
    status: 'active',
    startDate: '2026-03-25',
    endDate: '2026-04-30',
    progress: 20,
    workflowTemplateId: 'wt-3',
    taskIds: ['hd-apr-2', 'hd-1', 'hd-7'],
  },
  {
    id: 'proj-hd-3',
    clientId: 'happy-days',
    strategyId: 'strat-hd-1',
    pillarId: 'pillar-hd-3',
    name: 'Website Redesign',
    description: 'Full homepage and product page redesign with updated compliance-friendly copy and photography.',
    status: 'active',
    startDate: '2026-03-01',
    endDate: '2026-04-15',
    progress: 60,
    workflowTemplateId: 'wt-2',
    taskIds: ['hd-3', 'hd-4', 'hd-6', 'hd-9'],
  },
  // K. Pacho
  {
    id: 'proj-kp-1',
    clientId: 'k-pacho',
    strategyId: 'strat-kp-1',
    pillarId: 'pillar-kp-1',
    name: 'Monthly Social Media — April 2026',
    description: 'April content calendar, Cinco de Mayo prep content, and community engagement for K. Pacho.',
    status: 'planning',
    startDate: '2026-03-25',
    endDate: '2026-04-30',
    progress: 10,
    workflowTemplateId: 'wt-3',
    taskIds: ['kp-1', 'kp-apr-2', 'kp-6'],
  },
  {
    id: 'proj-kp-2',
    clientId: 'k-pacho',
    strategyId: 'strat-kp-1',
    pillarId: 'pillar-kp-1',
    name: 'Cinco de Mayo Event Campaign',
    description: 'Full campaign for Cinco de Mayo including ads, graphics, email, and social.',
    status: 'planning',
    startDate: '2026-04-01',
    endDate: '2026-05-05',
    progress: 5,
    taskIds: ['kp-apr-1', 'kp-2', 'kp-4'],
  },
  {
    id: 'proj-kp-3',
    clientId: 'k-pacho',
    strategyId: 'strat-kp-1',
    pillarId: 'pillar-kp-2',
    name: 'Monthly SEO — April 2026',
    description: 'Technical SEO, local keyword optimization, and content for K. Pacho April cycle.',
    status: 'planning',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    progress: 0,
    workflowTemplateId: 'wt-5',
    taskIds: ['kp-3', 'kp-7', 'kp-9'],
  },
  // The Refuge
  {
    id: 'proj-tr-1',
    clientId: 'the-refuge',
    strategyId: 'strat-tr-1',
    pillarId: 'pillar-tr-1',
    name: 'Grand Opening Campaign',
    description: 'Full launch campaign for The Refuge grand opening — strategy, social, ads, graphics, and PR.',
    status: 'complete',
    startDate: '2026-02-10',
    endDate: '2026-03-14',
    progress: 100,
    workflowTemplateId: 'wt-1',
    taskIds: ['tr-1', 'tr-2', 'tr-3', 'tr-4', 'tr-m1'],
  },
  {
    id: 'proj-tr-2',
    clientId: 'the-refuge',
    strategyId: 'strat-tr-1',
    pillarId: 'pillar-tr-1',
    name: 'PR Outreach',
    description: 'Media outreach to Long Island food press, influencers, and local bloggers.',
    status: 'active',
    startDate: '2026-02-25',
    endDate: '2026-04-01',
    progress: 40,
    taskIds: ['tr-5', 'tr-10', 'tr-11'],
  },
  {
    id: 'proj-tr-3',
    clientId: 'the-refuge',
    strategyId: 'strat-tr-1',
    pillarId: 'pillar-tr-2',
    name: 'Monthly Social Media — April 2026',
    description: 'First full month of ongoing social media management for The Refuge.',
    status: 'planning',
    startDate: '2026-03-25',
    endDate: '2026-04-30',
    progress: 5,
    workflowTemplateId: 'wt-3',
    taskIds: ['tr-apr-1', 'tr-2', 'tr-9'],
  },
  {
    id: 'proj-tr-4',
    clientId: 'the-refuge',
    strategyId: 'strat-tr-1',
    pillarId: 'pillar-tr-2',
    name: 'New Client Onboarding',
    description: 'Full onboarding process for The Refuge including brand audit, access setup, and kickoff.',
    status: 'complete',
    startDate: '2026-02-10',
    endDate: '2026-02-24',
    progress: 100,
    workflowTemplateId: 'wt-4',
    taskIds: ['tr-5', 'tr-6', 'tr-7'],
  },
];

export const STRATEGIES: Strategy[] = [
  {
    id: 'strat-hd-1',
    clientId: 'happy-days',
    name: 'Q2 2026 Growth Strategy',
    quarter: 'Q2 2026',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    status: 'active',
    pillars: [
      {
        id: 'pillar-hd-1',
        name: 'Brand Awareness',
        description: 'Grow social following and increase local visibility in Farmingdale and surrounding areas.',
        projectIds: ['proj-hd-2'],
        kpis: [
          { id: 'kpi-hd-1', name: 'Social Followers', target: 5000, current: 3200, unit: 'followers' },
          { id: 'kpi-hd-2', name: 'Monthly Impressions', target: 100000, current: 65000, unit: 'impressions' },
        ],
      },
      {
        id: 'pillar-hd-2',
        name: 'Revenue Growth',
        description: 'Drive dispensary foot traffic and convert paid ad spend into measurable store visits.',
        projectIds: ['proj-hd-1'],
        kpis: [
          { id: 'kpi-hd-3', name: 'Ad ROAS', target: 4.0, current: 3.2, unit: 'x' },
          { id: 'kpi-hd-4', name: 'Monthly Store Visits from Ads', target: 500, current: 320, unit: 'visits' },
        ],
      },
      {
        id: 'pillar-hd-3',
        name: 'Digital Presence',
        description: 'Redesign website and improve SEO to capture organic search traffic.',
        projectIds: ['proj-hd-3'],
        kpis: [
          { id: 'kpi-hd-5', name: 'Website Traffic', target: 8000, current: 5500, unit: '/mo' },
          { id: 'kpi-hd-6', name: 'Bounce Rate', target: 35, current: 48, unit: '%' },
        ],
      },
    ],
  },
  {
    id: 'strat-kp-1',
    clientId: 'k-pacho',
    name: 'Q2 2026 Engagement Strategy',
    quarter: 'Q2 2026',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    status: 'planning',
    pillars: [
      {
        id: 'pillar-kp-1',
        name: 'Community Engagement',
        description: 'Build a loyal local community through events, social engagement, and Cinco de Mayo activation.',
        projectIds: ['proj-kp-1', 'proj-kp-2'],
        kpis: [
          { id: 'kpi-kp-1', name: 'Event RSVPs', target: 200, current: 0, unit: 'RSVPs' },
          { id: 'kpi-kp-2', name: 'Engagement Rate', target: 5, current: 3.1, unit: '%' },
        ],
      },
      {
        id: 'pillar-kp-2',
        name: 'Reputation Management',
        description: 'Improve Google rating and build a steady stream of positive reviews.',
        projectIds: ['proj-kp-3'],
        kpis: [
          { id: 'kpi-kp-3', name: 'Google Rating', target: 4.7, current: 4.4, unit: '★' },
          { id: 'kpi-kp-4', name: 'Monthly Reviews', target: 20, current: 12, unit: 'reviews' },
        ],
      },
    ],
  },
  {
    id: 'strat-tr-1',
    clientId: 'the-refuge',
    name: 'Q2 2026 Launch Strategy',
    quarter: 'Q2 2026',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    status: 'active',
    pillars: [
      {
        id: 'pillar-tr-1',
        name: 'Grand Opening Push',
        description: 'Maximize launch visibility and establish The Refuge as the premier dining destination in Melville.',
        projectIds: ['proj-tr-1', 'proj-tr-2'],
        kpis: [
          { id: 'kpi-tr-1', name: 'Opening Week Covers', target: 800, current: 0, unit: 'covers' },
          { id: 'kpi-tr-2', name: 'Press Mentions', target: 5, current: 2, unit: 'mentions' },
        ],
      },
      {
        id: 'pillar-tr-2',
        name: 'Ongoing Marketing Foundation',
        description: 'Establish recurring monthly marketing to build long-term awareness and lead flow.',
        projectIds: ['proj-tr-3', 'proj-tr-4'],
        kpis: [
          { id: 'kpi-tr-3', name: 'Social Following', target: 3000, current: 1200, unit: 'followers' },
          { id: 'kpi-tr-4', name: 'Monthly Ad Leads', target: 150, current: 45, unit: 'leads' },
        ],
      },
    ],
  },
];
