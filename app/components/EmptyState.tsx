export default function EmptyState({ from, to }: { from: string; to: string }) {
  return (
    <div className="mb-5 rounded-md border border-board-line bg-board-panel/60 px-5 py-4">
      <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted">A few things that usually help</div>
      <ul className="list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-ink">
        <li>Try a date a day or two either side — running days vary train to train.</li>
        <li>
          Double-check the station codes ({from} → {to}) match what you meant.
        </li>
        <li>Widen &ldquo;Junctions to check&rdquo; in the search box so more transfer options get explored.</li>
      </ul>
    </div>
  );
}
