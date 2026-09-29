"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { appleDropdownSpring } from "@/lib/motion";
import { TrainSummary } from "@/lib/trains";
import { RunningStatusResult } from "@/lib/erail/runningStatus";

export default function TrainSearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TrainSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [loading, setLoading] = useState(false);

  const [preview, setPreview] = useState<RunningStatusResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewCache = useRef<Map<string, RunningStatusResult>>(new Map());

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function loadPreview(trainNo: string) {
    if (previewCache.current.has(trainNo)) {
      setPreview(previewCache.current.get(trainNo)!);
      return;
    }
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch(`/api/erail/runningStatus?trainNo=${trainNo}`);
        const json: RunningStatusResult = await res.json();
        previewCache.current.set(trainNo, json);
        setPreview(json);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 450);
  }

  function handleType(text: string) {
    setQuery(text);
    setHighlight(0);
    setPreview(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length === 0) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/trains/search?q=${encodeURIComponent(text)}&limit=6`);
        const json = await res.json();
        const results: TrainSummary[] = json.results ?? [];
        setSuggestions(results);
        setOpen(true);
        // The top suggestion's live preview opens automatically — no extra
        // click needed to see whether it's worth picking.
        if (results[0] && /^\d{4,5}$/.test(results[0].trainNo)) {
          loadPreview(results[0].trainNo);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  }

  function goToTrain(trainNo: string) {
    setOpen(false);
    router.push(`/running-status/${trainNo}`);
  }

  function pick(t: TrainSummary) {
    goToTrain(t.trainNo);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (open && suggestions[highlight]) {
      pick(suggestions[highlight]);
      return;
    }
    const trimmed = query.trim();
    if (/^\d{4,5}$/.test(trimmed)) {
      goToTrain(trimmed);
    } else if (suggestions[0]) {
      pick(suggestions[0]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const topSuggestion = suggestions[0];

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-dim"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            autoFocus={autoFocus}
            autoComplete="off"
            value={query}
            onChange={(e) => handleType(e.target.value)}
            onFocus={() => query.trim().length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Enter train number or name — e.g. 12951 or Rajdhani"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            className="w-full rounded-2xl border border-slate-200/90 bg-white py-3.5 pl-11 pr-4 font-mono text-[15px] text-ink outline-none transition-all shadow-xs focus:border-violet focus:ring-4 focus:ring-violet-ring"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-2xl apple-button-primary px-6 py-3.5 font-display text-[14px] font-semibold text-white shadow-sm"
        >
          Track train
        </button>
      </form>

      <AnimatePresence>
        {open && (suggestions.length > 0 || loading) && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={appleDropdownSpring}
            style={{ transformOrigin: "top center" }}
            className="absolute top-full z-40 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white/98 shadow-[0_16px_40px_-8px_rgba(24,19,31,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl"
          >
            <ul role="listbox" className="max-h-72 overflow-auto py-1">
              {loading && suggestions.length === 0 && (
                <li className="px-4 py-3 font-mono text-[12px] text-ink-dim">Searching…</li>
              )}
              {suggestions.map((t, i) => (
                <li
                  key={t.trainNo}
                  role="option"
                  aria-selected={i === highlight}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(t);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-[13.5px] transition-colors ${
                    i === highlight ? "bg-violet-soft text-violet font-medium" : "text-ink"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span className="shrink-0 rounded-md bg-surface-alt px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-muted">
                      {t.trainNo}
                    </span>
                    <span className="truncate font-medium">{t.trainName}</span>
                  </span>
                  {t.from && t.to && (
                    <span className="shrink-0 font-mono text-[11px] text-ink-dim">
                      {t.from} → {t.to}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {topSuggestion && (
              <div className="border-t border-slate-100 bg-surface-alt/70 px-4 py-3">
                <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-dim">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet" />
                  Live preview · {topSuggestion.trainNo} {topSuggestion.trainName}
                </div>
                {previewLoading && <div className="font-mono text-[12px] text-ink-muted">Checking live status…</div>}
                {!previewLoading && preview && preview.success && (
                  <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink">
                    {preview.summary?.statusMessage ? (
                      <span className="text-ink-muted">{preview.summary.statusMessage}</span>
                    ) : (
                      <span className="text-ink-muted">Status available — open for full details.</span>
                    )}
                    {typeof preview.summary?.departure.delayMin === "number" && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] ${
                          preview.summary.departure.delayMin > 0
                            ? "bg-signal-amber-soft text-signal-amber"
                            : "bg-signal-green-soft text-signal-green"
                        }`}
                      >
                        {preview.summary.departure.delayMin > 0
                          ? `Running ${preview.summary.departure.delayMin}m late`
                          : "On time"}
                      </span>
                    )}
                  </div>
                )}
                {!previewLoading && preview && !preview.success && (
                  <div className="font-mono text-[12px] text-ink-dim">
                    {preview.message ?? "No live status available right now."}
                  </div>
                )}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    goToTrain(topSuggestion.trainNo);
                  }}
                  className="mt-2 font-display text-[12.5px] font-semibold text-violet hover:text-violet-dark active:scale-95 transition-transform"
                >
                  Open full tracker →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
