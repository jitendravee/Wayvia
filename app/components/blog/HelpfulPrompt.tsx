"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

export default function HelpfulPrompt() {
  const [choice, setChoice] = useState<"yes" | "no" | null>(null);

  if (choice) {
    return (
      <div className="mt-10 flex items-center gap-2 border-t border-border pt-6 font-sans text-[13.5px] text-ink-muted">
        Thanks for letting us know!
      </div>
    );
  }

  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6">
      <span className="font-sans text-[13.5px] text-ink-muted">Was this article helpful?</span>
      <button
        type="button"
        onClick={() => setChoice("yes")}
        className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 font-display text-[12.5px] font-semibold text-ink-muted transition-colors hover:border-signal-green hover:text-signal-green"
      >
        <ThumbsUp size={13} />
        Yes
      </button>
      <button
        type="button"
        onClick={() => setChoice("no")}
        className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 font-display text-[12.5px] font-semibold text-ink-muted transition-colors hover:border-signal-red hover:text-signal-red"
      >
        <ThumbsDown size={13} />
        No
      </button>
    </div>
  );
}
