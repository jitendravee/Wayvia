"use client";

import { useEffect, useState } from "react";

export interface TocEntry {
  id: string;
  text: string;
}

export default function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState(entries[0]?.id ?? "");

  useEffect(() => {
    if (entries.length === 0) return;

    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );

    entries.forEach((e) => {
      const el = document.getElementById(e.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <span className="mb-3 block font-mono text-[10px] uppercase tracking-wider text-ink-dim">Table of contents</span>
      <ol className="flex flex-col gap-2.5">
        {entries.map((entry, i) => {
          const active = entry.id === activeId;
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => scrollTo(entry.id)}
                className={`flex w-full items-start gap-2.5 text-left transition-colors ${
                  active ? "text-violet" : "text-ink-muted hover:text-ink"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                    active ? "bg-violet text-white" : "bg-surface-alt text-ink-dim"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`font-sans text-[13px] leading-snug ${active ? "font-semibold" : ""}`}>{entry.text}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
