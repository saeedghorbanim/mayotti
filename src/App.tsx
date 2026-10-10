import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import SplashScreen from "./components/SplashScreen";
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAppUsage } from "@/hooks/useAppUsage";
import { HardPaywallGate } from "@/components/subscription/HardPaywallGate";

const IOS_API_KEY = import.meta.env.VITE_REVENUECAT_IOS_KEY;

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { hasCompletedOnboarding, answers, updateAnswer, completeOnboarding } = useOnboarding();
  const { subscription, isLoading: subscriptionLoading, setSubscriptionActive } = useAppUsage();

  useEffect(() => {
    const initRevenueCat = async () => {
      if (!Capacitor.isNativePlatform()) return;
      const { isConfigured } = await Purchases.isConfigured();
      if (isConfigured) return;
      // Verbose logs expose customer and purchase details in device logs; dev builds only
      if (import.meta.env.DEV) await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({ apiKey: IOS_API_KEY });
    };
    initRevenueCat();
  }, []);

  // No free tier: once onboarding is done, a native build requires an active
  // subscription before reaching the app. Web/simulator bypasses this (no
  // real IAP there) so local development stays usable.
  let mainContent;
  if (!hasCompletedOnboarding) {
    mainContent = <Onboarding answers={answers} updateAnswer={updateAnswer} onComplete={completeOnboarding} />;
  } else if (subscriptionLoading) {
    mainContent = <div className="fixed inset-0 bg-background" />;
  } else if (Capacitor.isNativePlatform() && !subscription.isSubscribed) {
    mainContent = <HardPaywallGate onSubscribed={setSubscriptionActive} />;
  } else {
    mainContent = <Index />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && (
          <SplashScreen onComplete={() => setShowSplash(false)} duration={2400} />
        )}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={mainContent} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

