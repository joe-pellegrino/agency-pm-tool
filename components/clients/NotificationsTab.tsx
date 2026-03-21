'use client';

import { useState, useEffect } from 'react';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { Bell, Mail } from 'lucide-react';

interface NotificationPreference {
  id: string;
  team_member_id: string;
  email_enabled: boolean;
  digest_frequency: 'realtime' | 'daily' | 'weekly' | 'off';
}

export default function NotificationsTab({ clientId }: { clientId: string }) {
  const { TEAM_MEMBERS = [] } = useAppData();
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch notification preferences for this client
    setLoading(false);
  }, [clientId]);

  const handleToggleEmail = (teamMemberId: string) => {
    setPrefs(prev =>
      prev.map(p =>
        p.team_member_id === teamMemberId
          ? { ...p, email_enabled: !p.email_enabled }
          : p
      )
    );
  };

  const handleFrequencyChange = (teamMemberId: string, frequency: string) => {
    setPrefs(prev =>
      prev.map(p =>
        p.team_member_id === teamMemberId
          ? { ...p, digest_frequency: frequency as any }
          : p
      )
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Configure notification preferences for team members assigned to this client.
      </p>

      {prefs.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Bell size={32} className="mx-auto mb-2 opacity-30 text-gray-400" />
          <p className="text-sm text-gray-500">No team members assigned to this client</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prefs.map(pref => {
            const member = TEAM_MEMBERS.find(m => m.id === pref.team_member_id);
            if (!member) return null;

            return (
              <div key={pref.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{member.name}</h4>
                    <p className="text-xs text-gray-500">{member.role}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-400" />
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</label>
                    </div>
                    <button
                      onClick={() => handleToggleEmail(pref.team_member_id)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        pref.email_enabled
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          pref.email_enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Digest Frequency */}
                  {pref.email_enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Digest Frequency</label>
                      <select
                        value={pref.digest_frequency}
                        onChange={(e) => handleFrequencyChange(pref.team_member_id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="realtime">Real-time</option>
                        <option value="daily">Daily Digest</option>
                        <option value="weekly">Weekly Digest</option>
                        <option value="off">Off</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
