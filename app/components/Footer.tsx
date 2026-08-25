import Link from "next/link";

const PRODUCT_LINKS = [
  { label: "How it Works", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "Running Status", href: "/running-status" },
  { label: "PNR Status", href: "/pnr-status" },
  { label: "Check PNR", href: "/pnr-status" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "mailto:hello@wayvia.com" },
];

// const SOCIALS = [
//   { label: "Twitter", href: "https://twitter.com/wayvia", icon: Twitter },
//   { label: "Instagram", href: "https://instagram.com/wayvia", icon: Instagram },
//   { label: "LinkedIn", href: "https://linkedin.com/company/wayvia", icon: Linkedin },
// ];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-white">
      {/* thin decorative gradient line */}
      <div className="h-px w-full bg-gradient-to-r from-violet/0 via-violet/50 to-violet/0" />

      <div className="mx-auto  px-5 py-10 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="max-w-[220px] shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet to-indigo-500 font-display text-xs font-bold text-white">
                W
              </span>
              <span className="font-display text-base font-semibold text-ink">Wayvia</span>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-ink-muted">
              Finding better ways
              <br />
              to get you there.
            </p>
            {/* <div className="mt-4 flex items-center gap-3.5">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-ink transition hover:text-violet"
                >
                  <Icon size={16} strokeWidth={2} />
                </a>
              ))}
            </div> */}
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 gap-8 sm:flex sm:gap-16">
            <div>
              <div className="mb-3 font-sans text-[11px] font-bold uppercase tracking-wider text-ink">
                Product
              </div>
              <ul className="space-y-2.5 text-[13px] text-ink-muted">
                {PRODUCT_LINKS.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition hover:text-violet">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="mb-3 font-sans text-[11px] font-bold uppercase tracking-wider text-ink">
                Company
              </div>
              <ul className="space-y-2.5 text-[13px] text-ink-muted">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("mailto:") ? (
                      <a href={link.href} className="transition hover:text-violet">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="transition hover:text-violet">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Copyright — sits inline at the end of the row on desktop */}
          <div className="hidden shrink-0 self-center whitespace-nowrap text-[12px] text-ink-dim sm:block">
            © {year} Wayvia. All rights reserved.
          </div>
        </div>

        {/* Copyright — separate, divided block on mobile */}
        <div className="mt-8 border-t border-border pt-5 text-[12px] text-ink-dim sm:hidden">
          © {year} Wayvia. All rights reserved.
        </div>
      </div>
    </footer>
  );
}