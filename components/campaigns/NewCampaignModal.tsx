'use client';

import { useState } from 'react';
import type { Client, Project } from '@/lib/data';
import { createProject } from '@/lib/actions';
import { X } from 'lucide-react';

interface NewCampaignModalProps {
  clients: Client[];
  defaultClientId?: string;
  onCreated: (project: Project) => void;
  onClose: () => void;
}

export default function NewCampaignModal({ clients, defaultClientId, onCreated, onClose }: NewCampaignModalProps) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState(defaultClientId ?? clients[0]?.id ?? '');
  const [status, setStatus] = useState<'planning' | 'active' | 'complete' | 'on-hold'>('planning');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Campaign name is required'); return; }
    if (!clientId) { setError('Client is required'); return; }
    setError('');
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const id = await createProject({
        clientId,
        name: name.trim(),
        description,
        status,
        startDate: startDate || today,
        endDate: endDate || startDate || today,
        type: 'campaign',
      });

      const created: Project = {
        id,
        clientId,
        name: name.trim(),
        description,
        status,
        startDate: startDate || today,
        endDate: endDate || startDate || today,
        progress: 0,
        taskIds: [],
        type: 'campaign',
      };

      onCreated(created);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          zIndex: 60,
        }}
      />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '480px',
        maxWidth: 'calc(100vw - 32px)',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        zIndex: 70,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>New Campaign</h2>
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
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#FEF2F2',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#EF4444',
              marginBottom: '16px',
              border: '1px solid #FCA5A5',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <div>
              <label style={labelStyle}>Campaign Name *</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Spring Promo 2026"
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
                onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* Client */}
            <div>
              <label style={labelStyle}>Client *</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as typeof status)}
                style={inputStyle}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="complete">Complete</option>
              </select>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
                  onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                />
              </div>
              <div>
                <label style={labelStyle}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
                  onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Campaign overview..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
                onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #F3F4F6',
          }}>
            <button
              type="button"
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
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: saving ? '#A5B4FC' : '#6366F1',
                color: '#FFFFFF',
                fontSize: '13px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {saving ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#6B7280',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: '14px',
  color: '#111827',
  border: '1px solid #E5E7EB',
  borderRadius: '6px',
  padding: '8px 12px',
  outline: 'none',
  backgroundColor: '#FFFFFF',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
