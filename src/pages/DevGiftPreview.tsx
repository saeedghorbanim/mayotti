import { useState } from "react";
import { GiftReveal } from "@/components/subscription/GiftReveal";
import { HardPaywallGate } from "@/components/subscription/HardPaywallGate";
import { useGiftOffer } from "@/hooks/useGiftOffer";

/** Development-only preview of the gift flow with sample prices (not in release builds). */
const DevGiftPreview = () => {
  const offer = useGiftOffer();
  const [done, setDone] = useState(false);
  if (done) return <HardPaywallGate onSubscribed={() => {}} autoPresent={false} />;
  return (
    <GiftReveal
      gift={offer.gift!}
      isPurchasing={false}
      error={null}
      onRevealed={offer.markRevealed}
      onClaim={() => {}}
      onRestore={() => {}}
      onClose={() => setDone(true)}
    />
  );
};

export default DevGiftPreview;
