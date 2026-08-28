import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "@/lib/blog/posts";
import PostMeta from "./PostMeta";

export default function FeaturedPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition-shadow hover:shadow-lg sm:flex-row"
    >
      <div className="aspect-[16/10] overflow-hidden sm:aspect-auto sm:w-[46%] sm:shrink-0">
        <img
          src={post.coverImage}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-3 p-5 sm:p-8">
        <span className="inline-flex w-fit items-center rounded-full bg-violet px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
          Featured
        </span>

        <h2 className="font-display text-[22px] font-semibold leading-tight text-ink sm:text-[26px]">{post.title}</h2>

        <p className="max-w-lg font-sans text-[14px] leading-relaxed text-ink-muted">{post.excerpt}</p>

        <div className="flex items-center gap-4 pt-1">
          <PostMeta readTime={post.readTime} date={post.date} />
        </div>

        <span className="mt-1 flex w-fit items-center gap-1.5 font-display text-[13.5px] font-semibold text-violet">
          Read article
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
