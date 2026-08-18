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
              You tell us where you want to go. We figure out the best way to get you there — direct or connecting,
              ranked by price, time, and reliability.
            </p>
          </div>

          <div>
            <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-ink-dim">Product</div>
            <ul className="space-y-2 text-[13px] text-ink-muted">
              <li><Link href="/" className="hover:text-violet">Journey search</Link></li>
              <li><Link href="/routes" className="hover:text-violet">Popular routes</Link></li>
              <li><Link href="/how-it-works" className="hover:text-violet">How it works</Link></li>
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
          <span>© {new Date().getFullYear()} Wayvia. Journey discovery, not just ticket search.</span>
          <span>Trains today. Buses and flights are on the way.</span>
        </div>
      </div>
    </footer>
  );
}
