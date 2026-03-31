'use client';

import { useState, useEffect } from 'react';
import type { Project, Client } from '@/lib/data';
import { updateProject, archiveProject } from '@/lib/actions';
import StatusCell, { type ProjectStatus } from './StatusCell';
import { X, Trash2, Calendar, Target, BarChart3, StickyNote } from 'lucide-react';

interface CampaignDrawerProps {
  project: Project | null;
  clients: Client[];
  onClose: () => void;
  onUpdated: (updated: Project) => void;
  onDeleted: (id: string) => void;
}

export default function CampaignDrawer({
  project,
  clients,
  onClose,
  onUpdated,
  onDeleted,
}: CampaignDrawerProps) {
  const [editing, setEditing] = useState<Partial<Project>>({});
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (project) setEditing({});
  }, [project?.id]);

  if (!project) return null;

  const merged = { ...project, ...editing };
  const client = clients.find(c => c.id === merged.clientId);

  const handleSave = async () => {
    if (Object.keys(editing).length === 0) return;
    setSaving(true);
    try {
      await updateProject(project.id, {
        name: editing.name,
        description: editing.description,
        status: editing.status,
        startDate: editing.startDate,
        endDate: editing.endDate,
        progress: editing.progress,
      });
      onUpdated({ ...project, ...editing });
      setEditing({});
    } catch (err) {
      console.error('Failed to update campaign:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm(`Archive campaign "${project.name}"? It will be moved to the archive.`)) return;
    setArchiving(true);
    try {
      await archiveProject(project.id);
      onDeleted(project.id);
      onClose();
    } catch (err) {
      console.error('Failed to archive campaign:', err);
    } finally {
      setArchiving(false);
    }
  };

  const isDirty = Object.keys(editing).length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.2)',
          zIndex: 40,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '480px',
        maxWidth: '100vw',
        backgroundColor: '#FFFFFF',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              value={editing.name ?? project.name}
              onChange={e => setEditing(prev => ({ ...prev, name: e.target.value }))}
              style={{
                width: '100%',
                fontSize: '18px',
                fontWeight: 700,
                color: '#111827',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                padding: '2px 0',
              }}
              onFocus={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onBlur={e => e.currentTarget.style.backgroundColor = 'transparent'}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <StatusCell
                status={(merged.status as ProjectStatus) ?? 'planning'}
                onChange={s => setEditing(prev => ({ ...prev, status: s }))}
              />
              {client && (
                <span style={{
                  fontSize: '12px',
                  color: '#9CA3AF',
                  backgroundColor: '#F3F4F6',
                  padding: '2px 8px',
                  borderRadius: '10px',
                }}>
                  {client.name}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#9CA3AF',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Meta */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <DrawerField label="Client" icon={<Target size={14} />}>
              <span style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>
                {client?.name ?? merged.clientId}
              </span>
            </DrawerField>

            <DrawerField label="Progress" icon={<BarChart3 size={14} />}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editing.progress ?? project.progress ?? 0}
                  onChange={e => setEditing(prev => ({ ...prev, progress: Math.min(100, Math.max(0, Number(e.target.value))) }))}
                  style={{
                    fontSize: '13px',
                    color: '#111827',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    width: '70px',
                  }}
                />
                <span style={{ fontSize: '12px', color: '#6B7280' }}>%</span>
              </div>
            </DrawerField>

            <DrawerField label="Start Date" icon={<Calendar size={14} />}>
              <input
                type="date"
                value={editing.startDate ?? project.startDate ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, startDate: e.target.value || '' }))}
                style={{
                  fontSize: '13px',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  width: '100%',
                }}
              />
            </DrawerField>

            <DrawerField label="End Date" icon={<Calendar size={14} />}>
              <input
                type="date"
                value={editing.endDate ?? project.endDate ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, endDate: e.target.value || '' }))}
                style={{
                  fontSize: '13px',
                  color: '#111827',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  width: '100%',
                }}
              />
            </DrawerField>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <StickyNote size={12} />
              Description
            </label>
            <textarea
              value={editing.description ?? project.description ?? ''}
              onChange={e => setEditing(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add description..."
              rows={4}
              style={{
                width: '100%',
                marginTop: '6px',
                fontSize: '14px',
                color: '#111827',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                padding: '8px 12px',
                outline: 'none',
                resize: 'vertical',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
              onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
            />
          </div>

          {/* Task count info */}
          {project.taskIds && project.taskIds.length > 0 && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#EEF2FF',
              borderRadius: '8px',
              border: '1px solid #C7D2FE',
              marginBottom: '20px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#6366F1', marginBottom: '2px' }}>
                LINKED TASKS
              </div>
              <div style={{ fontSize: '14px', color: '#4338CA' }}>
                {project.taskIds.length} task{project.taskIds.length !== 1 ? 's' : ''} linked to this campaign
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: '#F9FAFB',
        }}>
          <button
            onClick={handleArchive}
            disabled={archiving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #FCA5A5',
              backgroundColor: '#FFF5F5',
              color: '#EF4444',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <Trash2 size={14} />
            {archiving ? 'Archiving...' : 'Archive'}
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                color: '#6B7280',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            {isDirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#6366F1',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function DrawerField({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}
