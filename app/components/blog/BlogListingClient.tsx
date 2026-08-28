"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, SearchX } from "lucide-react";
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

export default function BlogListingClient({ posts, featuredPost, routeOfWeek }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BlogCategory | "all">("all");

  const filtering = query.trim().length > 0 || category !== "all";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.excerpt.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [posts, query, category]);

  // Default (no filter) layout pulls specific posts for each section, same
  // as the reference design: latest-3 (excluding the featured post) and a
  // separate popular-guides shelf.
  const nonFeatured = useMemo(() => posts.filter((p) => p.slug !== featuredPost.slug), [posts, featuredPost]);
  const latest = nonFeatured.slice(0, 3);
  const popularGuides = nonFeatured.slice(3, 7);

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-24 sm:px-6">
      <BlogHero query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} />

      <div className="mt-8">
        {!filtering && <FeaturedPostCard post={featuredPost} />}
      </div>

      {filtering ? (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[18px] font-semibold text-ink">
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
              className="font-display text-[13px] font-semibold text-violet hover:text-violet-dark"
            >
              Clear
            </button>
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-soft text-violet">
                <SearchX size={24} />
              </span>
              <p className="font-display text-[15px] font-semibold text-ink">No articles match that search</p>
              <p className="max-w-xs font-sans text-[13px] text-ink-muted">Try a different keyword or clear the filters to see everything.</p>
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-[18px] font-semibold text-ink">Latest from Wayvia</h2>
              <Link href="#" className="flex items-center gap-1 font-display text-[13px] font-semibold text-violet hover:text-violet-dark">
                View all articles
                <ArrowRight size={13} />
              </Link>
            </div>

            {latest.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <PostCard post={latest[0]} size="large" className="sm:row-span-2" />
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
                <h2 className="font-display text-[18px] font-semibold text-ink">Popular guides</h2>
                <Link href="#" className="flex items-center gap-1 font-display text-[13px] font-semibold text-violet hover:text-violet-dark">
                  View all
                  <ArrowRight size={13} />
                </Link>
              </div>
              <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
                {popularGuides.map((post) => (
                  <PostCard key={post.slug} post={post} size="compact" />
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
