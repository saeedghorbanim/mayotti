import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Gauge, PiggyBank, RefreshCw, LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { WelcomeSlide } from "@/components/onboarding/steps/WelcomeSlide";
import { GetStartedSlide } from "@/components/onboarding/steps/GetStartedSlide";
import { QuestionSlide, type QuestionConfig, type QuestionValue } from "@/components/onboarding/steps/QuestionSlide";
import { InsightSlide } from "@/components/onboarding/steps/InsightSlide";
import { CalculatingSlide } from "@/components/onboarding/steps/CalculatingSlide";
import { ResultsSlide } from "@/components/onboarding/steps/ResultsSlide";
import { SpendingBreakdownInsight } from "@/components/onboarding/insights/SpendingBreakdownInsight";
import { SavingsProjectionInsight } from "@/components/onboarding/insights/SavingsProjectionInsight";
import { HowItWorksInsight } from "@/components/onboarding/insights/HowItWorksInsight";
import { useInAppPurchase } from "@/hooks/useInAppPurchase";
import { useAppUsage } from "@/hooks/useAppUsage";
import type { OnboardingAnswers } from "@/hooks/useOnboarding";

interface OnboardingProps {
  answers: OnboardingAnswers;
  updateAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  onComplete: () => void;
}

type OnboardingStep =
  | { kind: "welcome"; icon: LucideIcon; title: string; subtitle: string; accent: "primary" | "success" }
  | { kind: "getstarted" }
  | (QuestionConfig & { kind: "question"; required: boolean })
  | { kind: "insight"; title: string; subtitle: string; Component: React.ComponentType<{ answers: OnboardingAnswers }> }
  | { kind: "calculating" }
  | { kind: "results" };

const CATEGORY_OPTIONS = [
  { value: "groceries", label: "Groceries" },
  { value: "dining", label: "Dining & Takeout" },
  { value: "transportation", label: "Transportation" },
  { value: "shopping", label: "Shopping" },
  { value: "entertainment", label: "Entertainment" },
  { value: "bills_utilities", label: "Bills & Utilities" },
  { value: "housing", label: "Housing & Rent" },
  { value: "health_fitness", label: "Health & Fitness" },
  { value: "travel", label: "Travel" },
  { value: "subscriptions", label: "Subscriptions" },
];

const QUESTIONS: (QuestionConfig & { required: boolean })[] = [
  {
    id: "gender",
    question: "What's your gender?",
    helper: "Helps us tailor tips for you.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "female", label: "Female" },
      { value: "male", label: "Male" },
      { value: "non_binary", label: "Non-binary" },
      { value: "prefer_not_to_say", label: "Prefer not to say" },
    ],
  },
  {
    id: "ageRange",
    question: "How old are you?",
    inputType: "single-select",
    required: true,
    options: [
      { value: "18_24", label: "18–24" },
      { value: "25_34", label: "25–34" },
      { value: "35_44", label: "35–44" },
      { value: "45_54", label: "45–54" },
      { value: "55_64", label: "55–64" },
      { value: "65_plus", label: "65+" },
    ],
  },
  {
    id: "incomeRange",
    question: "What's your income range?",
    helper: "Used only to personalize your savings targets.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "under_25k", label: "Under $25k/yr" },
      { value: "25k_50k", label: "$25k–$50k/yr" },
      { value: "50k_75k", label: "$50k–$75k/yr" },
      { value: "75k_100k", label: "$75k–$100k/yr" },
      { value: "100k_150k", label: "$100k–$150k/yr" },
      { value: "over_150k", label: "Over $150k/yr" },
      { value: "prefer_not_to_say", label: "Prefer not to say" },
    ],
  },
  {
    id: "spendingStyle",
    question: "How would you describe your spending?",
    inputType: "single-select",
    required: true,
    options: [
      { value: "planner", label: "I plan every purchase" },
      { value: "impulsive", label: "I often buy on impulse" },
      { value: "balanced", label: "A mix of both" },
      { value: "avoider", label: "I avoid thinking about it" },
    ],
  },
  {
    id: "topSpendingCategories",
    question: "Where does most of your money go?",
    helper: "Pick all that apply.",
    inputType: "multi-select",
    required: true,
    options: CATEGORY_OPTIONS,
  },
  {
    id: "biggestChallenge",
    question: "What's your biggest money challenge?",
    inputType: "single-select",
    required: true,
    options: [
      { value: "overspending", label: "I overspend without noticing" },
      { value: "no_savings", label: "I can't save anything" },
      { value: "debt", label: "I'm paying down debt" },
      { value: "irregular_income", label: "My income is irregular" },
      { value: "losing_track", label: "I just lose track of things" },
    ],
  },
  {
    id: "priorBudgetingExperience",
    question: "Have you tried budgeting before?",
    inputType: "single-select",
    required: true,
    options: [
      { value: "never", label: "Never tried" },
      { value: "tried_and_stopped", label: "Tried and gave up" },
      { value: "tried_ok", label: "Tried, worked okay" },
      { value: "currently_budgeting", label: "I currently budget" },
    ],
  },
  {
    id: "primaryGoal",
    question: "What do you want most from Mayotti?",
    inputType: "single-select",
    required: true,
    options: [
      { value: "save_more", label: "Save more money" },
      { value: "track_spending", label: "Understand my spending" },
      { value: "pay_off_debt", label: "Pay off debt" },
      { value: "build_habit", label: "Build a consistent habit" },
      { value: "stick_to_budget", label: "Stick to a budget" },
    ],
  },
  {
    id: "monthlySavingsGoal",
    question: "How much would you like to save each month?",
    helper: "Drag to set your goal — you can change this anytime.",
    inputType: "slider",
    required: false,
    sliderConfig: { min: 0, max: 2000, step: 50, formatValue: (n: number) => `$${n}` },
  },
  {
    id: "notificationPreference",
    question: "How often should we check in?",
    inputType: "single-select",
    required: true,
    options: [
      { value: "daily", label: "Daily" },
      { value: "weekly", label: "Weekly" },
      { value: "important_only", label: "Important only" },
      { value: "none", label: "None" },
    ],
  },
];

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    kind: "welcome",
    icon: Eye,
    title: "See every dollar clearly.",
    subtitle: "Just tell Mayotti what you spent in plain English — no spreadsheets, no manual categorizing.",
    accent: "primary",
  },
  {
    kind: "welcome",
    icon: Gauge,
    title: "Stay ahead of your budget.",
    subtitle: "Get warned before you overspend, with smart budget tracking that updates in real time.",
    accent: "success",
  },
  {
    kind: "welcome",
    icon: PiggyBank,
    title: "Build savings on autopilot.",
    subtitle: "Mayotti spots recurring costs and shows you exactly where to cut back to hit your goals.",
    accent: "primary",
  },
  { kind: "getstarted" },
  ...QUESTIONS.map((q) => ({ ...q, kind: "question" as const })),
  {
    kind: "insight",
    title: "See where your money goes",
    subtitle: "Mayotti automatically breaks down your spending by category.",
    Component: SpendingBreakdownInsight,
  },
  {
    kind: "insight",
    title: "Hit your savings goals",
    subtitle: "Small, consistent savings add up fast.",
    Component: SavingsProjectionInsight,
  },
  {
    kind: "insight",
    title: "Effortless money management",
    subtitle: "Here's how Mayotti keeps you on track.",
    Component: HowItWorksInsight,
  },
  { kind: "calculating" },
  { kind: "results" },
];

const QUESTION_INSIGHT_STEPS = ONBOARDING_STEPS.filter((s) => s.kind === "question" || s.kind === "insight");
const GETSTARTED_INDEX = ONBOARDING_STEPS.findIndex((s) => s.kind === "getstarted");

const pageVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24, transition: { duration: 0.15 } }),
};

const hasAnswer = (value: QuestionValue) => {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== "";
};

const Onboarding = ({ answers, updateAnswer, onComplete }: OnboardingProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const foundSubscriptionRef = useRef(false);

  const { setSubscriptionActive } = useAppUsage();
  const { restore, isLoading: isRestoring } = useInAppPurchase((productId) => {
    foundSubscriptionRef.current = true;
    setSubscriptionActive(productId);
  });

  const step = ONBOARDING_STEPS[currentIndex];
  const isLastStep = currentIndex === ONBOARDING_STEPS.length - 1;

  const goNext = () => {
    setDirection(1);
    if (isLastStep) {
      onComplete();
      return;
    }
    setCurrentIndex((i) => i + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const goToGetStarted = () => {
    setDirection(1);
    setCurrentIndex(GETSTARTED_INDEX);
  };

  const handleRestoreLogin = async () => {
    foundSubscriptionRef.current = false;
    toast.loading("Restoring purchases...", { id: "onboarding-restore" });
    await restore();
    if (foundSubscriptionRef.current) {
      toast.success("Welcome back!", { id: "onboarding-restore" });
      onComplete();
    } else {
      toast.error("No previous purchases found.", { id: "onboarding-restore" });
    }
  };

  const canContinue = step.kind !== "question" || !step.required || hasAnswer(answers[step.id]);

  const questionInsightIndex = QUESTION_INSIGHT_STEPS.indexOf(step);
  const progress =
    questionInsightIndex >= 0 ? { current: questionInsightIndex + 1, total: QUESTION_INSIGHT_STEPS.length } : undefined;
  const dots = step.kind === "welcome" ? { count: 3, activeIndex: currentIndex } : undefined;

  const renderStep = () => {
    switch (step.kind) {
      case "welcome":
        return <WelcomeSlide icon={step.icon} title={step.title} subtitle={step.subtitle} accent={step.accent} />;
      case "getstarted":
        return <GetStartedSlide />;
      case "question":
        return <QuestionSlide config={step} value={answers[step.id]} onChange={(value) => updateAnswer(step.id, value)} />;
      case "insight":
        return (
          <InsightSlide title={step.title} subtitle={step.subtitle}>
            <step.Component answers={answers} />
          </InsightSlide>
        );
      case "calculating":
        return <CalculatingSlide onDone={goNext} />;
      case "results":
        return <ResultsSlide answers={answers} />;
      default:
        return null;
    }
  };

  const renderFooter = () => {
    if (step.kind === "calculating") {
      return null;
    }

    if (step.kind === "getstarted") {
      return (
        <div className="flex flex-col gap-3">
          <Button size="lg" className="w-full h-14 text-lg font-semibold" onClick={goNext}>
            Get Started
          </Button>
          <Button variant="link" className="text-muted-foreground" onClick={handleRestoreLogin} disabled={isRestoring}>
            {isRestoring ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              "Already got an account? Log in"
            )}
          </Button>
        </div>
      );
    }

    if (step.kind === "welcome") {
      return (
        <div className="flex flex-col gap-2">
          <Button size="lg" className="w-full h-14 text-lg font-semibold" onClick={goNext}>
            Continue
          </Button>
          <Button variant="ghost" className="text-muted-foreground" onClick={goToGetStarted}>
            Skip
          </Button>
        </div>
      );
    }

    return (
      <Button size="lg" className="w-full h-14 text-lg font-semibold" onClick={goNext} disabled={!canContinue}>
        {isLastStep ? "Start Saving" : "Continue"}
      </Button>
    );
  };

  const showBack = currentIndex > 0 && step.kind !== "calculating" && step.kind !== "results";

  return (
    <OnboardingShell onBack={showBack ? goBack : undefined} progress={progress} dots={dots} footer={renderFooter()}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="min-h-full"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </OnboardingShell>
  );
};

export default Onboarding;
