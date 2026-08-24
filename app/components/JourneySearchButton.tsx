"use client";

import { useRouter } from "next/navigation";
import { todayIso } from "@/lib/date";

export interface JourneySearchButtonProps {
  /** Station code, e.g. "NDLS". Falls back to the current URL's ?from= if omitted. */
  from?: string;
  /** Station code, e.g. "BCT". Falls back to the current URL's ?to= if omitted. */
  to?: string;
  /** YYYY-MM-DD. Falls back to the current URL's ?date=, then today. */
  date?: string;
  /**
   * Optional — most callers should leave this unset. Train-specific refinements
   * like class/quota belong on the journey-planner's filters, not the base
   * search, but a caller that already knows them (e.g. a "search again" link)
   * can still forward them through the URL.
   */
  travelClass?: string;
  quota?: string;
  label?: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  /** Return false to cancel navigation (e.g. to show a validation message instead). */
  onBeforeNavigate?: () => boolean | void;
  /** Called right before navigating, with the params that are about to be sent. */
  onNavigate?: (params: { from: string; to: string; date: string }) => void;
}

const VARIANT_CLASS: Record<NonNullable<JourneySearchButtonProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-r from-violet to-violet-dark text-white shadow-sm shadow-violet-soft hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100",
  outline:
    "border border-violet bg-white text-violet hover:bg-violet-soft/60 disabled:opacity-50",
  ghost: "bg-violet-soft/60 text-violet-dark hover:bg-violet-soft disabled:opacity-50",
};

const SIZE_CLASS: Record<NonNullable<JourneySearchButtonProps["size"]>, string> = {
  sm: "h-9 px-3.5 text-[12.5px]",
  md: "h-11 px-5 text-sm",
  lg: "h-[52px] px-7 text-[15px]",
};

/**
 * A single button, usable anywhere in the app, that resolves a from/to/date
 * journey (either from its own props or, for whichever of those it wasn't
 * given, from the current page's URL query string) and pushes the user to
 * /journey-planner with those as query params. The journey planner reads
 * them on mount and runs the search itself — this component never calls the
 * search API directly, so it stays a thin, reusable "go search this" action.
 */
export default function JourneySearchButton({
  from,
  to,
  date,
  travelClass,
  quota,
  label = "Search trains",
  loadingLabel = "Searching…",
  loading = false,
  disabled = false,
  className = "",
  variant = "primary",
  size = "md",
  onBeforeNavigate,
  onNavigate,
}: JourneySearchButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (loading || disabled) return;
    if (onBeforeNavigate && onBeforeNavigate() === false) return;

    // Anything not explicitly passed as a prop is picked up from whatever is
    // already in the address bar — so this button works both as a fully
    // controlled search-and-go CTA (landing hero) and as a "reuse whatever
    // the URL already says" shortcut (e.g. a route card that only overrides
    // `to`).
    const current = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const resolvedFrom = (from ?? current.get("from") ?? "").trim().toUpperCase();
    const resolvedTo = (to ?? current.get("to") ?? "").trim().toUpperCase();
    const resolvedDate = (date ?? current.get("date") ?? todayIso()).trim();

    if (!resolvedFrom || !resolvedTo) return; // nothing sensible to search yet

    const params = new URLSearchParams();
    params.set("from", resolvedFrom);
    params.set("to", resolvedTo);
    params.set("date", resolvedDate);
    if (travelClass) params.set("class", travelClass);
    if (quota) params.set("quota", quota);

    onNavigate?.({ from: resolvedFrom, to: resolvedTo, date: resolvedDate });
    router.push(`/journey-planner?${params.toString()}`);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-display font-semibold transition-transform ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
    >
      {loading ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}