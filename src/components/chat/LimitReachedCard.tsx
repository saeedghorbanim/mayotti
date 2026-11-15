import { motion, useReducedMotion } from "framer-motion";
import { CalendarClock, BarChart3, History, Sparkles } from "lucide-react";
import { SproutLogo } from "@/components/brand/SproutLogo";

interface LimitReachedCardProps {
  limit: number;
  resetDate: Date;
  /** Bumped each time the user tries to send again, to give the card a gentle nudge. */
  nudgeKey?: number;
  onOpenTab?: (tab: "stats" | "history") => void;
}

/**
 * Shown in the chat when a subscriber has used this month's AI messages.
 * Friendly, not a dead end: when they come back, what they can still do,
 * and that more AI capacity is on the way.
 */
export const LimitReachedCard = ({ limit, resetDate, nudgeKey = 0, onOpenTab }: LimitReachedCardProps) => {
  const reduceMotion = useReducedMotion();
  const days = Math.max(1, Math.ceil((resetDate.getTime() - Date.now()) / 86_400_000));
  const dateLabel = resetDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <motion.div
      key={nudgeKey}
      initial={nudgeKey === 0 ? { opacity: 0, y: reduceMotion ? 0 : 16, scale: 0.98 } : { x: 0 }}
      animate={nudgeKey === 0 ? { opacity: 1, y: 0, scale: 1 } : reduceMotion ? {} : { x: [0, -6, 6, -4, 4, 0] }}
      transition={{ duration: nudgeKey === 0 ? 0.45 : 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-1 my-3 rounded-[22px] bg-card shadow-card overflow-hidden"
      role="status"
    >
      <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-accent to-card">
        <span aria-hidden="true" className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-primary/10" />
        <div className="relative flex items-center gap-3">
          <SproutLogo size={44} title="" className="shrink-0 rounded-[13px] shadow-card" />
          <div className="min-w-0">
            <p className="text-[17px] font-extrabold leading-tight text-foreground">You've used this month's AI messages</p>
            <p className="text-[13px] font-semibold text-muted-foreground mt-0.5">
              All {limit} used · thanks for tracking with Mayotti
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-5 space-y-3">
        <div className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3.5 py-3">
          <CalendarClock className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-[14px] leading-5 text-foreground">
            They refresh on <strong className="font-bold">{dateLabel}</strong>{" "}
            <span className="text-muted-foreground">
              (in {days} day{days === 1 ? "" : "s"})
            </span>
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-primary/30 px-3.5 py-3">
          <Sparkles className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <p className="text-[14px] leading-5 text-foreground">
            <strong className="font-bold">More is on the way.</strong>{" "}
            <span className="text-muted-foreground">
              We're working on adding more AI messages in the near future.
            </span>
          </p>
        </div>

        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground mb-2">Until then</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOpenTab?.("stats")}
              className="flex items-center justify-center gap-2 h-11 rounded-xl bg-accent text-primary text-[14px] font-bold"
            >
              <BarChart3 className="h-4 w-4" /> See your stats
            </button>
            <button
              onClick={() => onOpenTab?.("history")}
              className="flex items-center justify-center gap-2 h-11 rounded-xl bg-accent text-primary text-[14px] font-bold"
            >
              <History className="h-4 w-4" /> View history
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
