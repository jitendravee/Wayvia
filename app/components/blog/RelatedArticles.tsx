import Link from "next/link";
import type { BlogPost } from "@/lib/blog/posts";
import CategoryBadge from "./CategoryBadge";
import { Clock } from "lucide-react";

export default function RelatedArticles({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <span className="mb-3 block font-mono text-[10px] uppercase tracking-wider text-ink-dim">Related articles</span>
      <div className="flex flex-col gap-3.5">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex gap-3">
            <img src={post.coverImage} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0">
              <CategoryBadge category={post.category} className="!px-1.5 !py-0.5 !text-[9px]" />
              <div className="mt-1 line-clamp-2 font-display text-[13px] font-semibold leading-snug text-ink group-hover:text-violet">
                {post.title}
              </div>
              <div className="mt-1 flex items-center gap-1 font-sans text-[11px] text-ink-dim">
                <Clock size={11} />
                {post.readTime}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
