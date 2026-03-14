'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  getOrCreateBudget,
  getBudgetRows,
  addBudgetRow,
  deleteBudgetRow,
  updateBudgetRowLabel,
  upsertBudgetEntry,
  bulkUpsertBudgetEntries,
} from '@/lib/actions-budget';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface BudgetEntry {
  id: string;
  month: number;
  amount: number;
}

interface BudgetRow {
  id: string;
  budget_id: string;
  label: string;
  sort_order: number;
  created_at: string;
  entries: BudgetEntry[];
}

interface BudgetMatrix {
  id: string;
  client_id: string;
  year: number;
  rows: BudgetRow[];
  created_at: string;
  updated_at: string;
}

export default function BudgetMatrixComponent({ clientId }: { clientId: string }) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [budget, setBudget] = useState<BudgetMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; month: number } | null>(null);

  // Load budget data
  const loadBudget = useCallback(async (selectedYear: number) => {
    setIsLoading(true);
    try {
      const data = await getOrCreateBudget(clientId, selectedYear);
      setBudget(data);
    } catch (err) {
      toast.error('Failed to load budget: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadBudget(year);
  }, [year, loadBudget]);

  const handleYearChange = (delta: number) => {
    setYear(prev => prev + delta);
  };

  const handleCellChange = (rowId: string, month: number, value: string) => {
    // Just update draft value, don't save yet
    const key = `${rowId}-${month}`;
    setDraftValues(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCellBlur = (rowId: string, month: number) => {
    const key = `${rowId}-${month}`;
    const value = draftValues[key] ?? '';
    const amount = parseFloat(value) || 0;

    startTransition(async () => {
      try {
        await upsertBudgetEntry(rowId, month, amount);
        // Reload the budget to reflect changes
        await loadBudget(year);
        toast.success('Budget updated');
      } catch (err) {
        toast.error('Failed to update: ' + (err as Error).message);
      }
    });
  };

  const handleApplyToFutureMonths = (rowId: string, currentMonth: number) => {
    const key = `${rowId}-${currentMonth}`;
    const value = draftValues[key] ?? '';
    const amount = parseFloat(value) || 0;

    if (amount === 0) {
      toast.warning('Enter a value first');
      return;
    }

    startTransition(async () => {
      try {
        // Apply from next month through December
        const fromMonth = currentMonth + 1;
        const toMonth = 12;
        
        if (fromMonth > 12) {
          toast.warning('No future months to apply to');
          return;
        }

        await bulkUpsertBudgetEntries(rowId, fromMonth, toMonth, amount);
        // Also save the current month
        await upsertBudgetEntry(rowId, currentMonth, amount);
        // Reload the budget to reflect changes
        await loadBudget(year);
        toast.success(`Applied $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} to months ${fromMonth}-12`);
        setFocusedCell(null);
      } catch (err) {
        toast.error('Failed to apply: ' + (err as Error).message);
      }
    });
  };

  const handleAddRow = () => {
    if (!budget) return;

    startTransition(async () => {
      try {
        await addBudgetRow(budget.id, 'New Row');
        await loadBudget(year);
        toast.success('Row added');
      } catch (err) {
        toast.error('Failed to add row: ' + (err as Error).message);
      }
    });
  };

  const handleDeleteRow = (rowId: string) => {
    startTransition(async () => {
      try {
        await deleteBudgetRow(rowId);
        await loadBudget(year);
        toast.success('Row deleted');
      } catch (err) {
        toast.error('Failed to delete row: ' + (err as Error).message);
      }
    });
  };

  const handleStartEditLabel = (rowId: string, currentLabel: string) => {
    setEditingRowId(rowId);
    setEditingLabel(currentLabel);
  };

  const handleSaveLabel = (rowId: string) => {
    if (editingLabel.trim()) {
      startTransition(async () => {
        try {
          await updateBudgetRowLabel(rowId, editingLabel.trim());
          await loadBudget(year);
          setEditingRowId(null);
          toast.success('Row renamed');
        } catch (err) {
          toast.error('Failed to rename: ' + (err as Error).message);
        }
      });
    }
  };

  const getRowTotal = (row: BudgetRow): number => {
    return row.entries.reduce((sum, entry) => sum + entry.amount, 0);
  };

  const getMonthTotal = (month: number): number => {
    if (!budget) return 0;
    return budget.rows.reduce((sum, row) => {
      const entry = row.entries.find(e => e.month === month);
      return sum + (entry?.amount || 0);
    }, 0);
  };

  const getGrandTotal = (): number => {
    if (!budget) return 0;
    return budget.rows.reduce((sum, row) => sum + getRowTotal(row), 0);
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!budget) {
    return <div className="text-gray-400">Failed to load budget.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Year Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleYearChange(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Previous year"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-20 text-center">{year}</span>
        <button
          onClick={() => handleYearChange(1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Next year"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Budget Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {/* Row label header */}
              <th className="sticky left-0 z-10 w-48 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-left font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                Service Line
              </th>
              {/* Month headers */}
              {MONTHS.map((month, idx) => (
                <th
                  key={month}
                  className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 min-w-24"
                >
                  {month}
                </th>
              ))}
              {/* Total header */}
              <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20 min-w-32">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Budget rows */}
            {budget.rows.map((row, rowIdx) => (
              <tr
                key={row.id}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {/* Row label cell (editable) */}
                <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 px-4 py-3 font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    {editingRowId === row.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingLabel}
                        onChange={e => setEditingLabel(e.target.value)}
                        onBlur={() => handleSaveLabel(row.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveLabel(row.id);
                          if (e.key === 'Escape') setEditingRowId(null);
                        }}
                        className="flex-1 px-2 py-1 border border-blue-400 rounded bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <button
                        onClick={() => handleStartEditLabel(row.id, row.label)}
                        className="flex-1 text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors truncate"
                        title="Click to edit"
                      >
                        {row.label}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      disabled={isPending}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                      title="Delete row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>

                {/* Monthly cells */}
                {MONTHS.map((_, monthIdx) => {
                  const month = monthIdx + 1;
                  const entry = row.entries.find(e => e.month === month);
                  const key = `${row.id}-${month}`;
                  const draftValue = draftValues[key];
                  const displayValue = draftValue !== undefined ? draftValue : (entry?.amount?.toString() || '');
                  const isFocused = focusedCell?.rowId === row.id && focusedCell?.month === month;
                  const hasValue = parseFloat(displayValue) > 0;

                  return (
                    <td
                      key={key}
                      className="px-2 py-2 border-r border-gray-200 dark:border-gray-700 text-center relative"
                    >
                      <div className="relative">
                        <input
                          type="number"
                          value={displayValue}
                          onChange={e => handleCellChange(row.id, month, e.target.value)}
                          onBlur={() => {
                            handleCellBlur(row.id, month);
                            setFocusedCell(null);
                          }}
                          onFocus={() => setFocusedCell({ rowId: row.id, month })}
                          disabled={isPending}
                          placeholder="0"
                          className="w-full px-2 py-1 text-right text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                        {isFocused && hasValue && (
                          <button
                            onClick={() => handleApplyToFutureMonths(row.id, month)}
                            disabled={isPending}
                            className="absolute top-full left-0 right-0 mt-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded whitespace-nowrap z-20 font-medium transition-colors"
                            title="Apply this value to all remaining months"
                          >
                            Apply to future
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}

                {/* Row total */}
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20">
                  {formatCurrency(getRowTotal(row))}
                </td>
              </tr>
            ))}

            {/* Monthly totals row */}
            <tr className="bg-gray-100 dark:bg-gray-700/50 font-semibold">
              <td className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-700/50 px-4 py-3 text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                MONTHLY TOTAL
              </td>
              {MONTHS.map((_, monthIdx) => (
                <td
                  key={`total-${monthIdx}`}
                  className="px-4 py-3 text-center text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700"
                >
                  {formatCurrency(getMonthTotal(monthIdx + 1))}
                </td>
              ))}
              <td className="px-4 py-3 text-right text-gray-900 dark:text-white bg-blue-100 dark:bg-blue-900/40">
                {formatCurrency(getGrandTotal())}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      <button
        onClick={handleAddRow}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg font-medium transition-colors"
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Add Row
      </button>
    </div>
  );
}
