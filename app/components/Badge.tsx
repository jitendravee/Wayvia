export function TagBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-flap-soft px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-flap">
      {children}
    </span>
  );
}

export function Badge({ children, variant }: { children: React.ReactNode; variant?: "neutral" | "fare" | "duration" }) {
  const styles =
    variant === "fare"
      ? "bg-signal-green-soft text-signal-green"
      : variant === "duration"
      ? "bg-board-panel text-ink"
      : "bg-board-panel text-ink-muted";
  return <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${styles}`}>{children}</span>;
}

export function StatusBadge({ fullyConfirmed, hasBlockedLeg }: { fullyConfirmed: boolean; hasBlockedLeg: boolean }) {
  if (fullyConfirmed) {
    return (
      <span className="flex items-center gap-1.5 rounded-md bg-signal-green-soft px-2 py-0.5 font-mono text-[11px] text-signal-green">
        <span className="h-1.5 w-1.5 rounded-full bg-signal-green" />
        Fully confirmed
      </span>
    );
  }
  if (hasBlockedLeg) {
    return (
      <span className="flex items-center gap-1.5 rounded-md bg-signal-red-soft px-2 py-0.5 font-mono text-[11px] text-signal-red">
        <span className="h-1.5 w-1.5 rounded-full bg-signal-red" />
        Has blocked leg
      </span>
    );
  }
  return null;
}
