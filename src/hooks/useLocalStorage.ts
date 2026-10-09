import { useState, useEffect } from 'react';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  store: string | null;
  created_at: string;
}

export interface BudgetLimit {
  id: string;
  category: string;
  limit_amount: number;
  current_spent: number;
  period: string;
}

const EXPENSES_KEY = 'mayotti_expenses';
const BUDGET_KEY = 'mayotti_budget';
const BUDGET_RESET_KEY = 'mayotti_budget_last_reset';

export const useLocalStorage = () => {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    // Initialize from localStorage immediately to avoid flash of empty state
    try {
      const storedExpenses = localStorage.getItem(EXPENSES_KEY);
      if (storedExpenses) {
        const parsed = JSON.parse(storedExpenses);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to initialize expenses from localStorage:', error);
    }
    return [];
  });
  
  const [budget, setBudget] = useState<BudgetLimit | null>(() => {
    // Initialize from localStorage immediately
    try {
      const storedBudget = localStorage.getItem(BUDGET_KEY);
      if (storedBudget) {
        const parsed = JSON.parse(storedBudget);
        if (parsed && typeof parsed === 'object' && 'limit_amount' in parsed) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to initialize budget from localStorage:', error);
    }
    return null;
  });

  // Re-sync from localStorage when component mounts (handles tab switches)
  useEffect(() => {
    // Load expenses with error handling
    try {
      const storedExpenses = localStorage.getItem(EXPENSES_KEY);
      if (storedExpenses) {
        const parsed = JSON.parse(storedExpenses);
        if (Array.isArray(parsed)) {
          setExpenses(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load expenses from localStorage:', error);
    }

    // Load budget with error handling
    try {
      const storedBudget = localStorage.getItem(BUDGET_KEY);
      if (storedBudget) {
        const parsed = JSON.parse(storedBudget);
        if (parsed && typeof parsed === 'object' && 'limit_amount' in parsed) {
          setBudget(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load budget from localStorage:', error);
    }

    // Auto-reset monthly budget spending if the month has changed
    checkAndResetMonthlySpending();

    // Recalculate budget current_spent from actual expenses to fix any drift
    recalcBudgetFromExpenses();
  }, []);

  // Check if we've entered a new month and reset budget spending
  const checkAndResetMonthlySpending = () => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const lastReset = localStorage.getItem(BUDGET_RESET_KEY);

    if (lastReset !== currentMonthKey) {
      localStorage.setItem(BUDGET_RESET_KEY, currentMonthKey);

      // Reset budget current_spent if a budget exists
      try {
        const storedBudget = localStorage.getItem(BUDGET_KEY);
        if (storedBudget) {
          const parsed = JSON.parse(storedBudget);
          if (parsed && typeof parsed === 'object' && 'limit_amount' in parsed) {
            const resetBudget = { ...parsed, current_spent: 0 };
            localStorage.setItem(BUDGET_KEY, JSON.stringify(resetBudget));
            setBudget(resetBudget);
          }
        }
      } catch (error) {
        console.error('Failed to reset monthly spending:', error);
      }
    }
  };

  // Recalculate budget current_spent from actual current-month expenses
  const recalcBudgetFromExpenses = () => {
    try {
      const storedBudget = localStorage.getItem(BUDGET_KEY);
      const storedExpenses = localStorage.getItem(EXPENSES_KEY);
      if (!storedBudget || !storedExpenses) return;

      const parsedBudget = JSON.parse(storedBudget);
      const parsedExpenses = JSON.parse(storedExpenses);
      if (!parsedBudget || !Array.isArray(parsedExpenses)) return;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlySpent = parsedExpenses
        .filter((e: Expense) => {
          const d = new Date(e.created_at);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum: number, e: Expense) => sum + e.amount, 0);

      if (parsedBudget.current_spent !== monthlySpent) {
        const corrected = { ...parsedBudget, current_spent: monthlySpent };
        localStorage.setItem(BUDGET_KEY, JSON.stringify(corrected));
        setBudget(corrected);
      }
    } catch (error) {
      console.error('Failed to recalculate budget from expenses:', error);
    }
  };

  // Save expenses
  const saveExpenses = (newExpenses: Expense[]) => {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(newExpenses));
    setExpenses(newExpenses);
  };

  // Add expense
  const addExpense = (expense: Omit<Expense, 'id' | 'created_at'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    
    const updatedExpenses = [...expenses, newExpense];
    saveExpenses(updatedExpenses);

    // Auto-update budget spending
    if (budget) {
      const updatedBudget = {
        ...budget,
        current_spent: budget.current_spent + expense.amount,
      };
      saveBudget(updatedBudget);
    }

    return newExpense;
  };

  // Delete expense
  const deleteExpense = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    const updatedExpenses = expenses.filter(e => e.id !== id);
    saveExpenses(updatedExpenses);

    // Update budget if expense was deleted
    if (expense && budget) {
      const updatedBudget = {
        ...budget,
        current_spent: Math.max(0, budget.current_spent - expense.amount),
      };
      saveBudget(updatedBudget);
    }
  };

  // Save budget
  const saveBudget = (newBudget: BudgetLimit) => {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(newBudget));
    setBudget(newBudget);
  };

  // Set budget limit
  const setBudgetLimit = (limitAmount: number) => {
    const newBudget: BudgetLimit = {
      id: budget?.id || Date.now().toString(),
      category: 'total',
      limit_amount: limitAmount,
      current_spent: budget?.current_spent || 0,
      period: 'monthly',
    };
    saveBudget(newBudget);
  };

  // Reset monthly spending (call at start of new month)
  const resetMonthlySpending = () => {
    if (budget) {
      saveBudget({ ...budget, current_spent: 0 });
    }
  };

  // Clear all data
  const clearAllData = () => {
    localStorage.removeItem(EXPENSES_KEY);
    localStorage.removeItem(BUDGET_KEY);
    setExpenses([]);
    setBudget(null);
  };

  return {
    expenses,
    budget,
    addExpense,
    deleteExpense,
    setBudgetLimit,
    saveBudget,
    resetMonthlySpending,
    clearAllData,
  };
};
