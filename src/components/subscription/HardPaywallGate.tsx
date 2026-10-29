import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Gift, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePaywall } from "@/hooks/usePaywall";
import { useGiftOffer } from "@/hooks/useGiftOffer";
import { GiftReveal } from "./GiftReveal";
import appIcon from "@/assets/mayotti-logo.png";

interface HardPaywallGateProps {
  onSubscribed: (productId: string) => void;
  /** Dev preview only: don't auto-present the native paywall. */
  autoPresent?: boolean;
}

export const HardPaywallGate = ({ onSubscribed, autoPresent = true }: HardPaywallGateProps) => {
  const giftOffer = useGiftOffer(onSubscribed);
  const { gift, revealedAt } = giftOffer;
  const [giftView, setGiftView] = useState<"none" | "reveal" | "offer">("none");

  // The paywall's dismiss callback is captured when it opens, and the gift
  // may finish loading after that, so read the latest values through a ref.
  const latest = useRef({ gift, revealedAt });
  latest.current = { gift, revealedAt };

  const { presentPaywall, isPresenting } = usePaywall(onSubscribed, () => {
    const { gift: g, revealedAt: r } = latest.current;
    if (g && !r) setGiftView("reveal"); // first time closing the paywall → unwrap a gift
  });

  const attempt = () => {
    presentPaywall({ displayCloseButton: false });
  };

  // Present automatically as soon as this gate mounts, so subscribing feels
  // like the natural next step right after onboarding rather than a dead end.
  useEffect(() => {
    if (autoPresent) attempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gift && giftView !== "none") {
    return (
      <GiftReveal
        gift={gift}
        startOpened={giftView === "offer"}
        isPurchasing={giftOffer.isPurchasing}
        error={giftOffer.error}
        onRevealed={giftOffer.markRevealed}
        onClaim={giftOffer.claim}
        onRestore={giftOffer.restore}
        onClose={() => setGiftView("none")}
      />
    );
  }

  const giftWaiting = gift && revealedAt;

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-5 p-6 text-center">
      <img src={appIcon} alt="Mayotti" className="w-20 h-20 rounded-3xl shadow-card" />
      <p className="text-muted-foreground text-sm max-w-xs">
        Subscribe to Mayotti to start tracking your expenses and building your savings.
      </p>

      {giftWaiting && (
        <motion.button
          onClick={() => setGiftView("offer")}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xs flex items-center gap-3 rounded-3xl bg-card shadow-card p-4 text-left"
        >
          <motion.span
            className="w-11 h-11 rounded-2xl bg-accent text-primary flex items-center justify-center shrink-0"
            animate={{ rotate: [0, -8, 8, -4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.4 }}
          >
            <Gift className="w-5 h-5" />
          </motion.span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-bold text-foreground">Your gift is waiting</span>
            <span className="block text-[13px] text-muted-foreground">
              {gift.percentOff ? `${gift.percentOff}% off` : "Special price"} · {gift.price}/
              {gift.period === "year" ? "yr" : "mo"}
            </span>
          </span>
          <span className="text-sm font-bold text-primary">Open</span>
        </motion.button>
      )}

      <Button
        size="lg"
        variant={giftWaiting ? "outline" : "default"}
        className="h-12 px-8 rounded-full font-bold"
        onClick={attempt}
        disabled={isPresenting}
      >
        {isPresenting ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : giftWaiting ? (
          "See all plans"
        ) : (
          "View Plans"
        )}
      </Button>
    </div>
  );
};
