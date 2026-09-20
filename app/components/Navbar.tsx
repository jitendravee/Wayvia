"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Compass,
  ShieldAlert,
  Zap,
  LayoutGrid,
  GitFork,
  Calculator,
  Activity,
  Ticket,
  MapPin,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isNew?: boolean;
  description?: string;
}

const LINKS: NavLinkItem[] = [
  {
    href: "/journey-planner",
    label: "Find a Way",
    icon: Compass,
    description: "Multimodal train + bus route optimizer",
  },
  {
    href: "/emergency-travel",
    label: "Emergency Rescue",
    icon: ShieldAlert,
    isNew: true,
    description: "Sold-out festival travel blueprints",
  },
  {
    href: "/tatkal-matrix",
    label: "Tatkal Matrix",
    icon: Zap,
    isNew: true,
    description: "10 & 11 AM countdown & autofill script",
  },
  {
    href: "/coach-position",
    label: "Coach Position",
    icon: LayoutGrid,
    isNew: true,
    description: "2D blueprint & seat spotlight finder",
  },
  {
    href: "/junctions",
    label: "Junctions",
    icon: GitFork,
    isNew: true,
    description: "Inter-station transfers & layovers",
  },
  {
    href: "/refund-calculator",
    label: "Refund Calc",
    icon: Calculator,
    isNew: true,
    description: "Itemized cancellation deductions & GST",
  },
  {
    href: "/running-status",
    label: "Running Status",
    icon: Activity,
    description: "Real-time train tracking",
  },
  {
    href: "/pnr-status",
    label: "PNR Status",
    icon: Ticket,
    description: "Confirmation odds & coach allotment",
  },
  {
    href: "/routes",
    label: "Routes",
    icon: MapPin,
    description: "Popular Indian travel corridors",
  },
  {
    href: "/blog",
    label: "Blog",
    icon: BookOpen,
    description: "50+ railway booking guides & tips",
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close mobile menu on page navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header
        className={`
          fixed inset-x-0 top-0 z-[100]
          transition-all duration-300 ease-out
          ${
            scrolled || mobileMenuOpen
              ? "border-b border-white/40 bg-white/85 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl"
              : "border-b border-transparent bg-transparent shadow-none"
          }
        `}
      >
        <div className="mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            <img
              src="/logo.png"
              alt="Wayvia"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <span className="font-display text-lg font-bold tracking-tight text-ink">
              Wayvia
            </span>
          </Link>

          {/* DESKTOP NAVIGATION (>= lg) */}
          <nav className="hidden items-center gap-4 xl:gap-5 lg:flex">
            {LINKS.map((l) => {
              const isActive = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative text-[13px] font-medium transition-colors ${
                    isActive
                      ? "font-semibold text-violet"
                      : "text-ink-muted hover:text-violet"
                  }`}
                >
                  <span>{l.label}</span>
                  {l.isNew && (
                    <span className="ml-1 rounded-full bg-violet/10 px-1 py-0.2 font-mono text-[9px] font-bold uppercase text-violet">
                      New
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-violet" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT ACTION BUTTONS & HAMBURGER */}
          <div className="flex items-center gap-2">
            {/* Desktop / Tablet Check PNR CTA */}
            <Link
              href="/pnr-status"
              className="hidden rounded-full bg-ink px-4 py-2 font-display text-[12.5px] font-semibold text-white! shadow-xs transition-colors hover:bg-violet sm:inline-flex items-center gap-1.5"
            >
              <Ticket size={13} />
              Check PNR
            </Link>

            {/* MOBILE HAMBURGER BUTTON (< lg) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={
                mobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={mobileMenuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white/90 text-ink shadow-2xs backdrop-blur-md transition-all hover:border-violet/40 hover:bg-white active:scale-95 lg:hidden"
            >
              {mobileMenuOpen ? (
                <X size={20} className="text-ink" />
              ) : (
                <Menu size={20} className="text-ink" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU DRAWER & OVERLAY */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-xs lg:hidden"
            />

            {/* SLIDE-DOWN DRAWER MENU PANEL */}
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed inset-x-3 top-[64px] z-[95] max-h-[calc(100vh-80px)] overflow-y-auto rounded-3xl border border-border bg-white/95 p-4 shadow-2xl backdrop-blur-2xl sm:inset-x-6 sm:p-5 lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-dim">
                  <Sparkles size={13} className="text-violet" />
                  Navigation &amp; Features
                </div>
                <span className="font-mono text-[10px] text-ink-dim">
                  {LINKS.length} Tools
                </span>
              </div>

              {/* LIST OF NAVIGATION ITEMS */}
              <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {LINKS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`group flex items-center justify-between rounded-2xl p-3 transition-all ${
                        isActive
                          ? "bg-violet-soft text-violet font-semibold ring-1 ring-violet/20"
                          : "hover:bg-surface-alt text-ink"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                            isActive
                              ? "bg-violet text-white shadow-2xs"
                              : "bg-surface-alt text-ink group-hover:bg-white group-hover:text-violet"
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-display text-sm font-semibold">
                              {item.label}
                            </span>
                            {item.isNew && (
                              <span className="rounded-full bg-violet/15 px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase text-violet">
                                New
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="line-clamp-1 text-[11px] text-ink-muted">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <ArrowRight
                        size={14}
                        className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${
                          isActive ? "text-violet" : "text-ink-dim"
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>

              {/* QUICK ACTION FOOTER BUTTONS */}
              <div className="mt-4 border-t border-border pt-4 grid grid-cols-2 gap-2">
                <Link
                  href="/journey-planner"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-violet py-3 font-display text-xs font-semibold text-white shadow-sm hover:bg-violet-dark transition-colors"
                >
                  <Compass size={14} />
                  Find a Way
                </Link>

                <Link
                  href="/pnr-status"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface-alt py-3 font-display text-xs font-semibold text-ink hover:bg-white transition-colors"
                >
                  <Ticket size={14} />
                  Check PNR
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
