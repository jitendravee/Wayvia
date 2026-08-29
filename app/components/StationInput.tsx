"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { Place } from "@/lib/places/model";
import { usePlaceSearch } from "@/lib/query/places";

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
  value: string; // Place ID, e.g. "pune" or "place:IN:pune"
  onChange: (placeId: string) => void;
  placeholder?: string;
  /** Override the label's classes — lets callers (e.g. the hero search) match a different visual context. */
  labelClassName?: string;
  /** Override the input's classes — lets callers (e.g. the hero search) match a different visual context. */
  inputClassName?: string;
  /**
   * Shows the resolved place name under the input (e.g. "pune" / "Pune, Maharashtra").
   * When `value` is a Place ID that hasn't been resolved yet, this looks it up against /api/places.
   */
  showPlaceName?: boolean;
  /** Backward compatibility alias for showPlaceName */
  showStationName?: boolean;
  /** Classes for the resolved-place caption. Only used when showPlaceName is true. */
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
  showStationName, // Backward compatibility
  subLabelClassName,
}: Props) {
  // Handle backward compatibility: showStationName overrides showPlaceName if provided
  const shouldShowPlaceName = showStationName ?? showPlaceName;

  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: suggestions = [], isLoading, error } = usePlaceSearch(query, 8);

  // Keep the visible text in sync if the value changes from outside (e.g. swap button).
  useEffect(() => {
    setQuery(value);
  }, [value]);

  function handleType(text: string) {
    setQuery(text);
    onChange(text); // the typed text is sent to the search API as the query,
    // which gets resolved to a Place ID by the backend
    setHighlight(0);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length === 0) {
      setOpen(false);
      return;
    }
    // Loading state is handled by usePlaceSearch
  }

  function pick(s: PlaceSuggestion) {
    setQuery(s.id);
    onChange(s.id); // the Place ID is what gets sent to the journey-search API
    setOpen(false);
    setHighlight(0);
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
      pick(suggestions[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // For showing the resolved place name under the input
  const [resolvedId, setResolvedId] = useState("");
  const [resolvedName, setResolvedName] = useState("");

  useEffect(() => {
    if (!shouldShowPlaceName) return;
    const placeId = value.trim();
    if (!placeId) {
      setResolvedId("");
      setResolvedName("");
      return;
    }
    if (placeId === resolvedId && resolvedName) return;

    // Fetch the resolved place details
    const fetchResolvedPlace = async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(placeId)}&limit=8`);
        const json = await res.json();
        const match: PlaceSuggestion | undefined = (json.results ?? []).find(
          (r: PlaceSuggestion) => r.id === placeId
        );
        if (match) {
          setResolvedId(match.id);
          setResolvedName(match.name);
        } else {
          setResolvedId("");
          setResolvedName("");
        }
      } catch {
        setResolvedId("");
        setResolvedName("");
      }
    };

    fetchResolvedPlace();
  }, [value, shouldShowPlaceName]);

  const showCaption =
    shouldShowPlaceName && !open && !!resolvedName && query.trim() === resolvedId;

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-1">
      <label htmlFor={id} className={labelClassName ?? DEFAULT_LABEL_CLASS}>
        {label}
      </label>
      <input
        id={id}
        autoComplete="off"
        value={query}
        onChange={(e) => handleType(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
        className={inputClassName ?? DEFAULT_INPUT_CLASS}
      />
      {showCaption && <span className={subLabelClassName ?? DEFAULT_SUBLABEL_CLASS}>{resolvedName}</span>}

      {open && (suggestions.length > 0 || isLoading) && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute top-full z-40 mt-1.5 max-h-64 w-full min-w-[220px] overflow-auto rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          {isLoading && suggestions.length === 0 && (
            <li className="px-3 py-2 font-mono text-[11px] text-ink-dim">Searching…</li>
          )}
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[13px] ${
                i === highlight ? "bg-violet-soft text-violet-dark" : "text-ink"
              }`}
            >
              <span className="truncate">
                {s.name}
                {s.state && s.country ? <span className="text-ink-dim"> · {s.state}, {s.country}</span> : s.state ? <span className="text-ink-dim"> · {s.state}</span> : null}
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