import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GiftBox } from "./GiftBox";
import { GiftOfferCard } from "./GiftOfferCard";
import { SproutLogo } from "@/components/brand/SproutLogo";
import { CountUp } from "@/components/onboarding/CountUp";
import type { GiftDetails } from "@/hooks/useGiftOffer";
import { shakeHaptics, successHaptic, tapHaptic } from "@/lib/haptics";

interface GiftRevealProps {
  gift: GiftDetails;
  isPurchasing: boolean;
  error: string | null;
  onRevealed: () => void;
  onClaim: () => void;
  onRestore: () => void;
  /** The gift was opened before: start on a single wrapped box to tap open again. */
  startOpened?: boolean;
}

const BOXES = [
  { body: "#1F6B4F", lid: "#26805F", ribbon: "#F2C14E" },
  { body: "#F2C14E", lid: "#F5CD6B", ribbon: "#1F6B4F" },
  { body: "#0D9488", lid: "#14A89B", ribbon: "#FFFFFF" },
];

const CONFETTI_COLORS = ["#1F6B4F", "#F2C14E", "#0D9488", "#EC4899", "#2563EB", "#8B5CF6"];

// The shake animation in GiftBox lasts 0.6s with 7 swings; a buzz on each swing.
const SHAKE_MS = 650;
const SHAKE_BUZZES = [0, 90, 180, 270, 360, 450, 540];

type Phase = "pick" | "waiting" | "shake" | "open" | "offer";

/*
  Shown when someone closes the paywall.
  - First time: pick one of three gift boxes (every box holds the same gift,
    and nothing here suggests otherwise: no fake odds or prizes).
  - Later (and after closing the offer): one wrapped box, "Your gift is waiting".
  Tapping a box shakes it (with a buzz on each swing on iPhone), the lid pops
  off with confetti and a success buzz, the discount is revealed, and Continue
  opens the offer.
*/
export const GiftReveal = ({
  gift,
  isPurchasing,
  error,
  onRevealed,
  onClaim,
  onRestore,
  startOpened = false,
}: GiftRevealProps) => {
  const reduceMotion = useReducedMotion();
  const [picked, setPicked] = useState<number | null>(startOpened ? 1 : null);
  const [phase, setPhase] = useState<Phase>(startOpened ? "waiting" : "pick");
  const [burst, setBurst] = useState(0); // re-runs the confetti on every opening
  const [returning, setReturning] = useState(startOpened); // opened at least once before
  const timers = useRef<Array<() => void>>([]);

  useEffect(() => () => timers.current.forEach((cancel) => cancel()), []);

  const confetti = useMemo(
    () =>
      Array.from({ length: 72 }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 72 + Math.random() * 0.3;
        const dist = 150 + Math.random() * 190;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 60,
          r: Math.random() * 540 - 270,
          w: 6 + Math.random() * 6,
          h: 10 + Math.random() * 8,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          delay: Math.random() * 0.12,
        };
      }),
    []
  );

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(() => clearTimeout(t));
  };

  const openBox = (i: number) => {
    if (phase !== "pick" && phase !== "waiting") return;
    setPicked(i);
    tapHaptic("light");

    const reveal = () => {
      setPhase("open");
      setBurst((b) => b + 1);
      setReturning(true);
      successHaptic();
      later(() => tapHaptic("heavy"), 120);
      onRevealed();
    };

    if (reduceMotion) {
      reveal();
      return;
    }
    setPhase("shake");
    timers.current.push(shakeHaptics(SHAKE_BUZZES.map((t) => t + 40)));
    later(reveal, SHAKE_MS);
  };

  const isOpen = phase === "open";
  const single = phase !== "pick"; // only the chosen box is on screen

  const title =
    phase === "open"
      ? "It's yours!"
      : phase === "waiting" || (phase === "shake" && returning)
        ? "Your gift is waiting"
        : "Wait, we have a gift for you";
  const subtitle =
    phase === "open"
      ? "Here's your welcome gift."
      : phase === "waiting"
        ? "Tap the box to open it."
        : phase === "shake"
          ? "Opening…"
          : "Pick a box to unwrap it.";

  return (
    <div className="fixed inset-0 bg-background overflow-y-auto overflow-x-hidden">
      <div
        className="min-h-full flex flex-col px-5"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 24px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)",
        }}
      >
        <AnimatePresence mode="wait">
          {phase !== "offer" ? (
            <motion.div
              key="gift"
              className="flex-1 flex flex-col items-center text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
            >
              <div className="mt-8 min-h-[76px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h1 className="text-[28px] leading-[34px] font-extrabold tracking-[-0.02em] text-foreground">
                      {title}
                    </h1>
                    <p className="mt-2 text-[15px] text-muted-foreground">{subtitle}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative flex-1 w-full flex flex-col items-center justify-center">
                <div className="relative flex items-end justify-center gap-2 w-full max-w-[380px]">
                  {/* warm glow behind the opened box */}
                  {isOpen && (
                    <motion.div
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-1/2 w-[340px] h-[340px] -ml-[170px] -mt-[170px] rounded-full"
                      style={{ background: "radial-gradient(circle, rgba(242,193,78,0.45) 0%, rgba(242,193,78,0) 65%)" }}
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}

                  {BOXES.map((b, i) => {
                    const isPicked = picked === i;
                    const hidden = single && !isPicked;
                    const tappable = phase === "pick" || (phase === "waiting" && isPicked);
                    return (
                      <motion.button
                        key={i}
                        aria-label={phase === "waiting" ? "Open your gift" : `Gift box ${i + 1}`}
                        aria-hidden={hidden || undefined}
                        tabIndex={hidden ? -1 : undefined}
                        onClick={() => tappable && openBox(i)}
                        disabled={!tappable}
                        className="relative flex-1 aspect-square"
                        initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.6, y: reduceMotion ? 0 : 30 }}
                        animate={{
                          opacity: hidden ? 0 : 1,
                          scale: isPicked && single ? 1.7 : hidden ? 0.6 : 1,
                          x: isPicked && single ? `${(1 - i) * 104}%` : 0,
                          y: 0,
                        }}
                        transition={{ type: "spring", stiffness: 260, damping: 22, delay: phase === "pick" ? i * 0.1 : 0 }}
                        whileTap={tappable ? { scale: isPicked && single ? 1.6 : 0.92 } : undefined}
                        style={{ zIndex: isPicked ? 2 : 1 }}
                      >
                        <GiftBox
                          {...b}
                          state={isPicked && phase === "shake" ? "shake" : isPicked && isOpen ? "open" : "idle"}
                          delay={i * 0.35}
                          reduceMotion={reduceMotion ?? false}
                        />
                        {isPicked && isOpen && (
                          <div className="absolute inset-x-0 top-[30%] flex justify-center pointer-events-none">
                            <motion.div
                              className="w-[46%]"
                              initial={{ y: 20, scale: 0.4, opacity: 0 }}
                              animate={{ y: -34, scale: 1, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 240, damping: 14, delay: 0.15 }}
                            >
                              <SproutLogo size={56} title="" className="w-full h-auto drop-shadow-lg" />
                            </motion.div>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}

                  {isOpen && !reduceMotion && (
                    <div key={burst} className="pointer-events-none absolute left-1/2 top-1/2">
                      {confetti.map((c, i) => (
                        <motion.span
                          key={i}
                          className="absolute rounded-[2px]"
                          style={{ width: c.w, height: c.h, backgroundColor: c.color }}
                          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                          animate={{ x: c.x, y: [0, c.y, c.y + 260], rotate: c.r, opacity: [1, 1, 0] }}
                          transition={{ duration: 1.6, delay: c.delay, ease: "easeOut", times: [0, 0.45, 1] }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* the discount, revealed under the opened box */}
                <div className="min-h-[96px] mt-14 flex flex-col items-center">
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.6, y: reduceMotion ? 0 : 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.35 }}
                      className="flex flex-col items-center"
                    >
                      <span className="text-[44px] leading-[48px] font-extrabold tracking-[-0.04em] text-primary">
                        {gift.percentOff ? (
                          <CountUp to={gift.percentOff} suffix="% OFF" duration={0.8} delay={0.4} />
                        ) : (
                          "Special price"
                        )}
                      </span>
                      <span className="mt-1 text-[15px] font-semibold text-muted-foreground">
                        Mayotti Premium for {gift.price}/{gift.period === "year" ? "year" : "month"}
                      </span>
                    </motion.div>
                  )}
                  {phase === "waiting" && !reduceMotion && (
                    <motion.span
                      className="text-[13px] font-semibold text-muted-foreground"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.8, repeat: Infinity }}
                    >
                      Tap to open
                    </motion.span>
                  )}
                </div>
              </div>

              <div className="w-full min-h-[64px] mb-2 flex items-end justify-center">
                {isOpen && (
                  <motion.div
                    className="w-full"
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.4 }}
                  >
                    <Button
                      size="lg"
                      className="w-full h-14 rounded-full text-[17px] font-bold"
                      onClick={() => {
                        tapHaptic("light");
                        setPhase("offer");
                      }}
                    >
                      Continue
                    </Button>
                  </motion.div>
                )}
                {phase === "pick" && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mb-4 text-[13px] font-semibold text-muted-foreground"
                  >
                    Tap any box
                  </motion.p>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="offer"
              className="flex-1 flex flex-col justify-center"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
            >
              <GiftOfferCard
                gift={gift}
                isPurchasing={isPurchasing}
                error={error}
                onClaim={() => {
                  tapHaptic("medium");
                  onClaim();
                }}
                onClose={() => setPhase("waiting")}
                onRestore={onRestore}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
