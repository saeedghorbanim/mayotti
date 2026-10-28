import { motion, useReducedMotion } from "framer-motion";
import { OnboardingAnswers } from "@/hooks/useOnboarding";
import { CountUp } from "@/components/onboarding/CountUp";

interface SpendingBreakdownInsightProps {
  answers: OnboardingAnswers;
}

const CATEGORY_LABELS: Record<string, string> = {
  groceries: "Groceries",
  dining: "Dining & Takeout",
  transportation: "Transportation",
  shopping: "Shopping",
  entertainment: "Entertainment",
  bills_utilities: "Bills & Utilities",
  housing: "Housing & Rent",
  health_fitness: "Health & Fitness",
  travel: "Travel",
  subscriptions: "Subscriptions",
};

// Same palette as the Stats tab, so the preview matches the real thing.
const COLORS = ["#1F6B4F", "#0D9488", "#2563EB", "#8B5CF6", "#EC4899"];
const SHARES = [34, 24, 18, 14, 10];
const FILLERS = ["groceries", "dining", "transportation", "shopping", "entertainment", "subscriptions"];

const RADIUS = 70;
const STROKE = 22;
const CIRC = 2 * Math.PI * RADIUS;
const GAP = 4; // px of empty ring between segments

export const SpendingBreakdownInsight = ({ answers }: SpendingBreakdownInsightProps) => {
  const reduceMotion = useReducedMotion();

  // The user's picks come first (they spend most there), topped up with common
  // categories so the example always looks like a real month.
  const picked = answers.topSpendingCategories.slice(0, 5);
  const keys = [...picked, ...FILLERS.filter((k) => !picked.includes(k))].slice(0, 5);
  const data = keys.map((key, i) => ({ key, label: CATEGORY_LABELS[key] || key, share: SHARES[i], color: COLORS[i] }));

  let offset = 0;
  const segments = data.map((d, i) => {
    const length = (d.share / 100) * CIRC;
    const seg = { ...d, length: Math.max(length - GAP, 1), offset, delay: 0.15 + i * 0.18 };
    offset += length;
    return seg;
  });

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-[200px] h-[200px]">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="hsl(var(--muted))" strokeWidth={STROKE} />
          {segments.map((s) => (
            <motion.circle
              key={s.key}
              cx="100"
              cy="100"
              r={RADIUS}
              fill="none"
              stroke={s.color}
              strokeWidth={STROKE}
              strokeDashoffset={-s.offset}
              initial={{ strokeDasharray: reduceMotion ? `${s.length} ${CIRC}` : `0 ${CIRC}` }}
              animate={{ strokeDasharray: `${s.length} ${CIRC}` }}
              transition={{ duration: 0.55, delay: s.delay, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
        </svg>
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <CountUp
            to={data[0].share}
            suffix="%"
            delay={0.3}
            className="text-[32px] leading-9 font-extrabold tracking-[-0.03em] text-foreground"
          />
          <span className="text-[13px] font-semibold text-muted-foreground max-w-[110px] leading-4 mt-1">
            on {data[0].label}
          </span>
        </motion.div>
      </div>

      <div className="w-full bg-card rounded-3xl p-4 shadow-card flex flex-col gap-3">
        {data.map((d, i) => (
          <motion.div
            key={d.key}
            initial={{ opacity: 0, x: reduceMotion ? 0 : -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.12, duration: 0.35 }}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-semibold text-foreground min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="truncate">{d.label}</span>
              </span>
              <span className="font-bold text-muted-foreground">{d.share}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: d.color }}
                initial={{ width: reduceMotion ? `${(d.share / SHARES[0]) * 100}%` : 0 }}
                animate={{ width: `${(d.share / SHARES[0]) * 100}%` }}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground -mt-3">Example month based on your answers</p>
    </div>
  );
};
