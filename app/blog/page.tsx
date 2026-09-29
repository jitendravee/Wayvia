import type { Metadata } from "next";
import {
  BLOG_POSTS,
  getFeaturedPost,
  ROUTE_OF_THE_WEEK,
} from "@/lib/blog/posts";
import BlogListingClient from "../components/blog/BlogListingClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wayvia.xyz";

export const metadata: Metadata = {
  title: "Wayvia Travel Blog — Smart Train, Bus & Multimodal Guides (2026)",
  description:
    "Master Indian Railways ticketing hacks, waitlist secrets (GNWL vs RLWL vs PQWL), Tatkal tips, split-ticketing guides, and connecting multimodal routes.",
  keywords: [
    "Indian railway tips",
    "IRCTC hacks",
    "train travel guide India",
    "waitlist confirmation chances",
    "Tatkal booking strategy",
    "split ticketing India",
    "connecting train routes",
    "railway travel blog",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Wayvia Travel Blog — Smart Train, Bus & Multimodal Guides",
    description:
      "Master Indian Railways ticketing hacks, waitlist secrets, Tatkal tips, and connecting routes across India.",
    url: `${SITE_URL}/blog`,
    type: "website",
    images: [`${SITE_URL}/blog/split-ticketing-hero.jpg`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wayvia Travel Blog — Smart Train, Bus & Multimodal Guides (2026)",
    description:
      "Master Indian Railways ticketing hacks, waitlist secrets, Tatkal tips, and connecting routes across India.",
    images: [`${SITE_URL}/blog/split-ticketing-hero.jpg`],
  },
};

export default function BlogIndexPage() {
  const jsonLdBlog = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Wayvia Travel Blog",
        description:
          "Guides, secrets, and strategies for smart train, bus, and multimodal travel across India.",
        url: `${SITE_URL}/blog`,
        publisher: {
          "@type": "Organization",
          name: "Wayvia",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/logo.png`,
          },
        },
        hasPart: BLOG_POSTS.slice(0, 15).map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          url: `${SITE_URL}/blog/${post.slug}`,
          datePublished: post.date,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${SITE_URL}/blog` },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdBlog),
        }}
      />
      <BlogListingClient
        posts={BLOG_POSTS}
        featuredPost={getFeaturedPost()}
        routeOfWeek={ROUTE_OF_THE_WEEK}
      />
    </>
  );
}
