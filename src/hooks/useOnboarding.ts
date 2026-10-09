import { useState, useEffect } from "react";

export interface OnboardingAnswers {
  gender: "female" | "male" | "non_binary" | "prefer_not_to_say" | null;
  ageRange: "18_24" | "25_34" | "35_44" | "45_54" | "55_64" | "65_plus" | null;
  incomeRange:
    | "under_25k"
    | "25k_50k"
    | "50k_75k"
    | "75k_100k"
    | "100k_150k"
    | "over_150k"
    | "prefer_not_to_say"
    | null;
  spendingStyle: "planner" | "impulsive" | "balanced" | "avoider" | null;
  topSpendingCategories: string[];
  biggestChallenge: "overspending" | "no_savings" | "debt" | "irregular_income" | "losing_track" | null;
  priorBudgetingExperience: "never" | "tried_and_stopped" | "tried_ok" | "currently_budgeting" | null;
  primaryGoal: "save_more" | "track_spending" | "pay_off_debt" | "build_habit" | "stick_to_budget" | null;
  monthlySavingsGoal: number | null;
  notificationPreference: "daily" | "weekly" | "important_only" | "none" | null;
}

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  completedAt: string | null;
  answers: OnboardingAnswers;
}

const ONBOARDING_KEY = "mayotti_onboarding";

const defaultAnswers: OnboardingAnswers = {
  gender: null,
  ageRange: null,
  incomeRange: null,
  spendingStyle: null,
  topSpendingCategories: [],
  biggestChallenge: null,
  priorBudgetingExperience: null,
  primaryGoal: null,
  monthlySavingsGoal: 100,
  notificationPreference: null,
};

const defaultState: OnboardingState = {
  hasCompletedOnboarding: false,
  completedAt: null,
  answers: defaultAnswers,
};

// TEMPORARY (testing): every fresh app launch always starts from the
// onboarding welcome screen, regardless of subscription status or a prior
// completion. Remove this override — and restore
// `hasCompletedOnboarding: parsed.hasCompletedOnboarding === true` — once
// the RevenueCat paywall is fully configured and this no longer needs to
// be forced open for testing.
const FORCE_ONBOARDING_ON_LAUNCH = true;

const readStoredState = (): OnboardingState => {
  try {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        hasCompletedOnboarding: FORCE_ONBOARDING_ON_LAUNCH ? false : parsed.hasCompletedOnboarding === true,
        completedAt: parsed.completedAt || null,
        answers: { ...defaultAnswers, ...parsed.answers },
      };
    }
  } catch {
    // Fall back to default on corrupted data
  }
  return defaultState;
};

export const useOnboarding = () => {
  // Initialize synchronously from localStorage to avoid a flash of the
  // wrong screen (splash → onboarding vs. splash → main app) on first render.
  const [state, setState] = useState<OnboardingState>(readStoredState);

  // Re-sync from localStorage on mount (handles potential stale state).
  useEffect(() => {
    setState(readStoredState());
  }, []);

  const updateAnswer = <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => {
    setState((prev) => {
      const next = { ...prev, answers: { ...prev.answers, [key]: value } };
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(next));
      return next;
    });
  };

  const completeOnboarding = () => {
    setState((prev) => {
      const next = { ...prev, hasCompletedOnboarding: true, completedAt: new Date().toISOString() };
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setState(defaultState);
  };

  return {
    hasCompletedOnboarding: state.hasCompletedOnboarding,
    answers: state.answers,
    updateAnswer,
    completeOnboarding,
    resetOnboarding,
  };
};
