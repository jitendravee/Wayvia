import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "@/lib/blog/posts";
import CategoryBadge from "./CategoryBadge";
import PostMeta from "./PostMeta";

interface Props {
  post: BlogPost;
  size?: "default" | "large" | "compact";
  className?: string;
}

/**
 * Reusable post card used in every grid on the listing page.
 * - "large": the tall left card in "Latest from Wayvia" — bigger image, excerpt, Read more.
 * - "default": the smaller "Latest" cards — same content, smaller image/title.
 * - "compact": "Popular guides" style — image, badge, title, meta only, no excerpt.
 */
export default function PostCard({ post, size = "default", className = "" }: Props) {
  const large = size === "large";
  const compact = size === "compact";
  const showExcerpt = !compact;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${className}`}
    >
      <div className={`overflow-hidden ${large ? "aspect-[16/11]" : "aspect-[16/10]"}`}>
        <img
          src={post.coverImage}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className={`flex flex-1 flex-col gap-2 p-4 ${large ? "sm:p-5" : ""}`}>
        <CategoryBadge category={post.category} />

        <h3 className={`font-display font-semibold leading-snug text-ink ${large ? "text-[18px] sm:text-[19px]" : "text-[15px]"}`}>
          {post.title}
        </h3>

        {showExcerpt && <p className="line-clamp-2 font-sans text-[13.5px] leading-relaxed text-ink-muted">{post.excerpt}</p>}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <PostMeta readTime={post.readTime} date={post.date} />
          {showExcerpt && (
            <span className="flex shrink-0 items-center gap-1 font-display text-[12.5px] font-semibold text-violet">
              Read more
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
