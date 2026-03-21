'use client';

import { useState, useTransition } from 'react';
import { Calendar, DollarSign, Save } from 'lucide-react';
import { toast } from 'sonner';

interface BillingData {
  monthly_retainer?: number;
  contract_start?: string;
  contract_end?: string;
  billing_contact_name?: string;
  billing_contact_email?: string;
  payment_terms?: string;
  notes?: string;
}

export default function BillingTab({ clientId }: { clientId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();
  const [formData, setFormData] = useState<BillingData>({
    monthly_retainer: undefined,
    contract_start: '',
    contract_end: '',
    billing_contact_name: '',
    billing_contact_email: '',
    payment_terms: 'net-30',
    notes: '',
  });

  const handleSave = () => {
    startSaveTransition(async () => {
      try {
        // TODO: Call server action to save billing data
        toast.success('Billing info updated');
        setIsEditing(false);
      } catch (err) {
        toast.error('Failed to save: ' + (err as Error).message);
      }
    });
  };

  const calculateContractDuration = () => {
    if (!formData.contract_start || !formData.contract_end) return null;
    const start = new Date(formData.contract_start);
    const end = new Date(formData.contract_end);
    const months = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return `${months} months`;
  };

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Retainer */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={18} className="text-blue-600 dark:text-blue-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Retainer</label>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formData.monthly_retainer ? `$${formData.monthly_retainer.toLocaleString()}` : '—'}
            </p>
          </div>

          {/* Contract Duration */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={18} className="text-green-600 dark:text-green-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contract Duration</label>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {calculateContractDuration() || '—'}
            </p>
          </div>

          {/* Billing Contact Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Billing Contact</label>
            <p className="text-gray-900 dark:text-white text-sm font-medium">{formData.billing_contact_name || '—'}</p>
          </div>

          {/* Billing Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Billing Email</label>
            <p className="text-gray-900 dark:text-white text-sm font-medium">{formData.billing_contact_email || '—'}</p>
          </div>

          {/* Payment Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Terms</label>
            <p className="text-gray-900 dark:text-white text-sm font-medium capitalize">{formData.payment_terms || '—'}</p>
          </div>

          {/* Contract Start */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contract Start</label>
            <p className="text-gray-900 dark:text-white text-sm font-medium">
              {formData.contract_start ? new Date(formData.contract_start).toLocaleDateString() : '—'}
            </p>
          </div>

          {/* Contract End */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contract End</label>
            <p className="text-gray-900 dark:text-white text-sm font-medium">
              {formData.contract_end ? new Date(formData.contract_end).toLocaleDateString() : '—'}
            </p>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-line">{formData.notes || '—'}</p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          Edit Billing Info
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monthly Retainer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monthly Retainer</label>
          <input
            type="number"
            step="0.01"
            value={formData.monthly_retainer || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, monthly_retainer: e.target.value ? parseFloat(e.target.value) : undefined }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        {/* Payment Terms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Terms</label>
          <select
            value={formData.payment_terms || 'net-30'}
            onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="net-30">Net 30</option>
            <option value="net-45">Net 45</option>
            <option value="net-60">Net 60</option>
            <option value="due-on-receipt">Due on Receipt</option>
          </select>
        </div>

        {/* Contract Start */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contract Start Date</label>
          <input
            type="date"
            value={formData.contract_start || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, contract_start: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contract End */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contract End Date</label>
          <input
            type="date"
            value={formData.contract_end || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, contract_end: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Billing Contact Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Billing Contact Name</label>
          <input
            type="text"
            value={formData.billing_contact_name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, billing_contact_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Billing Contact Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Billing Contact Email</label>
          <input
            type="email"
            value={formData.billing_contact_email || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, billing_contact_email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-between gap-2 pt-4">
        <button
          onClick={() => setIsEditing(false)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
