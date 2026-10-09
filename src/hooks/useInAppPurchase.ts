import { useState, useEffect, useCallback } from 'react';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

export const SUBSCRIPTION_PRODUCT_ID = 'com.mayotti.subscription.monthly';
const ENTITLEMENT_ID = 'premium';

interface PurchaseState {
  isReady: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  error: string | null;
  product: any | null;
}

export const useInAppPurchase = (onPurchaseSuccess?: (productId: string) => void) => {
  const [state, setState] = useState<PurchaseState>({
    isReady: false,
    isLoading: true,
    isPurchasing: false,
    error: null,
    product: null,
  });

  useEffect(() => {
    initializeRevenueCat();
  }, []);

  const initializeRevenueCat = async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('RevenueCat not available - running in web mode');
      setState(prev => ({
        ...prev,
        isLoading: false,
        isReady: false,
        error: 'In-app purchases only available in the iOS app',
      }));
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = await Purchases.getOfferings();
      console.log('[RC] raw offerings object:', JSON.stringify(result));

      // The Capacitor plugin returns { offerings: { current: {...}, all: {...} } }
      // or sometimes the data is nested — try both:
      const offerings = result?.offerings ?? result;
      const currentOffering = offerings?.current;
      const monthlyPackage =
        currentOffering?.monthly
        ?? currentOffering?.availablePackages?.find(p => p.identifier === '$rc_monthly')
        ?? currentOffering?.availablePackages?.find(
          (pkg) => pkg.product?.identifier === SUBSCRIPTION_PRODUCT_ID
        )
        ?? currentOffering?.availablePackages?.[0]
        ?? null;

      console.log('[RC] monthly package:', JSON.stringify(monthlyPackage));

      setState(prev => ({
        ...prev,
        isReady: true,
        isLoading: false,
        product: monthlyPackage,
      }));
    } catch (error: any) {
      console.error('Failed to initialize RevenueCat:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to connect to App Store',
      }));
    }
  };

  const purchase = useCallback(async () => {
    if (!state.isReady || !state.product) {
      console.log('RevenueCat not ready for purchase');
      return false;
    }

    setState(prev => ({ ...prev, isPurchasing: true, error: null }));

    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: state.product });

      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        onPurchaseSuccess?.(SUBSCRIPTION_PRODUCT_ID);
        setState(prev => ({ ...prev, isPurchasing: false }));
        return true;
      }

      setState(prev => ({ ...prev, isPurchasing: false }));
      return false;
    } catch (error: any) {
      console.error('Purchase error:', error);
      const userCancelled = error.userCancelled === true;
      setState(prev => ({
        ...prev,
        isPurchasing: false,
        error: userCancelled ? null : (error.message || 'Purchase failed'),
      }));
      return false;
    }
  }, [state.isReady, state.product, onPurchaseSuccess]);

  const restore = useCallback(async () => {
    if (!state.isReady) {
      console.log('RevenueCat not ready for restore');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { customerInfo } = await Purchases.restorePurchases();

      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        onPurchaseSuccess?.(SUBSCRIPTION_PRODUCT_ID);
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error: any) {
      console.error('Restore error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to restore purchases',
      }));
      return false;
    }
  }, [state.isReady, onPurchaseSuccess]);

  const getFormattedPrice = () => {
    if (state.product?.product?.priceString) {
      return state.product.product.priceString;
    }
    return '$2.99';
  };

  return {
    ...state,
    purchase,
    restore,
    getFormattedPrice,
  };
};
