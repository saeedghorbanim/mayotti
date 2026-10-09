import { DollarSign } from "lucide-react";
import { ProfileMenu } from "@/components/profile/ProfileMenu";

interface AppHeaderProps {
  monthlyTotal: number;
  onShowPaywall?: () => void;
}

export const AppHeader = ({ monthlyTotal, onShowPaywall }: AppHeaderProps) => {

  return (
    <header
      className="bg-gradient-to-r from-primary to-accent px-4 pb-4 text-primary-foreground"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            aria-label="App logo"
          >
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg">Mayotti</h1>
            <p className="text-xs opacity-90">Save Smart, Live Better</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs opacity-80">This Month</p>
            <p className="text-xl font-bold font-display">
              ${monthlyTotal.toFixed(2)}
            </p>
          </div>
          
          <ProfileMenu onShowPaywall={onShowPaywall} />
        </div>
      </div>
    </header>
  );
};
