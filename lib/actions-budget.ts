'use server';

import { createServerClient } from '@/lib/supabase/client';

interface BudgetRow {
  id: string;
  budget_id: string;
  label: string;
  sort_order: number;
  created_at: string;
  entries: Array<{
    id: string;
    month: number;
    amount: number;
  }>;
}

interface BudgetMatrix {
  id: string;
  client_id: string;
  year: number;
  rows: BudgetRow[];
  created_at: string;
  updated_at: string;
}

/**
 * Get or create a budget record for a client and year
 */
export async function getOrCreateBudget(clientId: string, year: number): Promise<BudgetMatrix> {
  const supabase = createServerClient();

  // Try to get existing budget
  let { data: budget, error } = await supabase
    .from('client_budgets')
    .select('*')
    .eq('client_id', clientId)
    .eq('year', year)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  // If not found, create new budget
  if (!budget) {
    const { data: newBudget, error: createError } = await supabase
      .from('client_budgets')
      .insert([
        {
          client_id: clientId,
          year,
        },
      ])
      .select()
      .single();

    if (createError) throw createError;
    budget = newBudget;
  }

  // Get rows with entries
  const { data: rows, error: rowsError } = await supabase
    .from('budget_rows')
    .select(
      `
        *,
        budget_entries(id, month, amount)
      `,
    )
    .eq('budget_id', budget.id)
    .order('sort_order', { ascending: true });

  if (rowsError) throw rowsError;

  return {
    id: budget.id,
    client_id: budget.client_id,
    year: budget.year,
    rows: (rows || []).map(row => ({
      id: row.id,
      budget_id: row.budget_id,
      label: row.label,
      sort_order: row.sort_order,
      created_at: row.created_at,
      entries: row.budget_entries || [],
    })),
    created_at: budget.created_at,
    updated_at: budget.updated_at,
  };
}

/**
 * Get budget rows with their entries
 */
export async function getBudgetRows(budgetId: string): Promise<BudgetRow[]> {
  const supabase = createServerClient();

  const { data: rows, error } = await supabase
    .from('budget_rows')
    .select(
      `
        *,
        budget_entries(id, month, amount)
      `,
    )
    .eq('budget_id', budgetId)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (rows || []).map(row => ({
    id: row.id,
    budget_id: row.budget_id,
    label: row.label,
    sort_order: row.sort_order,
    created_at: row.created_at,
    entries: row.budget_entries || [],
  }));
}

/**
 * Upsert a single budget entry (create or update monthly amount)
 */
export async function upsertBudgetEntry(rowId: string, month: number, amount: number): Promise<void> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('budget_entries')
    .upsert([
      {
        row_id: rowId,
        month,
        amount: parseFloat(amount.toString()),
        updated_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
}

/**
 * Add a new budget row (service line / campaign type)
 */
export async function addBudgetRow(budgetId: string, label: string): Promise<BudgetRow> {
  const supabase = createServerClient();

  // Get the max sort_order to append at the end
  const { data: maxSort } = await supabase
    .from('budget_rows')
    .select('sort_order')
    .eq('budget_id', budgetId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = (maxSort?.sort_order || 0) + 1;

  const { data: row, error } = await supabase
    .from('budget_rows')
    .insert([
      {
        budget_id: budgetId,
        label,
        sort_order: sortOrder,
      },
    ])
    .select(
      `
        *,
        budget_entries(id, month, amount)
      `,
    )
    .single();

  if (error) throw error;

  return {
    id: row.id,
    budget_id: row.budget_id,
    label: row.label,
    sort_order: row.sort_order,
    created_at: row.created_at,
    entries: row.budget_entries || [],
  };
}

/**
 * Delete a budget row and all its entries
 */
export async function deleteBudgetRow(rowId: string): Promise<void> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('budget_rows')
    .delete()
    .eq('id', rowId);

  if (error) throw error;
}

/**
 * Update the label of a budget row
 */
export async function updateBudgetRowLabel(rowId: string, label: string): Promise<BudgetRow> {
  const supabase = createServerClient();

  const { data: row, error } = await supabase
    .from('budget_rows')
    .update({ label })
    .eq('id', rowId)
    .select(
      `
        *,
        budget_entries(id, month, amount)
      `,
    )
    .single();

  if (error) throw error;

  return {
    id: row.id,
    budget_id: row.budget_id,
    label: row.label,
    sort_order: row.sort_order,
    created_at: row.created_at,
    entries: row.budget_entries || [],
  };
}
