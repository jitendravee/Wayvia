"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import RelatedBlogGuides from "../components/RelatedBlogGuides";
import {
  GitFork,
  Search,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Building,
  ArrowRight,
  Coffee,
  Luggage,
} from "lucide-react";
import {
  JUNCTIONS_DATA,
  JunctionHubDetail,
} from "@/lib/junctions/junctionData";

type CategoryFilter =
  | "ALL"
  | "METRO_HUB"
  | "TRUNK_JUNCTION"
  | "PILGRIM_TOURISM";

export default function JunctionsHubClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("ALL");

  const filteredJunctions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return JUNCTIONS_DATA.filter((j) => {
      const matchesCat =
        selectedCategory === "ALL" || j.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        j.code.toLowerCase().includes(q) ||
        j.name.toLowerCase().includes(q) ||
        j.city.toLowerCase().includes(q) ||
        j.state.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
      {/* HEADER */}
      <header className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-soft px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-violet">
          <GitFork size={13} />
          Station Transfer &amp; Layover Guides
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-4xl">
          Major Indian Railway Junction Hubs
        </h1>
        <p className="mx-auto mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-ink-muted">
          Never miss a connecting train. Learn minimum connection times, how to
          transfer between city terminals (Metro &amp; cabs), cloakroom rules,
          and 24/7 executive lounge access.
        </p>
      </header>

      {/* SEARCH BAR & CATEGORY TABS */}
      <div className="mt-8 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-ink-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search junction by code or city (e.g. NDLS, Kanpur, Mathura, Vijayawada)..."
            className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 font-mono text-sm text-ink outline-none transition-colors focus:border-violet focus:ring-1 focus:ring-violet"
          />
        </div>

        {/* CATEGORY FILTERS */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-soft pt-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
            Filter:
          </span>
          {[
            { key: "ALL", label: "All Junctions" },
            { key: "METRO_HUB", label: "Metro Terminals" },
            { key: "TRUNK_JUNCTION", label: "Trunk Crossings" },
            { key: "PILGRIM_TOURISM", label: "Pilgrim & Tourism" },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key as CategoryFilter)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategory === cat.key
                  ? "border-violet bg-violet-soft text-violet font-semibold"
                  : "border-border bg-white text-ink-muted hover:border-violet/40 hover:text-ink"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* JUNCTION CARDS GRID */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {filteredJunctions.map((junc) => {
          return (
            <Link
              key={junc.code}
              href={`/junctions/${junc.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-xs transition-all hover:border-violet/50 hover:shadow-sm"
            >
              <div>
                {/* TOP ROW: CODE + CATEGORY */}
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-surface-alt px-2.5 py-1 font-mono text-xs font-bold text-ink group-hover:bg-violet-soft group-hover:text-violet transition-colors">
                    {junc.code}
                  </span>
                  <span className="rounded-full bg-surface-alt px-2.5 py-0.5 font-mono text-[10px] font-semibold text-ink-muted">
                    {junc.categoryLabel}
                  </span>
                </div>

                {/* NAME & CITY */}
                <h3 className="mt-3 font-display text-lg font-bold text-ink group-hover:text-violet transition-colors">
                  {junc.name}
                </h3>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {junc.city}, {junc.state} • {junc.zone}
                </p>

                {/* BRIEF OVERVIEW */}
                <p className="mt-2.5 text-xs leading-relaxed text-ink-muted line-clamp-2">
                  {junc.overview}
                </p>
              </div>

              {/* AMENITIES PILLS & MCT */}
              <div className="mt-5 border-t border-border-soft pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-ink">
                    <Clock size={12} className="text-violet" />
                    <span>
                      Min Layover: {junc.minimumConnectionTimeMin} mins
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-ink-muted">
                    <span>{junc.platformsCount} Platforms</span>
                    {junc.amenities.hasExecutiveLounge && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          Lounge Available
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end font-mono text-[11px] font-bold text-violet group-hover:translate-x-0.5 transition-transform">
                  <span>View Full Layover &amp; Transfer Guide</span>
                  <ArrowRight size={12} className="ml-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* WHY JUNCTION GUIDES MATTER */}
      <section className="mt-14 rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8">
        <h2 className="font-display text-xl font-bold text-ink">
          Why Knowing Your Junction Matters Before Booking
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Most travelers miss connecting trains not because of train delays, but
          due to lack of station transfer knowledge.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <Clock size={15} className="text-violet" />
              Minimum Connection Times (MCT)
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              At large stations like New Delhi (16 platforms) or Howrah (23
              platforms), walking with family and luggage between Platform 1 and
              16 takes 15–20 minutes. Never book connections with under 35
              minutes gap.
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <Building size={15} className="text-violet" />
              Inter-Station Terminals
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              In cities like Delhi (NDLS vs NZM vs ANVT) or Mumbai (CSMT vs BDTS
              vs LTT), trains arrive at completely different physical stations
              across town. Always check the Metro transfer line in our guide.
            </p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <Luggage size={15} className="text-violet" />
              Cloakroom Rules
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Indian Railways cloakrooms charge just ₹30 per bag for 24 hours,
              but strictly require a physical lock and key on every zipper. Open
              or un-lockable bags are rejected by railway police.
            </p>
          </div>
        </div>
      </section>

      {/* RELATED JUNCTION & TRANSIT GUIDES */}
      <RelatedBlogGuides
        title="Junction Layover & Transit Guides"
        subtitle="Learn how to plan train transfers, utilize station cloakrooms, and navigate major Indian transit hubs."
        guides={[
          {
            slug: "indian-railway-junction-transfer-layover-guide-2026",
            title:
              "The Ultimate Indian Railways Junction Transfer & Layover Guide (2026)",
            excerpt:
              "Cloakroom padlock rules, executive lounges, platform walking buffers, and cross-terminal metro transit.",
            category: "Travel Guides",
            readTime: "10 min read",
          },
          {
            slug: "delhi-to-mumbai-train-travel-guide-rajdhani-vande-bharat-connecting-routes",
            title:
              "Delhi to Mumbai Train Travel Guide: Connecting Junction Routes",
            excerpt:
              "How booking via Kota, Vadodara, or Surat unlocks confirmed berths when direct Rajdhanis sell out.",
            category: "Travel Guides",
            readTime: "9 min read",
          },
          {
            slug: "best-bus-routes-between-major-cities-in-india",
            title: "Best Bus Routes Between Major Cities in India",
            excerpt:
              "How to connect from railway junction hubs to nearby tourism and pilgrimage destinations by bus.",
            category: "Tips",
            readTime: "7 min read",
          },
        ]}
      />
    </main>
  );
}
