import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface-alt">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet font-display text-xs font-bold text-white">
                W
              </span>
              <span className="font-display text-base font-semibold text-ink">Wayvia</span>
            </div>
            <p className="mt-2.5 max-w-xs text-[13px] leading-relaxed text-ink-muted">
              Live train running status and PNR status, with a station-by-station journey tracker and visual
              seat maps — no clutter, just where your train is right now.
            </p>
          </div>

          <div>
            <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-ink-dim">Product</div>
            <ul className="space-y-2 text-[13px] text-ink-muted">
              <li><Link href="/running-status" className="hover:text-violet">Running status</Link></li>
              <li><Link href="/pnr-status" className="hover:text-violet">PNR status</Link></li>
              <li><Link href="/" className="hover:text-violet">How it works</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-ink-dim">Company</div>
            <ul className="space-y-2 text-[13px] text-ink-muted">
              <li><Link href="/about" className="hover:text-violet">About Wayvia</Link></li>
              <li><a href="mailto:hello@wayvia.com" className="hover:text-violet">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-5 text-[12px] text-ink-dim sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Wayvia. Know where your train is, always.</span>
          <span>Data sourced live from erail.in.</span>
        </div>
      </div>
    </footer>
  );
}
