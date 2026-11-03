import { motion, useReducedMotion } from "framer-motion";
import { SproutLogo } from "@/components/brand/SproutLogo";

/*
  Animated hero for the gift offer: slowly turning light rays, a glowing
  Sprout tile that springs in and floats, coins that pop out and bob around
  it, and twinkling sparkles. Everything is still when Reduce Motion is on.
*/
const RAYS = 14;

const COINS = [
  { x: -96, y: -18, size: 34, delay: 0.35, bob: 6 },
  { x: 92, y: -40, size: 28, delay: 0.5, bob: 8 },
  { x: 78, y: 46, size: 38, delay: 0.65, bob: 5 },
  { x: -70, y: 52, size: 26, delay: 0.8, bob: 7 },
];

const SPARKLES = [
  { x: -60, y: -66, s: 14, d: 0.0 },
  { x: 58, y: -78, s: 10, d: 0.7 },
  { x: 118, y: 6, s: 12, d: 1.3 },
  { x: -122, y: 22, s: 10, d: 0.4 },
  { x: 8, y: 86, s: 12, d: 1.0 },
];

const Coin = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="21.5" r="17" fill="#C9962B" />
    <circle cx="20" cy="19" r="17" fill="#F2C14E" />
    <circle cx="20" cy="19" r="12" fill="none" stroke="#FFF3CF" strokeOpacity="0.8" strokeWidth="2" />
    <text x="20" y="25" textAnchor="middle" fontSize="16" fontWeight="800" fill="#9A6B12" fontFamily="Manrope, system-ui">
      $
    </text>
  </svg>
);

const Sparkle = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0 Z" fill="#F2C14E" />
  </svg>
);

export const GiftHero = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative w-full h-[190px] flex items-center justify-center" aria-hidden="true">
      {/* turning light rays */}
      <motion.svg
        viewBox="-100 -100 200 200"
        className="absolute w-[300px] h-[300px]"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1, rotate: reduceMotion ? 0 : 360 }}
        transition={{
          opacity: { duration: 0.5 },
          scale: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          rotate: { duration: 28, repeat: Infinity, ease: "linear" },
        }}
      >
        <defs>
          <radialGradient id="gift-ray" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
            <stop offset="0.25" stopColor="#F2C14E" stopOpacity="0.55" />
            <stop offset="1" stopColor="#F2C14E" stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: RAYS }).map((_, i) => {
          const a = (i / RAYS) * Math.PI * 2;
          const w = Math.PI / RAYS / 2;
          const p = (ang: number) => `${Math.cos(ang) * 100} ${Math.sin(ang) * 100}`;
          return <path key={i} d={`M0 0 L${p(a - w)} L${p(a + w)} Z`} fill="url(#gift-ray)" />;
        })}
      </motion.svg>

      {/* soft pulsing glow */}
      <motion.div
        className="absolute w-[170px] h-[170px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(31,107,79,0.22) 0%, rgba(31,107,79,0) 70%)" }}
        animate={reduceMotion ? undefined : { scale: [1, 1.15, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* sparkles */}
      {SPARKLES.map((sp, i) => (
        <motion.span
          key={`s${i}`}
          className="absolute"
          style={{ left: "50%", top: "50%", marginLeft: sp.x - sp.s / 2, marginTop: sp.y - sp.s / 2 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: [0, 1, 0], scale: [0.3, 1, 0.3], rotate: [0, 90] }}
          transition={{ duration: 1.8, delay: 0.4 + sp.d, repeat: Infinity, repeatDelay: 0.6 }}
        >
          <Sparkle size={sp.s} />
        </motion.span>
      ))}

      {/* coins pop out of the tile, then bob */}
      {COINS.map((c, i) => (
        <motion.span
          key={`c${i}`}
          className="absolute"
          style={{ left: "50%", top: "50%", marginLeft: -c.size / 2, marginTop: -c.size / 2 }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{ x: c.x, y: c.y, scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 14, delay: reduceMotion ? 0 : c.delay }}
        >
          <motion.span
            className="block"
            animate={reduceMotion ? undefined : { y: [0, -c.bob, 0], rotate: [0, i % 2 ? 8 : -8, 0] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: c.delay + 0.6 }}
          >
            <Coin size={c.size} />
          </motion.span>
        </motion.span>
      ))}

      {/* the Sprout tile */}
      <motion.div
        className="relative"
        initial={{ scale: reduceMotion ? 1 : 0.3, opacity: 0, rotate: reduceMotion ? 0 : -12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 15 }}
      >
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="rounded-[28px] shadow-[0_14px_34px_rgba(31,107,79,0.28)] bg-card"
        >
          <SproutLogo size={104} title="" />
        </motion.div>
      </motion.div>
    </div>
  );
};
