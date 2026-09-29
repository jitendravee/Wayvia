import Link from "next/link";

interface FooterLink {
  label: string;
  href: string;
  isNew?: boolean;
}

interface FooterCategory {
  title: string;
  links: FooterLink[];
}

const FOOTER_CATEGORIES: FooterCategory[] = [
  {
    title: "Plan & Routes",
    links: [
      { label: "Find a Way", href: "/journey-planner" },
      { label: "Popular Corridors", href: "/routes" },
      { label: "Junction Hub Guides", href: "/junctions", isNew: true },
      { label: "Emergency Rescue", href: "/emergency-travel", isNew: true },
      { label: "How It Works", href: "/how-it-works" },
    ],
  },
  {
    title: "Savings & Hacks",
    links: [
      { label: "Fare Arbitrage Engine", href: "/fare-arbitrage", isNew: true },
      { label: "Tatkal Matrix", href: "/tatkal-matrix", isNew: true },
      { label: "Vande Bharat Explorer", href: "/vande-bharat", isNew: true },
      { label: "Refund Calculator", href: "/refund-calculator", isNew: true },
    ],
  },
  {
    title: "Live Track & Tools",
    links: [
      { label: "Live Running Status", href: "/running-status" },
      { label: "PNR Status & Seat Map", href: "/pnr-status" },
      {
        label: "Coach Position & Layout",
        href: "/coach-position",
        isNew: true,
      },
      { label: "WhatsApp Journey Card", href: "/journey-card", isNew: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Wayvia", href: "/about" },
      { label: "Travel Blog & Guides", href: "/blog" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-white">
      {/* Subtle top ambient accent */}
      <div className="h-px w-full bg-gradient-to-r from-violet/0 via-violet/40 to-violet/0" />

      <div className="mx-auto  px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-5 lg:gap-12">
          {/* Brand Info Column */}
          <div className="md:col-span-1 lg:pr-4">
            <Link
              href="/"
              className="flex items-center gap-2 active:scale-95 transition-transform duration-100"
            >
              <img
                src="/logo.png"
                alt="Wayvia"
                className="h-8 w-8 rounded-xl object-contain shadow-xs border border-black/5"
              />
              <span className="font-display text-lg font-bold tracking-tight text-ink">
                Wayvia
              </span>
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              Smart journey discovery for India. Finding confirmed seats,
              connecting routes, and bus alternatives when direct trains are
              full.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Network Active
              </span>
            </div>
          </div>

          {/* 4 Categorized Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-4">
            {FOOTER_CATEGORIES.map((cat) => (
              <div key={cat.title}>
                <div className="font-display text-[12px] font-bold uppercase tracking-wider text-ink">
                  {cat.title}
                </div>
                <ul className="mt-4 space-y-2.5 text-[13px]">
                  {cat.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1.5 text-ink-muted transition-colors hover:text-violet"
                      >
                        <span className="transition-transform duration-150 group-hover:translate-x-0.5">
                          {link.label}
                        </span>
                        {link.isNew && (
                          <span className="rounded-full bg-violet-soft px-1.5 py-0.2 font-mono text-[9px] font-bold text-violet uppercase">
                            New
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row text-[12px] text-ink-dim">
          <div>© {year} Wayvia. Built for seamless travel across India.</div>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy-policy"
              className="hover:text-violet transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms-of-service"
              className="hover:text-violet transition-colors"
            >
              Terms
            </Link>
            <Link href="/about" className="hover:text-violet transition-colors">
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
