import { motion } from "framer-motion";
import { MessageSquare, Gauge, RefreshCw } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Tell the chat what you spent",
    description: "\"Spent $12 on lunch\" — that's it. No forms, no menus.",
  },
  {
    icon: Gauge,
    title: "Mayotti tracks it instantly",
    description: "Every expense is categorized and checked against your budget in real time.",
  },
  {
    icon: RefreshCw,
    title: "Recurring costs get flagged",
    description: "Subscriptions and repeat charges are spotted automatically so nothing sneaks by.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35 } },
};

export const HowItWorksInsight = () => {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-5 px-2">
      {steps.map((step, i) => (
        <motion.div key={step.title} variants={item} className="flex gap-4 relative">
          {i < steps.length - 1 && <span className="absolute left-6 top-12 bottom-[-20px] w-px bg-border" />}
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 relative z-10">
            <step.icon className="w-6 h-6" />
          </div>
          <div className="pt-1">
            <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
