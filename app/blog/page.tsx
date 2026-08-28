import type { Metadata } from "next";
import { BLOG_POSTS, getFeaturedPost, ROUTE_OF_THE_WEEK } from "@/lib/blog/posts";
import BlogListingClient from "../components/blog/BlogListingClient";

export const metadata: Metadata = {
  title: "Blog — Travel smarter, explore further",
  description:
    "Stories, guides and ideas about journeys, routes and finding better ways to get there — from Wayvia.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  return <BlogListingClient posts={BLOG_POSTS} featuredPost={getFeaturedPost()} routeOfWeek={ROUTE_OF_THE_WEEK} />;
}
