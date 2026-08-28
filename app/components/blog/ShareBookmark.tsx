"use client";

import { useState } from "react";
import { Bookmark, Check, Share2 } from "lucide-react";

export default function ShareBookmark({ title }: { title: string }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* cancelled — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — nothing more we can do */
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setSaved((v) => !v)}
        aria-pressed={saved}
        aria-label={saved ? "Remove bookmark" : "Bookmark this article"}
        title={saved ? "Bookmarked" : "Bookmark"}
        className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-colors ${
          saved ? "border-violet bg-violet-soft text-violet-dark" : "border-border bg-white text-ink-muted hover:border-violet-ring hover:text-violet"
        }`}
      >
        <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
      </button>

      <button
        type="button"
        onClick={handleShare}
        aria-label="Share this article"
        title={copied ? "Link copied" : "Share"}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-ink-muted shadow-sm transition-colors hover:border-violet-ring hover:text-violet"
      >
        {copied ? <Check size={15} className="text-signal-green" /> : <Share2 size={15} />}
      </button>
    </div>
  );
}
