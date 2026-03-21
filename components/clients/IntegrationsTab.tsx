'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle, Clock, XCircle, ExternalLink, RefreshCw } from 'lucide-react';

type Integration = {
  id: string;
  platform: string;
  status: string;
  connected_at: string | null;
  last_sync_at: string | null;
  sync_error: string | null;
  account_config: Record<string, any>;
};

const PLATFORM_CONFIG: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
  meta: { label: 'Meta (Facebook & Instagram)', icon: '📘', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  google_ads: { label: 'Google Ads', icon: '📊', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
  ga4: { label: 'Google Analytics 4', icon: '📈', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  gsc: { label: 'Google Search Console', icon: '🔍', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  jotform: { label: 'JotForm', icon: '📝', color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  gbp: { label: 'Google Business Profile', icon: '📍', color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ComponentType<any>; color: string; dotColor: string }> = {
  connected: { label: 'Connected', icon: CheckCircle, color: 'text-green-600 dark:text-green-400', dotColor: 'bg-green-500' },
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' },
  error: { label: 'Error', icon: AlertCircle, color: 'text-red-600 dark:text-red-400', dotColor: 'bg-red-500' },
  disconnected: { label: 'Disconnected', icon: XCircle, color: 'text-gray-500 dark:text-gray-400', dotColor: 'bg-gray-400' },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function getAccountSummary(platform: string, config: Record<string, any>): string | null {
  if (!config) return null;
  switch (platform) {
    case 'meta': {
      const parts: string[] = [];
      if (config.page_id) parts.push(`Page ID: ${config.page_id}`);
      if (config.ad_account_id) parts.push(`Ad Account: ${config.ad_account_id}`);
      if (config.instagram_account_id) parts.push(`IG: ${config.instagram_account_id}`);
      return parts.length > 0 ? parts.join(' · ') : null;
    }
    case 'jotform': {
      const formCount = config.selected_forms?.length || 0;
      return formCount > 0 ? `${formCount} form${formCount !== 1 ? 's' : ''} connected` : null;
    }
    case 'ga4':
      return config.property_id ? `Property: ${config.property_id}` : null;
    case 'gsc':
      return config.site_url ? `Site: ${config.site_url}` : null;
    case 'google_ads':
      return config.customer_id ? `Customer ID: ${config.customer_id}` : null;
    default:
      return null;
  }
}

export default function IntegrationsTab({ clientId }: { clientId: string }) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalClientId, setPortalClientId] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/data/integrations?clientId=${clientId}`);
      if (!res.ok) throw new Error('Failed to fetch integrations');
      const data = await res.json();
      setIntegrations(data.integrations || []);
      setPortalClientId(data.portalClientId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gray-400" />
        <span className="ml-3 text-sm text-gray-500">Loading integrations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
        <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchIntegrations}
          className="mt-3 text-sm text-[#3B5BDB] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!portalClientId) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
        <ExternalLink size={32} className="mx-auto mb-3 opacity-30 text-gray-400" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No portal mapping found</p>
        <p className="text-xs text-gray-400 mt-1">This client hasn't been linked to the client portal yet.</p>
      </div>
    );
  }

  // All supported platforms, showing connected ones with data and unconnected as available slots
  const allPlatforms = Object.keys(PLATFORM_CONFIG);
  const connectedPlatforms = new Set(integrations.map(i => i.platform));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Connected Integrations</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {integrations.length} of {allPlatforms.length} platforms connected
          </p>
        </div>
        <button
          onClick={fetchIntegrations}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Integration cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allPlatforms.map(platform => {
          const config = PLATFORM_CONFIG[platform];
          const integration = integrations.find(i => i.platform === platform);
          const isConnected = !!integration;
          const status = isConnected ? (STATUS_CONFIG[integration.status] || STATUS_CONFIG.disconnected) : null;
          const accountSummary = isConnected ? getAccountSummary(platform, integration.account_config) : null;

          return (
            <div
              key={platform}
              className={`rounded-xl border transition-all ${
                isConnected
                  ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  : 'border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30'
              }`}
            >
              <div className="p-4">
                {/* Platform header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center text-lg`}>
                      {config.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{config.label}</h3>
                      {isConnected && status && (
                        <div className={`flex items-center gap-1.5 mt-0.5 ${status.color}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                          <span className="text-xs font-medium">{status.label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isConnected ? (
                  <div className="space-y-2">
                    {/* Account details */}
                    {accountSummary && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                        {accountSummary}
                      </p>
                    )}

                    {/* Sync error */}
                    {integration.sync_error && (
                      <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                        <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                        <span>{integration.sync_error}</span>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                      {integration.connected_at && (
                        <span>Connected {formatDate(integration.connected_at)}</span>
                      )}
                      {integration.last_sync_at && (
                        <span>Last sync {formatDate(integration.last_sync_at)}</span>
                      )}
                    </div>

                    {/* JotForm form list */}
                    {platform === 'jotform' && integration.account_config?.form_names && (
                      <details className="mt-2">
                        <summary className="text-xs text-[#3B5BDB] cursor-pointer hover:underline">
                          View connected forms
                        </summary>
                        <ul className="mt-2 space-y-1 pl-2">
                          {Object.entries(integration.account_config.form_names as Record<string, string>).map(([formId, formName]) => (
                            <li key={formId} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                              {formName}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">Not connected</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Portal link */}
      <div className="text-center pt-2">
        <p className="text-xs text-gray-400">
          Manage integrations in the{' '}
          <span className="text-[#3B5BDB]">Client Portal</span>
        </p>
      </div>
    </div>
  );
}
