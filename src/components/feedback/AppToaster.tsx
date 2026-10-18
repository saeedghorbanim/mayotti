import { CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/*
  Mayotti's toast styling, built on the shadcn primitives (which we don't edit).
  Sits below the status bar / Dynamic Island, uses a white card with a brand
  icon so it stands out from the background, and turns red-tinted for errors.
*/
export function AppToaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={3000} swipeDirection="up">
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        const isError = variant === "destructive";
        const Icon = isError ? AlertCircle : CheckCircle2;
        return (
          <Toast
            key={id}
            {...props}
            className={cn(
              "items-center gap-3 space-x-0 rounded-[18px] border-0 p-3 pr-10",
              "shadow-[0_10px_30px_rgba(23,32,27,0.16),0_2px_6px_rgba(23,32,27,0.08)]",
              "data-[state=open]:slide-in-from-top-full data-[state=closed]:slide-out-to-top-full",
              "data-[swipe=end]:translate-y-[var(--radix-toast-swipe-end-y)] data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y)] data-[swipe=move]:translate-x-0 data-[swipe=end]:translate-x-0",
              isError ? "bg-destructive-tint text-foreground" : "bg-card text-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                isError ? "bg-destructive/10 text-destructive" : "bg-accent text-primary",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <div className="grid min-w-0 flex-1 gap-0.5">
              {title && (
                <ToastTitle
                  className={cn("text-[15px] leading-5 font-bold", isError ? "text-destructive" : "text-foreground")}
                >
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-[13px] leading-[18px] font-medium text-muted-foreground opacity-100">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="right-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-70" />
          </Toast>
        );
      })}
      <ToastViewport
        className="top-0 bottom-auto left-0 right-0 mx-auto max-w-[480px] flex-col gap-2 px-4 pb-0 sm:bottom-auto sm:right-0 sm:top-0 sm:flex-col md:max-w-[480px]"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 8px)" }}
      />
    </ToastProvider>
  );
}
