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
}

const DEFAULT_LABEL_CLASS = "font-mono text-[10px] uppercase tracking-wider text-ink-muted";
const DEFAULT_INPUT_CLASS =
  "w-[180px] min-w-[140px] max-w-full rounded-lg bg-white px-3 py-2.5 font-mono text-sm text-ink outline-none";
const DEFAULT_SUBLABEL_CLASS = "font-sans text-[12px] leading-none text-ink-muted truncate";

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
}: Props) {
  const shouldShowPlaceName = showStationName ?? showPlaceName;

  // What's visible in the input.
  const [inputValue, setInputValue] = useState(value);
  // Drives usePlaceSearch. Only ever set while the user is typing — NOT on
  // selection — so picking a suggestion never fires another API call.
  const [searchQuery, setSearchQuery] = useState("");
  // The full object the user picked (or null while typing/unresolved).
  // We already have name/state/country from the suggestion itself, so
  // there's no need to re-fetch anything to show a caption — and no need
  // to keep an `id` around anywhere, since only `name` is ever used.
  const [selected, setSelected] = useState<PlaceSuggestion | null>(null);

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Tracks the last value WE sent up via onChange. Used to tell "the parent
  // just echoed back what I typed" apart from "the parent genuinely changed
  // this field" (swap button, reset, chained-stop prefill, etc). Without
  // this, every keystroke's round trip through the parent can race with
  // typing and stomp the character you just entered — the flicker/dropped
  // letters bug.
  const lastSentRef = useRef(value);

  // If `value` is a place id/slug (e.g. from JourneyStopsForm's origin/stop
  // state) rather than a display name, resolve it so the box shows "Pune"
  // instead of the raw id. Harmless no-op if `value` is already a name —
  // the resolver just won't find a match and we fall back to `value`.
  const { data: resolvedValuePlace } = useResolvedPlace(value);

  // Sync with genuine external value changes only.
  useEffect(() => {
    if (value === lastSentRef.current) return; // our own change echoing back — ignore
    lastSentRef.current = value;
    setSelected(null);
    setSearchQuery("");
    setOpen(false);
    setInputValue(resolvedValuePlace?.name ?? value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, resolvedValuePlace]);

  const { data: suggestions = [], isLoading, error } = usePlaceSearch(searchQuery, {
    limit: 8,
    debounceMs: 300,
    minLength: 2,
  });

  // Open/close the dropdown in response to fresh results, not on every
  // keystroke — avoids the "still showing stale suggestions" flash.
  useEffect(() => {
    if (searchQuery.trim().length >= 2 && (suggestions.length > 0 || isLoading)) {
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
    setInputValue(v);
    setSearchQuery(v); // this is what triggers the API call
    setSelected(null); // no longer have a confirmed pick
    setHighlight(0);
    onChange(v);
  }

  function handlePlaceSelect(place: PlaceSuggestion) {
    lastSentRef.current = place.name;
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
    ? [selected.name, selected.state, selected.country].filter(Boolean).join(", ")
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
        onFocus={() => searchQuery.trim().length >= 2 && suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
        className={inputClassName ?? DEFAULT_INPUT_CLASS}
      />
      {showCaption && <span className={subLabelClassName ?? DEFAULT_SUBLABEL_CLASS}>{caption}</span>}

      {open && (suggestions.length > 0 || isLoading) && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute top-full z-40 mt-1.5 max-h-64 w-full min-w-[220px] overflow-auto rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          {isLoading && suggestions.length === 0 && (
            <li className="px-3 py-2 font-mono text-[11px] text-ink-dim">Searching…</li>
          )}
          {error && (
            <li className="px-3 py-2 font-mono text-[11px] text-ink-dim">Unable to load suggestions</li>
          )}
          {!isLoading && suggestions.length === 0 && (
            <li className="px-3 py-2 font-mono text-[11px] text-ink-dim">No places found</li>
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
                  <span className="text-ink-dim"> · {s.state}, {s.country}</span>
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