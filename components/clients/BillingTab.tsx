'use client';

import { useState, useEffect, useTransition } from 'react';
import { Loader2, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getClientBilling, upsertClientBilling } from '@/lib/actions-client-settings';

interface ClientBilling {
  id: string;
  client_id: string;
  monthly_retainer: number | null;
  contract_start: string | null;
  contract_end: string | null;
  billing_contact_name: string | null;
  billing_contact_email: string | null;
  payment_terms: string;
  notes: string | null;
}

const PAYMENT_TERMS_OPTIONS = [
  { value: 'due-on-receipt', label: 'Due on Receipt' },
  { value: 'net-30', label: 'Net 30' },
  { value: 'net-45', label: 'Net 45' },
  { value: 'net-60', label: 'Net 60' },
];

interface BillingTabProps {
  clientId: string;
}

export default function BillingTab({ clientId }: BillingTabProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [billing, setBilling] = useState<ClientBilling | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    monthly_retainer: '',
    contract_start: '',
    contract_end: '',
    billing_contact_name: '',
    billing_contact_email: '',
    payment_terms: 'net-30',
    notes: '',
  });

  // Load billing data on mount
  useEffect(() => {
    const loadBilling = async () => {
      try {
        setIsLoading(true);
        const data = await getClientBilling(clientId);
        if (data) {
          setBilling(data);
          setForm({
            monthly_retainer: data.monthly_retainer ? String(data.monthly_retainer) : '',
            contract_start: data.contract_start || '',
            contract_end: data.contract_end || '',
            billing_contact_name: data.billing_contact_name || '',
            billing_contact_email: data.billing_contact_email || '',
            payment_terms: data.payment_terms || 'net-30',
            notes: data.notes || '',
          });
        }
      } catch (err) {
        console.error('Failed to load billing:', err);
        toast.error('Failed to load billing information');
      } finally {
        setIsLoading(false);
      }
    };

    loadBilling();
  }, [clientId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (form.monthly_retainer && isNaN(parseFloat(form.monthly_retainer))) {
      newErrors.monthly_retainer = 'Must be a valid number';
    }

    if (form.contract_start && form.contract_end) {
      if (new Date(form.contract_start) > new Date(form.contract_end)) {
        newErrors.contract_end = 'End date must be after start date';
      }
    }

    if (form.billing_contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.billing_contact_email)) {
      newErrors.billing_contact_email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      try {
        const payload = {
          clientId,
          monthly_retainer: form.monthly_retainer ? parseFloat(form.monthly_retainer) : undefined,
          contract_start: form.contract_start || undefined,
          contract_end: form.contract_end || undefined,
          billing_contact_name: form.billing_contact_name || undefined,
          billing_contact_email: form.billing_contact_email || undefined,
          payment_terms: form.payment_terms,
          notes: form.notes || undefined,
        };

        await upsertClientBilling(payload);
        // Reload billing data
        const updated = await getClientBilling(clientId);
        if (updated) {
          setBilling(updated);
        }
        toast.success('Billing information updated');
      } catch (err) {
        toast.error('Failed to save billing information: ' + (err as Error).message);
      }
    });
  };

  const calculateContractDuration = () => {
    if (!form.contract_start || !form.contract_end) return null;

    const start = new Date(form.contract_start);
    const end = new Date(form.contract_end);
    const today = new Date();

    // Check if contract is expired
    if (today > end) {
      return {
        status: 'expired' as const,
        text: 'Contract expired',
      };
    }

    // Calculate months remaining
    let months = 0;
    let tempDate = new Date(today);

    while (tempDate < end) {
      tempDate.setMonth(tempDate.getMonth() + 1);
      months++;
    }

    // Calculate total contract duration
    let totalMonths = 0;
    let tempStart = new Date(start);
    while (tempStart < end) {
      tempStart.setMonth(tempStart.getMonth() + 1);
      totalMonths++;
    }

    return {
      status: 'active' as const,
      remaining: months,
      total: totalMonths,
      text: `${months} of ${totalMonths} months remaining`,
    };
  };

  const contractDuration = calculateContractDuration();

  const inputClass =
    'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Billing Information</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage retainer, contract terms, and billing contacts</p>
      </div>

      {/* Contract Duration Summary */}
      {contractDuration && (
        <div
          className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
            contractDuration.status === 'expired'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }`}
        >
          {contractDuration.status === 'expired' ? (
            <AlertCircle
              size={20}
              className={contractDuration.status === 'expired' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}
              style={{ marginTop: '2px' }}
            />
          ) : (
            <CheckCircle size={20} className="text-green-600 dark:text-green-400" style={{ marginTop: '2px' }} />
          )}
          <div>
            <p
              className={`font-semibold text-sm ${
                contractDuration.status === 'expired'
                  ? 'text-red-900 dark:text-red-200'
                  : 'text-green-900 dark:text-green-200'
              }`}
            >
              {contractDuration.text}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {form.contract_start && form.contract_end ? (
                <>
                  {new Date(form.contract_start).toLocaleDateString()} -{' '}
                  {new Date(form.contract_end).toLocaleDateString()}
                </>
              ) : null}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Monthly Retainer */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} />
              Monthly Retainer
            </div>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400 font-medium">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.monthly_retainer}
              onChange={e => handleChange('monthly_retainer', e.target.value)}
              placeholder="0.00"
              className={`${inputClass} pl-7 ${errors.monthly_retainer ? 'border-red-400 focus:ring-red-500' : ''}`}
            />
          </div>
          {errors.monthly_retainer && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.monthly_retainer}</p>
          )}
        </div>

        {/* Contract Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                Contract Start
              </div>
            </label>
            <input
              type="date"
              value={form.contract_start}
              onChange={e => handleChange('contract_start', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                Contract End
              </div>
            </label>
            <input
              type="date"
              value={form.contract_end}
              onChange={e => handleChange('contract_end', e.target.value)}
              className={`${inputClass} ${errors.contract_end ? 'border-red-400 focus:ring-red-500' : ''}`}
            />
            {errors.contract_end && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.contract_end}</p>
            )}
          </div>
        </div>

        {/* Payment Terms */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment Terms</label>
          <select
            value={form.payment_terms}
            onChange={e => handleChange('payment_terms', e.target.value)}
            className={`${inputClass} appearance-none bg-right pr-8`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPositionX: 'right 10px',
            }}
          >
            {PAYMENT_TERMS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Billing Contact Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Billing Contact Name
          </label>
          <input
            type="text"
            value={form.billing_contact_name}
            onChange={e => handleChange('billing_contact_name', e.target.value)}
            placeholder="e.g., Sarah Johnson"
            className={inputClass}
          />
        </div>

        {/* Billing Contact Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Billing Contact Email
          </label>
          <input
            type="email"
            value={form.billing_contact_email}
            onChange={e => handleChange('billing_contact_email', e.target.value)}
            placeholder="billing@example.com"
            className={`${inputClass} ${errors.billing_contact_email ? 'border-red-400 focus:ring-red-500' : ''}`}
          />
          {errors.billing_contact_email && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.billing_contact_email}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => handleChange('notes', e.target.value)}
            placeholder="Additional billing notes or special terms..."
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
