import { MessageSquare, TrendingUp, RefreshCw, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "stats", label: "Stats", icon: TrendingUp },
  { id: "recurring", label: "Recurring", icon: RefreshCw },
  { id: "history", label: "History", icon: Calendar },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav
      aria-label="Main"
      className="shrink-0 bg-card border-t border-divider"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-4 px-2 pt-2 pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-[3px] h-[52px] transition-colors",
                isActive ? "text-primary font-bold" : "text-muted-foreground font-semibold hover:text-foreground"
              )}
            >
              <tab.icon className="w-[22px] h-[22px]" strokeWidth={2} aria-hidden="true" />
              <span className="text-[11px] leading-[14px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
