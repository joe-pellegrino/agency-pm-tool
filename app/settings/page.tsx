'use client';

import { useState, useTransition } from 'react';
import TopBar from '@/components/layout/TopBar';
import { User, Building2, Bell, Shield, Palette, Plus, Pencil, Archive } from 'lucide-react';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { toast } from 'sonner';
import TeamMemberModal from '@/components/team/TeamMemberModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { archiveTeamMember } from '@/lib/actions';
import type { TeamMember } from '@/lib/data';

export default function SettingsPage() {
  const { TEAM_MEMBERS = [], CLIENTS = [], loading, refresh } = useAppData();
  const [showNewMember, setShowNewMember] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Settings" subtitle="Manage your workspace preferences" />

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={16} className="text-indigo-500" />
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
                        member.isOwner ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {member.isOwner ? 'Admin' : 'Member'}
                      </span>
                      <button
                        onClick={() => setEditMember(member)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg transition-all"
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
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-indigo-600 border border-dashed border-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <Plus size={14} />
              Add team member
            </button>
          </div>

          {/* Clients */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-indigo-500" />
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

          {/* Other settings panels */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Bell, label: 'Notifications', desc: 'Configure alerts and reminders' },
              { icon: Shield, label: 'Security', desc: 'Password, 2FA, access control' },
              { icon: Palette, label: 'Appearance', desc: 'Theme, color scheme, layout' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-indigo-500" />
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
