import { Clock, Calendar } from "lucide-react";
import { formatBlogDate } from "@/lib/blog/format";

export default function PostMeta({
  readTime,
  date,
  className = "",
}: {
  readTime: string;
  date: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 font-sans text-[12px] text-ink-dim ${className}`}>
      <span className="flex items-center gap-1">
        <Clock size={12} />
        {readTime}
      </span>
      <span className="flex items-center gap-1">
        <Calendar size={12} />
        {formatBlogDate(date)}
      </span>
    </div>
  );
}
