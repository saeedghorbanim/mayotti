import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GiftBox } from "./GiftBox";
import { GiftOfferCard } from "./GiftOfferCard";
import { SproutLogo } from "@/components/brand/SproutLogo";
import type { GiftDetails } from "@/hooks/useGiftOffer";

interface GiftRevealProps {
  gift: GiftDetails;
  isPurchasing: boolean;
  error: string | null;
  onRevealed: () => void;
  onClaim: () => void;
  onClose: () => void;
  onRestore: () => void;
  /** Skip the boxes and go straight to the offer (already opened before). */
  startOpened?: boolean;
}

const BOXES = [
  { body: "#1F6B4F", lid: "#26805F", ribbon: "#F2C14E" },
  { body: "#F2C14E", lid: "#F5CD6B", ribbon: "#1F6B4F" },
  { body: "#0D9488", lid: "#14A89B", ribbon: "#FFFFFF" },
];

const CONFETTI_COLORS = ["#1F6B4F", "#F2C14E", "#0D9488", "#EC4899", "#2563EB", "#8B5CF6"];

/*
  Shown when someone closes the paywall. They pick one of three gift boxes;
  every box holds the same gift, and nothing here suggests otherwise (no fake
  odds or prizes that can't be won). The chosen box shakes, pops open with
  confetti, and the discounted offer slides up.
*/
export const GiftReveal = ({
  gift,
  isPurchasing,
  error,
  onRevealed,
  onClaim,
  onClose,
  onRestore,
  startOpened = false,
}: GiftRevealProps) => {
  const reduceMotion = useReducedMotion();
  const [picked, setPicked] = useState<number | null>(null);
  const [phase, setPhase] = useState<"pick" | "shake" | "open" | "offer">(startOpened ? "offer" : "pick");

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

  const pick = (i: number) => {
    if (phase !== "pick") return;
    setPicked(i);
    if (reduceMotion) {
      setPhase("open");
      onRevealed();
      setTimeout(() => setPhase("offer"), 600);
      return;
    }
    setPhase("shake");
    setTimeout(() => {
      setPhase("open");
      onRevealed();
    }, 650);
    setTimeout(() => setPhase("offer"), 2100);
  };

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
              key="pick"
              className="flex-1 flex flex-col items-center text-center"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
            >
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <h1 className="text-[28px] leading-[34px] font-extrabold tracking-[-0.02em] text-foreground">
                  {phase === "open" ? "It's yours!" : "Wait, we have a gift for you"}
                </h1>
                <p className="mt-2 text-[15px] text-muted-foreground">
                  {phase === "open" ? "Unwrapping your offer…" : "Pick a box to unwrap it."}
                </p>
              </motion.div>

              <div className="relative flex-1 w-full flex items-center justify-center">
                <div className="flex items-end justify-center gap-2 w-full max-w-[380px]">
                  {BOXES.map((b, i) => {
                    const isPicked = picked === i;
                    const hidden = picked !== null && !isPicked;
                    return (
                      <motion.button
                        key={i}
                        aria-label={`Gift box ${i + 1}`}
                        onClick={() => pick(i)}
                        disabled={phase !== "pick"}
                        className="relative flex-1 aspect-square"
                        initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.6, y: reduceMotion ? 0 : 30 }}
                        animate={{
                          opacity: hidden ? 0 : 1,
                          scale: isPicked ? 1.7 : hidden ? 0.6 : 1,
                          x: isPicked ? `${(1 - i) * 104}%` : 0,
                          y: 0,
                        }}
                        transition={{ type: "spring", stiffness: 260, damping: 22, delay: picked === null ? i * 0.1 : 0 }}
                        whileTap={phase === "pick" ? { scale: 0.92 } : undefined}
                        style={{ zIndex: isPicked ? 2 : 1 }}
                      >
                        <GiftBox
                          {...b}
                          state={isPicked ? (phase === "shake" ? "shake" : phase === "open" ? "open" : "idle") : "idle"}
                          delay={i * 0.35}
                          reduceMotion={reduceMotion ?? false}
                        />
                        {isPicked && phase === "open" && (
                          <motion.div
                            className="absolute left-1/2 top-[38%] w-[46%] -translate-x-1/2"
                            initial={{ y: 20, scale: 0.4, opacity: 0 }}
                            animate={{ y: -34, scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 240, damping: 14, delay: 0.15 }}
                          >
                            <SproutLogo size={56} title="" className="w-full h-auto drop-shadow-lg" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {phase === "open" && (
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 w-[340px] h-[340px] -ml-[170px] -mt-[170px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(242,193,78,0.45) 0%, rgba(242,193,78,0) 65%)" }}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                )}
                {phase === "open" && !reduceMotion && (
                  <div className="pointer-events-none absolute left-1/2 top-1/2">
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

              {phase === "pick" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mb-6 text-[13px] font-semibold text-muted-foreground"
                >
                  Tap any box
                </motion.p>
              )}
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
                onClaim={onClaim}
                onClose={onClose}
                onRestore={onRestore}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
