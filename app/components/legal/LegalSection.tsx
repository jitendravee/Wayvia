import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface LegalSectionItem {
  /** Optional bold lead-in before the item text, e.g. "Personal Information: <text>". Omit for a plain bullet. */
  label?: string;
  text: string;
}

export interface LegalSectionData {
  icon: LucideIcon;
  /** Include the number in the title itself (e.g. "1. Information We Collect") so it reads correctly even if items ever get reordered. */
  title: string;
  /** ReactNode (not just string) so a section like "Cancellations and Refunds" can embed an inline link to another policy. */
  description?: ReactNode;
  items?: LegalSectionItem[];
}

export default function LegalSection({ icon: Icon, title, description, items }: LegalSectionData) {
  return (
    <div className="flex gap-3.5 sm:gap-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet sm:h-10 sm:w-10">
        <Icon size={17} strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        <h2 className="font-display text-[14.5px] font-semibold text-ink sm:text-[15.5px]">{title}</h2>

        {description && (
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted sm:text-[13.5px]">{description}</p>
        )}

        {items && items.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-muted sm:text-[13.5px]">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-dim" />
                <span>
                  {item.label && <span className="font-semibold text-ink">{item.label}: </span>}
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}