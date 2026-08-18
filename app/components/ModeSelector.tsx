"use client";

const MODES = [
  { key: "train", label: "Train", enabled: true },
  { key: "bus", label: "Bus", enabled: false },
  { key: "flight", label: "Flight", enabled: false },
] as const;

export default function ModeSelector() {
  return (
    <div className="mb-5 flex gap-2">
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          disabled={!m.enabled}
          title={m.enabled ? undefined : "Coming soon"}
          className={
            m.enabled
              ? "flex items-center gap-1.5 rounded-full border border-violet bg-violet px-4 py-1.5 font-display text-sm font-semibold text-white"
              : "flex cursor-default items-center gap-1.5 rounded-full border border-border bg-surface-alt px-4 py-1.5 font-display text-sm text-ink-dim opacity-80"
          }
        >
          {m.label}
          {!m.enabled && (
            <span className="rounded-full border border-border bg-white px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-ink-dim">
              soon
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
