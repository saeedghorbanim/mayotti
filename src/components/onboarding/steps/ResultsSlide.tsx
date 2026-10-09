import { motion } from "framer-motion";
import { Check, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis } from "recharts";
import { addMonths, format } from "date-fns";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { OnboardingAnswers } from "@/hooks/useOnboarding";

interface ResultsSlideProps {
  answers: OnboardingAnswers;
}

const chartConfig: ChartConfig = {
  savings: { label: "Projected savings", color: "hsl(var(--primary))" },
};

export const ResultsSlide = ({ answers }: ResultsSlideProps) => {
  const monthlyGoal =
    answers.monthlySavingsGoal && answers.monthlySavingsGoal > 0 ? answers.monthlySavingsGoal : 100;

  const data = Array.from({ length: 6 }).map((_, i) => ({
    month: `${i + 1}`,
    savings: monthlyGoal * (i + 1),
  }));

  const totalSaved = data[data.length - 1].savings;
  const targetDate = format(addMonths(new Date(), 6), "MMMM d");

  return (
    <div className="min-h-full flex flex-col items-center py-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-5"
      >
        <Check className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
      </motion.div>

      <h1 className="font-display text-2xl font-bold text-foreground mb-6 px-4">
        You're all set! Here's your plan to save more.
      </h1>

      <p className="text-muted-foreground text-sm mb-2">Your target date:</p>
      <div className="flex items-center gap-2 bg-card border border-border rounded-full px-5 py-2.5 mb-6">
        <Calendar className="w-4 h-4 text-primary" />
        <span className="font-semibold text-foreground">By {targetDate}</span>
      </div>

      <div className="w-full bg-card border border-border rounded-2xl p-5 mb-6 text-left">
        <p className="font-semibold text-foreground mb-3">Your savings timeline</p>
        <ChartContainer config={chartConfig} className="w-full aspect-[4/3] max-h-[180px]">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="resultsSavingsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <Area
              type="monotone"
              dataKey="savings"
              stroke="hsl(var(--primary))"
              fill="url(#resultsSavingsFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>

      <p className="text-muted-foreground text-sm mb-3 px-4">
        Here's what you stand to gain by following your <span className="font-semibold text-primary">Mayotti</span>{" "}
        plan
      </p>

      <div className="w-full flex items-center gap-4 bg-card border border-border rounded-2xl p-5">
        <span className="text-3xl">💰</span>
        <div className="text-left">
          <p className="font-display text-2xl font-bold text-primary">${totalSaved.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">you could keep in your pocket</p>
        </div>
      </div>
    </div>
  );
};
