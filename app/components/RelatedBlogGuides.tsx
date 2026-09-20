import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export interface GuideLink {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
}

export default function RelatedBlogGuides({
  title = "Related Travel Guides & Tactics",
  subtitle = "Learn the official rules, insider tricks, and booking strategies.",
  guides,
}: {
  title?: string;
  subtitle?: string;
  guides: GuideLink[];
}) {
  return (
    <section className="mt-14 border-t border-border pt-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-violet">
            <BookOpen size={13} />
            Insider Knowledge
          </div>
          <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-ink">
            {title}
          </h3>
          <p className="text-xs text-ink-muted">{subtitle}</p>
        </div>
        <Link
          href="/blog"
          className="mt-2 inline-flex items-center gap-1 font-display text-xs font-semibold text-violet transition-colors hover:text-violet-dark sm:mt-0"
        >
          Explore All 50+ Guides <ArrowRight size={13} />
        </Link>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((g) => (
          <Link
            key={g.slug}
            href={`/blog/${g.slug}`}
            className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-violet/40 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="rounded-md bg-surface-alt px-2 py-0.5 font-mono font-medium text-ink-muted uppercase">
                  {g.category}
                </span>
                <span className="font-mono text-ink-dim">{g.readTime}</span>
              </div>
              <h4 className="mt-2.5 font-display text-sm font-bold leading-snug text-ink transition-colors group-hover:text-violet">
                {g.title}
              </h4>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                {g.excerpt}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-violet">
              Read Guide{" "}
              <ArrowRight
                size={12}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
