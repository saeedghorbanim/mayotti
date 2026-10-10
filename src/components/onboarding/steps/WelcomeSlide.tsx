import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WelcomeSlideProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  accent: "primary" | "success";
}

const accentClasses: Record<WelcomeSlideProps["accent"], { badge: string; blob: string; icon: string }> = {
  primary: {
    badge: "bg-accent",
    blob: "bg-primary/30",
    icon: "text-primary",
  },
  success: {
    badge: "bg-accent",
    blob: "bg-success/30",
    icon: "text-success",
  },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export const WelcomeSlide = ({ icon: Icon, title, subtitle, accent }: WelcomeSlideProps) => {
  const classes = accentClasses[accent];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="min-h-full flex flex-col items-center justify-center text-center py-10"
    >
      <div className="relative mb-8">
        <div className={cn("absolute -inset-6 rounded-full blur-3xl opacity-40 animate-float", classes.blob)} />
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "relative w-28 h-28 rounded-full flex items-center justify-center",
            classes.badge
          )}
        >
          <Icon className={cn("w-14 h-14", classes.icon)} strokeWidth={1.75} />
        </motion.div>
      </div>

      <motion.h1 variants={item} className="font-display text-2xl font-bold text-foreground px-4 mb-3">
        {title}
      </motion.h1>
      <motion.p variants={item} className="text-muted-foreground text-base px-6 max-w-sm">
        {subtitle}
      </motion.p>
    </motion.div>
  );
};
