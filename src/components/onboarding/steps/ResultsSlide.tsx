import { motion, useReducedMotion } from "framer-motion";
import { Check, Calendar, Sprout, Flag } from "lucide-react";
import { addMonths, format } from "date-fns";
import type { OnboardingAnswers } from "@/hooks/useOnboarding";
import { CountUp } from "@/components/onboarding/CountUp";
import { cn } from "@/lib/utils";

interface ResultsSlideProps {
  answers: OnboardingAnswers;
}

export const ResultsSlide = ({ answers }: ResultsSlideProps) => {
  const reduceMotion = useReducedMotion();
  const monthlyGoal =
    answers.monthlySavingsGoal && answers.monthlySavingsGoal > 0 ? answers.monthlySavingsGoal : 100;
  const totalSaved = monthlyGoal * 6;
  const targetDate = format(addMonths(new Date(), 6), "MMMM d");

  const milestones = [
    { icon: Sprout, title: "First month", detail: format(addMonths(new Date(), 1), "MMMM d"), amount: monthlyGoal },
    { icon: Sprout, title: "Halfway there", detail: format(addMonths(new Date(), 3), "MMMM d"), amount: monthlyGoal * 3 },
    { icon: Flag, title: "Goal reached", detail: targetDate, amount: totalSaved, isGoal: true },
  ];

  return (
    <div className="min-h-full flex flex-col items-center py-6 text-center">
      <div className="relative mb-5">
        {!reduceMotion && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-primary"
            initial={{ scale: 1, opacity: 0.35 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 1.4, delay: 0.3, ease: "easeOut", repeat: 1 }}
          />
        )}
        <motion.div
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
        </motion.div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-2xl font-bold text-foreground mb-5 px-4"
      >
        You're all set! Here's your plan to save more.
      </motion.h1>

      {/* Hero number */}
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="w-full bg-primary rounded-3xl px-5 py-5 mb-4 text-left text-primary-foreground relative overflow-hidden"
      >
        <span aria-hidden="true" className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-white/10" />
        <span aria-hidden="true" className="absolute right-10 -bottom-12 w-24 h-24 rounded-full bg-white/10" />
        <p className="text-sm font-semibold opacity-80">You could keep</p>
        <CountUp
          to={totalSaved}
          prefix="$"
          delay={0.5}
          duration={1.6}
          className="block text-[40px] leading-[44px] font-extrabold tracking-[-0.03em]"
        />
        <p className="flex items-center gap-1.5 text-sm font-semibold opacity-90 mt-1">
          <Calendar className="w-4 h-4" /> by {targetDate}
        </p>
      </motion.div>

      {/* Milestones */}
      <div className="w-full bg-card rounded-3xl p-5 shadow-card text-left">
        <p className="font-bold text-foreground mb-4">Your milestones</p>
        <div className="relative flex flex-col gap-5">
          <span aria-hidden="true" className="absolute left-5 top-5 bottom-5 w-0.5 bg-muted" />
          <motion.span
            aria-hidden="true"
            className="absolute left-5 top-5 w-0.5 bg-primary"
            initial={{ height: reduceMotion ? "calc(100% - 40px)" : 0 }}
            animate={{ height: "calc(100% - 40px)" }}
            transition={{ delay: 0.7, duration: 1.2, ease: "easeInOut" }}
          />
          {milestones.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, x: reduceMotion ? 0 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75 + i * 0.4, duration: 0.35 }}
              className="relative flex items-center gap-3"
            >
              <span
                className={cn(
                  "relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  m.isGoal ? "bg-primary text-primary-foreground" : "bg-accent text-primary"
                )}
              >
                <m.icon className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-foreground leading-5">{m.title}</p>
                <p className="text-[13px] text-muted-foreground leading-[18px]">{m.detail}</p>
              </div>
              <span className={cn("text-[15px] font-extrabold", m.isGoal ? "text-primary" : "text-foreground")}>
                ${m.amount.toLocaleString("en-US")}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
