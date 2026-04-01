'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { Project, Client } from '@/lib/data';
import CampaignCalendarCard from './CampaignCalendarCard';

interface CampaignCalendarProps {
  projects: Project[];
  clients: Client[];
  onSelectProject: (p: Project) => void;
}

type CalendarMode = 'week' | 'month';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // make Mon the first day
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDate(str: string): Date {
  // Parse YYYY-MM-DD as local date
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function formatDayHeader(date: Date): { abbr: string; num: string } {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    abbr: days[date.getDay()],
    num: String(date.getDate()),
  };
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getMonthGrid(date: Date): Date[][] {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const weekStart = startOfWeek(firstOfMonth);
  const weeks: Date[][] = [];
  let cursor = new Date(weekStart);
  // Generate until we've covered the full month (up to 6 weeks)
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
    // Stop if the next week starts after the month
    if (cursor.getMonth() !== date.getMonth() && cursor.getDate() > 1) break;
  }
  return weeks;
}

// ─── Card placement logic ─────────────────────────────────────────────────────

interface PlacedCard {
  project: Project;
  client: Client | undefined;
  daySpan: number;
  startOffset: number;
  isClippedLeft: boolean;
  isClippedRight: boolean;
  row: number;
}

function placeCards(projects: Project[], days: Date[], clients: Client[]): PlacedCard[][] {
  // Returns rows — each entry is an array of PlacedCard for that row
  const rowTracker: Array<Array<{ start: number; end: number }>> = [];

  const placed: PlacedCard[] = [];

  const dayStrings = days.map(d => toDateOnly(d));

  for (const project of projects) {
    if (!project.startDate || !project.endDate) continue;

    const projStart = parseDate(project.startDate);
    const projEnd = parseDate(project.endDate);

    // Find overlap with visible days
    const firstVisibleDay = days[0];
    const lastVisibleDay = days[days.length - 1];

    if (projEnd < firstVisibleDay || projStart > lastVisibleDay) continue;

    const isClippedLeft = projStart < firstVisibleDay;
    const isClippedRight = projEnd > lastVisibleDay;

    const effectiveStart = isClippedLeft ? firstVisibleDay : projStart;
    const effectiveEnd = isClippedRight ? lastVisibleDay : projEnd;

    const startStr = toDateOnly(effectiveStart);
    const endStr = toDateOnly(effectiveEnd);

    const startOffset = dayStrings.indexOf(startStr);
    if (startOffset < 0) continue;

    let endOffset = dayStrings.indexOf(endStr);
    if (endOffset < 0) endOffset = days.length - 1;

    const daySpan = endOffset - startOffset + 1;

    // Find a row where this card fits
    let row = 0;
    while (true) {
      if (!rowTracker[row]) {
        rowTracker[row] = [];
      }
      const conflict = rowTracker[row].some(
        seg => !(endOffset < seg.start || startOffset > seg.end)
      );
      if (!conflict) {
        rowTracker[row].push({ start: startOffset, end: endOffset });
        break;
      }
      row++;
    }

    placed.push({
      project,
      client: clients.find(c => c.id === project.clientId),
      daySpan,
      startOffset,
      isClippedLeft,
      isClippedRight,
      row,
    });
  }

  // Group by row for rendering
  const maxRow = placed.reduce((m, c) => Math.max(m, c.row), -1);
  const rows: PlacedCard[][] = Array.from({ length: maxRow + 1 }, () => []);
  for (const card of placed) {
    rows[card.row].push(card);
  }
  return rows;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CampaignCalendar({
  projects,
  clients,
  onSelectProject,
}: CampaignCalendarProps) {
  const [mode, setMode] = useState<CalendarMode>('week');
  const [anchor, setAnchor] = useState<Date>(() => startOfWeek(new Date()));
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnWidth, setColumnWidth] = useState(120);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Derive the list of days for the current view
  const days = useMemo<Date[]>(() => {
    if (mode === 'week') {
      return Array.from({ length: 7 }, (_, i) => addDays(anchor, i));
    } else {
      const weeks = getMonthGrid(anchor);
      return weeks.flat();
    }
  }, [mode, anchor]);

  // Measure container width to compute column width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const available = el.offsetWidth - 64; // minus label column
      setColumnWidth(Math.max(60, Math.floor(available / (mode === 'week' ? 7 : 7))));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);

  const navigate = (dir: -1 | 1) => {
    if (mode === 'week') {
      setAnchor(d => addDays(d, dir * 7));
    } else {
      setAnchor(d => {
        const next = new Date(d);
        next.setMonth(next.getMonth() + dir);
        next.setDate(1);
        return next;
      });
    }
  };

  const goToday = () => {
    if (mode === 'week') {
      setAnchor(startOfWeek(new Date()));
    } else {
      const now = new Date();
      setAnchor(new Date(now.getFullYear(), now.getMonth(), 1));
    }
  };

  const headerLabel = mode === 'week'
    ? `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : formatMonthYear(anchor);

  // ─── Week view rendering ────────────────────────────────────────────────────

  const weekCardRows = useMemo(() => {
    if (mode !== 'week') return [];
    return placeCards(projects, days, clients);
  }, [mode, projects, days, clients]);

  // ─── Month view: grid of weeks ──────────────────────────────────────────────
  const monthWeeks = useMemo(() => {
    if (mode !== 'month') return [];
    const weeks = getMonthGrid(anchor);
    return weeks.map(week => ({
      days: week,
      rows: placeCards(projects, week, clients),
    }));
  }, [mode, anchor, projects, clients]);

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    borderRadius: '6px',
    border: `1px solid ${active ? '#6366F1' : '#E5E7EB'}`,
    backgroundColor: active ? '#EEF2FF' : '#FFFFFF',
    color: active ? '#6366F1' : '#6B7280',
    fontSize: '12px',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  const navBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    color: '#6B7280',
  };

  const headerCellStyle = (date: Date): React.CSSProperties => ({
    width: `${columnWidth}px`,
    minWidth: `${columnWidth}px`,
    padding: '8px 4px',
    textAlign: 'center',
    borderLeft: '1px solid #E5E7EB',
    backgroundColor: isSameDay(date, today)
      ? '#EEF2FF'
      : isWeekend(date)
      ? '#FAFAFA'
      : '#F9FAFB',
    flexShrink: 0,
  });

  const colCellBg = (date: Date): string => {
    if (isSameDay(date, today)) return '#F5F3FF';
    if (isWeekend(date)) return '#FAFAFA';
    return '#FFFFFF';
  };

  const totalGridWidth = columnWidth * 7;

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* ── Calendar Toolbar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 0 8px',
        flexWrap: 'wrap',
      }}>
        {/* Nav arrows */}
        <button style={navBtnStyle} onClick={() => navigate(-1)}>
          <ChevronLeft size={14} />
        </button>
        <button style={navBtnStyle} onClick={() => navigate(1)}>
          <ChevronRight size={14} />
        </button>

        {/* Date label */}
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', minWidth: '200px' }}>
          {headerLabel}
        </span>

        {/* Today */}
        <button
          onClick={goToday}
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            color: '#6B7280',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Today
        </button>

        <div style={{ flex: 1 }} />

        {/* Week / Month toggle */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={btnStyle(mode === 'week')} onClick={() => { setMode('week'); setAnchor(startOfWeek(new Date())); }}>
            Week
          </button>
          <button style={btnStyle(mode === 'month')} onClick={() => { setMode('month'); const n = new Date(); setAnchor(new Date(n.getFullYear(), n.getMonth(), 1)); }}>
            Month
          </button>
        </div>
      </div>

      {/* ── Calendar Grid ── */}
      <div style={{
        flex: 1,
        overflowX: 'auto',
        overflowY: 'auto',
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {mode === 'week' ? (
          <WeekGrid
            days={days}
            today={today}
            columnWidth={columnWidth}
            totalGridWidth={totalGridWidth}
            cardRows={weekCardRows}
            headerCellStyle={headerCellStyle}
            colCellBg={colCellBg}
            onSelectProject={onSelectProject}
          />
        ) : (
          <MonthGrid
            monthWeeks={monthWeeks}
            today={today}
            anchor={anchor}
            columnWidth={columnWidth}
            totalGridWidth={totalGridWidth}
            headerCellStyle={headerCellStyle}
            colCellBg={colCellBg}
            onSelectProject={onSelectProject}
          />
        )}
      </div>
    </div>
  );
}

// ─── Week Grid ────────────────────────────────────────────────────────────────

interface WeekGridProps {
  days: Date[];
  today: Date;
  columnWidth: number;
  totalGridWidth: number;
  cardRows: PlacedCard[][];
  headerCellStyle: (d: Date) => React.CSSProperties;
  colCellBg: (d: Date) => string;
  onSelectProject: (p: Project) => void;
}

function WeekGrid({ days, today, columnWidth, totalGridWidth, cardRows, headerCellStyle, colCellBg, onSelectProject }: WeekGridProps) {
  const rowHeight = 42; // px per card row
  const minBodyHeight = 120;
  const bodyHeight = Math.max(minBodyHeight, cardRows.length * rowHeight + 16);

  return (
    <div style={{ minWidth: `${totalGridWidth + 0}px` }}>
      {/* Header row */}
      <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#F9FAFB' }}>
        {days.map((day, i) => {
          const { abbr, num } = formatDayHeader(day);
          const isToday = isSameDay(day, today);
          return (
            <div key={i} style={headerCellStyle(day)}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: isToday ? '#6366F1' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {abbr}
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 700,
                color: isToday ? '#4F46E5' : '#374151',
                lineHeight: '1.2',
              }}>
                {isToday ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    fontSize: '16px',
                  }}>{num}</span>
                ) : num}
              </div>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div style={{ position: 'relative', display: 'flex', height: `${bodyHeight}px` }}>
        {/* Column backgrounds */}
        {days.map((day, i) => (
          <div key={i} style={{
            width: `${columnWidth}px`,
            minWidth: `${columnWidth}px`,
            flexShrink: 0,
            height: '100%',
            backgroundColor: colCellBg(day),
            borderLeft: i > 0 ? '1px solid #E5E7EB' : 'none',
          }} />
        ))}

        {/* Campaign cards — absolutely positioned over the columns */}
        <div style={{ position: 'absolute', inset: 0, padding: '8px 0' }}>
          {cardRows.length === 0 ? (
            <EmptyState />
          ) : (
            cardRows.map((row, rowIdx) => (
              <div key={rowIdx} style={{ position: 'relative', height: `${rowHeight}px`, marginBottom: '2px' }}>
                {row.map(card => (
                  <CampaignCalendarCard
                    key={card.project.id}
                    project={card.project}
                    client={card.client}
                    daySpan={card.daySpan}
                    startOffset={card.startOffset}
                    isClippedLeft={card.isClippedLeft}
                    isClippedRight={card.isClippedRight}
                    columnWidth={columnWidth}
                    onClick={() => onSelectProject(card.project)}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Month Grid ───────────────────────────────────────────────────────────────

interface MonthWeek {
  days: Date[];
  rows: PlacedCard[][];
}

interface MonthGridProps {
  monthWeeks: MonthWeek[];
  today: Date;
  anchor: Date;
  columnWidth: number;
  totalGridWidth: number;
  headerCellStyle: (d: Date) => React.CSSProperties;
  colCellBg: (d: Date) => string;
  onSelectProject: (p: Project) => void;
}

function MonthGrid({ monthWeeks, today, anchor, columnWidth, totalGridWidth, headerCellStyle, colCellBg, onSelectProject }: MonthGridProps) {
  const DAY_ABBRS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div style={{ minWidth: `${totalGridWidth}px` }}>
      {/* Fixed day-of-week header */}
      <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#F9FAFB' }}>
        {DAY_ABBRS.map((abbr, i) => (
          <div key={i} style={{
            width: `${columnWidth}px`,
            minWidth: `${columnWidth}px`,
            flexShrink: 0,
            padding: '8px 4px',
            textAlign: 'center',
            borderLeft: i > 0 ? '1px solid #E5E7EB' : 'none',
            backgroundColor: (i >= 5) ? '#FAFAFA' : '#F9FAFB',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {abbr}
            </span>
          </div>
        ))}
      </div>

      {/* Week rows */}
      {monthWeeks.map((week, wIdx) => {
        const rowHeight = 42;
        const minWeekHeight = 80;
        const weekHeight = Math.max(minWeekHeight, week.rows.length * rowHeight + 40);

        return (
          <div key={wIdx} style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', position: 'relative', height: `${weekHeight}px` }}>
            {/* Day cells */}
            {week.days.map((day, dIdx) => {
              const isCurrentMonth = day.getMonth() === anchor.getMonth();
              const isToday = isSameDay(day, today);
              return (
                <div key={dIdx} style={{
                  width: `${columnWidth}px`,
                  minWidth: `${columnWidth}px`,
                  flexShrink: 0,
                  height: '100%',
                  backgroundColor: colCellBg(day),
                  borderLeft: dIdx > 0 ? '1px solid #E5E7EB' : 'none',
                  padding: '4px',
                  boxSizing: 'border-box',
                  opacity: isCurrentMonth ? 1 : 0.45,
                }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: isToday ? '#4F46E5' : 'transparent',
                    color: isToday ? '#FFFFFF' : '#374151',
                    fontSize: '12px',
                    fontWeight: isToday ? 700 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {day.getDate()}
                  </div>
                </div>
              );
            })}

            {/* Campaign cards overlay */}
            <div style={{ position: 'absolute', top: '28px', left: 0, right: 0, bottom: '4px' }}>
              {week.rows.map((row, rowIdx) => (
                <div key={rowIdx} style={{ position: 'relative', height: `${rowHeight}px`, marginBottom: '2px' }}>
                  {row.map(card => (
                    <CampaignCalendarCard
                      key={card.project.id}
                      project={card.project}
                      client={card.client}
                      daySpan={card.daySpan}
                      startOffset={card.startOffset}
                      isClippedLeft={card.isClippedLeft}
                      isClippedRight={card.isClippedRight}
                      columnWidth={columnWidth}
                      onClick={() => onSelectProject(card.project)}
                    />
                  ))}
                </div>
              ))}
              {week.rows.length === 0 && wIdx === 0 && (
                <EmptyState />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      gap: '12px',
    }}>
      <Calendar size={36} color="#D1D5DB" />
      <p style={{ fontSize: '14px', fontWeight: 500, color: '#9CA3AF', margin: 0, textAlign: 'center' }}>
        No campaigns scheduled this period
      </p>
      <p style={{ fontSize: '12px', color: '#D1D5DB', margin: 0, textAlign: 'center' }}>
        Navigate to a different date range or create a new campaign
      </p>
    </div>
  );
}
