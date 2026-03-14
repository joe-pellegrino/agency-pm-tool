'use client';

import { useState, useTransition, useEffect } from 'react';
import TopBar from '@/components/layout/TopBar';
import { User, Building2, Bell, Shield, Palette, Plus, Pencil, Archive, Image } from 'lucide-react';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { toast } from 'sonner';
import TeamMemberModal from '@/components/team/TeamMemberModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { archiveTeamMember } from '@/lib/actions';
import { supabase } from '@/lib/supabase/client';
import type { TeamMember } from '@/lib/data';

export default function SettingsPage() {
  const { TEAM_MEMBERS = [], CLIENTS = [], loading, refresh } = useAppData();
  const [showNewMember, setShowNewMember] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  // Fetch current logo URL
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data, error } = await supabase
          .from('agency_settings')
          .select('value')
          .eq('key', 'logo_url')
          .single();

        if (!error && data?.value) {
          setLogoUrl(data.value);
        }
      } catch (err) {
        console.error('Failed to fetch logo:', err);
      }
    };

    fetchLogo();
  }, []);

  const handleArchive = () => {
    if (!archiveId) return;
    const id = archiveId;
    setArchiveId(null);
    startTransition(async () => {
      try {
        await archiveTeamMember(id);
        toast.success('Team member archived');
        refresh?.();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  const handleSaveLogo = async () => {
    if (!logoUrl.trim()) {
      toast.error('Please enter a logo URL');
      return;
    }

    setSaving(true);
    try {
      // Upsert the logo URL
      const { error } = await supabase
        .from('agency_settings')
        .upsert({
          key: 'logo_url',
          value: logoUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      toast.success('Logo saved successfully');
      // Reload the page to reflect changes in sidebar
      window.location.reload();
    } catch (err) {
      toast.error('Failed to save logo: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <TopBar />

      {(showNewMember || editMember) && (
        <TeamMemberModal member={editMember || undefined} onClose={() => { setShowNewMember(false); setEditMember(null); }} />
      )}
      {archiveId && (
        <ConfirmDialog
          title="Archive Team Member"
          message="Archive this team member? Their tasks will remain assigned."
          confirmLabel="Archive"
          destructive
          onConfirm={handleArchive}
          onCancel={() => setArchiveId(null)}
        />
      )}

      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your workspace preferences</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={16} className="text-[#3B5BDB]" />
              Team Members
            </h2>
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {TEAM_MEMBERS.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.initials}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-white">{member.name}</div>
                        <div className="text-xs text-gray-400">{member.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        member.isOwner ? 'bg-[#E0E7FF] text-[#3B5BDB]' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {member.isOwner ? 'Admin' : 'Member'}
                      </span>
                      <button
                        onClick={() => setEditMember(member)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-[#3B5BDB] rounded-lg transition-all"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      {!member.isOwner && (
                        <button
                          onClick={() => setArchiveId(member.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-all"
                          title="Archive"
                        >
                          <Archive size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowNewMember(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[#3B5BDB] border border-dashed border-indigo-300 rounded-lg hover:bg-[#EEF2FF] dark:hover:bg-indigo-900/20 transition-colors"
            >
              <Plus size={14} />
              Add team member
            </button>
          </div>

          {/* Clients */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-[#3B5BDB]" />
              Clients
            </h2>
            <div className="space-y-2">
              {CLIENTS.map(client => (
                <div
                  key={client.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: client.color }}
                  >
                    {client.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{client.name}</div>
                    <div className="text-xs text-gray-400 truncate">{client.industry}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Branding section */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Image size={16} className="text-[#3B5BDB]" />
              Branding
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Agency Logo URL
                </label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter a URL to your agency logo. It will appear in the sidebar (expanded state only).
                </p>
              </div>
              <button
                onClick={handleSaveLogo}
                disabled={saving}
                className="w-full px-4 py-2 bg-[#3B5BDB] text-white font-medium rounded-lg hover:bg-[#2D42A8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Logo'}
              </button>
            </div>
          </div>

          {/* Other settings panels */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Bell, label: 'Notifications', desc: 'Configure alerts and reminders' },
              { icon: Shield, label: 'Security', desc: 'Password, 2FA, access control' },
              { icon: Palette, label: 'Appearance', desc: 'Theme, color scheme, layout' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-[#3B5BDB]" />
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
