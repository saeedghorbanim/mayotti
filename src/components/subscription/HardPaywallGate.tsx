import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
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
  const [giftView, setGiftView] = useState<"none" | "reveal">("none");

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

  // Once there's a gift, it replaces the plain "View Plans" screen: the boxes
  // the first time, then the opened box with a Continue button that reopens
  // the offer. Closing the offer always comes back here, never to a plans list.
  if (gift && (revealedAt || giftView === "reveal")) {
    return (
      <GiftReveal
        gift={gift}
        startOpened={!!revealedAt && giftView !== "reveal"}
        isPurchasing={giftOffer.isPurchasing}
        error={giftOffer.error}
        onRevealed={giftOffer.markRevealed}
        onClaim={giftOffer.claim}
        onRestore={giftOffer.restore}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-5 p-6 text-center">
      <img src={appIcon} alt="Mayotti" className="w-20 h-20 rounded-3xl shadow-card" />
      <p className="text-muted-foreground text-sm max-w-xs">
        Subscribe to Mayotti to start tracking your expenses and building your savings.
      </p>

      <Button
        size="lg"
        className="h-12 px-8 rounded-full font-bold"
        onClick={attempt}
        disabled={isPresenting}
      >
        {isPresenting ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          "View Plans"
        )}
      </Button>
    </div>
  );
};
