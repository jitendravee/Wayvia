export default function EmptyState({ from, to, partialCount = 0 }: { from: string; to: string; partialCount?: number }) {
  return (
    <div className="mb-5 rounded-lg border border-border bg-surface-alt px-5 py-4">
      <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted">A few things that usually help</div>
      <ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-ink">
        {partialCount > 0 && (
          <li>
            {partialCount} real train{partialCount === 1 ? "" : "s"} below cover part of this route, even though nothing
            connects all the way through yet.
          </li>
        )}
        <li>Try a date a day or two either side — running days vary train to train.</li>
        <li>
          Double-check the station codes ({from} → {to}) match what you meant.
        </li>
        <li>Widen &ldquo;Junctions to explore&rdquo; in the search box, or turn on 2-junction routes, so more transfer options get checked.</li>
      </ul>
    </div>
  );
}