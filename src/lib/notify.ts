import { toast as appToast } from "@/hooks/use-toast";

/*
  One notification style for the whole app. A small adapter with the same
  shape as the old sonner calls (toast.success / error / info / loading),
  rendered by AppToaster. Passing the same `id` replaces the previous toast,
  e.g. "Restoring purchases..." -> "Purchases restored!".
*/
type Opts = { description?: string; id?: string; duration?: number };
const live = new Map<string, ReturnType<typeof appToast>>();

const show = (title: string, opts: Opts = {}, destructive = false) => {
  const props = {
    title,
    description: opts.description,
    variant: destructive ? ("destructive" as const) : ("default" as const),
    duration: opts.duration ?? 3500,
  };
  const existing = opts.id ? live.get(opts.id) : undefined;
  if (existing) {
    existing.update({ id: existing.id, ...props });
    return existing;
  }
  const handle = appToast(props);
  if (opts.id) live.set(opts.id, handle);
  return handle;
};

export const toast = {
  success: (title: string, opts?: Opts) => show(title, opts),
  info: (title: string, opts?: Opts) => show(title, opts),
  error: (title: string, opts?: Opts) => show(title, opts, true),
  loading: (title: string, opts?: Opts) => show(title, { duration: 60000, ...opts }),
};
