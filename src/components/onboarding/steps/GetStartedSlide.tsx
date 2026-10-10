import { motion } from "framer-motion";
import { Eye, Gauge, PiggyBank } from "lucide-react";
import appIcon from "@/assets/mayotti-logo.png";

const highlights = [
  { icon: Eye, label: "Track spending in plain English" },
  { icon: Gauge, label: "Stay ahead of your budget" },
  { icon: PiggyBank, label: "Build savings automatically" },
];

export const GetStartedSlide = () => {
  return (
    <div className="min-h-full flex flex-col items-center justify-center text-center py-8">
      <motion.img
        src={appIcon}
        alt="Mayotti"
        initial={{ opacity: 0, scale: 0.8, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-24 h-24 rounded-3xl shadow-card mb-5"
      />
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="font-display text-[34px] font-extrabold tracking-[-0.03em] text-primary mb-2"
      >
        mayotti
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="text-muted-foreground text-base px-8 max-w-sm mb-8"
      >
        Save Smart, Live Better.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="w-full max-w-xs space-y-3"
      >
        {highlights.map((h) => (
          <div
            key={h.label}
            className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 text-left"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <h.icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-foreground">{h.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
