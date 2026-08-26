"use client";

export interface LegTabItem {
  key: string;
  /** Small overline, e.g. "LEG 1". */
  label: string;
  /** Main line, e.g. "New Delhi → Jaipur". */
  sublabel: string;
}

interface Props {
  tabs: LegTabItem[];
  active: string;
  onChange: (key: string) => void;
}

/**
 * Tab strip for a multi-city trip's legs. Deliberately renders nothing for
 * 0-1 tabs — callers don't need an `if (legs.length > 1)` guard of their
 * own before using this; a single-leg trip just never shows tab chrome.
 */
export default function LegTabs({ tabs, active, onChange }: Props) {
  if (tabs.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="Trip legs"
      className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-white p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={`flex min-w-[150px] flex-1 flex-col items-start gap-0.5 rounded-xl px-3.5 py-2.5 text-left transition-colors ${
              isActive ? "bg-violet-soft text-violet-dark" : "text-ink-muted hover:bg-surface-alt hover:text-ink"
            }`}
          >
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider opacity-70">{t.label}</span>
            <span className="max-w-full truncate font-display text-[13.5px] font-semibold">{t.sublabel}</span>
          </button>
        );
      })}
    </div>
  );
}