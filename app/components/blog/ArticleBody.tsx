import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { ContentBlock } from "@/lib/blog/posts";
import Tip from "./Tip";
import ModeCards from "./ModeCards";

export default function ArticleBody({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p key={i} className="font-sans text-[14.5px] leading-relaxed text-ink-muted">
                {block.text}
              </p>
            );

          case "heading":
            return (
              <h2
                key={i}
                id={block.id}
                className="scroll-mt-24 pt-3 font-display text-[19px] font-semibold text-ink sm:text-[21px]"
              >
                {block.text}
              </h2>
            );

          case "checklist":
            return (
              <ul key={i} className="flex flex-col gap-2">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-signal-green-soft text-signal-green">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span className="font-sans text-[14px] leading-relaxed text-ink">{item}</span>
                  </li>
                ))}
              </ul>
            );

          case "tip":
            return <Tip key={i} text={block.text} />;

          case "modes":
            return <ModeCards key={i} items={block.items} />;

          case "cta":
            return (
              <Link
                key={i}
                href={block.href}
                className="mt-2 flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-violet to-violet-dark px-5 py-2.5 font-display text-[13.5px] font-semibold text-white! shadow-sm shadow-violet-soft transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {block.label}
                <ArrowRight size={15} />
              </Link>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
