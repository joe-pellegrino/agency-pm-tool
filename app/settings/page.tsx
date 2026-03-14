'use client';

import { useState, useTransition, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import TopBar from '@/components/layout/TopBar';
import { User, Building2, Bell, Palette, Image } from 'lucide-react';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export default function SettingsPage() {
  const { TEAM_MEMBERS = [], loading } = useAppData();
  
  // Account Tab State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Branding Tab State
  const [agencyName, setAgencyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B5BDB');
  
  // Appearance Tab State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  // Notifications Tab State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  
  const [savingBranding, setSavingBranding] = useState(false);
  const [, startTransition] = useTransition();

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('agency_settings')
          .select('key, value');

        if (!error && data) {
          data.forEach(item => {
            if (item.key === 'logo_url') setLogoUrl(item.value || '');
            if (item.key === 'agency_name') setAgencyName(item.value || '');
            if (item.key === 'primary_color') setPrimaryColor(item.value || '#3B5BDB');
          });
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      // Save agency name
      if (agencyName.trim()) {
        await supabase
          .from('agency_settings')
          .upsert({
            key: 'agency_name',
            value: agencyName,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'key'
          });
      }

      // Save logo URL
      if (logoUrl.trim()) {
        await supabase
          .from('agency_settings')
          .upsert({
            key: 'logo_url',
            value: logoUrl,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'key'
          });
      }

      // Save primary color
      await supabase
        .from('agency_settings')
        .upsert({
          key: 'primary_color',
          value: primaryColor,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        });

      toast.success('Branding settings saved successfully');
      // Reload the page to reflect changes in sidebar
      window.location.reload();
    } catch (err) {
      toast.error('Failed to save settings: ' + (err as Error).message);
    } finally {
      setSavingBranding(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <TopBar />

      <div className="p-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account, branding, and preferences</p>
        </div>

        {/* Tab Navigation */}
        <Tab.Group>
          <Tab.List className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-8">
            {[
              { name: 'Account', icon: User },
              { name: 'Branding', icon: Image },
              { name: 'Appearance', icon: Palette },
              { name: 'Notifications', icon: Bell },
            ].map(tab => (
              <Tab
                key={tab.name}
                className={({ selected }) => `
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none
                  ${selected
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <tab.icon size={16} />
                {tab.name}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>
            {/* Account Tab */}
            <Tab.Panel className="space-y-6">
              {/* Avatar Section */}
              <div className="flex gap-8">
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-bold text-gray-900 dark:text-white">Profile Picture</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your avatar image</p>
                </div>
                <div className="w-2/3">
                  <div className="flex items-end gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <span className="text-gray-400 text-2xl">👤</span>
                      )}
                    </div>
                    <button className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      Change avatar
                    </button>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Personal Information Section */}
              <div className="flex gap-8">
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-bold text-gray-900 dark:text-white">Personal Information</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your basic account details</p>
                </div>
                <div className="w-2/3 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value="Agency Owner"
                      readOnly
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your role cannot be changed</p>
                  </div>
                </div>
              </div>
            </Tab.Panel>

            {/* Branding Tab */}
            <Tab.Panel className="space-y-6">
              {/* Agency Name Section */}
              <div className="flex gap-8">
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-bold text-gray-900 dark:text-white">Agency Name</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your agency's official name</p>
                </div>
                <div className="w-2/3">
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="e.g., Creative Agency Co."
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Agency Logo Section */}
              <div className="flex gap-8">
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-bold text-gray-900 dark:text-white">Agency Logo</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Logo URL for sidebar and branding</p>
                </div>
                <div className="w-2/3">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use a public image URL. Appears in the sidebar when expanded.
                  </p>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Primary Color Section */}
              <div className="flex gap-8">
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-bold text-gray-900 dark:text-white">Primary Color</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Brand color (hex format)</p>
                </div>
                <div className="w-2/3 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3B5BDB"
                      className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveBranding}
                  disabled={savingBranding}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {savingBranding ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </Tab.Panel>

            {/* Appearance Tab */}
            <Tab.Panel className="space-y-6">
              {/* Theme Section */}
              <div className="flex gap-8">
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-bold text-gray-900 dark:text-white">Theme</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose your preferred appearance</p>
                </div>
                <div className="w-2/3 space-y-3">
                  {[
                    { value: 'light', label: 'Light', description: 'Use light theme' },
                    { value: 'dark', label: 'Dark', description: 'Use dark theme' },
                    { value: 'system', label: 'System', description: 'Match system settings' },
                  ].map(option => (
                    <label key={option.value} className="flex items-center p-3 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <input
                        type="radio"
                        name="theme"
                        value={option.value}
                        checked={theme === option.value}
                        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                        className="w-4 h-4 text-blue-600 cursor-pointer"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </Tab.Panel>

            {/* Notifications Tab */}
            <Tab.Panel className="space-y-6">
              {/* Email Notifications Section */}
              <div className="flex gap-8">
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-bold text-gray-900 dark:text-white">Email Notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage email alert preferences</p>
                </div>
                <div className="w-2/3 space-y-3">
                  {[
                    { state: emailNotifications, setState: setEmailNotifications, label: 'All Notifications', description: 'Receive email for all activity' },
                    { state: pushNotifications, setState: setPushNotifications, label: 'Push Alerts', description: 'Real-time browser notifications' },
                    { state: weeklyDigest, setState: setWeeklyDigest, label: 'Weekly Digest', description: 'Summary email every Monday' },
                  ].map((item, idx) => (
                    <label key={idx} className="flex items-center justify-between p-3 rounded-md border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={item.state}
                        onChange={(e) => item.setState(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
