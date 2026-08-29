import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function LegalFooterNote({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-violet-soft/50 p-3.5 sm:p-4">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-violet">
        <Icon size={16} strokeWidth={2.2} />
      </span>
      <p className="text-[12.5px] leading-relaxed text-ink sm:text-[13px]">{children}</p>
    </div>
  );
}