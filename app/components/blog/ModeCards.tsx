import { Bus, Plane, TrainFront } from "lucide-react";
import type { ContentBlock } from "@/lib/blog/posts";

const MODE_ICON = {
  "train-bus": TrainFront,
  "flight-train": Plane,
  bus: Bus,
};

export default function ModeCards({ items }: { items: Extract<ContentBlock, { type: "modes" }>["items"] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item, i) => {
        const Icon = MODE_ICON[item.icon];
        return (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-border bg-surface-alt/50 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-soft text-violet-dark">
              <Icon size={15} />
            </span>
            <span className="font-display text-[14px] font-semibold text-ink">{item.title}</span>
            <span className="font-sans text-[12.5px] leading-relaxed text-ink-muted">{item.description}</span>
          </div>
        );
      })}
    </div>
  );
}
