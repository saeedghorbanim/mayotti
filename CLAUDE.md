# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint
npm run preview      # Preview production build
```

There is no test suite configured for this project.

To sync to native platforms after a web build:
```bash
npx cap sync         # Sync web assets to iOS/Android
npx cap open ios     # Open in Xcode
npx cap open android # Open in Android Studio
```

## Architecture

**Mayotti** is a mobile-first AI expense tracker built with React + TypeScript + Vite, wrapped with Capacitor for iOS/Android deployment.

### Data Flow

All user data (expenses, budget, onboarding answers, subscription status) lives in **browser localStorage** — there is no server-side persistence. Supabase is used only for Edge Functions:
- `/chat` — AI expense parsing via natural language
- `/analyze-receipt` — OCR receipt image analysis

### Key Directories

- `src/components/views/` — The four main tab views: Chat, Stats, Recurring, History
- `src/components/onboarding/` — First-run onboarding screens (shell, question/insight step renderers, chart insights)
- `src/components/ui/` — shadcn-ui component library (don't modify these)
- `src/hooks/` — All state management; localStorage reads are synchronous to avoid race conditions
- `src/integrations/supabase/` — Supabase client configuration and generated types

### Onboarding Flow

- Gated in `src/App.tsx` on `useOnboarding().hasCompletedOnboarding` (localStorage key `mayotti_onboarding`): the root route renders `Onboarding` instead of `Index` until it's marked complete
- `src/pages/Onboarding.tsx` drives one flat, data-driven array of 19 steps: 3 welcome slides (each with a "Skip" button straight to Get Started, in addition to Continue) → a branded "Get Started" / "Already got an account? Log in" screen → 10 personalization questions → 3 chart/insight payoff slides → an auto-playing "calculating your plan" slide → a final results/roadmap slide with the real completion CTA
- Only the 10 questions + 3 insight slides count toward the "Step X of 13" progress bar shown in `OnboardingShell` — the welcome slides, Get Started screen, and the calculating/results epilogue are outside that count and show no numeric progress
- The `incomeRange` question is required (like most others) but always includes a "Prefer not to say" option, so nobody is forced to disclose income — they just have to actively choose something before Continue enables. `gender` and `monthlySavingsGoal` remain the only genuinely optional questions.
- "Log in" is **not** a real auth system — this app has none. It calls the existing RevenueCat restore-purchases flow (`useInAppPurchase`); on a found entitlement it marks onboarding complete and skips straight to `Index`
- Answers (`OnboardingAnswers`) are persisted incrementally to localStorage as each question is answered, and are only used to personalize the insight/results slides (spending breakdown chart, savings projection chart, target date, "$X you could keep" figure) — never wired into `useLocalStorage`'s real `Expense`/`BudgetLimit` records
- The final two steps (`CalculatingSlide`, `ResultsSlide`) replace the old direct "Start Saving" completion: `CalculatingSlide` auto-advances itself via an internal timer (no back/skip) once its progress animation finishes, then `ResultsSlide` shows the personalized payoff and is the step that actually calls `onComplete`
- `framer-motion` was added for onboarding page transitions and staggered reveals — it's the first animation library in the codebase; existing Tailwind keyframes (`fade-in`, `slide-in`, `float`, `pulse-glow`) are still used for decorative/infinite-loop effects
- The insight/results pages are the first real usage of `recharts` / `src/components/ui/chart.tsx` in the app (previously installed but unused)

### Subscription Model (Hard Paywall)

- **No free tier.** The old 3-free-prompts model is gone. Once onboarding completes, a native build requires an active `premium` entitlement before the user ever reaches `Index` — there is no browsing or usage without subscribing.
- Gated in `src/App.tsx`: after `hasCompletedOnboarding` is true, if `Capacitor.isNativePlatform()` and `!subscription.isSubscribed`, it renders `HardPaywallGate` (`src/components/subscription/HardPaywallGate.tsx`) instead of `Index`. That gate auto-presents the RevenueCat-hosted paywall on mount and again on tapping "View Plans" if dismissed.
- **Web/simulator bypasses the gate** (no real IAP there) so `npm run dev` stays usable for local development — you cannot demo the actual paywall-gated experience outside a native build with sandbox/Test Store purchases.
- The paywall UI itself is **not built in this repo** — it's designed remotely in the RevenueCat dashboard (Paywalls builder) and rendered natively via `RevenueCatUI.presentPaywall()` from `@revenuecat/purchases-capacitor-ui`. Changing paywall copy/pricing/layout does not require an app update.
- `usePaywall` (`src/hooks/usePaywall.ts`) wraps `RevenueCatUI.presentPaywall()`; treats `PAYWALL_RESULT.PURCHASED`/`RESTORED` as success and calls the `onPurchased` callback (typically `useAppUsage().setSubscriptionActive`). Used both by the mandatory `HardPaywallGate` and by voluntary triggers (Settings' "Upgrade to Pro", `ChatView`'s monthly AI-prompt cap).
- `usePromptLimit` (`MONTHLY_PROMPT_LIMIT = 30`) is unrelated to the paywall gate — it's a separate monthly rate limit on AI calls that applies to subscribers, to control API cost.
- RevenueCat (`@revenuecat/purchases-capacitor` + `@revenuecat/purchases-capacitor-ui`, both pinned to the same version — currently `13.5.1`) handles IAP and the paywall UI; product ID `com.mayotti.subscription.monthly`; entitlement identifier `premium`.
- `useAppUsage` now tracks **subscription status only** (no usage-count/free-limit machinery) — validated against RevenueCat on native, always cleared on web/simulator.

#### RevenueCat Configuration

- The iOS API key is read from `VITE_REVENUECAT_IOS_KEY` in `.env` — no hardcoded fallback
- Use the `appl_` production key for App Store builds; never commit `test_` keys
- `src/App.tsx` initializes RevenueCat on native platforms only via `Capacitor.isNativePlatform()`
- Dashboard setup required before the paywall renders anything: create the `premium` entitlement, attach the App Store product to it, create an Offering and mark it current, then design and attach a Paywall to that offering in RevenueCat's Paywalls builder

### State Management Pattern

The app uses localStorage-backed custom hooks rather than a global store:
- `useLocalStorage` — Expenses and budget with month-aware auto-reset
- `useAppUsage` — Subscription status only (validated against RevenueCat)
- `usePaywall` — Presents the RevenueCat-hosted paywall UI, reports purchase/restore success
- `usePromptLimit` — Monthly AI-prompt cap for subscribers (unrelated to the paywall gate)
- `useOnboarding` — First-run onboarding completion flag and collected answers

Budget recalculates from the expense list on each update (rather than storing a running total) to prevent drift.

### Mobile-Specific Considerations

- Safe area insets handled via CSS `env()` variables and Capacitor config (`contentInset: never`)
- Voice recording uses native APIs via `useVoiceRecording`
- The `@` path alias maps to `./src/`
- TypeScript is intentionally lenient (`noImplicitAny: false`, `strictNullChecks: false`)
