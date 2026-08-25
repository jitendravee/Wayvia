import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.12go.co" },
      { protocol: "https", hostname: "www.petitfute.com" },
      { protocol: "https", hostname: "cdn.kimkim.com" },
      { protocol: "https", hostname: "www.asiaodysseytravel.com" },
      { protocol: "https", hostname: "lp-cms-production.imgix.net" },
      { protocol: "https", hostname: "www.gettyimages.com" },
      { protocol: "https", hostname: "imgs.search.brave.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;