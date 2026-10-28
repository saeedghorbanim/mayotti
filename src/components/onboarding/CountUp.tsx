import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

interface CountUpProps {
  to: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/** Counts a number up from 0 once, e.g. "$0" → "$600". */
export const CountUp = ({ to, duration = 1.4, delay = 0, prefix = "", suffix = "", className }: CountUpProps) => {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion ? to : 0);

  useEffect(() => {
    if (reduceMotion) {
      setValue(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [to, duration, delay, reduceMotion]);

  return (
    <span className={className}>
      {prefix}
      {Math.round(value).toLocaleString("en-US")}
      {suffix}
    </span>
  );
};
