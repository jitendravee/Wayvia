"use client";

import { useEffect, useRef, useState } from "react";

export interface StationSuggestion {
  code: string;
  name: string;
  state?: string;
}

interface Props {
  id: string;
  label: string;
  value: string; // always a station code, e.g. "NDLS"
  onChange: (code: string) => void;
  placeholder?: string;
}

export default function StationInput({ id, label, value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<StationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the visible text in sync if the value changes from outside (e.g. swap button).
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleType(text: string) {
    setQuery(text.toUpperCase());
    onChange(text.toUpperCase()); // the raw typed text is still sent to the search API as the code,
    // so typing a known code directly (without picking a suggestion) keeps working.
    setHighlight(0);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length === 0) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stations?q=${encodeURIComponent(text)}&limit=8`);
        const json = await res.json();
        setSuggestions(json.results ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 150);
  }

  function pick(s: StationSuggestion) {
    setQuery(s.code);
    onChange(s.code); // the station CODE is what gets sent to the journey-search API
    setOpen(false);
    setSuggestions([]);
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

  return (
    <div ref={wrapRef} className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
        {label}
      </label>
      <input
        id={id}
        autoComplete="off"
        value={query}
        onChange={(e) => handleType(e.target.value)}
        onFocus={() => query.trim().length > 0 && suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
        className="w-full rounded-lg border border-border bg-white px-3 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-violet focus:ring-2 focus:ring-violet-ring"
      />

      {open && (suggestions.length > 0 || loading) && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute top-full z-40 mt-1.5 max-h-64 w-full min-w-[220px] overflow-auto rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          {loading && suggestions.length === 0 && (
            <li className="px-3 py-2 font-mono text-[11px] text-ink-dim">Searching…</li>
          )}
          {suggestions.map((s, i) => (
            <li
              key={s.code}
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
                {s.state ? <span className="text-ink-dim"> · {s.state}</span> : null}
              </span>
              <span className="shrink-0 rounded-md bg-surface-alt px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
                {s.code}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
