import { GiftReveal } from "@/components/subscription/GiftReveal";
import { useGiftOffer } from "@/hooks/useGiftOffer";

/** Development-only preview of the gift flow with sample prices (not in release builds). */
const DevGiftPreview = () => {
  const offer = useGiftOffer();
  return (
    <GiftReveal
      gift={offer.gift!}
      isPurchasing={false}
      error={null}
      onRevealed={offer.markRevealed}
      onClaim={() => {}}
      onRestore={() => {}}
      startOpened={new URLSearchParams(window.location.search).has("opened")}
    />
  );
};

export default DevGiftPreview;
