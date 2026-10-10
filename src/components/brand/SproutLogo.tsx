import { cn } from "@/lib/utils";

interface SproutLogoProps {
  /** Rendered width and height in px. */
  size?: number;
  className?: string;
  /** Accessible name; pass "" when the logo sits next to visible "mayotti" text. */
  title?: string;
}

/**
 * The Mayotti mark: a two-leaf sprout growing from a coin, in brand green on a
 * brand-tint rounded square. It keeps its own colors in light and dark mode.
 */
export const SproutLogo = ({ size = 40, className, title = "mayotti" }: SproutLogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={cn("shrink-0", className)}
    role={title ? "img" : undefined}
    aria-label={title || undefined}
    aria-hidden={title ? undefined : true}
  >
    <rect width="64" height="64" rx="16" fill="#E5F0E9" />
    <path d="M32 30V18" stroke="#1F6B4F" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M32 22c-8 0-13-4-13-11 8 0 13 4 13 11z" fill="#1F6B4F" />
    <path d="M32 19c0-6 4-10 12-10 0 7-4 10-12 10z" fill="#1F6B4F" fillOpacity="0.7" />
    <circle cx="32" cy="42" r="13" fill="#1F6B4F" />
    <circle cx="32" cy="42" r="8.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2" />
  </svg>
);
