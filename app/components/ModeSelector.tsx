"use client";

const MODES = [
  { key: "train", label: "Train", enabled: true },
  { key: "bus", label: "Bus", enabled: false },
  { key: "flight", label: "Flight", enabled: false },
] as const;

export default function ModeSelector() {
  return (
    <div className="flex gap-2 mb-5">
      {MODES.map((m) => (
        <button
          key={m.key}
          type="button"
          disabled={!m.enabled}
          title={m.enabled ? undefined : "Coming soon"}
          className={
            m.enabled
              ? "flex items-center gap-1.5 rounded-full border border-flap bg-flap px-4 py-1.5 font-display text-sm font-semibold text-board"
              : "flex items-center gap-1.5 rounded-full border border-board-line bg-board-raised px-4 py-1.5 font-display text-sm text-ink-dim opacity-70 cursor-default"
          }
        >
          {m.label}
          {!m.enabled && (
            <span className="rounded-full border border-board-line bg-board-panel px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-ink-dim">
              soon
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
