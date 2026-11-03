import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

/*
  Small wrappers around the iPhone's Taptic Engine. They do nothing on the
  web, and never throw: a missed buzz should never break the screen.
*/
const native = () => Capacitor.isNativePlatform();

export const tapHaptic = (style: "light" | "medium" | "heavy" = "light") => {
  if (!native()) return;
  const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
  Haptics.impact({ style: map[style] }).catch(() => {});
};

export const successHaptic = () => {
  if (!native()) return;
  Haptics.notification({ type: NotificationType.Success }).catch(() => {});
};

/** A run of taps timed to a shake animation, e.g. [0, 90, 180]. Returns a cancel function. */
export const shakeHaptics = (times: number[], style: "light" | "medium" = "medium") => {
  const timers = times.map((t) => setTimeout(() => tapHaptic(style), t));
  return () => timers.forEach(clearTimeout);
};
