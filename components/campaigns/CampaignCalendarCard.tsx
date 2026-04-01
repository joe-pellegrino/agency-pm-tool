'use client';

import type { Project, Client } from '@/lib/data';

interface CampaignCalendarCardProps {
  project: Project;
  client: Client | undefined;
  daySpan: number;
  startOffset: number;
  isClippedLeft: boolean;
  isClippedRight: boolean;
  columnWidth: number;
  onClick: () => void;
}

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; subText: string }> = {
  planning: {
    bg: '#EEF2FF',
    border: '#6366F1',
    text: '#3730A3',
    subText: '#6366F1',
  },
  active: {
    bg: '#ECFDF5',
    border: '#10B981',
    text: '#065F46',
    subText: '#059669',
  },
  complete: {
    bg: '#F3F4F6',
    border: '#9CA3AF',
    text: '#374151',
    subText: '#6B7280',
  },
  'on-hold': {
    bg: '#FFFBEB',
    border: '#F59E0B',
    text: '#78350F',
    subText: '#D97706',
  },
};

const STATUS_DOT: Record<string, string> = {
  planning: '#6366F1',
  active: '#10B981',
  complete: '#9CA3AF',
  'on-hold': '#F59E0B',
};

export default function CampaignCalendarCard({
  project,
  client,
  daySpan,
  startOffset,
  isClippedLeft,
  isClippedRight,
  columnWidth,
  onClick,
}: CampaignCalendarCardProps) {
  const style = STATUS_STYLES[project.status] ?? STATUS_STYLES.planning;
  const dotColor = STATUS_DOT[project.status] ?? '#6366F1';

  const leftOffset = startOffset * columnWidth;
  const width = daySpan * columnWidth - 4; // 4px gap

  const borderRadius = `${isClippedLeft ? 0 : 6}px ${isClippedRight ? 0 : 6}px ${isClippedRight ? 0 : 6}px ${isClippedLeft ? 0 : 6}px`;

  return (
    <div
      onClick={onClick}
      title={`${project.name}${client ? ` — ${client.name}` : ''}`}
      style={{
        position: 'absolute',
        left: `${leftOffset + 2}px`,
        width: `${Math.max(width, 20)}px`,
        height: '34px',
        backgroundColor: style.bg,
        borderLeft: isClippedLeft ? 'none' : `4px solid ${style.border}`,
        borderRight: isClippedRight ? `2px solid ${style.border}` : 'none',
        borderTop: `1px solid ${style.border}33`,
        borderBottom: `1px solid ${style.border}33`,
        borderRadius,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: isClippedLeft ? '8px' : '8px',
        paddingRight: '8px',
        gap: '5px',
        cursor: 'pointer',
        overflow: 'hidden',
        boxSizing: 'border-box',
        transition: 'box-shadow 0.15s ease, filter 0.15s ease',
        zIndex: 2,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
        (e.currentTarget as HTMLElement).style.filter = 'brightness(0.97)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.filter = 'none';
      }}
    >
      {/* Status dot */}
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: dotColor,
        flexShrink: 0,
      }} />

      {/* Text content */}
      <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: style.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '15px',
        }}>
          {project.name}
        </div>
        {client && daySpan > 1 && (
          <div style={{
            fontSize: '10px',
            fontWeight: 400,
            color: style.subText,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '13px',
          }}>
            {client.name}
          </div>
        )}
      </div>

      {/* Clipped right arrow indicator */}
      {isClippedRight && (
        <div style={{
          flexShrink: 0,
          fontSize: '10px',
          color: style.border,
          fontWeight: 700,
        }}>›</div>
      )}

      {/* Clipped left arrow indicator */}
      {isClippedLeft && (
        <div style={{
          position: 'absolute',
          left: '2px',
          fontSize: '10px',
          color: style.border,
          fontWeight: 700,
        }}>‹</div>
      )}
    </div>
  );
}
