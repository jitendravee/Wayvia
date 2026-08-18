import type { MetadataRoute } from "next";
import { POPULAR_TRAINS } from "@/lib/trains";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://wayvia.com";
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/running-status`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/pnr-status`, changeFrequency: "daily", priority: 0.9 },
  ];

  const trainPages: MetadataRoute.Sitemap = POPULAR_TRAINS.map((t) => ({
    url: `${base}/running-status/${t.trainNo}`,
    changeFrequency: "hourly",
    priority: 0.7,
  }));

  return [...staticPages, ...trainPages];
}
