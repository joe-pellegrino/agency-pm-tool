'use client';

import { useState } from 'react';
import type { Client } from '@/lib/data';
import { createCampaign } from '@/lib/actions-campaigns';
import type { Campaign } from '@/lib/data';
import { X } from 'lucide-react';

interface NewCampaignModalProps {
  clients: Client[];
  defaultClientId?: string;
  onCreated: (campaign: Campaign) => void;
  onClose: () => void;
}

export default function NewCampaignModal({ clients, defaultClientId, onCreated, onClose }: NewCampaignModalProps) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState(defaultClientId ?? clients[0]?.id ?? '');
  const [platform, setPlatform] = useState<Campaign['platform']>('meta');
  const [status, setStatus] = useState<Campaign['status']>('draft');
  const [priority, setPriority] = useState<Campaign['priority']>('medium');
  const [totalBudget, setTotalBudget] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Campaign name is required'); return; }
    if (!clientId) { setError('Client is required'); return; }
    setError('');
    setSaving(true);
    try {
      const created = await createCampaign({
        clientId,
        name: name.trim(),
        platform,
        status,
        priority,
        totalBudget: totalBudget ? Number(totalBudget) : null,
      });
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

            {/* Platform + Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Platform</label>
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value as Campaign['platform'])}
                  style={inputStyle}
                >
                  <option value="meta">Meta Ads</option>
                  <option value="google_ads">Google Ads</option>
                  <option value="email">Email</option>
                  <option value="organic">Organic</option>
                  <option value="tiktok">TikTok</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as Campaign['status'])}
                  style={inputStyle}
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>

            {/* Priority + Budget */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as Campaign['priority'])}
                  style={inputStyle}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Total Budget ($)</label>
                <input
                  type="number"
                  value={totalBudget}
                  onChange={e => setTotalBudget(e.target.value)}
                  placeholder="0.00"
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor = '#6366F1'}
                  onBlur={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                />
              </div>
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
