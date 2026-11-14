import { Capacitor } from "@capacitor/core";
import { LocalNotifications, Weekday } from "@capacitor/local-notifications";

/*
  Two kinds of notifications, both scheduled on the phone (no server):

  1. Nudges: a friendly reminder to log spending, daily or weekly. The user
     chooses this in onboarding and can change it or turn it off in Settings.
  2. Balance alerts: sent when the balance drops below 10% of the budget or
     goes negative. These always stay on (iOS Settings can still silence all
     Mayotti notifications), and fire at most once per level per month.
*/

export type NudgeFrequency = "daily" | "weekly" | "none";

const PREFS_KEY = "mayotti_reminders";
const ALERTS_KEY = "mayotti_balance_alerts";
const NUDGE_IDS = { daily: 101, weekly: 102 } as const;
const ALERT_IDS = { low: 201, over: 202 } as const;

interface ReminderPrefs {
  frequency: NudgeFrequency;
  permissionAsked: boolean;
}

const native = () => Capacitor.isNativePlatform();

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
};
const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

/** Maps the onboarding answer (older builds also had "important_only") to a nudge setting. */
export const nudgeFromOnboarding = (answer: string | null | undefined): NudgeFrequency =>
  answer === "daily" || answer === "weekly" ? answer : answer == null ? "daily" : "none";

export const getReminderPrefs = (): ReminderPrefs | null => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as ReminderPrefs) : null;
  } catch {
    return null;
  }
};

const ensurePermission = async (): Promise<boolean> => {
  if (!native()) return false;
  try {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === "granted") return true;
    if (current.display === "denied") return false;
    const asked = await LocalNotifications.requestPermissions();
    return asked.display === "granted";
  } catch {
    return false;
  }
};

const scheduleNudge = async (frequency: NudgeFrequency) => {
  if (!native()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: NUDGE_IDS.daily }, { id: NUDGE_IDS.weekly }],
    });
    if (frequency === "none") return;
    const nudge =
      frequency === "daily"
        ? {
            id: NUDGE_IDS.daily,
            title: "Log today's spending",
            body: "Bought anything today? Just tell Mayotti and it's done.",
            schedule: { on: { hour: 20, minute: 0 }, allowWhileIdle: true },
          }
        : {
            id: NUDGE_IDS.weekly,
            title: "Your weekly check-in",
            body: "Take a minute to log this week's spending and see where you stand.",
            schedule: { on: { weekday: Weekday.Sunday, hour: 19, minute: 0 }, allowWhileIdle: true },
          };
    await LocalNotifications.schedule({ notifications: [nudge] });
  } catch (e) {
    console.error("[reminders] could not schedule nudge", e);
  }
};

/**
 * Called once the main app opens. The first time, it asks for notification
 * permission and adopts the onboarding answer; after that it just keeps the
 * scheduled nudge in sync with the saved setting.
 */
export const initReminders = async (onboardingAnswer: string | null | undefined) => {
  let prefs = getReminderPrefs();
  if (!prefs) {
    prefs = { frequency: nudgeFromOnboarding(onboardingAnswer), permissionAsked: false };
  }
  if (!prefs.permissionAsked) {
    await ensurePermission();
    prefs = { ...prefs, permissionAsked: true };
  }
  writeJson(PREFS_KEY, prefs);
  await scheduleNudge(prefs.frequency);
};

/** Changes the nudge from Settings. Balance alerts are not affected. */
export const setNudgeFrequency = async (frequency: NudgeFrequency): Promise<boolean> => {
  const prefs = getReminderPrefs() ?? { frequency, permissionAsked: false };
  writeJson(PREFS_KEY, { ...prefs, frequency, permissionAsked: true });
  if (frequency === "none") {
    await scheduleNudge("none");
    return true;
  }
  const granted = await ensurePermission();
  await scheduleNudge(frequency);
  return granted;
};

/**
 * Sends a balance alert when the balance first drops below 10% of the budget,
 * or below zero, in a given month. Safe to call on every budget change.
 */
export const checkBalanceAlert = async (total: number, spent: number) => {
  if (!native() || !total || total <= 0) return;
  const balance = total - spent;
  const level: "low" | "over" | null = balance < 0 ? "over" : balance / total < 0.1 ? "low" : null;
  if (!level) return;

  const now = new Date();
  const month = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const sent = readJson<Record<string, string>>(ALERTS_KEY, {});
  if (sent[level] === month) return;

  const money = (n: number) =>
    `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") return;
    await LocalNotifications.schedule({
      notifications: [
        level === "over"
          ? {
              id: ALERT_IDS.over,
              title: "Over budget",
              body: `You've spent ${money(balance)} more than your budget this month.`,
            }
          : {
              id: ALERT_IDS.low,
              title: "Running low",
              body: `Only ${money(balance)} left this month. Spend carefully.`,
            },
      ],
    });
    writeJson(ALERTS_KEY, { ...sent, [level]: month });
  } catch (e) {
    console.error("[reminders] could not send balance alert", e);
  }
};
