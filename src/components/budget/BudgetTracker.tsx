import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { BudgetLimit } from '@/hooks/useLocalStorage';

interface BudgetTrackerProps {
  budget: BudgetLimit | null;
  onSetBudget: (amount: number) => void;
}

export const BudgetTracker = ({ budget, onSetBudget }: BudgetTrackerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newLimit, setNewLimit] = useState(budget?.limit_amount?.toString() || '');
  const { toast } = useToast();

  const saveBudget = () => {
    const limitAmount = parseFloat(newLimit);
    if (isNaN(limitAmount) || limitAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid budget amount',
        variant: 'destructive',
      });
      return;
    }

    onSetBudget(limitAmount);
    setIsEditing(false);
    toast({
      title: 'Budget saved',
      description: `Your monthly budget is now $${limitAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    });
  };

  if (!budget && !isEditing) {
    return (
      <div className="bg-card rounded-3xl p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] leading-[18px] font-semibold text-muted-foreground">Monthly budget</p>
            <p className="text-sm text-foreground mt-0.5">Set one and I'll keep you on track.</p>
          </div>
          <Button variant="outline" className="h-11 rounded-full px-4 font-semibold" onClick={() => setIsEditing(true)}>
            Set budget
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="bg-card rounded-3xl p-5 shadow-card">
        <label htmlFor="budget-limit" className="block text-[13px] leading-[18px] font-semibold text-muted-foreground mb-3">Monthly budget</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="budget-limit"
              type="number"
              inputMode="decimal"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              placeholder="1000"
              className="pl-7 h-11 rounded-full"
            />
          </div>
          <Button size="icon" className="h-11 w-11 rounded-full" aria-label="Save budget" onClick={saveBudget}>
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const percentage = budget ? (budget.current_spent / budget.limit_amount) * 100 : 0;
  const remaining = budget ? budget.limit_amount - budget.current_spent : 0;
  const overBy = budget ? budget.current_spent - budget.limit_amount : 0;

  // Budget states, paired with words so color never carries meaning alone:
  //   under 75% used  → brand green
  //   75% to <90%     → amber ("Heads up")
  //   90% and over    → red ("Running low", then "Over budget" past 100%)
  const isWarning = percentage >= 75 && percentage < 90;
  const isLow = percentage >= 90 && percentage < 100;
  const isOver = percentage >= 100;
  const isDanger = isLow || isOver;

  const money = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const alertMessage = isOver
    ? {
        lead: "Over budget.",
        text: `You're ${money(overBy)} over this month. Maybe ease up for a few days?`,
        className: "bg-destructive-tint text-foreground",
      }
    : isLow
      ? {
          lead: "Running low.",
          text: `Only ${money(remaining)} left for the rest of the month.`,
          className: "bg-destructive-tint text-foreground",
        }
      : isWarning
        ? {
            lead: "Heads up!",
            text: `You've got ${money(remaining)} left for the month.`,
            className: "bg-warning-tint text-foreground",
          }
        : null;

  // The bar shows what's left, so it drains as you spend (like a fuel gauge).
  const leftPercentage = Math.max(0, 100 - percentage);
  const toneText = isDanger ? "text-destructive" : isWarning ? "text-warning" : "text-foreground";

  return (
    <div className="bg-card rounded-3xl p-5 shadow-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] leading-[18px] font-semibold text-muted-foreground">
          {isOver ? "Over budget" : "Left to spend"}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-11 w-11 -mr-2 -my-2 rounded-full text-muted-foreground"
          aria-label="Edit budget"
          onClick={() => {
            setNewLimit(budget?.limit_amount?.toString() || '');
            setIsEditing(true);
          }}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-baseline gap-2 min-w-0">
        <span className={cn("text-[34px] leading-[38px] font-extrabold tracking-[-0.03em]", toneText)}>
          {isOver ? `-${money(overBy)}` : money(remaining)}
        </span>
        <span className="text-sm text-muted-foreground whitespace-nowrap">of {money(budget?.limit_amount || 0)}</span>
      </div>

      <Progress
        value={leftPercentage}
        aria-label="Budget left"
        className={cn(
          "h-2.5 bg-muted",
          isDanger ? "[&>div]:bg-destructive" : isWarning ? "[&>div]:bg-warning" : "[&>div]:bg-primary"
        )}
      />

      <div className="flex justify-between text-[13px] leading-[18px] text-muted-foreground">
        <span>
          <strong className="font-bold text-foreground">{money(budget?.current_spent || 0)}</strong> spent
        </span>
        <span className={cn(isDanger && "font-bold text-destructive", isWarning && "font-bold text-warning")}>
          {Math.round(Math.min(percentage, 999))}% used
        </span>
      </div>

      {alertMessage && (
        <div className={cn("text-sm leading-5 font-medium px-4 py-3 rounded-[18px]", alertMessage.className)}>
          <strong className="font-bold">{alertMessage.lead}</strong> {alertMessage.text}
        </div>
      )}
    </div>
  );
};
