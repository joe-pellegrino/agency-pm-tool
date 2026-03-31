'use client';

import { useState, useRef, useEffect } from 'react';

export type ProjectStatus = 'planning' | 'active' | 'complete' | 'on-hold';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; bg: string; text: string; dot: string }> = {
  planning:  { label: 'Planning',  bg: '#EFF6FF', text: '#3B82F6', dot: '#3B82F6' },
  active:    { label: 'Active',    bg: '#ECFDF5', text: '#059669', dot: '#10B981' },
  complete:  { label: 'Complete',  bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6' },
  'on-hold': { label: 'On Hold',   bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' },
};

const ALL_STATUSES: ProjectStatus[] = ['planning', 'active', 'complete', 'on-hold'];

interface StatusCellProps {
  status: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
  readOnly?: boolean;
}

export default function StatusCell({ status, onChange, readOnly = false }: StatusCellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.planning;

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

  const handleSelect = (s: ProjectStatus) => {
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
          bottom: 'calc(100% + 4px)',
          left: 0,
          zIndex: 50,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          minWidth: '140px',
          overflow: 'hidden',
          padding: '2px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
        }}>
          {ALL_STATUSES.map(s => {
            const c = STATUS_CONFIG[s];
            const baseColor = c.bg;
            const textColor = c.text;
            const hoverColor = s === status 
              ? baseColor 
              : `rgba(${parseInt(baseColor.slice(1, 3), 16)}, ${parseInt(baseColor.slice(3, 5), 16)}, ${parseInt(baseColor.slice(5, 7), 16)}, 0.7)`;
            
            return (
              <button
                key={s}
                onClick={() => handleSelect(s)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: '100%',
                  padding: '8px 12px',
                  border: s === status ? `1.5px solid ${textColor}` : 'none',
                  backgroundColor: baseColor,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: textColor,
                  transition: 'all 0.1s',
                  borderRadius: '4px',
                }}
                onMouseEnter={e => {
                  const btn = e.currentTarget as HTMLElement;
                  if (s !== status) {
                    btn.style.opacity = '0.8';
                    btn.style.transform = 'scale(0.98)';
                  }
                }}
                onMouseLeave={e => {
                  const btn = e.currentTarget as HTMLElement;
                  if (s !== status) {
                    btn.style.opacity = '1';
                    btn.style.transform = 'scale(1)';
                  }
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.dot, flexShrink: 0 }} />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { STATUS_CONFIG };
