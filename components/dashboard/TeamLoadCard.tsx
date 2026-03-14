'use client';

import { useState } from 'react';
import { AlertCircle, Users } from 'lucide-react';
import type { TeamMember, Task } from '@/lib/data';

interface TeamLoadCardProps {
  teamMembers: TeamMember[];
  tasks: Task[];
}

export default function TeamLoadCard({ teamMembers, tasks }: TeamLoadCardProps) {
  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, memberId: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverPos({
      x: rect.right + 10,
      y: rect.top,
    });
    setHoveredMemberId(memberId);
  };

  return (
    <>
      <div
        className="rounded-lg p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <Users size={15} style={{ color: 'var(--color-primary)' }} />
            Team Load
          </h2>
        </div>
        <div className="space-y-4">
          {teamMembers.map(member => {
            const memberTasks = tasks.filter(
              t => t.assigneeId === member.id && t.status !== 'done' && !t.isMilestone
            );
            const urgent = memberTasks.filter(t => t.priority === 'Urgent').length;
            const maxTasks = 10;
            const pct = Math.min(100, (memberTasks.length / maxTasks) * 100);
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 relative"
                onMouseEnter={(e) => handleMouseEnter(e, member.id)}
                onMouseLeave={() => setHoveredMemberId(null)}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-pointer"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{member.name.split(' ')[0]}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{memberTasks.length} tasks</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-donut-track)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: 'var(--color-primary)' }}
                    />
                  </div>
                  {urgent > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs mt-0.5" style={{ color: '#DC2626' }}>
                      <AlertCircle size={10} /> {urgent} urgent
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popover */}
      {hoveredMemberId && (
        <div
          style={{
            position: 'fixed',
            left: `${popoverPos.x}px`,
            top: `${popoverPos.y}px`,
            zIndex: 50,
            backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)',
            minWidth: '280px',
            maxWidth: '400px',
            maxHeight: '400px',
            overflow: 'auto',
          }}
        >
          {(() => {
            const member = teamMembers.find(m => m.id === hoveredMemberId);
            if (!member) return null;
            const memberTasks = tasks.filter(
              t => t.assigneeId === member.id && t.status !== 'done' && !t.isMilestone
            );
            return (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{member.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{memberTasks.length} active tasks</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {memberTasks.slice(0, 10).map(task => (
                    <div key={task.id} className="text-xs p-2 rounded" style={{ backgroundColor: 'var(--color-bg-page)' }}>
                      <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{task.title}</div>
                      <div style={{ color: 'var(--color-text-muted)' }} className="mt-0.5">
                        Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                  {memberTasks.length > 10 && (
                    <div className="text-xs text-center py-2" style={{ color: 'var(--color-text-muted)' }}>
                      +{memberTasks.length - 10} more tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
