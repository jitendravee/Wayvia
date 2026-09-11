import type { MetadataRoute } from "next";
import { POPULAR_TRAINS } from "@/lib/trains";
import { POPULAR_ROUTES } from "@/lib/popularRoutes";
import { BLOG_POSTS } from "@/lib/blog/posts";

const base = process.env.NEXT_PUBLIC_SITE_URL || "https://wayvia.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/journey-planner`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/running-status`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/pnr-status`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/routes`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/how-it-works`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const routePages: MetadataRoute.Sitemap = POPULAR_ROUTES.map((r) => ({
    url: `${base}/routes/${r.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const trainPages: MetadataRoute.Sitemap = POPULAR_TRAINS.map((t) => ({
    url: `${base}/running-status/${t.trainNo}`,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  // One entry per post at /blog/[slug]. `lastModified` comes straight from
  // each post's `date` field (an ISO string, e.g. "2026-08-27") — that's
  // the one date BlogPost actually has, so it doubles as "last modified"
  // here. Google uses this to decide how often to recrawl a URL, which
  // matters more for the blog than for the train pages above (those don't
  // have a natural "last edited" date to report at all).
  //
  // `featured` posts get a small priority bump — same idea as the homepage
  // getting priority 1 above, just one tier down.
  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: "weekly",
    priority: post.featured ? 0.7 : 0.6,
  }));

  return [...staticPages, ...routePages, ...trainPages, ...blogPages];
}