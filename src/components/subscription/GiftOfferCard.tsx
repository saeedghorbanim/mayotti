import { motion, useReducedMotion } from "framer-motion";
import { Gift, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GiftDetails } from "@/hooks/useGiftOffer";
import { CountUp } from "@/components/onboarding/CountUp";

interface GiftOfferCardProps {
  gift: GiftDetails;
  isPurchasing: boolean;
  error: string | null;
  onClaim: () => void;
  onClose: () => void;
  onRestore: () => void;
}

const TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
const PRIVACY_URL = "https://mayotti.com/privacy";

/** The discounted plan, with the price and renewal terms Apple requires. */
export const GiftOfferCard = ({ gift, isPurchasing, error, onClaim, onClose, onRestore }: GiftOfferCardProps) => {
  const reduceMotion = useReducedMotion();
  const per = gift.period === "year" ? "year" : "month";
  const features = ["Log expenses by chat or voice", "Scan receipts in a snap", "Budget warnings before you run out"];

  return (
    <div className="relative w-full flex flex-col items-center text-center">
      <button
        onClick={onClose}
        aria-label="Close offer"
        className="absolute -top-1 right-0 w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground"
      >
        <X className="w-5 h-5" />
      </button>

      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent text-primary px-3 py-1 text-xs font-bold uppercase tracking-wide">
        <Gift className="w-3.5 h-3.5" /> Your welcome gift
      </span>

      {gift.percentOff ? (
        <h1 className="mt-3 text-[52px] leading-[54px] font-extrabold tracking-[-0.04em] text-primary">
          <CountUp to={gift.percentOff} suffix="% OFF" duration={0.9} />
        </h1>
      ) : (
        <h1 className="mt-3 text-[34px] leading-[40px] font-extrabold tracking-[-0.03em] text-primary">Special price</h1>
      )}
      <p className="mt-1 text-sm font-semibold text-muted-foreground">Mayotti Premium, every {per}</p>

      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="w-full mt-5 rounded-3xl border-2 border-primary bg-accent/60 p-4 text-left"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[15px] font-bold text-foreground">{per === "year" ? "Yearly" : "Monthly"}</span>
          <span className="flex items-baseline gap-2">
            {gift.regularPrice && (
              <span className="text-sm font-semibold text-muted-foreground line-through">{gift.regularPrice}</span>
            )}
            <span className="text-[22px] font-extrabold text-foreground">{gift.price}</span>
            <span className="text-sm font-semibold text-muted-foreground">/{per === "year" ? "yr" : "mo"}</span>
          </span>
        </div>
        <ul className="mt-3 flex flex-col gap-1.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-[13px] font-medium text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </motion.div>

      {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}

      <Button
        size="lg"
        className="mt-5 w-full h-14 rounded-full text-[17px] font-bold"
        onClick={onClaim}
        disabled={isPurchasing}
      >
        {isPurchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Claim my gift"}
      </Button>

      <p className="mt-3 text-xs leading-[17px] text-muted-foreground px-2">
        {gift.price} per {per}, billed through your Apple account. Renews automatically until canceled. Cancel
        anytime in Settings.
      </p>
      <div className="mt-2 flex items-center justify-center gap-5 text-xs font-semibold text-muted-foreground">
        <button onClick={onRestore}>Restore Purchases</button>
        <a href={TERMS_URL} target="_blank" rel="noopener noreferrer">
          Terms
        </a>
        <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
          Privacy
        </a>
      </div>
    </div>
  );
};
