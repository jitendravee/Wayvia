"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { usePlaceSearch } from "@/lib/hooks/usePlaceSearch";
import { useResolvedPlace } from "@/lib/query/resolvedPlace";

export interface PlaceSuggestion {
  id: string;
  name: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface Props {
  id: string;
  label: string;
  value: string; // Last value sent to onChange: place name (e.g. "Ahmedabad")
  onChange: (value: string) => void; // Called with the current text while typing, or the picked name on select
  placeholder?: string;
  labelClassName?: string;
  inputClassName?: string;
  /** Shows a fuller caption ("Ahmedabad, Gujarat, India") under the input once a suggestion has been picked. */
  showPlaceName?: boolean;
  /** Backward compatibility alias for showPlaceName */
  showStationName?: boolean;
  subLabelClassName?: string;
  /**
   * Fires whenever this field's "confirmed" status changes — true once the
   * current value is backed by an actual resolved place (picked from the
   * dropdown, or auto-resolved on load/swap), false while it's raw,
   * unconfirmed text. Parents use this to gate search submission: searching
   * on unconfirmed free text is how "Pune" typed into the box but never
   * actually selected quietly turns into an ambiguous multi-place query.
   */
  onConfirmedChange?: (confirmed: boolean) => void;
}

const DEFAULT_LABEL_CLASS =
  "font-mono text-[10px] uppercase tracking-wider text-ink-muted";
const DEFAULT_INPUT_CLASS =
  "w-[180px] min-w-[140px] max-w-full rounded-lg bg-white px-3 py-2.5 font-mono text-sm text-ink outline-none";
const DEFAULT_SUBLABEL_CLASS =
  "font-sans text-[12px] leading-none text-ink-muted truncate";

export default function StationInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  labelClassName,
  inputClassName,
  showPlaceName = false,
  showStationName,
  subLabelClassName,
  onConfirmedChange,
}: Props) {
  const shouldShowPlaceName = showStationName ?? showPlaceName;

  // What's visible in the input.
  const [inputValue, setInputValue] = useState(value);
  // Drives usePlaceSearch. Only ever set while the user is typing — NOT on
  // selection — so picking a suggestion never fires another API call.
  const [searchQuery, setSearchQuery] = useState("");
  // The full object the user picked (or that we auto-resolved on their
  // behalf). Non-null == "confirmed": this field currently holds a real,
  // resolved place, not just typed text that happens to look like one.
  const [selected, setSelected] = useState<PlaceSuggestion | null>(null);

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Tracks the last value WE sent up via onChange. Used to tell "the parent
  // just echoed back what I typed" apart from "the parent genuinely changed
  // this field" (swap button, reset, chained-stop prefill, URL params on
  // first load, etc). Without this, every keystroke's round trip through
  // the parent can race with typing and stomp the character you just
  // entered — the flicker/dropped letters bug.
  const lastSentRef = useRef(value);

  // Which exact `value` we've already attempted to auto-resolve, so the
  // resolve effect below doesn't refire endlessly for the same value while
  // waiting on network calls, and doesn't re-attempt a value that genuinely
  // has no match.
  const resolvedAttemptRef = useRef<string | null>(null);

  // Whether the CURRENT value should be auto-resolved into a confirmed
  // selection without the user clicking anything. True for values that
  // arrive from outside this component (initial URL params, a swap, a
  // chained-stop prefill). False the instant the user starts typing — at
  // that point they must pick from the dropdown again to become confirmed;
  // we don't want to silently auto-pick a suggestion mid-keystroke.
  const shouldAutoResolveRef = useRef(true);

  // If `value` is a place id/slug/name, try to resolve it against known
  // place data — this both fixes up the display name (e.g. "pune" -> "Pune")
  // and, on load, tells us whether the incoming value is already a real,
  // resolvable place.
  const { data: resolvedValuePlace, isLoading: resolvedValueLoading } =
    useResolvedPlace(value);

  // Fallback text search used only when useResolvedPlace can't find a
  // direct match for a value that arrived from outside — same API the
  // dropdown itself uses, we just auto-pick the top result instead of
  // waiting for a click.
  const [autoResolveQuery, setAutoResolveQuery] = useState("");
  const { data: autoResolveSuggestions = [] } = usePlaceSearch(
    autoResolveQuery,
    {
      limit: 1,
      debounceMs: 0,
      minLength: 1,
    },
  );

  const {
    data: suggestions = [],
    isLoading,
    error,
  } = usePlaceSearch(searchQuery, {
    limit: 8,
    debounceMs: 300,
    minLength: 2,
  });

  // --- External value changes (not our own onChange echoing back) -------
  // A genuine external change means this value is no longer confirmed —
  // even if it happens to be the exact same text as some previously
  // confirmed place, we can't assume that without re-checking (e.g. a swap
  // brings in a value this exact StationInput instance never resolved).
  useEffect(() => {
    if (value === lastSentRef.current) return; // our own change echoing back — ignore
    lastSentRef.current = value;
    resolvedAttemptRef.current = null;
    shouldAutoResolveRef.current = true;
    setSearchQuery("");
    setAutoResolveQuery("");
    setOpen(false);
    setSelected(null);
    setInputValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // --- Auto-resolve: covers first mount (URL params) and any external ---
  // --- change (swap, prefill) that Effect A above just unconfirmed. -----
  useEffect(() => {
    if (!value) return;
    if (selected) return; // already confirmed
    if (!shouldAutoResolveRef.current) return; // user is actively typing — don't auto-pick under them
    if (resolvedAttemptRef.current === value) return; // already tried this exact value
    if (resolvedValueLoading) return; // wait for the direct lookup to settle

    if (resolvedValuePlace) {
      resolvedAttemptRef.current = value;
      const place: PlaceSuggestion = {
        id: (resolvedValuePlace as { id: string }).id,
        name: resolvedValuePlace.name,
        state: (resolvedValuePlace as { state?: string }).state,
        country: (resolvedValuePlace as { country?: string }).country,
      };
      setSelected(place);
      setInputValue(place.name);
      if (place.name !== value) {
        lastSentRef.current = place.name;
        onChange(place.name);
      }
      return;
    }

    // No direct match — fall back to a live suggestion search and auto-pick
    // the top result, so a value that arrived from outside behaves as if
    // the user had picked it, instead of sitting as unconfirmed free text.
    resolvedAttemptRef.current = value;
    setAutoResolveQuery(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, selected, resolvedValuePlace, resolvedValueLoading]);

  // --- Consume the fallback search once it returns ---
  useEffect(() => {
    if (!autoResolveQuery) return;
    if (autoResolveSuggestions.length === 0) return;
    const top = autoResolveSuggestions[0];
    setAutoResolveQuery("");
    handlePlaceSelect(top);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoResolveQuery, autoResolveSuggestions]);

  // --- Report confirmed status up to the parent ---
  useEffect(() => {
    onConfirmedChange?.(selected !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Open/close the dropdown in response to fresh results, not on every
  // keystroke — avoids the "still showing stale suggestions" flash.
  useEffect(() => {
    if (
      searchQuery.trim().length >= 2 &&
      (suggestions.length > 0 || isLoading)
    ) {
      setOpen(true);
    } else if (searchQuery.trim().length < 2) {
      setOpen(false);
    }
  }, [searchQuery, suggestions, isLoading]);

  // Close on outside click.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    lastSentRef.current = v; // this change originates here, not externally
    shouldAutoResolveRef.current = false; // typing — no more silent auto-picking until the user picks again
    setAutoResolveQuery("");
    setInputValue(v);
    setSearchQuery(v); // this is what triggers the API call
    setSelected(null); // no longer have a confirmed pick
    setHighlight(0);
    onChange(v);
  }

  function handlePlaceSelect(place: PlaceSuggestion) {
    lastSentRef.current = place.name;
    resolvedAttemptRef.current = place.name;
    shouldAutoResolveRef.current = false;
    setInputValue(place.name);
    setSelected(place);
    setSearchQuery(""); // stop searching — prevents the extra API call
    setHighlight(0);
    setOpen(false);
    onChange(place.name); // only the name goes to the parent
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[highlight]) {
        handlePlaceSelect(suggestions[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const caption = selected
    ? [selected.name, selected.state, selected.country]
        .filter(Boolean)
        .join(", ")
    : "";
  const showCaption = shouldShowPlaceName && !open && !!caption;

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-1">
      <label htmlFor={id} className={labelClassName ?? DEFAULT_LABEL_CLASS}>
        {label}
      </label>
      <input
        id={id}
        autoComplete="off"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() =>
          searchQuery.trim().length >= 2 &&
          suggestions.length > 0 &&
          setOpen(true)
        }
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
        className={inputClassName ?? DEFAULT_INPUT_CLASS}
      />
      {showCaption && (
        <span className={subLabelClassName ?? DEFAULT_SUBLABEL_CLASS}>
          {caption}
        </span>
      )}

      {open && (suggestions.length > 0 || isLoading) && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute top-full z-40 mt-1.5 max-h-64 w-full min-w-[220px] overflow-auto rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          {isLoading && suggestions.length === 0 && (
            <li className="px-3 py-2 font-mono text-[11px] text-ink-dim">
              Searching…
            </li>
          )}
          {error && (
            <li className="px-3 py-2 font-mono text-[11px] text-ink-dim">
              Unable to load suggestions
            </li>
          )}
          {!isLoading && suggestions.length === 0 && (
            <li className="px-3 py-2 font-mono text-[11px] text-ink-dim">
              No places found
            </li>
          )}
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                handlePlaceSelect(s);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[13px] ${
                i === highlight ? "bg-violet-soft text-violet-dark" : "text-ink"
              }`}
            >
              <span className="truncate">
                {s.name}
                {s.state && s.country ? (
                  <span className="text-ink-dim">
                    {" "}
                    · {s.state}, {s.country}
                  </span>
                ) : s.state ? (
                  <span className="text-ink-dim"> · {s.state}</span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <MapPin className="h-3 w-3 text-ink-dim" />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
