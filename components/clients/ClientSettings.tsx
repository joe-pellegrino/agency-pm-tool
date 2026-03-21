'use client';

import { useState, Suspense } from 'react';
import { Client } from '@/lib/data';
import { User, Users, Zap, DollarSign, Bell } from 'lucide-react';
import ProfileTab from './ProfileTab';
import TeamTab from './TeamTab';
import IntegrationsTab from './IntegrationsTab';
import BillingTab from './BillingTab';
import NotificationsTab from './NotificationsTab';

type SettingsTab = 'profile' | 'team' | 'integrations' | 'billing' | 'notifications';

const TAB_CONFIG: Array<{ id: SettingsTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'integrations', label: 'Integrations', icon: Zap },
  { id: 'billing', label: 'Billing', icon: DollarSign },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function ClientSettings({ client }: { client: Client }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab client={client} />;
      case 'team':
        return <TeamTab clientId={client.id} />;
      case 'integrations':
        return <IntegrationsTab clientId={client.id} />;
      case 'billing':
        return <BillingTab clientId={client.id} />;
      case 'notifications':
        return <NotificationsTab clientId={client.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-sm">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <Suspense fallback={<div className="text-center py-8 text-gray-500">Loading...</div>}>
          {renderContent()}
        </Suspense>
      </div>
    </div>
  );
}
