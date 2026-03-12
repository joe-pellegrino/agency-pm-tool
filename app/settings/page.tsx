import TopBar from '@/components/layout/TopBar';
import { TEAM_MEMBERS, CLIENTS } from '@/lib/data';
import { User, Building2, Bell, Shield, Palette } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar title="Settings" subtitle="Manage your workspace preferences" />
      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={16} className="text-indigo-500" />
              Team Members
            </h2>
            <div className="space-y-3">
              {TEAM_MEMBERS.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
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
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    member.role === 'Owner' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {member.role === 'Owner' ? 'Admin' : 'Member'}
                  </span>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full py-2.5 text-sm font-medium text-indigo-600 border border-dashed border-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              + Invite team member
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
                <div key={client.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                  <span
                    className="w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center"
                    style={{ backgroundColor: client.color + '20', color: client.color }}
                  >
                    {client.logo}
                  </span>
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{client.name}</div>
                    <div className="text-xs text-gray-400">{client.location}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full py-2.5 text-sm font-medium text-indigo-600 border border-dashed border-indigo-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              + Add client
            </button>
          </div>

          {/* Other settings panels */}
          {[
            { icon: Bell, title: 'Notifications', desc: 'Configure how and when you receive alerts', items: ['Email digests', 'Task assignments', 'Due date reminders', 'Comment mentions'] },
            { icon: Palette, title: 'Appearance', desc: 'Customize the look and feel', items: ['Theme: Light / Dark', 'Sidebar color', 'Card density', 'Date format'] },
            { icon: Shield, title: 'Permissions', desc: 'Role-based access control', items: ['Admin: Full access', 'Member: Limited access', 'Client: View only', 'Custom roles'] },
          ].map(({ icon: Icon, title, desc, items }) => (
            <div key={title} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Icon size={16} className="text-indigo-500" />
                {title}
              </h2>
              <p className="text-xs text-gray-400 mb-4">{desc}</p>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <span className="text-sm text-gray-700 dark:text-gray-200">{item}</span>
                    <div className="w-9 h-5 bg-indigo-500 rounded-full relative cursor-pointer">
                      <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
