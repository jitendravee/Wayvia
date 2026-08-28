import type { BlogAuthor } from "@/lib/blog/posts";

export default function AuthorCard({ author }: { author: BlogAuthor }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <span className="mb-3 block font-mono text-[10px] uppercase tracking-wider text-ink-dim">About the author</span>
      <div className="flex items-center gap-3">
        <img src={author.avatar} alt={author.name} className="h-11 w-11 shrink-0 rounded-full object-cover" />
        <div>
          <div className="font-display text-[14px] font-semibold text-ink">{author.name}</div>
          <div className="font-sans text-[12px] text-ink-muted">{author.role}</div>
        </div>
      </div>
      <p className="mt-3 font-sans text-[12.5px] leading-relaxed text-ink-muted">{author.bio}</p>
    </div>
  );
}
