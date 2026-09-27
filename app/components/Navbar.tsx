"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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
  Share2,
  Train,
  Coins,
  ChevronDown,
} from "lucide-react";

interface NavSubItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isNew?: boolean;
  description: string;
}

interface NavCategory {
  id: string;
  label: string;
  items: NavSubItem[];
}

const CATEGORIES: NavCategory[] = [
  {
    id: "plan",
    label: "Plan & Routes",
    items: [
      {
        href: "/journey-planner",
        label: "Find a Way",
        icon: Compass,
        description: "Multimodal train + bus route optimizer",
      },
      {
        href: "/routes",
        label: "Popular Corridors",
        icon: MapPin,
        description: "High-density routes & station guides",
      },
      {
        href: "/junctions",
        label: "Junction Hubs",
        icon: GitFork,
        isNew: true,
        description: "Inter-station transfers & layover guide",
      },
      {
        href: "/emergency-travel",
        label: "Emergency Rescue",
        icon: ShieldAlert,
        isNew: true,
        description: "Sold-out festival travel blueprints",
      },
    ],
  },
  {
    id: "savings",
    label: "Savings & Hacks",
    items: [
      {
        href: "/fare-arbitrage",
        label: "Fare Arbitrage",
        icon: Coins,
        isNew: true,
        description: "Secret AC upgrades & dynamic surge breakers",
      },
      {
        href: "/tatkal-matrix",
        label: "Tatkal Matrix",
        icon: Zap,
        isNew: true,
        description: "10 & 11 AM countdown & autofill generator",
      },
      {
        href: "/vande-bharat",
        label: "Vande Bharat",
        icon: Train,
        isNew: true,
        description: "Live halts, fares & multimodal bus connectors",
      },
      {
        href: "/refund-calculator",
        label: "Refund Calc",
        icon: Calculator,
        isNew: true,
        description: "Itemized cancellation deductions & GST",
      },
    ],
  },
  {
    id: "track",
    label: "Live Track & Tools",
    items: [
      {
        href: "/journey-card",
        label: "Journey Pass",
        icon: Share2,
        isNew: true,
        description: "1-Click WhatsApp digital ticket pass",
      },
      {
        href: "/running-status",
        label: "Running Status",
        icon: Activity,
        description: "Real-time live train tracking",
      },
      {
        href: "/pnr-status",
        label: "PNR Status",
        icon: Ticket,
        description: "Confirmation odds & coach allotment",
      },
      {
        href: "/coach-position",
        label: "Coach Position",
        icon: LayoutGrid,
        isNew: true,
        description: "2D blueprint & seat spotlight finder",
      },
    ],
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<
    string | null
  >("plan");
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on path navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
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

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setOpenDropdown(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMouseEnter = (categoryId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(categoryId);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  const isCategoryActive = (category: NavCategory) => {
    return category.items.some((item) => pathname === item.href);
  };

  return (
    <>
      <header
        className={`
          fixed inset-x-0 top-0 z-[100]
          transition-all duration-200 ease-out
          ${
            scrolled || mobileMenuOpen || openDropdown !== null
              ? "border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-xl"
              : "border-b border-slate-200/50 bg-white/80 backdrop-blur-md"
          }
        `}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/logo.png"
              alt="Wayvia"
              className="h-8 w-8 rounded-lg object-contain shadow-2xs"
            />
            <span className="font-display text-lg font-bold tracking-tight text-ink">
              Wayvia
            </span>
          </Link>

          {/* DESKTOP CATEGORIZED NAVIGATION (>= lg) */}
          <nav className="hidden items-center gap-1.5 lg:flex">
            {CATEGORIES.map((cat) => {
              const active = isCategoryActive(cat);
              const isOpen = openDropdown === cat.id;

              return (
                <div
                  key={cat.id}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(cat.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Category Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(isOpen ? null : cat.id)}
                    className={`flex items-center gap-1 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all ${
                      isOpen || active
                        ? "bg-violet-soft text-violet"
                        : "text-ink hover:bg-slate-100 hover:text-violet"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-violet" : "text-ink-dim"
                      }`}
                    />
                  </button>

                  {/* Desktop Dropdown Flyout */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-0 top-full pt-2 z-[110] w-80"
                        onMouseEnter={() => handleMouseEnter(cat.id)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="rounded-2xl border border-slate-200 bg-white/98 p-2 shadow-xl shadow-slate-900/10 backdrop-blur-2xl">
                          <div className="space-y-1">
                            {cat.items.map((sub) => {
                              const SubIcon = sub.icon;
                              const isSubActive = pathname === sub.href;

                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  onClick={() => setOpenDropdown(null)}
                                  className={`group flex items-start gap-3 rounded-xl p-2.5 transition-all ${
                                    isSubActive
                                      ? "bg-violet-soft text-violet"
                                      : "hover:bg-slate-50 text-slate-800 hover:text-violet"
                                  }`}
                                >
                                  <div
                                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                      isSubActive
                                        ? "bg-violet text-white shadow-2xs"
                                        : "bg-slate-100 text-slate-600 group-hover:bg-violet-soft group-hover:text-violet"
                                    }`}
                                  >
                                    <SubIcon size={16} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[13px] font-bold leading-tight">
                                        {sub.label}
                                      </span>
                                      {sub.isNew && (
                                        <span className="rounded-full bg-violet/15 px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase text-violet">
                                          New
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                                      {sub.description}
                                    </p>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Direct Blog Link */}
            <Link
              href="/blog"
              className={`rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-all ${
                pathname.startsWith("/blog")
                  ? "bg-violet-soft text-violet"
                  : "text-ink hover:bg-slate-100 hover:text-violet"
              }`}
            >
              Blog
            </Link>
          </nav>

          {/* RIGHT ACTION BUTTONS & HAMBURGER */}
          <div className="flex items-center gap-2.5">
            {/* Desktop Quick CTA */}
            <Link
              href="/pnr-status"
              className="hidden items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-display text-[12.5px] font-semibold text-white! shadow-xs transition-colors hover:bg-violet sm:inline-flex"
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
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-ink shadow-2xs backdrop-blur-md transition-all hover:border-violet/40 hover:bg-white active:scale-95 lg:hidden"
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
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-x-3 top-[70px] z-[95] max-h-[calc(100vh-85px)] overflow-y-auto rounded-3xl border border-slate-200 bg-white/98 p-4 shadow-2xl backdrop-blur-2xl sm:inset-x-6 sm:p-5 lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <Sparkles size={13} className="text-violet" />
                  Categories &amp; Tools
                </div>
                <span className="font-mono text-[10px] text-slate-400">
                  {CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0) +
                    1}{" "}
                  Tools
                </span>
              </div>

              {/* CATEGORY ACCORDIONS */}
              <div className="mt-3 space-y-2">
                {CATEGORIES.map((cat) => {
                  const isExpanded = expandedMobileCategory === cat.id;
                  const active = isCategoryActive(cat);

                  return (
                    <div
                      key={cat.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMobileCategory(isExpanded ? null : cat.id)
                        }
                        className="flex w-full items-center justify-between px-3.5 py-3 text-left transition hover:bg-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-display text-[13px] font-bold ${
                              active ? "text-violet" : "text-slate-800"
                            }`}
                          >
                            {cat.label}
                          </span>
                          <span className="rounded-full bg-slate-200/80 px-1.5 py-0.2 font-mono text-[10px] font-bold text-slate-600">
                            {cat.items.length}
                          </span>
                        </div>
                        <ChevronDown
                          size={15}
                          className={`text-slate-400 transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-violet" : ""
                          }`}
                        />
                      </button>

                      {/* Accordion Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="border-t border-slate-100 bg-white px-2 py-2"
                          >
                            <div className="space-y-1">
                              {cat.items.map((sub) => {
                                const SubIcon = sub.icon;
                                const isSubActive = pathname === sub.href;

                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`group flex items-center justify-between rounded-xl p-2.5 transition-all ${
                                      isSubActive
                                        ? "bg-violet-soft text-violet font-semibold"
                                        : "hover:bg-slate-50 text-slate-800"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                          isSubActive
                                            ? "bg-violet text-white shadow-2xs"
                                            : "bg-slate-100 text-slate-600 group-hover:bg-violet-soft group-hover:text-violet"
                                        }`}
                                      >
                                        <SubIcon size={16} />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[13px] font-bold">
                                            {sub.label}
                                          </span>
                                          {sub.isNew && (
                                            <span className="rounded-full bg-violet/15 px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase text-violet">
                                              New
                                            </span>
                                          )}
                                        </div>
                                        <p className="line-clamp-1 text-[11px] text-slate-500">
                                          {sub.description}
                                        </p>
                                      </div>
                                    </div>

                                    <ArrowRight
                                      size={14}
                                      className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${
                                        isSubActive
                                          ? "text-violet"
                                          : "text-slate-300"
                                      }`}
                                    />
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Direct Blog Link in Mobile */}
                <Link
                  href="/blog"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-3.5 py-3 transition hover:bg-slate-100 ${
                    pathname.startsWith("/blog")
                      ? "text-violet font-bold"
                      : "text-slate-800 font-semibold"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <div className="text-[13px]">
                        Travel Blog &amp; Guides
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        50+ railway booking guides &amp; tips
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-300" />
                </Link>
              </div>

              {/* QUICK ACTION FOOTER BUTTONS */}
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                <Link
                  href="/journey-planner"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-violet py-2.5 font-display text-xs font-semibold text-white shadow-sm hover:bg-violet-dark transition-colors"
                >
                  <Compass size={14} />
                  Find a Way
                </Link>

                <Link
                  href="/pnr-status"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 py-2.5 font-display text-xs font-semibold text-slate-800 hover:bg-white transition-colors"
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
