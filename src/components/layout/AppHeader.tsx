import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { SproutLogo } from "@/components/brand/SproutLogo";

interface AppHeaderProps {
  monthlyTotal: number;
  onShowPaywall?: () => void;
}

export const AppHeader = ({ monthlyTotal, onShowPaywall }: AppHeaderProps) => {
  const month = new Date().toLocaleString("en-US", { month: "long" });

  return (
    <header
      className="bg-background px-5 pb-3"
      style={{ paddingTop: "max(env(safe-area-inset-top), 1.5rem)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <SproutLogo size={36} title="" />
          <h1 className="text-[26px] leading-8 font-extrabold tracking-[-0.03em] text-primary">
            mayotti
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[13px] leading-[18px] font-semibold text-muted-foreground">
              Spent in {month}
            </p>
            <p className="text-lg leading-6 font-extrabold tracking-[-0.02em] text-foreground">
              ${monthlyTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <ProfileMenu onShowPaywall={onShowPaywall} />
        </div>
      </div>
    </header>
  );
};
