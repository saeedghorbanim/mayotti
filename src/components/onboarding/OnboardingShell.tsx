import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OnboardingShellProps {
  children: ReactNode;
  footer: ReactNode;
  onBack?: () => void;
  progress?: { current: number; total: number };
  dots?: { count: number; activeIndex: number };
}

export const OnboardingShell = ({ children, footer, onBack, progress, dots }: OnboardingShellProps) => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <div
        className="flex items-center gap-3 px-4 pb-2"
        style={{ paddingTop: "max(env(safe-area-inset-top), 1.5rem)" }}
      >
        <button
          onClick={onBack}
          disabled={!onBack}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
            onBack ? "text-foreground hover:bg-muted" : "invisible"
          )}
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {progress && (
          <div className="flex-1 flex items-center gap-2">
            <Progress value={(progress.current / progress.total) * 100} className="h-1.5 flex-1" />
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {progress.current}/{progress.total}
            </span>
          </div>
        )}

        {dots && (
          <div className="flex-1 flex items-center justify-center gap-1.5">
            {Array.from({ length: dots.count }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === dots.activeIndex ? "w-6 bg-primary" : "w-1.5 bg-muted"
                )}
              />
            ))}
          </div>
        )}

        {!progress && !dots && <div className="flex-1" />}
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4">{children}</div>

      <div className="px-4 pt-3 pb-safe bg-gradient-to-t from-background via-background/95 to-transparent">
        {footer}
      </div>
    </div>
  );
};
