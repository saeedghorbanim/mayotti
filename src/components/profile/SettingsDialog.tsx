import { CreditCard, ExternalLink, Trash2, RefreshCw } from "lucide-react";
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
      <DialogContent className="sm:max-w-[400px]">
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
                    {subscription.isSubscribed ? "Mayotti Pro" : "Free Plan"}
                  </span>
                </div>
                {subscription.isSubscribed && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </div>

              {subscription.isSubscribed ? (
                <p className="text-sm text-muted-foreground">
                  Your subscription renews monthly at $2.99 USD
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Upgrade to Pro for unlimited expense tracking
                </p>
              )}

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
                  Upgrade to Pro
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
