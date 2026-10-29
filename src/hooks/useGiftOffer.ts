import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Purchases, type PurchasesPackage } from "@revenuecat/purchases-capacitor";

/*
  The "gift" shown after someone closes the paywall without subscribing.

  It is a real, separately priced App Store product, served through its own
  RevenueCat offering, so the price shown is always the true App Store price:
    RevenueCat offering identifier: "gift"  (one package, e.g. $rc_monthly)
    App Store product (same subscription group as the normal plans), e.g.
      com.mayotti.subscription.monthly.gift
  The discount % is worked out from the normal plan of the same length in the
  current ("default") offering. If the "gift" offering isn't set up, the gift
  flow simply doesn't appear.
*/
export const GIFT_OFFERING_ID = "gift";
const ENTITLEMENT_ID = "premium";
const STORAGE_KEY = "mayotti_gift";

export interface GiftDetails {
  pkg: PurchasesPackage | null; // null only in the web preview
  price: string; // e.g. "$3.49"
  regularPrice: string | null; // e.g. "$6.99"
  percentOff: number | null; // e.g. 50
  period: "month" | "year";
  productId: string;
}

interface StoredGift {
  revealedAt: string | null;
}

const readStored = (): StoredGift => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { revealedAt: JSON.parse(raw).revealedAt ?? null };
  } catch {
    // ignore
  }
  return { revealedAt: null };
};

const periodOf = (pkg: PurchasesPackage): "month" | "year" =>
  pkg.packageType === "ANNUAL" || pkg.identifier === "$rc_annual" || pkg.product?.subscriptionPeriod === "P1Y"
    ? "year"
    : "month";

// Web / local dev has no App Store, so the preview uses sample prices.
const PREVIEW_GIFT: GiftDetails = {
  pkg: null,
  price: "$3.49",
  regularPrice: "$6.99",
  percentOff: 50,
  period: "month",
  productId: "preview",
};

export const useGiftOffer = (onPurchased?: (productId: string) => void) => {
  const [gift, setGift] = useState<GiftDetails | null>(Capacitor.isNativePlatform() ? null : PREVIEW_GIFT);
  const [isLoading, setIsLoading] = useState(Capacitor.isNativePlatform());
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedAt, setRevealedAt] = useState<string | null>(() => readStored().revealedAt);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    (async () => {
      try {
        const res: any = await Purchases.getOfferings();
        const offerings = res?.offerings ?? res;
        const giftOffering = offerings?.all?.[GIFT_OFFERING_ID];
        const pkg: PurchasesPackage | undefined = giftOffering?.availablePackages?.[0];
        if (!pkg) return;

        const period = periodOf(pkg);
        const regular: PurchasesPackage | undefined = offerings?.current?.availablePackages?.find(
          (p: PurchasesPackage) => periodOf(p) === period
        );
        const regularPrice = regular?.product?.price;
        const percentOff =
          regularPrice && regularPrice > pkg.product.price
            ? Math.round((1 - pkg.product.price / regularPrice) * 100)
            : null;

        if (!cancelled) {
          setGift({
            pkg,
            price: pkg.product.priceString,
            regularPrice: percentOff ? regular!.product.priceString : null,
            percentOff,
            period,
            productId: pkg.product.identifier,
          });
        }
      } catch (e) {
        console.error("[gift] failed to load offering", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const markRevealed = useCallback(() => {
    const at = new Date().toISOString();
    setRevealedAt(at);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ revealedAt: at }));
    } catch {
      // ignore
    }
  }, []);

  const claim = useCallback(async (): Promise<boolean> => {
    if (!gift?.pkg) return false;
    setIsPurchasing(true);
    setError(null);
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: gift.pkg });
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        onPurchased?.(gift.productId);
        return true;
      }
      return false;
    } catch (e: any) {
      if (!e?.userCancelled) setError("The purchase didn't go through. Please try again.");
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [gift, onPurchased]);

  const restore = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const { customerInfo } = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        onPurchased?.("restored");
        return true;
      }
      setError("No active subscription was found to restore.");
      return false;
    } catch {
      setError("Couldn't restore purchases. Please try again.");
      return false;
    }
  }, [onPurchased]);

  return { gift, isLoading, isPurchasing, error, revealedAt, markRevealed, claim, restore };
};
