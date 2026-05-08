import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Layers,
  LayoutDashboard,
  MessageSquare,
  PanelLeftClose,
  Sparkles,
  ShieldAlert,
  Target,
  Users,
} from 'lucide-react'

type MetricTone = 'blue' | 'amber' | 'violet' | 'red'
type ChipTone = 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'violet'
type NeedTone = 'amber' | 'red' | 'blue' | 'violet'

type SparklineProps = {
  values: number[]
  color: string
  muted?: string
}

const sidebarItems = [
  { label: 'Overview', icon: LayoutDashboard, active: true, count: '12' },
  { label: 'Projects', icon: Layers, active: false, count: '28' },
  { label: 'Risks', icon: CircleAlert, active: false, count: '5' },
  { label: 'Decisions', icon: Target, active: false, count: '7' },
  { label: 'Team Load', icon: Users, active: false, count: '68%' },
  { label: 'Client Pulse', icon: Activity, active: false, count: '3 alerts' },
]

const metrics: Array<{
  label: string
  value: string
  delta: string
  tone: MetricTone
  icon: typeof LayoutDashboard
  points: number[]
}> = [
  { label: 'Projects in flight', value: '18', delta: '+12.5% vs last 7 days', tone: 'blue', icon: Layers, points: [8, 12, 10, 16, 14, 19, 18] },
  { label: 'At risk', value: '5', delta: '+1.4% pressure week over week', tone: 'amber', icon: ShieldAlert, points: [4, 5, 5, 6, 5, 4, 5] },
  { label: 'Decisions needed', value: '7', delta: '-2.1% from last review cycle', tone: 'violet', icon: Target, points: [9, 8, 7, 8, 6, 7, 7] },
  { label: 'Client escalations', value: '2', delta: '+0.3% active escalation threads', tone: 'red', icon: Bell, points: [1, 2, 1, 3, 2, 2, 2] },
]

const portfolioRows = [
  {
    project: 'Northstar rebrand',
    clientType: 'Consumer',
    owner: 'Mara Ellison',
    status: 'On track',
    tone: 'green' as ChipTone,
    milestone: 'Creative review · May 9',
    accent: 'from-cyan-400 to-blue-500',
  },
  {
    project: 'Summit paid media sprint',
    clientType: 'B2B SaaS',
    owner: 'Devon Ilyas',
    status: 'Needs decision',
    tone: 'amber' as ChipTone,
    milestone: 'Audience approval · May 8',
    accent: 'from-violet-400 to-indigo-500',
  },
  {
    project: 'Ridgeway site refresh',
    clientType: 'Healthcare',
    owner: 'Priya Sethi',
    status: 'At risk',
    tone: 'red' as ChipTone,
    milestone: 'Content intake · May 7',
    accent: 'from-rose-400 to-red-500',
  },
  {
    project: 'Harbor podcast launch',
    clientType: 'Media',
    owner: 'Ellis Navarro',
    status: 'In review',
    tone: 'blue' as ChipTone,
    milestone: 'Final QA · May 10',
    accent: 'from-emerald-400 to-teal-500',
  },
]

const neededItems = [
  {
    title: 'Approve revised scope',
    project: 'Summit campaign · +12% budget shift',
    due: 'Needed today',
    tone: 'amber' as NeedTone,
    icon: ClipboardList,
  },
  {
    title: 'Escalation response direction',
    project: 'Ridgeway milestone slip · client call pending',
    due: 'High priority',
    tone: 'red' as NeedTone,
    icon: ShieldAlert,
  },
  {
    title: 'Choose launch date',
    project: 'Harbor podcast · two viable windows remain',
    due: 'Decision window',
    tone: 'blue' as NeedTone,
    icon: CalendarDays,
  },
  {
    title: 'Finalize staffing tradeoff',
    project: 'One strategist needed next week · three projects affected',
    due: 'Resource check',
    tone: 'violet' as NeedTone,
    icon: Users,
  },
]

const pulseCards = [
  {
    label: 'Team Load',
    value: '68%',
    caption: '5 people above the 85% threshold',
    tone: 'blue' as ChipTone,
    points: [54, 58, 60, 64, 67, 66, 68],
  },
  {
    label: 'Client Sentiment',
    value: '72%',
    caption: 'Positive in the last 30 days',
    tone: 'green' as ChipTone,
    points: [62, 63, 68, 70, 69, 71, 72],
  },
  {
    label: 'SLA Risk',
    value: '3',
    caption: 'Items trending past the alert threshold',
    tone: 'amber' as ChipTone,
    points: [2, 2, 3, 3, 4, 3, 3],
  },
]

function toneClasses(tone: MetricTone | ChipTone | NeedTone) {
  switch (tone) {
    case 'green':
      return {
        bg: 'bg-emerald-500/12',
        ring: 'ring-emerald-400/20',
        text: 'text-emerald-200',
        dot: 'bg-emerald-400',
        accent: 'from-emerald-400 to-teal-400',
      }
    case 'amber':
      return {
        bg: 'bg-amber-500/12',
        ring: 'ring-amber-400/20',
        text: 'text-amber-200',
        dot: 'bg-amber-400',
        accent: 'from-amber-300 to-orange-400',
      }
    case 'red':
      return {
        bg: 'bg-rose-500/12',
        ring: 'ring-rose-400/20',
        text: 'text-rose-200',
        dot: 'bg-rose-400',
        accent: 'from-rose-400 to-red-500',
      }
    case 'violet':
      return {
        bg: 'bg-violet-500/12',
        ring: 'ring-violet-400/20',
        text: 'text-violet-200',
        dot: 'bg-violet-400',
        accent: 'from-violet-400 to-indigo-500',
      }
    default:
      return {
        bg: 'bg-slate-500/12',
        ring: 'ring-slate-400/20',
        text: 'text-slate-200',
        dot: 'bg-slate-400',
        accent: 'from-slate-400 to-slate-500',
      }
  }
}

function makeSparkPath(values: number[]) {
  const width = 120
  const height = 36
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)

  return values
    .map((value, index) => {
      const x = index * step
      const y = height - ((value - min) / range) * (height - 4) - 2
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

function Sparkline({ values, color, muted = 'rgba(148,163,184,0.26)' }: SparklineProps) {
  const path = makeSparkPath(values)
  const fill = `${path} L 120 36 L 0 36 Z`

  return (
    <svg viewBox="0 0 120 36" className="h-9 w-[120px] shrink-0">
      <path d={fill} fill={muted} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RingChart({ value, tone }: { value: string; tone: ChipTone | MetricTone | NeedTone }) {
  const palette = toneClasses(tone)
  return (
    <div className={`relative grid h-16 w-16 place-items-center rounded-full border border-white/10 ${palette.bg}`}>
      <div className={`absolute inset-2 rounded-full border border-white/10 bg-slate-950/50 ${palette.ring}`} />
      <div className="relative z-10 text-center">
        <div className={`text-sm font-semibold ${palette.text}`}>{value}</div>
      </div>
    </div>
  )
}

function Chip({ tone, children }: { tone: ChipTone; children: React.ReactNode }) {
  const palette = toneClasses(tone)
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold ${palette.bg} ${palette.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
      {children}
    </span>
  )
}

function SidebarItem({ label, icon: Icon, active, count }: {
  label: string
  icon: typeof LayoutDashboard
  active?: boolean
  count: string
}) {
  return (
    <button
      type="button"
      className={`group relative flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-transform duration-200 active:scale-[0.985] ${
        active
          ? 'border-cyan-400/25 bg-cyan-400/10 text-white shadow-[0_12px_30px_rgba(10,27,47,0.35)]'
          : 'border-transparent bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.06]'
      }`}
    >
      {active ? <span className="absolute left-0 top-2 h-[calc(100%-1rem)] w-1 rounded-r-full bg-cyan-400" /> : null}
      <span className="flex items-center gap-3">
        <span className={`grid h-8 w-8 place-items-center rounded-xl ${active ? 'bg-white/10' : 'bg-white/[0.04]'}`}>
          <Icon size={16} strokeWidth={1.8} />
        </span>
        <span className="text-[14px] font-medium">{label}</span>
      </span>
      <span className={`text-[11px] font-semibold ${active ? 'text-cyan-100' : 'text-slate-400'}`}>{count}</span>
    </button>
  )
}

function MetricCard({ label, value, delta, tone, icon: Icon, points }: {
  label: string
  value: string
  delta: string
  tone: MetricTone
  icon: typeof LayoutDashboard
  points: number[]
}) {
  const palette = toneClasses(tone)
  return (
    <article className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_45px_rgba(5,11,24,0.35)] backdrop-blur-xl">
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            <span className={`grid h-9 w-9 place-items-center rounded-2xl border border-white/10 ${palette.bg}`}>
              <Icon size={18} strokeWidth={1.8} className={palette.text} />
            </span>
            <span>{label}</span>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-[34px] font-semibold leading-none text-white tabular-nums">{value}</div>
            <div className={`rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold ${palette.bg} ${palette.text}`}>
              {tone === 'red' ? '+2.4%' : '+1.1%'}
            </div>
          </div>
          <div className="mt-3 text-sm text-slate-400">{delta}</div>
        </div>
        <div className="pt-1">
          <Sparkline values={points} color={tone === 'red' ? '#fb7185' : tone === 'amber' ? '#fbbf24' : tone === 'violet' ? '#a78bfa' : '#38bdf8'} />
        </div>
      </div>
    </article>
  )
}

function StatusPill({ tone, children }: { tone: ChipTone; children: React.ReactNode }) {
  const palette = toneClasses(tone)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold ${palette.bg} ${palette.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
      {children}
    </span>
  )
}

function NeedCard({ title, project, due, tone, icon: Icon }: {
  title: string
  project: string
  due: string
  tone: NeedTone
  icon: typeof ClipboardList
}) {
  const palette = toneClasses(tone)
  return (
    <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_12px_30px_rgba(5,11,24,0.28)]">
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 ${palette.bg}`}>
          <Icon size={18} strokeWidth={1.8} className={palette.text} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15px] font-medium text-white">{title}</h3>
            <StatusPill tone={tone === 'violet' ? 'violet' : tone === 'red' ? 'red' : 'amber'}>{due}</StatusPill>
          </div>
          <p className="mt-2 text-[13px] leading-6 text-slate-400">{project}</p>
        </div>
      </div>
    </article>
  )
}

function PulseCard({ label, value, caption, tone, points }: {
  label: string
  value: string
  caption: string
  tone: ChipTone
  points: number[]
}) {
  const palette = toneClasses(tone)
  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_35px_rgba(5,11,24,0.28)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</div>
          <div className={`mt-2 text-[28px] font-semibold leading-none tabular-nums ${palette.text}`}>{value}</div>
          <div className="mt-2 text-[13px] leading-6 text-slate-400">{caption}</div>
        </div>
        <RingChart value={value} tone={tone} />
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-2.5">
        <Sparkline values={points} color={tone === 'green' ? '#34d399' : tone === 'amber' ? '#fbbf24' : '#38bdf8'} />
      </div>
    </article>
  )
}

function Avatar({ initials, tone = 'blue' }: { initials: string; tone?: ChipTone | 'violet' }) {
  const palette = toneClasses(tone)
  return (
    <div className={`grid h-11 w-11 place-items-center rounded-full border border-white/10 ${palette.bg} text-[13px] font-semibold text-white`}>
      <span className="relative z-10">{initials}</span>
    </div>
  )
}

function ProjectIcon({ accent }: { accent: string }) {
  return <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${accent} shadow-[0_10px_24px_rgba(0,0,0,0.22)]`} />
}

export default function LeadershipOverviewPage() {
  return (
    <div
      className="relative min-h-[100dvh] w-full overflow-hidden text-slate-100"
      style={{
        background: 'linear-gradient(180deg, #07111f 0%, #08101b 100%)',
      }}
    >
      <div className="pointer-events-none fixed inset-0 bg-[#08101b]" aria-hidden="true" />
      <div className="relative z-10 flex min-h-[100dvh] w-full gap-4 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <aside className="sticky top-4 hidden w-[242px] shrink-0 self-start rounded-[2rem] border border-white/10 bg-slate-950/55 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl xl:block">
          <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3">
            <div className="grid h-11 w-11 place-items-center rounded-[1.1rem] bg-[linear-gradient(135deg,#5ea0ff_0%,#7c3aed_55%,#22d3ee_100%)] shadow-[0_12px_30px_rgba(94,160,255,0.24)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white">Au</span>
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-white">Aurora</div>
              <div className="text-[12px] text-slate-400">Agency command center</div>
            </div>
          </div>

          <nav className="mt-4 space-y-2">
            {sidebarItems.map((item) => (
              <SidebarItem key={item.label} {...item} />
            ))}
          </nav>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[28px] font-semibold text-cyan-200 tabular-nums">86%</div>
              <div className="mt-1 text-[12px] leading-5 text-slate-400">On-time delivery</div>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[28px] font-semibold text-amber-200 tabular-nums">4</div>
              <div className="mt-1 text-[12px] leading-5 text-slate-400">Open approvals</div>
            </div>
          </div>

          <div className="mt-4 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.12)]" />
              Leadership mode ready
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2.5 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <ChevronLeft size={16} strokeWidth={1.8} />
                Collapse
              </span>
              <PanelLeftClose size={16} strokeWidth={1.8} className="text-slate-400" />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-4 sm:space-y-5">
          <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] px-5 py-5 shadow-[0_20px_45px_rgba(5,11,24,0.32)] backdrop-blur-xl sm:px-6 sm:py-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.26em] text-cyan-200/90">
                  <Sparkles size={15} strokeWidth={1.8} />
                  Executive overview
                </div>
                <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] text-white sm:text-[36px]">Leadership Command Center</h1>
                <p className="mt-2 max-w-[60ch] text-[14px] leading-6 text-slate-400 sm:text-[15px]">Agency Portfolio Overview</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13px] font-medium text-slate-200 transition-transform duration-200 hover:bg-white/[0.06] active:scale-[0.985]"
                >
                  <CalendarDays size={15} strokeWidth={1.8} />
                  May 5 - May 11
                  <ChevronDown size={15} strokeWidth={1.8} className="text-slate-400" />
                </button>

                <button
                  type="button"
                  className="relative grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition-transform duration-200 hover:bg-white/[0.06] active:scale-[0.985]"
                  aria-label="Notifications"
                >
                  <Bell size={18} strokeWidth={1.8} />
                  <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border border-slate-950 bg-rose-400" />
                </button>

                <button
                  type="button"
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1.5 pr-4 text-left transition-transform duration-200 hover:bg-white/[0.06] active:scale-[0.985]"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[linear-gradient(135deg,#60a5fa_0%,#8b5cf6_55%,#22d3ee_100%)] text-[12px] font-semibold text-white shadow-[0_10px_24px_rgba(94,160,255,0.18)]">
                    AR
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-[13px] font-semibold text-white">Avery Reed</div>
                    <div className="text-[12px] text-slate-400">Leadership</div>
                  </div>
                </button>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_22px_50px_rgba(5,11,24,0.30)] backdrop-blur-xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    <Layers size={14} strokeWidth={1.8} className="text-cyan-200" />
                    Project portfolio
                  </div>
                  <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-white">Project Portfolio</h2>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-slate-200 transition-transform duration-200 hover:bg-white/[0.06] active:scale-[0.985]"
                >
                  View all projects
                  <ArrowUpRight size={14} strokeWidth={1.8} />
                </button>
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950/35">
                <div className="grid grid-cols-[1.6fr_.85fr_.9fr_.8fr_1fr] gap-4 border-b border-white/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  <div>Project</div>
                  <div>Client type</div>
                  <div>Owner</div>
                  <div>Status</div>
                  <div>Next milestone</div>
                </div>

                <div className="divide-y divide-white/10">
                  {portfolioRows.map((row, index) => (
                    <div key={row.project} className="grid grid-cols-[1.6fr_.85fr_.9fr_.8fr_1fr] gap-4 px-4 py-4 transition-colors duration-200 hover:bg-white/[0.03]">
                      <div className="flex items-center gap-3">
                        <ProjectIcon accent={row.accent} />
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-medium text-white">{row.project}</div>
                          <div className="mt-1 text-[12px] text-slate-400">Portfolio group {index + 1}</div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Chip tone="slate">{row.clientType}</Chip>
                      </div>

                      <div className="flex items-center gap-3">
                        <Avatar initials={row.owner.split(' ').map((part) => part[0]).join('').slice(0, 2)} tone={index % 2 === 0 ? 'blue' : 'violet'} />
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-medium text-white">{row.owner}</div>
                          <div className="text-[12px] text-slate-400">Owner</div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <StatusPill tone={row.tone}>{row.status}</StatusPill>
                      </div>

                      <div>
                        <div className="text-[14px] font-medium text-white">{row.milestone}</div>
                        <div className="mt-1 text-[12px] text-slate-400">Next checkpoint</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <aside className="space-y-4">
              <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_22px_50px_rgba(5,11,24,0.30)] backdrop-blur-xl sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      <CircleCheck size={14} strokeWidth={1.8} className="text-emerald-200" />
                      Where I’m needed
                    </div>
                    <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-white">Leadership requests</h2>
                  </div>
                  <button type="button" className="text-[12px] font-medium text-cyan-200 transition hover:text-cyan-100">
                    View all
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {neededItems.map((item) => (
                    <NeedCard key={item.title} {...item} />
                  ))}
                </div>
              </article>
            </aside>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_22px_50px_rgba(5,11,24,0.30)] backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    <MessageSquare size={14} strokeWidth={1.8} className="text-violet-200" />
                    Thread summary
                  </div>
                  <h2 className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-white">Leadership thread summary</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-cyan-200">
                  <Sparkles size={13} strokeWidth={1.8} />
                  AI assisted
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-200">Issue</div>
                  <p className="mt-3 text-[14px] leading-6 text-slate-200">
                    20-reply thread on campaign timing. One urgent client concern is still unresolved.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">Current state</div>
                  <p className="mt-3 text-[14px] leading-6 text-slate-200">
                    Strategy is agreed. Scope drift and a missing asset are holding final signoff.
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">Recommended action</div>
                  <p className="mt-3 text-[14px] leading-6 text-slate-200">
                    Approve the revised scope, assign the missing owner, and send a concise client update before EOD.
                  </p>
                </div>
              </div>
            </article>

            <div className="grid grid-cols-1 gap-4">
              {pulseCards.map((card) => (
                <PulseCard key={card.label} {...card} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
