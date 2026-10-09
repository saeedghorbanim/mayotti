import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePaywall } from "@/hooks/usePaywall";
import appIcon from "@/assets/mayotti-logo.png";

interface HardPaywallGateProps {
  onSubscribed: (productId: string) => void;
}

export const HardPaywallGate = ({ onSubscribed }: HardPaywallGateProps) => {
  const { presentPaywall, isPresenting } = usePaywall(onSubscribed);

  const attempt = () => {
    presentPaywall({ displayCloseButton: false });
  };

  // Present automatically as soon as this gate mounts, so subscribing feels
  // like the natural next step right after onboarding rather than a dead end.
  useEffect(() => {
    attempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center gap-5 p-6 text-center">
      <img src={appIcon} alt="Mayotti" className="w-20 h-20 rounded-3xl shadow-xl" />
      <p className="text-muted-foreground text-sm max-w-xs">
        Subscribe to Mayotti to start tracking your expenses and building your savings.
      </p>
      <Button size="lg" className="h-12 px-8" onClick={attempt} disabled={isPresenting}>
        {isPresenting ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          "View Plans"
        )}
      </Button>
    </div>
  );
};
