import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Minus, Lightbulb } from "lucide-react";
import { Expense } from "@/hooks/useLocalStorage";

interface StatsViewProps {
  expenses: Expense[];
}

// Generate spending tips based on spending patterns
const generateSpendingTips = (categories: { name: string; amount: number; percentage: number }[], totalSpent: number): string[] => {
  const tips: string[] = [];
  
  if (categories.length === 0) return tips;
  
  // Find top spending category
  const topCategory = categories[0];
  if (topCategory && topCategory.percentage > 40) {
    tips.push(`${topCategory.name} takes ${topCategory.percentage.toFixed(0)}% of your budget. Consider setting a limit for this category.`);
  }
  
  // Check for food/dining spending
  const foodCategories = categories.filter(c => 
    ['food', 'dining', 'restaurant', 'takeout', 'coffee', 'groceries'].includes(c.name.toLowerCase())
  );
  const totalFoodSpend = foodCategories.reduce((sum, c) => sum + c.amount, 0);
  if (totalFoodSpend > totalSpent * 0.3) {
    tips.push(`You're spending ${((totalFoodSpend / totalSpent) * 100).toFixed(0)}% on food. Try meal prepping to save money.`);
  }
  
  // Check for entertainment/shopping
  const discretionaryCategories = categories.filter(c => 
    ['entertainment', 'shopping', 'subscriptions', 'gaming'].includes(c.name.toLowerCase())
  );
  const totalDiscretionary = discretionaryCategories.reduce((sum, c) => sum + c.amount, 0);
  if (totalDiscretionary > totalSpent * 0.25) {
    tips.push(`Discretionary spending is ${((totalDiscretionary / totalSpent) * 100).toFixed(0)}% of your budget. Review subscriptions you might not need.`);
  }
  
  // General tips based on spending level
  if (categories.length > 5) {
    tips.push(`You're spending across ${categories.length} categories. Focus on the top 3 to find savings.`);
  }
  
  // If no specific tips, give a general one
  if (tips.length === 0 && categories.length > 0) {
    tips.push(`Your top expense is ${topCategory.name} at $${topCategory.amount.toFixed(0)}. Look for ways to reduce it by 10-15%.`);
  }
  
  return tips.slice(0, 2); // Max 2 tips at a time
};

export const StatsView = ({ expenses }: StatsViewProps) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Filter expenses by month
  const thisMonthExpenses = expenses.filter((e) => {
    const date = new Date(e.created_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const lastMonthExpenses = expenses.filter((e) => {
    const date = new Date(e.created_at);
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  });

  // Calculate totals
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate percentage change
  const percentChange = lastMonthTotal > 0 
    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
    : 0;

  // Calculate daily average for this month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const dailyAverage = dayOfMonth > 0 ? thisMonthTotal / dayOfMonth : 0;

  // Get trend info
  const getTrendInfo = () => {
    if (percentChange < 0) {
      return { icon: TrendingDown, text: `${Math.abs(percentChange).toFixed(0)}%`, trend: "positive" };
    } else if (percentChange > 0) {
      return { icon: TrendingUp, text: `+${percentChange.toFixed(0)}%`, trend: "negative" };
    }
    return { icon: Minus, text: "0%", trend: "neutral" };
  };

  const trendInfo = getTrendInfo();

  const stats = [
    { label: "Spent This Month", value: `$${thisMonthTotal.toFixed(0)}`, icon: DollarSign, trend: null },
    { label: "vs Last Month", value: trendInfo.text, icon: trendInfo.icon, trend: trendInfo.trend },
    { label: "Avg. Daily Spend", value: `$${dailyAverage.toFixed(0)}`, icon: TrendingUp, trend: "neutral" },
  ];

  // Group expenses by category
  const categoryTotals: Record<string, number> = {};
  thisMonthExpenses.forEach((e) => {
    const cat = e.category || "Other";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
  });

  // Sort categories by amount
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      amount,
      percentage: thisMonthTotal > 0 ? (amount / thisMonthTotal) * 100 : 0,
    }));

  // Assign colors
  const categoryColors = [
    "bg-primary",
    "bg-teal-600",
    "bg-blue-600",
    "bg-violet-500",
    "bg-pink-500",
    "bg-cyan-600",
    "bg-muted-foreground",
  ];

  const categories = sortedCategories.map((cat, i) => ({
    ...cat,
    color: categoryColors[i % categoryColors.length],
  }));

  // Get month name
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 space-y-6 overflow-y-auto overflow-x-hidden h-full">
      <div>
        <h1 className="text-2xl font-bold mb-1">Stats</h1>
        <p className="text-muted-foreground text-sm">{monthName}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="min-w-0 p-3 bg-card border-border">
            <stat.icon className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="truncate text-lg font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">By Category</h2>
        {categories.length === 0 ? (
          <Card className="p-6 bg-card border-border text-center">
            <p className="text-muted-foreground text-sm">
              No expenses this month yet. Start logging in the chat!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.name}>
                <div className="flex justify-between gap-3 mb-1.5">
                  <span className="min-w-0 truncate text-sm font-medium">{category.name}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    ${category.amount.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${category.color} rounded-full transition-all`}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {percentChange < 0 && thisMonthExpenses.length > 0 && (
        <Card className="px-4 py-3.5 bg-accent border-0 shadow-none rounded-[18px]">
          <p className="text-sm leading-5 text-accent-foreground font-medium">
            <strong className="font-bold">Nice work.</strong> You're spending {Math.abs(percentChange).toFixed(0)}% less than last month. Keep it up!
          </p>
        </Card>
      )}

      {/* AI Spending Tips */}
      {(() => {
        const tips = generateSpendingTips(
          categories.map(c => ({ name: c.name, amount: c.amount, percentage: c.percentage })),
          thisMonthTotal
        );
        
        if (tips.length === 0) return null;
        
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h2 className="text-[17px] font-bold">Saving tips</h2>
            </div>
            {tips.map((tip, index) => (
              <Card key={index} className="px-4 py-3.5 bg-accent border-0 shadow-none rounded-[18px]">
                <p className="text-sm leading-5 text-accent-foreground font-medium">
                  {tip}
                </p>
              </Card>
            ))}
          </div>
        );
      })()}

      <p className="text-xs text-center text-muted-foreground">
        All data stays on your device
      </p>
    </div>
  );
};
