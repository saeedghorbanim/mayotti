import { Card } from "@/components/ui/card";
import { Trash2, Calendar } from "lucide-react";
import { Expense } from "@/hooks/useLocalStorage";

interface HistoryViewProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}

// Get color based on category
const getCategoryColor = (category: string | null) => {
  const colors: Record<string, string> = {
    food: "bg-teal-600",
    dining: "bg-teal-600",
    transport: "bg-blue-600",
    transportation: "bg-blue-600",
    shopping: "bg-violet-500",
    entertainment: "bg-pink-500",
    groceries: "bg-primary",
    utilities: "bg-slate-500",
    health: "bg-cyan-600",
  };
  const cat = (category || "other").toLowerCase();
  return colors[cat] || "bg-muted-foreground";
};

// Group expenses by week
const groupByWeek = (expenses: Expense[]) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

  const thisWeek: Expense[] = [];
  const lastWeek: Expense[] = [];
  const twoWeeksAgoList: Expense[] = [];
  const older: Expense[] = [];

  expenses.forEach((expense) => {
    const date = new Date(expense.created_at);
    if (date >= oneWeekAgo) {
      thisWeek.push(expense);
    } else if (date >= twoWeeksAgo) {
      lastWeek.push(expense);
    } else if (date >= threeWeeksAgo) {
      twoWeeksAgoList.push(expense);
    } else {
      older.push(expense);
    }
  });

  return [
    { label: "This Week", expenses: thisWeek },
    { label: "Last Week", expenses: lastWeek },
    { label: "2 Weeks Ago", expenses: twoWeeksAgoList },
    { label: "Older", expenses: older },
  ].filter((group) => group.expenses.length > 0);
};

export const HistoryView = ({ expenses, onDeleteExpense }: HistoryViewProps) => {
  // Sort expenses by date (newest first)
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const groupedExpenses = groupByWeek(sortedExpenses);

  // Calculate weekly totals
  const weeklyTotals = groupedExpenses.map((group) => ({
    label: group.label,
    total: group.expenses.reduce((sum, e) => sum + e.amount, 0),
  }));

  return (
    <div className="p-4 space-y-4 overflow-y-auto overflow-x-hidden h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Transaction History</h1>
        <Calendar className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Weekly Summary */}
      {weeklyTotals.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weeklyTotals.map((week) => (
            <Card key={week.label} className="p-3 bg-card border-border shrink-0">
              <p className="text-xs text-muted-foreground">{week.label}</p>
              <p className="font-bold">${week.total.toFixed(2)}</p>
            </Card>
          ))}
        </div>
      )}

      {sortedExpenses.length === 0 ? (
        <Card className="p-6 bg-card border-border text-center">
          <p className="text-muted-foreground text-sm">
            No expenses yet. Start logging in the chat!
          </p>
        </Card>
      ) : (
        groupedExpenses.map((group) => (
          <div key={group.label}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              {group.label}
            </h2>
            <Card className="divide-y divide-border">
              {group.expenses.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-4">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(item.category)} shrink-0`}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base">
                      {item.description}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {item.category || "Other"}
                      {item.store && ` • ${item.store}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <p className="font-semibold text-sm sm:text-base">
                      ${item.amount.toFixed(2)}
                    </p>
                    <button
                      onClick={() => onDeleteExpense(item.id)}
                      className="text-destructive hover:opacity-80 transition-opacity p-1"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ))
      )}

      <p className="text-xs text-center text-muted-foreground">
        All data stays on your device
      </p>
    </div>
  );
};
