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
      className="shrink-0 bg-background px-4 pb-3"
      style={{ paddingTop: "max(env(safe-area-inset-top), 1.5rem)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <SproutLogo size={32} title="" className="shrink-0" />
          <h1 className="truncate text-[22px] leading-7 font-extrabold tracking-[-0.03em] text-primary">
            mayotti
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <div className="text-right">
            <p className="text-[12px] leading-4 font-semibold text-muted-foreground whitespace-nowrap">
              Spent in {month}
            </p>
            <p className="text-[17px] leading-6 font-extrabold tracking-[-0.02em] text-foreground whitespace-nowrap">
              ${monthlyTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <ProfileMenu onShowPaywall={onShowPaywall} />
        </div>
      </div>
    </header>
  );
};
