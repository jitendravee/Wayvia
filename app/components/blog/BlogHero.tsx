"use client";

import { Search, MapPin, Plane, Bus, TrainFront } from "lucide-react";
import { BlogCategory, CATEGORY_PILL_LABEL } from "@/lib/blog/posts";

const CATEGORIES: BlogCategory[] = ["travel-guides", "route-ideas", "rail", "bus", "flights", "wayvia", "tips"];

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  category: BlogCategory | "all";
  onCategoryChange: (c: BlogCategory | "all") => void;
}

export default function BlogHero({ query, onQueryChange, category, onCategoryChange }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-violet-soft/70 via-violet-soft/30 to-transparent px-5 pb-8 pt-10 text-center sm:px-8 sm:pb-10 sm:pt-14">
      {/* Decorative floating icons — purely visual, hidden on small screens so they never crowd the text. */}
      <TrainFront size={18} className="absolute left-6 top-14 hidden text-violet/40 sm:block md:left-10" />
      <MapPin size={16} className="absolute left-16 top-32 hidden text-violet/30 sm:block md:left-24" />
      <Plane size={20} className="absolute right-8 top-10 hidden -rotate-12 text-violet/40 sm:block md:right-14" />
      <Bus size={16} className="absolute right-10 top-36 hidden text-violet/30 sm:block md:right-16" />

      <span className="inline-flex items-center rounded-full bg-violet-soft px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-violet-dark">
        Journal
      </span>

      <h1 className="mx-auto mt-3 max-w-2xl font-display text-[28px] font-semibold leading-tight text-ink sm:text-[38px]">
        Travel <span className="text-violet">smarter</span>. Explore <span className="text-violet">further</span>.
      </h1>

      <p className="mx-auto mt-2.5 max-w-md font-sans text-[14px] leading-relaxed text-ink-muted">
        Stories, guides and ideas about journeys, routes and finding better ways to get there.
      </p>

      <div className="relative mx-auto mt-6 max-w-md">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-dim" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search articles..."
          className="w-full rounded-full border border-border bg-white py-3 pl-11 pr-4 font-sans text-[14px] text-ink shadow-sm outline-none placeholder:text-ink-dim focus:border-violet focus:ring-2 focus:ring-violet-ring"
        />
      </div>

      <div className="relative mt-6 flex flex-wrap justify-center gap-2">
        <PillButton active={category === "all"} onClick={() => onCategoryChange("all")}>
          All
        </PillButton>
        {CATEGORIES.map((c) => (
          <PillButton key={c} active={category === c} onClick={() => onCategoryChange(c)}>
            {CATEGORY_PILL_LABEL[c]}
          </PillButton>
        ))}
      </div>
    </div>
  );
}

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 font-display text-[13px] font-semibold transition-colors ${
        active ? "bg-violet text-white shadow-sm shadow-violet-soft" : "border border-border bg-white text-ink-muted hover:border-violet-ring hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
