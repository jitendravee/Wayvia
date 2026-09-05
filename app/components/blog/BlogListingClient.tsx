"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import type { BlogCategory, BlogPost, RouteOfWeek } from "@/lib/blog/posts";
import BlogHero from "./BlogHero";
import FeaturedPostCard from "./FeaturedPostCard";
import PostCard from "./PostCard";
import RouteOfWeekCard from "./RouteOfWeekCard";
import CtaBanner from "./CtaBanner";

interface Props {
  posts: BlogPost[];
  featuredPost: BlogPost;
  routeOfWeek: RouteOfWeek;
}

export default function BlogListingClient({
  posts,
  featuredPost,
  routeOfWeek,
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BlogCategory | "all">("all");
  // Explicit "view all" toggle, separate from search/category filtering,
  // so "View all articles" / "View all" can show every post without
  // pretending the user typed a search query.
  const [showAll, setShowAll] = useState(false);

  const hasSearchFilter = query.trim().length > 0 || category !== "all";
  const filtering = hasSearchFilter || showAll;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !p.excerpt.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [posts, query, category]);

  const nonFeatured = useMemo(
    () => posts.filter((p) => p.slug !== featuredPost.slug),
    [posts, featuredPost],
  );
  const latest = nonFeatured.slice(0, 3);
  const latestSlugs = useMemo(
    () => new Set(latest.map((p) => p.slug)),
    [latest],
  );

  // Every remaining post — not a slice — so the carousel (and the
  // crawlable HTML of /blog) links to the whole catalog, not just 4 of them.
  const popularGuides = useMemo(
    () => nonFeatured.filter((p) => !latestSlugs.has(p.slug)),
    [nonFeatured, latestSlugs],
  );

  const gridPosts = hasSearchFilter ? filtered : posts;

  const clearAll = () => {
    setQuery("");
    setCategory("all");
    setShowAll(false);
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (dir: 1 | -1) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-24 sm:px-6">
      <BlogHero
        query={query}
        onQueryChange={(v) => {
          setShowAll(false);
          setQuery(v);
        }}
        category={category}
        onCategoryChange={(c) => {
          setShowAll(false);
          setCategory(c);
        }}
      />

      <div className="mt-8">
        {!filtering && <FeaturedPostCard post={featuredPost} />}
      </div>

      {filtering ? (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[18px] font-semibold text-ink">
              {hasSearchFilter
                ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
                : "All articles"}
            </h2>
            <button
              type="button"
              onClick={clearAll}
              className="font-display text-[13px] font-semibold text-violet hover:text-violet-dark"
            >
              {hasSearchFilter ? "Clear" : "Back"}
            </button>
          </div>

          {gridPosts.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-soft text-violet">
                <SearchX size={24} />
              </span>
              <p className="font-display text-[15px] font-semibold text-ink">
                No articles match that search
              </p>
              <p className="max-w-xs font-sans text-[13px] text-ink-muted">
                Try a different keyword or clear the filters to see everything.
              </p>
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-[18px] font-semibold text-ink">
                Latest from Wayvia
              </h2>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="flex items-center gap-1 font-display text-[13px] font-semibold text-violet hover:text-violet-dark"
              >
                View all articles
                <ArrowRight size={13} />
              </button>
            </div>

            {latest.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <PostCard
                  post={latest[0]}
                  size="large"
                  className="sm:row-span-2"
                />
                <div className="grid gap-5 sm:grid-rows-2">
                  {latest.slice(1, 3).map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="mt-10">
            <RouteOfWeekCard route={routeOfWeek} />
          </section>

          {popularGuides.length > 0 && (
            <section className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-[18px] font-semibold text-ink">
                  Popular guides
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="flex items-center gap-1 font-display text-[13px] font-semibold text-violet hover:text-violet-dark"
                  >
                    View all
                    <ArrowRight size={13} />
                  </button>
                  <div className="hidden items-center gap-1 sm:flex">
                    <button
                      type="button"
                      aria-label="Scroll left"
                      onClick={() => scrollCarousel(-1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-ink-muted hover:text-ink"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Scroll right"
                      onClick={() => scrollCarousel(1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-ink-muted hover:text-ink"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Every remaining post is rendered here (not sliced), so all
                  of them are linked from /blog for crawling — just scrolled
                  horizontally instead of paginated for the visitor. */}
              <div
                ref={carouselRef}
                className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {popularGuides.map((post) => (
                  <div
                    key={post.slug}
                    className="w-[calc(50%-10px)] shrink-0 snap-start sm:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)]"
                  >
                    <PostCard post={post} size="compact" />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <CtaBanner />
          </section>
        </>
      )}
    </main>
  );
}
