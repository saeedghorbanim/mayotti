import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

/*
  Launch sequence. The native iOS launch image and the inline splash in
  index.html both show only the Sprout mark, centered, at 11.4% of the screen
  height. This component starts from that exact frame so the hand-off is
  seamless, then: a soft growth ring pulses out, the leaves sway, the mark
  rises, and the wordmark and tagline fade in before everything fades away.
*/
const MARK_SIZE = "11.4vh";
const BRAND = "#1F6B4F";
const TINT = "#E5F0E9";

const SplashScreen = ({ onComplete, duration = 2400 }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), duration - 400);
    const completeTimer = setTimeout(onComplete, duration);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <motion.div
      role="status"
      aria-label="Loading mayotti"
      className="fixed inset-0 z-50 bg-background overflow-hidden"
      initial={false}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Mark: centered exactly like the native launch image, then rises. */}
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{ width: MARK_SIZE, height: MARK_SIZE, x: "-50%", y: "-50%" }}
        animate={reduceMotion ? undefined : { y: ["-50%", "-50%", "-95%"] }}
        transition={{ duration: 0.9, times: [0, 0.45, 1], ease }}
      >
        {/* Growth ring */}
        {!reduceMotion && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-[25%]"
            style={{ backgroundColor: TINT }}
            initial={{ scale: 1, opacity: 0.9 }}
            animate={{ scale: 2.1, opacity: 0 }}
            transition={{ duration: 1.1, delay: 0.1, ease: "easeOut" }}
          />
        )}

        <svg viewBox="0 0 64 64" width="100%" height="100%" className="relative" aria-hidden="true">
          <rect width="64" height="64" rx="16" fill={TINT} />
          <motion.g
            style={{ originX: "32px", originY: "30px" }}
            animate={reduceMotion ? undefined : { rotate: [0, -7, 5, 0], scale: [1, 1.08, 1.04, 1] }}
            transition={{ duration: 1.0, delay: 0.15, ease: "easeInOut" }}
          >
            <path d="M32 30V18" stroke={BRAND} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M32 22c-8 0-13-4-13-11 8 0 13 4 13 11z" fill={BRAND} />
            <path d="M32 19c0-6 4-10 12-10 0 7-4 10-12 10z" fill={BRAND} fillOpacity="0.7" />
          </motion.g>
          <circle cx="32" cy="42" r="13" fill={BRAND} />
          <motion.circle
            cx="32"
            cy="42"
            r="8.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            initial={{ strokeOpacity: 0.45 }}
            animate={reduceMotion ? undefined : { strokeOpacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>

      {/* Wordmark and tagline appear under the risen mark. */}
      <div
        className="absolute left-0 right-0 flex flex-col items-center"
        style={{ top: `calc(50% + ${MARK_SIZE} * 0.24)` }}
      >
        <motion.p
          className="font-extrabold tracking-[-0.03em] text-primary leading-none"
          style={{ fontSize: `calc(${MARK_SIZE} * 0.48)` }}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: reduceMotion ? 0.1 : 0.55, ease }}
        >
          mayotti
        </motion.p>
        <motion.p
          className="mt-3 text-[15px] font-medium text-muted-foreground"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: reduceMotion ? 0.2 : 0.8, ease }}
        >
          Save smart, live better.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
