import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, RefreshCw, TrendingUp, Sparkles } from "lucide-react";
import { Expense } from "@/hooks/useLocalStorage";

interface RecurringPattern {
  id: string;
  description: string;
  averageAmount: number;
  frequency: "weekly" | "biweekly" | "monthly";
  occurrences: number;
  lastOccurrence: Date;
  category: string | null;
}

// Detect recurring patterns from expenses
function detectRecurringPatterns(expenses: Expense[]): RecurringPattern[] {
  if (expenses.length < 2) return [];

  // Group expenses by similar description (normalize)
  const grouped: Record<string, Expense[]> = {};
  
  expenses.forEach((expense) => {
    const key = expense.description.toLowerCase().trim();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(expense);
  });

  const patterns: RecurringPattern[] = [];

  Object.entries(grouped).forEach(([key, group]) => {
    if (group.length < 2) return;

    // Sort by date
    const sorted = group.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Calculate average interval between occurrences
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const daysDiff = Math.round(
        (new Date(sorted[i].created_at).getTime() - 
         new Date(sorted[i - 1].created_at).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      intervals.push(daysDiff);
    }

    if (intervals.length === 0) return;

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Determine frequency
    let frequency: "weekly" | "biweekly" | "monthly" | null = null;

    // Weekly: every 5-9 days
    if (avgInterval >= 5 && avgInterval <= 9) {
      frequency = "weekly";
    }
    // Bi-weekly: every 12-16 days
    else if (avgInterval >= 12 && avgInterval <= 16) {
      frequency = "biweekly";
    }
    // Monthly: every 25-35 days
    else if (avgInterval >= 25 && avgInterval <= 35) {
      frequency = "monthly";
    }

    if (!frequency) return;

    // Calculate average amount
    const avgAmount = group.reduce((sum, e) => sum + Number(e.amount), 0) / group.length;

    patterns.push({
      id: key,
      description: sorted[0].description,
      averageAmount: avgAmount,
      frequency,
      occurrences: group.length,
      lastOccurrence: new Date(sorted[sorted.length - 1].created_at),
      category: sorted[0].category,
    });
  });

  // Sort by occurrences (most frequent first)
  return patterns.sort((a, b) => b.occurrences - a.occurrences);
}

interface RecurringViewProps {
  expenses: Expense[];
}

export const RecurringView = ({ expenses }: RecurringViewProps) => {
  const patterns = detectRecurringPatterns(expenses);

  // Calculate total monthly cost
  const totalMonthly = patterns.reduce((sum, p) => {
    if (p.frequency === "weekly") {
      return sum + p.averageAmount * (365.25 / 12 / 7); // ~4.345 weeks per month
    }
    if (p.frequency === "biweekly") {
      return sum + p.averageAmount * (365.25 / 12 / 14); // ~2.17 per month
    }
    return sum + p.averageAmount;
  }, 0);

  const getFrequencyLabel = (freq: "weekly" | "biweekly" | "monthly") => {
    if (freq === "weekly") return "Weekly";
    if (freq === "biweekly") return "Bi-weekly";
    return "Monthly";
  };

  const getFrequencyColor = (freq: "weekly" | "biweekly" | "monthly") => {
    if (freq === "weekly") return "bg-secondary text-foreground";
    if (freq === "biweekly") return "bg-secondary text-foreground";
    return "bg-accent text-accent-foreground";
  };

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold">Recurring</h1>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            Auto-detected
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Automatically detects patterns in your spending
        </p>
      </div>

      <Card className="p-4 bg-card border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Est. Monthly Total</p>
            <p className="text-2xl font-bold">${totalMonthly.toFixed(2)}</p>
          </div>
          <Calendar className="w-8 h-8 text-primary" />
        </div>
      </Card>

      {/* Detection Info */}
      <Card className="p-3 bg-muted/50 border-border">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-5 h-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Pattern Detection</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• Finds weekly expenses (every 5-9 days)</li>
              <li>• Finds bi-weekly expenses (every 12-16 days)</li>
              <li>• Finds monthly expenses (every 25-35 days)</li>
              <li>• Data stored on your device only</li>
            </ul>
          </div>
        </div>
      </Card>

      {patterns.length === 0 ? (
        <Card className="p-6 bg-card border-border text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1">No patterns detected yet</p>
          <p className="text-sm text-muted-foreground">
            Keep logging expenses in the chat, and I'll automatically detect recurring ones!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {patterns.map((pattern) => (
            <Card
              key={pattern.id}
              className="p-4 bg-card border-border"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium">{pattern.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Last: {pattern.lastOccurrence.toLocaleDateString()}
                  </p>
                </div>
                <p className="text-lg font-bold">${pattern.averageAmount.toFixed(2)}</p>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getFrequencyColor(pattern.frequency)}>
                  {getFrequencyLabel(pattern.frequency)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {pattern.occurrences} occurrences
                </Badge>
                {pattern.category && (
                  <Badge variant="secondary" className="text-xs">
                    {pattern.category}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        📱 All data stored locally on your device
      </p>
    </div>
  );
};
