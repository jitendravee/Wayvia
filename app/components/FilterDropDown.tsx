"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";

export interface FilterDropdownProps {
  /** Small label above the value, e.g. "Budget", "Departure". */
  label: string;
  /** Current value shown next to the label, e.g. "Up to ₹2,500". */
  valueLabel: string;
  /** Highlights the trigger (violet text) when the value differs from its default. */
  active?: boolean;
  /**
   * "pill" is the filled violet chip look (used for "Best match" in the
   * reference design); "plain" is the quieter text-only trigger used by
   * every other filter in the bar.
   */
  variant?: "pill" | "plain";
  /** Icon rendered before the label on "pill" triggers (e.g. Sparkles, SlidersHorizontal). */
  icon?: ReactNode;
  /** Which side the desktop dropdown panel opens from. */
  align?: "left" | "right";
  /** Extra classes for the desktop dropdown panel (e.g. a wider w-80 for Transport). */
  panelClassName?: string;
  /** Sheet header title on mobile — defaults to `label`. */
  title?: string;
  /** The filter's actual controls (radio list, slider, checkboxes, ...). */
  children: ReactNode;
  /** Optional footer row (e.g. "Apply") shown under the controls in both layouts. */
  footer?: ReactNode;
}

/**
 * One filter trigger + its content, rendered two ways from the same
 * `open` state:
 *  - a floating dropdown panel, shown only at `sm:` and above
 *  - a bottom sheet with a backdrop, shown only below `sm:`
 * Both are plain CSS (`hidden sm:block` / `sm:hidden`) so there's no
 * client-side viewport detection and nothing to get out of sync on resize.
 */
export default function FilterDropdown({
  label,
  valueLabel,
  active = false,
  variant = "plain",
  icon,
  align = "left",
  panelClassName = "",
  title,
  children,
  footer,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  // The mobile sheet stays mounted after its first open so the closing
  // transition can actually play, instead of the sheet just vanishing.
  const [everOpened, setEverOpened] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  function toggle() {
    setOpen((wasOpen) => {
      if (!wasOpen) setEverOpened(true);
      return !wasOpen;
    });
  }

  // Desktop: close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Lock page scroll while any panel is open (mainly matters for the
  // mobile sheet; harmless when the desktop dropdown is what's open).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={
          variant === "pill"
            ? "flex shrink-0 items-center gap-1.5 rounded-full bg-violet-soft px-3.5 py-2 font-display text-[13px] font-semibold text-violet-dark transition hover:bg-violet-soft/70"
            : `flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-surface-alt ${
                active ? "bg-violet-soft/40" : ""
              }`
        }
      >
        {variant === "pill" && icon}
        {variant === "pill" ? (
          <span>{label}</span>
        ) : (
          <span className="leading-tight">
            <span className="block font-mono text-[10px] uppercase tracking-wider text-ink-dim">{label}</span>
            <span className={`block whitespace-nowrap font-display text-[13px] font-semibold ${active ? "text-violet" : "text-ink"}`}>
              {valueLabel}
            </span>
          </span>
        )}
        <ChevronDown size={14} className={`shrink-0 text-ink-dim transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Desktop dropdown */}
      {open && (
        <div
          className={`absolute top-[calc(100%+8px)] z-30 hidden w-72 rounded-2xl border border-border bg-white p-4 shadow-lg shadow-ink/5 sm:block ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName}`}
        >
          {children}
          {footer && <div className="mt-3 border-t border-border-soft pt-3">{footer}</div>}
        </div>
      )}

      {/* Mobile bottom sheet — stays mounted once opened so it can transition closed */}
      {everOpened && (
        <div className={`fixed inset-0 z-40 sm:hidden ${open ? "" : "pointer-events-none"}`}>
          <div
            className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-border bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-2xl transition-transform duration-300 ${
              open ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-[15px] font-semibold text-ink">{title ?? label}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-ink-dim transition hover:bg-surface-alt hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            {children}
            {footer && <div className="mt-4 border-t border-border-soft pt-4">{footer}</div>}
          </div>
        </div>
      )}
    </div>
  );
}