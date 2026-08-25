"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/running-status", label: "Running Status" },
  { href: "/pnr-status", label: "PNR Status" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <header
      className={`
        fixed inset-x-0 top-0 z-50
        transition-all duration-300 ease-out
        ${
          scrolled
            ? "border-b border-white/40 bg-white/75 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl"
            : "border-b border-transparent bg-transparent shadow-none"
        }
      `}
    >
      <div className="mx-auto flex items-center justify-between px-5 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Wayvia"
            className="h-12 w-12 rounded-lg object-contain"
          />

          <span className="mt-2 font-display text-lg font-semibold text-ink">
            Wayvia
          </span>
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
          href="/pnr-status"
          className="rounded-full bg-violet px-4 py-2 font-display text-[13px] font-semibold text-white! shadow-sm shadow-violet-soft transition-colors hover:bg-violet-dark"
        >
          Check PNR
        </Link>
      </div>
    </header>
  );
}