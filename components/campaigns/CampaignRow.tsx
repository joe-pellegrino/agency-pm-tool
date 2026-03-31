'use client';

import { useState } from 'react';
import type { Project, Client } from '@/lib/data';
import { updateProject } from '@/lib/actions';
import StatusCell, { type ProjectStatus } from './StatusCell';

interface CampaignRowProps {
  project: Project;
  client: Client | undefined;
  onCampaignClick: (project: Project) => void;
  onUpdated: (updated: Project) => void;
}

export default function CampaignRow({
  project,
  client,
  onCampaignClick,
  onUpdated,
}: CampaignRowProps) {
  const [hover, setHover] = useState(false);

  const handleStatusChange = async (status: ProjectStatus) => {
    await updateProject(project.id, { status });
    onUpdated({ ...project, status });
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        backgroundColor: hover ? '#F9FAFB' : '#FFFFFF',
        transition: 'background-color 0.1s',
        cursor: 'default',
      }}
    >
      {/* Campaign/Project Name — sticky */}
      <td style={{
        position: 'sticky',
        left: 0,
        zIndex: 2,
        backgroundColor: hover ? '#F9FAFB' : '#FFFFFF',
        padding: '0 16px',
        borderBottom: '1px solid #F3F4F6',
        borderRight: '1px solid #E5E7EB',
        minWidth: '260px',
        maxWidth: '300px',
        height: '44px',
        transition: 'background-color 0.1s',
      }}>
        <button
          onClick={() => onCampaignClick(project)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
          }}
        >
          <span style={{
            display: 'inline-block',
            width: '4px',
            height: '24px',
            borderRadius: '2px',
            backgroundColor: client?.color ?? '#6366F1',
            flexShrink: 0,
          }} />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#111827',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textDecoration: hover ? 'underline' : 'none',
              textDecorationColor: '#6366F1',
            }}
          >
            {project.name}
          </span>
        </button>
      </td>

      {/* Status */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>
        <StatusCell
          status={(project.status as ProjectStatus) ?? 'planning'}
          onChange={handleStatusChange}
        />
      </td>

      {/* Start Date */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '13px', color: '#6B7280' }}>{formatDate(project.startDate)}</span>
      </td>

      {/* End Date */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '13px', color: '#6B7280' }}>{formatDate(project.endDate)}</span>
      </td>

      {/* Progress */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', minWidth: '130px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            flex: 1,
            height: '6px',
            borderRadius: '3px',
            backgroundColor: '#E5E7EB',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${project.progress ?? 0}%`,
              borderRadius: '3px',
              backgroundColor: project.progress >= 100 ? '#059669' : project.progress >= 50 ? '#6366F1' : '#3B82F6',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap', minWidth: '32px' }}>
            {project.progress ?? 0}%
          </span>
        </div>
      </td>

      {/* Tasks */}
      <td style={{ padding: '0 12px', borderBottom: '1px solid #F3F4F6', textAlign: 'right', whiteSpace: 'nowrap' }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 500,
          color: project.taskIds?.length > 0 ? '#374151' : '#D1D5DB',
          fontFamily: 'ui-monospace, monospace',
        }}>
          {project.taskIds?.length ?? 0}
        </span>
      </td>
    </tr>
  );
}
