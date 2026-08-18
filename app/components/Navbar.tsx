import Link from "next/link";

const LINKS = [
  { href: "/", label: "Search" },
  { href: "/routes", label: "Popular routes" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet font-display text-sm font-bold text-white">
            W
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">Wayvia</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[13.5px] font-medium text-ink-muted transition-colors hover:text-violet"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="rounded-full bg-violet px-4 py-2 font-display text-[13px] font-semibold text-white shadow-sm shadow-violet-soft transition-colors hover:bg-violet-dark"
        >
          Find a journey
        </Link>
      </div>
    </header>
  );
}
