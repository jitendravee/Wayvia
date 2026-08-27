"use client";

import { Compass, MapPin, RotateCcw, SearchX, TrainFront } from "lucide-react";
import { formatDatePretty } from "@/lib/date";

export interface NoResultsSuggestion {
  message: string;
  nextConnections: 1 | 2 | 3;
}

interface Props {
  from: string;
  to: string;
  /** ISO date for this leg — shown formatted, e.g. "Fri, 5 Sep". Omit if unknown. */
  date?: string;
  /**
   * How many "partway there" matches (real trains covering part of the
   * route) exist below this card, if any. > 0 shows a "jump to those"
   * button instead of just mentioning them in passing.
   */
  partialCount?: number;
  /** Anchor id the "see partial matches" button scrolls to. */
  partialAnchorId?: string;
  /**
   * The backend's own "you searched too narrowly" hint — e.g. "only 1
   * change allowed, but a 2-change route exists". When present this drives
   * the primary CTA; when absent the card falls back to generic tips only.
   */
  suggestion?: NoResultsSuggestion;
  /** Fired when the primary CTA is pressed — typically `onRefine({ maxConnections: suggestion.nextConnections })`. */
  onWidenSearch?: () => void;
  /** True while a widen-search refetch is in flight — disables the CTA and shows a spinner. */
  loading?: boolean;
}

const DEFAULT_TIPS = [
  { icon: Compass, text: "Allow more junctions — one extra change often opens up a whole route" },
  { icon: MapPin, text: "Double-check the station codes — a nearby city or junction may serve this route instead" },
  { icon: TrainFront, text: "Try a day either side — seat maps and even routes can shift day to day" },
];

/**
 * Shown in place of the results list when a leg's search comes back with no
 * direct or junction-connected routes at all (as opposed to routes that
 * exist but got filtered out — that's a different, filter-specific empty
 * state, not this one). Leads with the backend's own widen-search
 * suggestion when there is one, since that's a one-tap fix; otherwise falls
 * back to generic, still-actionable tips.
 */
export default function NoResultsState({
  from,
  to,
  date,
  partialCount = 0,
  partialAnchorId = "partial-matches",
  suggestion,
  onWidenSearch,
  loading = false,
}: Props) {
  const prettyDate = date ? formatDatePretty(date) : "";

  function scrollToPartial() {
    document
      .getElementById(partialAnchorId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-white px-6 py-10 text-center shadow-sm sm:px-10 sm:py-14">
      {/* Icon: train in a soft violet disc, with a small "no results" badge layered on top — reuses the app's existing icon language instead of a bespoke illustration. */}
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-violet-soft">
        <TrainFront size={34} className="text-violet" />
        <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-ink text-white">
          <SearchX size={14} />
        </span>
      </div>

      <h3 className="mt-5 font-display text-[18px] font-semibold text-ink sm:text-[19px]">
        No direct routes from {from} to {to}
      </h3>
      <p className="mt-1.5 max-w-[420px] font-sans text-[13.5px] leading-relaxed text-ink-muted">
        {prettyDate ? (
          <>We didn&rsquo;t find a way to get there on <span className="font-medium text-ink">{prettyDate}</span> within the junctions currently allowed.</>
        ) : (
          <>We didn&rsquo;t find a way to get there within the junctions currently allowed.</>
        )}
      </p>

      {/* Primary path: the backend's own widen-search hint, when it has one. */}
      {suggestion && onWidenSearch && (
        <button
          type="button"
          onClick={onWidenSearch}
          disabled={loading}
          className="mt-6 flex items-center gap-2 rounded-full bg-gradient-to-r from-violet to-violet-dark px-5 py-2.5 font-display text-[13.5px] font-semibold text-white shadow-sm shadow-violet-soft transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
        >
          {loading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <RotateCcw size={15} />
          )}
          Search via {suggestion.nextConnections} junction{suggestion.nextConnections > 1 ? "s" : ""}
        </button>
      )}
      {suggestion && (
        <p className="mt-2 max-w-[380px] font-mono text-[11px] leading-relaxed text-ink-dim">
          {suggestion.message}
        </p>
      )}

      {/* Secondary path: real partial coverage exists further down the page. */}
      {partialCount > 0 && (
        <button
          type="button"
          onClick={scrollToPartial}
          className={`flex items-center gap-1.5 rounded-full border border-border px-4 py-2 font-display text-[12.5px] font-semibold text-ink-muted transition hover:border-violet hover:text-violet ${
            suggestion ? "mt-3" : "mt-6"
          }`}
        >
          See {partialCount} partway-there match{partialCount > 1 ? "es" : ""} ↓
        </button>
      )}

      {/* Fallback / supplementary tips — always shown, since even a widened search can still come up empty. */}
      <div className="mt-8 w-full max-w-[420px] border-t border-border-soft pt-6">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">Things to try</span>
        <ul className="mt-3 flex flex-col gap-3 text-left">
          {DEFAULT_TIPS.map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-surface-alt text-violet">
                <Icon size={12} />
              </span>
              <span className="font-sans text-[12.5px] leading-relaxed text-ink-muted">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}