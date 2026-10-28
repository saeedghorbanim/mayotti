import { motion, useReducedMotion } from "framer-motion";
import { addMonths, format } from "date-fns";
import { OnboardingAnswers } from "@/hooks/useOnboarding";
import { CountUp } from "@/components/onboarding/CountUp";

interface SavingsProjectionInsightProps {
  answers: OnboardingAnswers;
}

const MONTHS = 6;
const BAR_AREA = 180; // px height of the tallest bar

export const SavingsProjectionInsight = ({ answers }: SavingsProjectionInsightProps) => {
  const reduceMotion = useReducedMotion();
  const monthlyGoal =
    answers.monthlySavingsGoal && answers.monthlySavingsGoal > 0 ? answers.monthlySavingsGoal : 100;
  const total = monthlyGoal * MONTHS;

  const bars = Array.from({ length: MONTHS }).map((_, i) => ({
    label: format(addMonths(new Date(), i + 1), "MMM"),
    value: monthlyGoal * (i + 1),
    height: ((i + 1) / MONTHS) * BAR_AREA,
    delay: 0.3 + i * 0.12,
    isLast: i === MONTHS - 1,
  }));

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <CountUp
          to={total}
          prefix="$"
          delay={0.2}
          duration={1.6}
          className="block text-[44px] leading-[48px] font-extrabold tracking-[-0.03em] text-primary"
        />
        <p className="text-sm text-muted-foreground mt-1">
          saved in 6 months at <span className="font-bold text-foreground">${monthlyGoal}/mo</span>
        </p>
      </div>

      <div className="w-full bg-card rounded-3xl px-4 pt-5 pb-4 shadow-card">
        <div className="flex items-end justify-between gap-2" style={{ height: BAR_AREA + 28 }}>
          {bars.map((b) => (
            <div key={b.label} className="flex-1 flex flex-col items-center justify-end h-full">
              <motion.span
                className={b.isLast ? "text-xs font-extrabold text-primary mb-1" : "text-[11px] font-semibold text-muted-foreground mb-1"}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: b.delay + 0.35, duration: 0.3 }}
              >
                ${b.value.toLocaleString("en-US")}
              </motion.span>
              <motion.div
                className={b.isLast ? "w-full rounded-xl bg-primary" : "w-full rounded-xl bg-accent"}
                style={{ originY: 1 }}
                initial={{ height: reduceMotion ? b.height : 0 }}
                animate={{ height: b.height }}
                transition={{ delay: b.delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between gap-2 mt-2">
          {bars.map((b) => (
            <span
              key={b.label}
              className={b.isLast ? "flex-1 text-center text-xs font-bold text-primary" : "flex-1 text-center text-xs font-semibold text-muted-foreground"}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
