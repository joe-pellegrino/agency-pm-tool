'use client';

import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import TopBar from '@/components/layout/TopBar';
import { User, Bell, Palette, Image } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

const CARD = 'bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden';
const SECTION = 'flex gap-8 p-6';
const DIVIDER = 'border-t border-gray-100';

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <div className={`flex justify-end px-6 py-4 ${DIVIDER}`}>
      <button
        onClick={onClick}
        disabled={saving}
        className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}

async function upsertSetting(key: string, value: string) {
  return supabase
    .from('agency_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
}

export default function SettingsPage() {
  // ── Account ──────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  // ── Branding ─────────────────────────────────────────────
  const [agencyName, setAgencyName]       = useState('');
  const [logoLightUrl, setLogoLightUrl]   = useState('');
  const [logoDarkUrl, setLogoDarkUrl]     = useState('');
  const [primaryColor, setPrimaryColor]   = useState('#3B5BDB');
  const [savingBranding, setSavingBranding] = useState(false);
  const [uploadingLogoLight, setUploadingLogoLight] = useState(false);
  const [uploadingLogoDark, setUploadingLogoDark] = useState(false);

  // ── Appearance ────────────────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [savingAppearance, setSavingAppearance] = useState(false);

  // ── Notifications ─────────────────────────────────────────
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications]   = useState(false);
  const [weeklyDigest, setWeeklyDigest]             = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // ── Load all settings ─────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('agency_settings').select('key, value');
      if (!data) return;
      data.forEach(({ key, value }) => {
        if (key === 'agency_name')         setAgencyName(value ?? '');
        if (key === 'logo_light_url')      setLogoLightUrl(value ?? '');
        if (key === 'logo_dark_url')       setLogoDarkUrl(value ?? '');
        if (key === 'primary_color')       setPrimaryColor(value ?? '#3B5BDB');
        if (key === 'user_first_name')     setFirstName(value ?? '');
        if (key === 'user_last_name')      setLastName(value ?? '');
        if (key === 'user_email')          setEmail(value ?? '');
        if (key === 'user_avatar_url')     setAvatarUrl(value ?? '');
        if (key === 'theme')               setTheme((value as 'light' | 'dark' | 'system') ?? 'system');
        if (key === 'notif_email')         setEmailNotifications(value === 'true');
        if (key === 'notif_push')          setPushNotifications(value === 'true');
        if (key === 'notif_weekly_digest') setWeeklyDigest(value === 'true');
      });
    };
    load();
  }, []);

  // ── Save handlers ─────────────────────────────────────────
  const handleSaveAccount = async () => {
    setSavingAccount(true);
    try {
      await Promise.all([
        upsertSetting('user_first_name', firstName),
        upsertSetting('user_last_name', lastName),
        upsertSetting('user_email', email),
        upsertSetting('user_avatar_url', avatarUrl),
      ]);
      toast.success('Account saved');
    } catch {
      toast.error('Failed to save account');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      await Promise.all([
        upsertSetting('agency_name', agencyName),
        upsertSetting('logo_light_url', logoLightUrl),
        upsertSetting('logo_dark_url', logoDarkUrl),
        upsertSetting('primary_color', primaryColor),
      ]);
      toast.success('Branding saved');
      window.location.reload();
    } catch {
      toast.error('Failed to save branding');
    } finally {
      setSavingBranding(false);
    }
  };

  const handleSaveAppearance = async () => {
    setSavingAppearance(true);
    try {
      await upsertSetting('theme', theme);
      localStorage.setItem('theme', theme);
      toast.success('Appearance saved');
      window.location.reload();
    } catch {
      toast.error('Failed to save appearance');
    } finally {
      setSavingAppearance(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      await Promise.all([
        upsertSetting('notif_email', String(emailNotifications)),
        upsertSetting('notif_push', String(pushNotifications)),
        upsertSetting('notif_weekly_digest', String(weeklyDigest)),
      ]);
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save notifications');
    } finally {
      setSavingNotifications(false);
    }
  };

  const input = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <TopBar />

      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your account, branding, and preferences</p>
        </div>

        <Tab.Group>
          <Tab.List className="flex gap-1 border-b border-gray-200 mb-6">
            {[
              { name: 'Account',       icon: User },
              { name: 'Branding',      icon: Image },
              { name: 'Appearance',    icon: Palette },
              { name: 'Notifications', icon: Bell },
            ].map(tab => (
              <Tab
                key={tab.name}
                className={({ selected }) => `
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none
                  ${selected
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                  }
                `}
              >
                <tab.icon size={15} />
                {tab.name}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>

            {/* ── Account ── */}
            <Tab.Panel className={CARD}>
              <div className={SECTION}>
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">Profile Picture</h3>
                  <p className="text-sm text-gray-500 mt-1">Your avatar image URL</p>
                </div>
                <div className="w-2/3 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-xl">👤</span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      className={input}
                    />
                  </div>
                </div>
              </div>

              <div className={DIVIDER} />

              <div className={SECTION}>
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">Personal Information</h3>
                  <p className="text-sm text-gray-500 mt-1">Your basic account details</p>
                </div>
                <div className="w-2/3 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className={input} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className={input} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className={input} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input type="text" value="Agency Owner" readOnly className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                    <p className="text-xs text-gray-400 mt-1">Role cannot be changed</p>
                  </div>
                </div>
              </div>

              <SaveButton onClick={handleSaveAccount} saving={savingAccount} />
            </Tab.Panel>

            {/* ── Branding ── */}
            <Tab.Panel className={CARD}>
              <div className={SECTION}>
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">Agency Name</h3>
                  <p className="text-sm text-gray-500 mt-1">Displayed in the sidebar and reports</p>
                </div>
                <div className="w-2/3">
                  <input type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Creative Agency Co." className={input} />
                </div>
              </div>

              <div className={DIVIDER} />

              <div className={SECTION}>
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">Light Mode Logo</h3>
                  <p className="text-sm text-gray-500 mt-1">Recommended: 200×60px, PNG or SVG</p>
                </div>
                <div className="w-2/3 space-y-3">
                  {logoLightUrl && (
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <img src={logoLightUrl} alt="Light logo preview" className="h-10 max-w-[160px] object-contain rounded" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      <button
                        type="button"
                        onClick={() => setLogoLightUrl('')}
                        className="text-xs text-red-500 hover:text-red-700 font-medium ml-auto"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploadingLogoLight ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
                    <div className="flex flex-col items-center gap-1 text-center">
                      {uploadingLogoLight ? (
                        <span className="text-sm text-gray-400">Uploading…</span>
                      ) : (
                        <>
                          <Image size={20} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">Click to upload</span>
                          <span className="text-xs text-gray-400">PNG, SVG, JPG · Max 2MB</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg,image/webp"
                      className="hidden"
                      disabled={uploadingLogoLight}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { toast.error('File too large — max 2MB'); return; }
                        setUploadingLogoLight(true);
                        try {
                          const ext = file.name.split('.').pop();
                          const path = `logos/light-logo-${Date.now()}.${ext}`;
                          const { error: upErr } = await supabase.storage.from('assets').upload(path, file, { upsert: true, contentType: file.type });
                          if (upErr) throw upErr;
                          const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path);
                          setLogoLightUrl(publicUrl);
                          toast.success('Light logo uploaded');
                        } catch (err) {
                          toast.error('Upload failed: ' + (err as Error).message);
                        } finally {
                          setUploadingLogoLight(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className={DIVIDER} />

              <div className={SECTION}>
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">Dark Mode Logo</h3>
                  <p className="text-sm text-gray-500 mt-1">Recommended: 200×60px, PNG or SVG</p>
                </div>
                <div className="w-2/3 space-y-3">
                  {logoDarkUrl && (
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-900">
                      <img src={logoDarkUrl} alt="Dark logo preview" className="h-10 max-w-[160px] object-contain rounded" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      <button
                        type="button"
                        onClick={() => setLogoDarkUrl('')}
                        className="text-xs text-red-400 hover:text-red-300 font-medium ml-auto"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploadingLogoDark ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}>
                    <div className="flex flex-col items-center gap-1 text-center">
                      {uploadingLogoDark ? (
                        <span className="text-sm text-gray-400">Uploading…</span>
                      ) : (
                        <>
                          <Image size={20} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-600">Click to upload</span>
                          <span className="text-xs text-gray-400">PNG, SVG, JPG · Max 2MB</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg,image/webp"
                      className="hidden"
                      disabled={uploadingLogoDark}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { toast.error('File too large — max 2MB'); return; }
                        setUploadingLogoDark(true);
                        try {
                          const ext = file.name.split('.').pop();
                          const path = `logos/dark-logo-${Date.now()}.${ext}`;
                          const { error: upErr } = await supabase.storage.from('assets').upload(path, file, { upsert: true, contentType: file.type });
                          if (upErr) throw upErr;
                          const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path);
                          setLogoDarkUrl(publicUrl);
                          toast.success('Dark logo uploaded');
                        } catch (err) {
                          toast.error('Upload failed: ' + (err as Error).message);
                        } finally {
                          setUploadingLogoDark(false);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className={DIVIDER} />

              <div className={SECTION}>
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">Primary Color</h3>
                  <p className="text-sm text-gray-500 mt-1">Brand accent color</p>
                </div>
                <div className="w-2/3 flex items-center gap-3">
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-10 rounded-md border border-gray-300 cursor-pointer p-1 bg-white" />
                  <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#3B5BDB" className={`${input} w-36`} />
                  <div className="w-8 h-8 rounded-md border border-gray-200 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                </div>
              </div>

              <SaveButton onClick={handleSaveBranding} saving={savingBranding} />
            </Tab.Panel>

            {/* ── Appearance ── */}
            <Tab.Panel className={CARD}>
              <div className={SECTION}>
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">Theme</h3>
                  <p className="text-sm text-gray-500 mt-1">Choose your preferred appearance</p>
                </div>
                <div className="w-2/3 space-y-2">
                  {([
                    { value: 'light',  label: 'Light',  description: 'Always use light theme' },
                    { value: 'dark',   label: 'Dark',   description: 'Always use dark theme' },
                    { value: 'system', label: 'System', description: 'Follow device settings' },
                  ] as const).map(option => (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        theme === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={option.value}
                        checked={theme === option.value}
                        onChange={() => setTheme(option.value)}
                        className="w-4 h-4 text-blue-600 cursor-pointer"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <SaveButton onClick={handleSaveAppearance} saving={savingAppearance} />
            </Tab.Panel>

            {/* ── Notifications ── */}
            <Tab.Panel className={CARD}>
              <div className={SECTION}>
                <div className="w-1/3 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
                  <p className="text-sm text-gray-500 mt-1">Choose what alerts you receive</p>
                </div>
                <div className="w-2/3 space-y-2">
                  {[
                    { label: 'Email Notifications', description: 'Receive emails for task assignments and comments', state: emailNotifications, setState: setEmailNotifications },
                    { label: 'Push Notifications',  description: 'Real-time browser alerts for urgent activity',    state: pushNotifications,   setState: setPushNotifications },
                    { label: 'Weekly Digest',        description: 'Summary of activity sent every Monday morning',   state: weeklyDigest,         setState: setWeeklyDigest },
                  ].map((item, idx) => (
                    <label key={idx} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                      <input type="checkbox" checked={item.state} onChange={(e) => item.setState(e.target.checked)} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                    </label>
                  ))}
                </div>
              </div>

              <SaveButton onClick={handleSaveNotifications} saving={savingNotifications} />
            </Tab.Panel>

          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
