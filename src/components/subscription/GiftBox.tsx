import { motion } from "framer-motion";

interface GiftBoxProps {
  body: string;
  lid: string;
  ribbon: string;
  /** "idle" floats gently, "shake" wiggles, "open" pops the lid off. */
  state: "idle" | "shake" | "open";
  delay?: number;
  reduceMotion?: boolean;
}

/** A wrapped gift box drawn in SVG, with an animated lid. */
export const GiftBox = ({ body, lid, ribbon, state, delay = 0, reduceMotion }: GiftBoxProps) => {
  const boxMotion =
    reduceMotion || state === "open"
      ? {}
      : state === "shake"
        ? { rotate: [0, -9, 9, -7, 7, -4, 4, 0], transition: { duration: 0.6 } }
        : { y: [0, -7, 0], transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" as const, delay } };

  return (
    <motion.svg viewBox="10 14 100 100" className="w-full h-full overflow-visible" animate={boxMotion}>
      {/* soft shadow */}
      <ellipse cx="60" cy="112" rx="38" ry="5" fill="#17201B" opacity="0.08" />
      {/* body */}
      <rect x="20" y="52" width="80" height="58" rx="10" fill={body} />
      <rect x="54" y="52" width="12" height="58" fill={ribbon} />
      <rect x="20" y="52" width="80" height="8" fill="#000" opacity="0.08" />
      {/* lid + bow */}
      <motion.g
        style={{ originX: "60px", originY: "50px" }}
        animate={state === "open" ? { y: -46, rotate: -18, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <path d="M60 36 C46 18 30 24 36 34 C40 40 52 38 60 36 Z" fill={ribbon} />
        <path d="M60 36 C74 18 90 24 84 34 C80 40 68 38 60 36 Z" fill={ribbon} />
        <rect x="14" y="36" width="92" height="20" rx="8" fill={lid} />
        <rect x="54" y="36" width="12" height="20" fill={ribbon} />
        <circle cx="60" cy="36" r="5" fill={ribbon} />
      </motion.g>
    </motion.svg>
  );
};
