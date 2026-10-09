import { useState, useEffect } from 'react';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

const SUBSCRIPTION_KEY = 'mayotti_subscription';

interface SubscriptionData {
  isSubscribed: boolean;
  subscribedAt: string | null;
  expiresAt: string | null;
  productId: string | null;
}

const defaultSubscription: SubscriptionData = {
  isSubscribed: false,
  subscribedAt: null,
  expiresAt: null,
  productId: null,
};

export const useAppUsage = () => {
  const [subscription, setSubscription] = useState<SubscriptionData>(() => {
    try {
      const stored = localStorage.getItem(SUBSCRIPTION_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // Fall back to default
    }
    return defaultSubscription;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load and validate subscription data against RevenueCat as source of truth.
  // On web/simulator: always clear stored subscription (no IAP available).
  // On native: verify entitlement with RevenueCat; clear if no longer active.
  useEffect(() => {
    const validateSubscription = async () => {
      try {
        const stored = localStorage.getItem(SUBSCRIPTION_KEY);
        const parsed = stored ? JSON.parse(stored) : null;

        if (!Capacitor.isNativePlatform()) {
          // Web or simulator — no real IAP, clear any stored subscription
          localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(defaultSubscription));
          setSubscription(defaultSubscription);
        } else if (parsed?.isSubscribed === true) {
          // Native platform — verify entitlement is still active with RevenueCat
          try {
            const { customerInfo } = await Purchases.getCustomerInfo();
            if (customerInfo.entitlements.active['premium']) {
              setSubscription(parsed);
            } else {
              localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(defaultSubscription));
              setSubscription(defaultSubscription);
            }
          } catch (rcError) {
            console.error('Failed to verify subscription with RevenueCat:', rcError);
            // On RC error, trust local storage to avoid wrongly blocking a subscriber
            setSubscription(parsed);
          }
        } else if (parsed) {
          setSubscription(parsed);
        }
      } catch (error) {
        console.error('Failed to load subscription data:', error);
      }

      setIsLoading(false);
    };

    validateSubscription();
  }, []);

  // Set subscription status (called after successful purchase/restore)
  const setSubscriptionActive = (productId: string, expiresAt?: string) => {
    const now = new Date().toISOString();
    const newSubscription: SubscriptionData = {
      isSubscribed: true,
      subscribedAt: now,
      expiresAt: expiresAt || null,
      productId,
    };

    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(newSubscription));
    setSubscription(newSubscription);
  };

  // Clear subscription (for testing or when subscription expires)
  const clearSubscription = () => {
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(defaultSubscription));
    setSubscription(defaultSubscription);
  };

  return {
    subscription,
    isLoading,
    setSubscriptionActive,
    clearSubscription,
  };
};
