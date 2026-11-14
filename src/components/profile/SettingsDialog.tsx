import { useState } from "react";
import { CreditCard, ExternalLink, Trash2, RefreshCw, Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAppUsage } from "@/hooks/useAppUsage";
import { useInAppPurchase } from "@/hooks/useInAppPurchase";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { getReminderPrefs, setNudgeFrequency, type NudgeFrequency } from "@/lib/reminders";
import { cn } from "@/lib/utils";

const NUDGE_OPTIONS: { value: NudgeFrequency; label: string }[] = [
  { value: "daily", label: "Every evening" },
  { value: "weekly", label: "Weekly" },
  { value: "none", label: "Off" },
];

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowPaywall?: () => void;
}

export const SettingsDialog = ({ open, onOpenChange, onShowPaywall }: SettingsDialogProps) => {
  const { subscription, setSubscriptionActive } = useAppUsage();
  
  const handleRestoreSuccess = (productId: string) => {
    setSubscriptionActive(productId);
    toast.success("Subscription restored successfully!");
  };
  
  const { restore, isLoading: isRestoring } = useInAppPurchase(handleRestoreSuccess);
  const [nudge, setNudge] = useState<NudgeFrequency>(() => getReminderPrefs()?.frequency ?? "daily");

  const changeNudge = async (value: NudgeFrequency) => {
    setNudge(value);
    const ok = await setNudgeFrequency(value);
    if (value === "none") {
      toast.success("Reminders turned off", { description: "You'll still get an alert if your balance runs low." });
    } else if (ok) {
      toast.success(value === "daily" ? "Reminder set for every evening" : "Weekly reminder set");
    } else {
      toast.error("Notifications are off for Mayotti", {
        description: "Turn them on in iPhone Settings → Mayotti → Notifications.",
        duration: 6000,
      });
    }
  };

  const handleManageSubscription = () => {
    // Deep link to App Store subscription management (iOS only for now)
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
      // iOS App Store subscription management URL
      window.location.href = "itms-apps://apps.apple.com/account/subscriptions";
    } else {
      // For web/testing, show instructions
      toast.info("Subscription Management", {
        description: "On iOS: Settings → [Your Name] → Subscriptions",
        duration: 5000,
      });
    }
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all app data? This cannot be undone.")) {
      localStorage.clear();
      toast.success("All data cleared", {
        description: "The app will reload now",
      });
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Subscription Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Subscription
            </h3>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    Mayotti Premium
                  </span>
                </div>
                {subscription.isSubscribed && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                {subscription.isSubscribed
                  ? "Your plan and renewal date are shown in your Apple ID subscriptions."
                  : "Subscribe to log expenses by chat, voice and receipt photos."}
              </p>

              {subscription.isSubscribed ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleManageSubscription}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false);
                    onShowPaywall?.();
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  View Plans
                </Button>
              )}

              {/* Restore Purchases Button - Required by App Store Guidelines 3.1.1 */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={async () => {
                  toast.loading("Restoring purchases...", { id: "restore" });
                  const success = await restore();
                  if (success) {
                    toast.success("Purchases restored!", { id: "restore" });
                  } else {
                    toast.error("No previous purchases found.", { id: "restore" });
                  }
                }}
                disabled={isRestoring}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRestoring ? 'animate-spin' : ''}`} />
                Restore Purchases
              </Button>

              {subscription.isSubscribed && (
                <p className="text-xs text-muted-foreground text-center">
                  Cancel anytime from your device's subscription settings
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Reminders Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Reminders
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="font-medium">Reminder to log spending</span>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-background p-1" role="radiogroup" aria-label="Reminder frequency">
                {NUDGE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    role="radio"
                    aria-checked={nudge === o.value}
                    onClick={() => changeNudge(o.value)}
                    className={cn(
                      "h-10 rounded-lg text-sm font-semibold transition-colors",
                      nudge === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Low-balance alerts always stay on, so you'll know before you run out.
              </p>
            </div>
          </div>

          <Separator />

          {/* Data Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Data
            </h3>
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleClearData}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All App Data
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              This will delete all expenses, budgets, and settings
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
