import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export default function Breadcrumb({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-sans text-[12.5px] text-ink-dim">
      <Link href="/" className="flex items-center hover:text-violet" aria-label="Home">
        <Home size={13} />
      </Link>
      <ChevronRight size={12} />
      <Link href="/blog" className="hover:text-violet">
        Blog
      </Link>
      <ChevronRight size={12} />
      <span className="max-w-[220px] truncate text-ink-muted sm:max-w-none">{title}</span>
    </nav>
  );
}
