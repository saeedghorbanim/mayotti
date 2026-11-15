import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";

const ENTITLEMENT_ID = "premium";

export interface SubscriptionDetails {
  planName: string; // "Monthly", "Yearly", "Monthly (welcome gift)"
  price: string | null; // "$6.99"
  per: "month" | "year" | null;
  date: Date | null; // next renewal, or the end date if cancelled
  willRenew: boolean;
}

const planFromProduct = (id: string) => {
  const lower = id.toLowerCase();
  if (lower.includes("gift")) return "Monthly (welcome gift)";
  if (lower.includes("year") || lower.includes("annual")) return "Yearly";
  if (lower.includes("month")) return "Monthly";
  return "Premium";
};

const perFromPeriod = (period: string | null | undefined, id: string): "month" | "year" | null => {
  if (period === "P1Y" || /year|annual/i.test(id)) return "year";
  if (period === "P1M" || /month/i.test(id)) return "month";
  return null;
};

/**
 * The subscriber's actual plan, price and renewal date, read from RevenueCat
 * (and the App Store price for that product). Null when not subscribed, on
 * the web, or while loading.
 */
export const useSubscriptionDetails = (enabled: boolean) => {
  const [details, setDetails] = useState<SubscriptionDetails | null>(null);

  useEffect(() => {
    if (!enabled || !Capacitor.isNativePlatform()) return;
    let cancelled = false;
    (async () => {
      try {
        const { customerInfo } = await Purchases.getCustomerInfo();
        const ent = customerInfo.entitlements.active[ENTITLEMENT_ID];
        if (!ent) {
          if (!cancelled) setDetails(null);
          return;
        }
        let price: string | null = null;
        let period: string | null = null;
        try {
          const { products } = await Purchases.getProducts({ productIdentifiers: [ent.productIdentifier] });
          price = products[0]?.priceString ?? null;
          period = products[0]?.subscriptionPeriod ?? null;
        } catch {
          // Price is a nice-to-have; show the rest without it.
        }
        if (!cancelled) {
          setDetails({
            planName: planFromProduct(ent.productIdentifier),
            price,
            per: perFromPeriod(period, ent.productIdentifier),
            date: ent.expirationDate ? new Date(ent.expirationDate) : null,
            willRenew: ent.willRenew,
          });
        }
      } catch (e) {
        console.error("[subscription] could not load details", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return details;
};
