'use client';

import { useState, useTransition } from 'react';
import { Client } from '@/lib/data';
import { updateClient } from '@/lib/actions';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { toast } from 'sonner';
import { Save, Loader2, Upload, X } from 'lucide-react';

interface ProfileTabProps {
  client: Client;
}

export default function ProfileTab({ client }: ProfileTabProps) {
  const { refresh } = useAppData();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [logoPreview, setLogoPreview] = useState<string | null>(client.logo_url || null);
  const [formData, setFormData] = useState({
    name: client.name || '',
    industry: client.industry || '',
    location: client.location || '',
    primary_contact_name: client.primary_contact_name || '',
    primary_contact_email: client.primary_contact_email || '',
    primary_contact_phone: client.primary_contact_phone || '',
    website_url: client.website_url || '',
    logo_url: client.logo_url || '',
    notes: client.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = 'Client name is required';
    if (formData.primary_contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primary_contact_email)) {
      e.primary_contact_email = 'Invalid email address';
    }
    if (formData.website_url && !/^https?:\/\/.+/.test(formData.website_url)) {
      e.website_url = 'URL must start with http:// or https://';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      setFormData(prev => ({ ...prev, logo_url: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo_url: '' }));
  };

  const handleSave = () => {
    if (!validate()) return;

    startTransition(async () => {
      try {
        // Prepare data for update (only include non-empty string fields)
        const updateData: any = {
          name: formData.name,
          industry: formData.industry,
          location: formData.location,
          primary_contact_name: formData.primary_contact_name || null,
          primary_contact_email: formData.primary_contact_email || null,
          primary_contact_phone: formData.primary_contact_phone || null,
          website_url: formData.website_url || null,
          logo_url: formData.logo_url || null,
          notes: formData.notes || null,
        };

        await updateClient(client.id, updateData);
        toast.success('Client profile updated');
        setIsEditing(false);
        refresh?.();
      } catch (err) {
        toast.error('Failed to update: ' + (err as Error).message);
      }
    });
  };

  const handleCancel = () => {
    setFormData({
      name: client.name || '',
      industry: client.industry || '',
      location: client.location || '',
      primary_contact_name: client.primary_contact_name || '',
      primary_contact_email: client.primary_contact_email || '',
      primary_contact_phone: client.primary_contact_phone || '',
      website_url: client.website_url || '',
      logo_url: client.logo_url || '',
      notes: client.notes || '',
    });
    setLogoPreview(client.logo_url || null);
    setErrors({});
    setIsEditing(false);
  };

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-700';
  const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5';

  if (!isEditing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{client.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{client.industry} · {client.location}</p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Edit Profile
          </button>
        </div>

        {/* Logo Preview */}
        {logoPreview && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <img
              src={logoPreview}
              alt="Client logo"
              className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Logo Preview</p>
              <p className="text-xs text-gray-500 mt-0.5">Current client logo</p>
            </div>
          </div>
        )}

        {/* Contact Information */}
        {client.primary_contact_name && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Primary Contact</h3>
            <div className="space-y-2 text-sm">
              {client.primary_contact_name && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Name</p>
                  <p className="text-gray-900 dark:text-white font-medium">{client.primary_contact_name}</p>
                </div>
              )}
              {client.primary_contact_email && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Email</p>
                  <a href={`mailto:${client.primary_contact_email}`} className="text-[#3B5BDB] hover:underline">
                    {client.primary_contact_email}
                  </a>
                </div>
              )}
              {client.primary_contact_phone && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Phone</p>
                  <a href={`tel:${client.primary_contact_phone}`} className="text-[#3B5BDB] hover:underline">
                    {client.primary_contact_phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Website */}
        {client.website_url && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">Website</p>
            <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="text-[#3B5BDB] hover:underline text-sm">
              {client.website_url}
            </a>
          </div>
        )}

        {/* Notes */}
        {client.notes && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-2">Notes</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{client.notes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo Upload Section */}
      <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Logo</h3>
            <p className="text-xs text-gray-500">Upload a client logo (JPEG, PNG, GIF, or WebP, max 5MB)</p>
          </div>
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Logo preview"
              className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700 ml-4"
            />
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Upload size={14} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose File</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </label>
          {logoPreview && (
            <button
              type="button"
              onClick={handleClearLogo}
              className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Basic Information</h3>

        <div>
          <label className={labelClass}>Client Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            placeholder="Enter client name"
            className={`${inputClass} ${errors.name ? 'border-red-400' : ''}`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Industry</label>
            <input
              type="text"
              value={formData.industry}
              onChange={e => handleChange('industry', e.target.value)}
              placeholder="e.g., Retail, Technology"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => handleChange('location', e.target.value)}
              placeholder="e.g., New York, NY"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Primary Contact */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Primary Contact</h3>

        <div>
          <label className={labelClass}>Contact Name</label>
          <input
            type="text"
            value={formData.primary_contact_name}
            onChange={e => handleChange('primary_contact_name', e.target.value)}
            placeholder="e.g., John Doe"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={formData.primary_contact_email}
              onChange={e => handleChange('primary_contact_email', e.target.value)}
              placeholder="contact@company.com"
              className={`${inputClass} ${errors.primary_contact_email ? 'border-red-400' : ''}`}
            />
            {errors.primary_contact_email && <p className="text-xs text-red-500 mt-1">{errors.primary_contact_email}</p>}
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              value={formData.primary_contact_phone}
              onChange={e => handleChange('primary_contact_phone', e.target.value)}
              placeholder="(123) 456-7890"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Online Presence */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Online Presence</h3>

        <div>
          <label className={labelClass}>Website URL</label>
          <input
            type="url"
            value={formData.website_url}
            onChange={e => handleChange('website_url', e.target.value)}
            placeholder="https://company.com"
            className={`${inputClass} ${errors.website_url ? 'border-red-400' : ''}`}
          />
          {errors.website_url && <p className="text-xs text-red-500 mt-1">{errors.website_url}</p>}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Additional Information</h3>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            value={formData.notes}
            onChange={e => handleChange('notes', e.target.value)}
            placeholder="Add any additional notes about this client..."
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
