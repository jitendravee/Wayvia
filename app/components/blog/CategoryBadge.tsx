import { CATEGORY_BADGE_LABEL, BlogCategory } from "@/lib/blog/posts";

export default function CategoryBadge({ category, className = "" }: { category: BlogCategory; className?: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full bg-violet-soft px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-violet-dark ${className}`}
    >
      {CATEGORY_BADGE_LABEL[category]}
    </span>
  );
}
