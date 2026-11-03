import { motion, useReducedMotion } from "framer-motion";
import { Gift, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney, type GiftDetails } from "@/hooks/useGiftOffer";
import { CountUp } from "@/components/onboarding/CountUp";
import { GiftHero } from "./GiftHero";

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
const EASE = [0.22, 1, 0.36, 1] as const;

/** The discounted plan, its yearly total, and the price/renewal terms Apple requires. */
export const GiftOfferCard = ({ gift, isPurchasing, error, onClaim, onClose, onRestore }: GiftOfferCardProps) => {
  const reduceMotion = useReducedMotion();
  const per = gift.period === "year" ? "year" : "month";
  const money = (n: number) => formatMoney(n, gift.currencyCode);
  const yearlySavings = gift.regularYearTotal ? gift.regularYearTotal - gift.yearTotal : 0;
  const giftShare = gift.regularYearTotal ? gift.yearTotal / gift.regularYearTotal : 1;

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.45, ease: EASE },
  });

  return (
    <div className="relative w-full flex flex-col items-center text-center">
      <button
        onClick={onClose}
        aria-label="Close offer"
        className="absolute -top-1 right-0 z-10 w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"
      >
        <X className="w-5 h-5" />
      </button>

      <motion.span
        {...rise(0)}
        className="inline-flex items-center gap-1.5 rounded-full bg-accent text-primary px-3 py-1 text-xs font-bold uppercase tracking-wide"
      >
        <Gift className="w-3.5 h-3.5" /> Your welcome gift
      </motion.span>

      <GiftHero />

      {/* % OFF, with a light sweeping through the letters */}
      <motion.h1
        initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.7 }}
        animate={
          reduceMotion
            ? { opacity: 1, scale: 1 }
            : { opacity: 1, scale: 1, backgroundPosition: ["150% 0%", "-50% 0%"] }
        }
        transition={{
          opacity: { duration: 0.3, delay: 0.25 },
          scale: { type: "spring", stiffness: 260, damping: 16, delay: 0.25 },
          backgroundPosition: { duration: 1.4, delay: 1.2, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" },
        }}
        className="text-[52px] leading-[56px] font-extrabold tracking-[-0.04em] bg-clip-text text-transparent"
        style={{
          backgroundImage: "linear-gradient(100deg, #1F6B4F 0%, #1F6B4F 40%, #6FD3A6 50%, #1F6B4F 60%, #1F6B4F 100%)",
          backgroundSize: "250% 100%",
          backgroundPosition: "150% 0%",
          WebkitBackgroundClip: "text",
        }}
      >
        {gift.percentOff ? <CountUp to={gift.percentOff} suffix="% OFF" duration={0.9} delay={0.3} /> : "Special price"}
      </motion.h1>

      {/* Price */}
      <motion.p {...rise(0.35)} className="mt-1 flex items-baseline justify-center gap-2">
        {gift.regularPrice && (
          <span className="text-base font-semibold text-muted-foreground line-through">{gift.regularPrice}</span>
        )}
        <span className="text-[26px] font-extrabold tracking-[-0.02em] text-foreground">{gift.price}</span>
        <span className="text-base font-semibold text-muted-foreground">/ {per}</span>
      </motion.p>

      {/* What it adds up to over a year */}
      {gift.regularYearTotal && (
        <motion.div {...rise(0.5)} className="w-full mt-4 rounded-3xl bg-card shadow-card p-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-foreground">Over a year</span>
            <span className="rounded-full bg-accent text-primary px-2.5 py-1 text-[12px] font-extrabold">
              You keep <CountUp to={yearlySavings} delay={0.9} duration={1.3} format={money} />
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-2.5">
            <div>
              <div className="flex justify-between text-[12px] font-semibold text-muted-foreground mb-1">
                <span>Regular price</span>
                <span className="line-through">{money(gift.regularYearTotal)}</span>
              </div>
              <motion.div
                className="h-2.5 rounded-full bg-muted-foreground/40"
                initial={{ width: reduceMotion ? "100%" : 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.7, duration: 0.7, ease: EASE }}
              />
            </div>
            <div>
              <div className="flex justify-between text-[12px] font-bold text-foreground mb-1">
                <span>With your gift</span>
                <span className="text-primary">{money(gift.yearTotal)}</span>
              </div>
              <motion.div
                className="h-2.5 rounded-full bg-primary"
                initial={{ width: reduceMotion ? `${giftShare * 100}%` : 0 }}
                animate={{ width: `${giftShare * 100}%` }}
                transition={{ delay: 0.95, duration: 0.7, ease: EASE }}
              />
            </div>
          </div>
          {per === "month" && (
            <p className="mt-2.5 text-[11px] leading-4 text-muted-foreground">
              12 months × {gift.price} = {money(gift.yearTotal)}, compared with 12 × {gift.regularPrice}.
            </p>
          )}
        </motion.div>
      )}

      {error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}

      {/* CTA with a gentle shine */}
      <motion.div {...rise(0.65)} className="w-full mt-4">
        <Button
          size="lg"
          className="relative overflow-hidden w-full h-14 rounded-full text-[17px] font-bold"
          onClick={onClaim}
          disabled={isPurchasing}
        >
          {isPurchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Claim my gift"}
          {!reduceMotion && !isPurchasing && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-y-0 w-1/3 pointer-events-none"
              style={{ background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.35), transparent)" }}
              initial={{ left: "-40%" }}
              animate={{ left: "120%" }}
              transition={{ duration: 1.1, delay: 1.6, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" }}
            />
          )}
        </Button>
      </motion.div>

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
