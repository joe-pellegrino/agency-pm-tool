'use client';

import { useState, useRef, useEffect } from 'react';
import type { CampaignStatus } from '@/lib/data';

const STATUS_CONFIG: Record<CampaignStatus, { label: string; bg: string; text: string; dot: string }> = {
  draft:     { label: 'Draft',     bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
  scheduled: { label: 'Scheduled', bg: '#EFF6FF', text: '#3B82F6', dot: '#3B82F6' },
  active:    { label: 'Active',    bg: '#ECFDF5', text: '#059669', dot: '#10B981' },
  paused:    { label: 'Paused',    bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' },
  completed: { label: 'Completed', bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6' },
  archived:  { label: 'Archived',  bg: '#F9FAFB', text: '#9CA3AF', dot: '#D1D5DB' },
};

const ALL_STATUSES: CampaignStatus[] = ['draft', 'scheduled', 'active', 'paused', 'completed', 'archived'];

interface StatusCellProps {
  status: CampaignStatus;
  onChange: (status: CampaignStatus) => void;
  readOnly?: boolean;
}

export default function StatusCell({ status, onChange, readOnly = false }: StatusCellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (s: CampaignStatus) => {
    onChange(s);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => !readOnly && setOpen(!open)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: cfg.bg,
          color: cfg.text,
          border: 'none',
          cursor: readOnly ? 'default' : 'pointer',
          whiteSpace: 'nowrap',
          transition: 'opacity 0.1s',
        }}
        onMouseEnter={e => { if (!readOnly) (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
      >
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: cfg.dot,
          flexShrink: 0,
        }} />
        {cfg.label}
        {!readOnly && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: '2px' }}>
            <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke={cfg.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          zIndex: 50,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          minWidth: '140px',
          overflow: 'hidden',
        }}>
          {ALL_STATUSES.map(s => {
            const c = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  backgroundColor: s === status ? '#F9FAFB' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                  color: '#111827',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={e => { if (s !== status) (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'; }}
                onMouseLeave={e => { if (s !== status) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: c.bg,
                  color: c.text,
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: c.dot }} />
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { STATUS_CONFIG };
