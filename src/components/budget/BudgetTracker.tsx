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

  // One number: everything added to the budget minus everything spent.
  // Color + a short message only when it's getting low:
  //   under 25% of the total left → amber, under 10% → red, below zero → red.
  const total = budget?.limit_amount || 0;
  const balance = total - (budget?.current_spent || 0);
  const leftShare = total > 0 ? balance / total : 0;
  const isOver = balance < 0;
  const isLow = !isOver && leftShare < 0.1;
  const isWarning = !isOver && !isLow && leftShare < 0.25;

  const money = (n: number) =>
    `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const alertMessage = isOver
    ? { lead: "Over budget.", text: `You've spent ${money(balance)} more than you have.`, className: "bg-destructive-tint" }
    : isLow
      ? { lead: "Running low.", text: "Spend carefully for the rest of the month.", className: "bg-destructive-tint" }
      : isWarning
        ? { lead: "Heads up!", text: "Less than a quarter of your money is left.", className: "bg-warning-tint" }
        : null;

  return (
    <div className="bg-card rounded-3xl p-5 shadow-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] leading-[18px] font-semibold text-muted-foreground">Balance</span>
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

      <span
        className={cn(
          "text-[40px] leading-[44px] font-extrabold tracking-[-0.03em]",
          isOver || isLow ? "text-destructive" : isWarning ? "text-warning" : "text-foreground"
        )}
      >
        {isOver ? "-" : ""}
        {money(balance)}
      </span>

      {alertMessage && (
        <div className={cn("text-sm leading-5 font-medium text-foreground px-4 py-3 rounded-[18px]", alertMessage.className)}>
          <strong className="font-bold">{alertMessage.lead}</strong> {alertMessage.text}
        </div>
      )}
    </div>
  );
};
