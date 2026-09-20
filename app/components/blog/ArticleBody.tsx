import React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { ContentBlock } from "@/lib/blog/posts";
import Tip from "./Tip";
import ModeCards from "./ModeCards";

function renderBoldCode(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-surface-alt px-1.5 py-0.5 font-mono text-[12px] text-ink"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderFormattedText(text: string): React.ReactNode {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <React.Fragment key={`text-${lastIndex}`}>
          {renderBoldCode(text.substring(lastIndex, match.index))}
        </React.Fragment>,
      );
    }
    const linkText = match[1];
    const linkHref = match[2];
    const isInternal = linkHref.startsWith("/") || linkHref.startsWith("#");

    if (isInternal) {
      parts.push(
        <Link
          key={`link-${match.index}`}
          href={linkHref}
          className="font-medium text-violet underline decoration-violet/30 underline-offset-2 transition-colors hover:text-violet-dark hover:decoration-violet"
        >
          {linkText}
        </Link>,
      );
    } else {
      parts.push(
        <a
          key={`link-${match.index}`}
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-violet underline decoration-violet/30 underline-offset-2 transition-colors hover:text-violet-dark hover:decoration-violet"
        >
          {linkText}
        </a>,
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <React.Fragment key={`text-${lastIndex}`}>
        {renderBoldCode(text.substring(lastIndex))}
      </React.Fragment>,
    );
  }

  return parts.length > 0 ? parts : renderBoldCode(text);
}

export default function ArticleBody({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p
                key={i}
                className="font-sans text-[14.5px] leading-relaxed text-ink-muted"
              >
                {renderFormattedText(block.text)}
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
                    <span className="font-sans text-[14px] leading-relaxed text-ink">
                      {item}
                    </span>
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
