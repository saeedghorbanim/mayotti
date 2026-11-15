import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const PICKABLE_CATEGORIES = [
  { id: "groceries", label: "Groceries", emoji: "🛒" },
  { id: "dining", label: "Dining", emoji: "🍽️" },
  { id: "coffee", label: "Coffee", emoji: "☕" },
  { id: "transport", label: "Transport", emoji: "🚗" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "utilities", label: "Bills", emoji: "💡" },
  { id: "entertainment", label: "Fun", emoji: "🎬" },
  { id: "health", label: "Health", emoji: "💊" },
  { id: "subscriptions", label: "Subscriptions", emoji: "🔁" },
  { id: "other", label: "Other", emoji: "📦" },
] as const;

interface CategoryPickerProps {
  amount: number;
  chosen?: string;
  onPick: (categoryId: string) => void;
}

/**
 * Tap-to-pick category under an AI reply that logged an expense without
 * knowing what it was for. Picking is free: it updates the saved expense
 * on the device and never sends another AI message.
 */
export const CategoryPicker = ({ amount, chosen, onPick }: CategoryPickerProps) => {
  const reduceMotion = useReducedMotion();
  const picked = PICKABLE_CATEGORIES.find((c) => c.id === chosen);

  if (picked) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ml-1 mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[13px] font-bold text-primary"
      >
        <Check className="h-3.5 w-3.5" />
        Saved as {picked.emoji} {picked.label}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="mt-2 mb-1 max-w-[92%]"
    >
      <p className="ml-1 mb-1.5 text-[12px] font-semibold text-muted-foreground">
        What was the ${amount.toFixed(2)} for? <span className="font-normal">Tap one, it's free</span>
      </p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose a category">
        {PICKABLE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-card px-3 h-9 text-[14px] font-semibold text-foreground shadow-card",
              "active:scale-95 transition-transform"
            )}
          >
            <span aria-hidden="true">{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
};
