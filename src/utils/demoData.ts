import { Expense, BudgetLimit } from '@/hooks/useLocalStorage';

// Generate demo expenses spread across the current month
export const generateDemoExpenses = (): Expense[] => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const demoItems = [
    { description: 'Grocery shopping at Walmart', amount: 87.45, category: 'Groceries', store: 'Walmart' },
    { description: 'Gas fill up', amount: 52.30, category: 'Transportation', store: 'Shell' },
    { description: 'Netflix subscription', amount: 15.99, category: 'Entertainment', store: 'Netflix' },
    { description: 'Coffee and pastry', amount: 8.75, category: 'Food & Dining', store: 'Starbucks' },
    { description: 'Phone bill', amount: 65.00, category: 'Utilities', store: 'Verizon' },
    { description: 'Lunch with friends', amount: 34.50, category: 'Food & Dining', store: 'Chipotle' },
    { description: 'Amazon order - household items', amount: 45.23, category: 'Shopping', store: 'Amazon' },
    { description: 'Gym membership', amount: 29.99, category: 'Health', store: 'Planet Fitness' },
    { description: 'Uber ride downtown', amount: 18.40, category: 'Transportation', store: 'Uber' },
    { description: 'Dinner takeout', amount: 42.80, category: 'Food & Dining', store: 'DoorDash' },
  ];

  return demoItems.map((item, index) => {
    // Spread expenses across different days of the month
    const day = Math.min(now.getDate(), Math.max(1, now.getDate() - (index * 2)));
    const date = new Date(currentYear, currentMonth, day, 12 + index, 30);
    
    return {
      id: `demo_${Date.now()}_${index}`,
      description: item.description,
      amount: item.amount,
      category: item.category,
      store: item.store,
      created_at: date.toISOString(),
    };
  });
};

// Calculate total from demo expenses
export const getDemoTotal = (expenses: Expense[]): number => {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
};

// Generate a budget at ~90% usage based on expenses
export const generateDemoBudget = (totalSpent: number): BudgetLimit => {
  // Set limit so current spending is ~90%
  const limitAmount = Math.round((totalSpent / 0.90) * 100) / 100;
  
  return {
    id: `demo_budget_${Date.now()}`,
    category: 'total',
    limit_amount: limitAmount,
    current_spent: totalSpent,
    period: 'monthly',
  };
};

// Load demo data into localStorage
export const loadDemoData = (): { expenses: Expense[]; budget: BudgetLimit } => {
  const expenses = generateDemoExpenses();
  const totalSpent = getDemoTotal(expenses);
  const budget = generateDemoBudget(totalSpent);
  
  // Save to localStorage
  localStorage.setItem('mayotti_expenses', JSON.stringify(expenses));
  localStorage.setItem('mayotti_budget', JSON.stringify(budget));

  // Set as subscribed so the paywall doesn't show
  const subscriptionData = {
    isSubscribed: true,
    subscribedAt: new Date().toISOString(),
    expiresAt: null,
    productId: 'demo_mode',
  };
  localStorage.setItem('mayotti_subscription', JSON.stringify(subscriptionData));
  
  return { expenses, budget };
};

// Clear demo data
export const clearDemoData = () => {
  localStorage.removeItem('mayotti_expenses');
  localStorage.removeItem('mayotti_budget');
  localStorage.removeItem('mayotti_subscription');
};
