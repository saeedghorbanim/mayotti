import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { OnboardingAnswers } from "@/hooks/useOnboarding";

export interface QuestionOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

export interface QuestionConfig {
  id: keyof OnboardingAnswers;
  question: string;
  helper?: string;
  inputType: "single-select" | "multi-select" | "slider";
  options?: QuestionOption[];
  sliderConfig?: { min: number; max: number; step: number; formatValue: (n: number) => string };
}

export type QuestionValue = string | string[] | number | null;

interface QuestionSlideProps {
  config: QuestionConfig;
  value: QuestionValue;
  onChange: (value: QuestionValue) => void;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const QuestionSlide = ({ config, value, onChange }: QuestionSlideProps) => {
  const isMulti = config.inputType === "multi-select";
  const selectedValues: string[] = isMulti ? (Array.isArray(value) ? value : []) : [];

  const toggleOption = (optionValue: string) => {
    if (isMulti) {
      const next = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(next);
    } else {
      onChange(optionValue);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center py-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">{config.question}</h1>
        {config.helper && <p className="text-muted-foreground text-sm">{config.helper}</p>}
      </motion.div>

      {config.inputType === "slider" && config.sliderConfig && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="px-2 pt-6">
          <p className="text-center font-display text-4xl font-bold text-primary mb-8">
            {config.sliderConfig.formatValue((value as number) ?? config.sliderConfig.min)}
          </p>
          <Slider
            min={config.sliderConfig.min}
            max={config.sliderConfig.max}
            step={config.sliderConfig.step}
            value={[(value as number) ?? config.sliderConfig.min]}
            onValueChange={([v]) => onChange(v)}
          />
        </motion.div>
      )}

      {(config.inputType === "single-select" || config.inputType === "multi-select") && config.options && (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
          {config.options.map((option) => {
            const isSelected = isMulti ? selectedValues.includes(option.value) : value === option.value;
            return (
              <motion.button
                key={option.value}
                variants={item}
                whileTap={{ scale: 0.96 }}
                aria-pressed={isSelected}
                onClick={() => toggleOption(option.value)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-colors min-h-[88px]",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                )}
              >
                {option.icon && <option.icon className="w-6 h-6" />}
                <span className="text-sm font-medium leading-tight">{option.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};
