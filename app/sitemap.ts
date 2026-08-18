import type { MetadataRoute } from "next";
import { POPULAR_ROUTES } from "@/lib/popularRoutes";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://wayvia.com";
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/routes`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/how-it-works`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const routePages: MetadataRoute.Sitemap = POPULAR_ROUTES.map((r) => ({
    url: `${base}/routes/${r.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...routePages];
}
