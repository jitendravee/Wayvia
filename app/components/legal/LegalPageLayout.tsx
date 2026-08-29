import type { ReactNode } from "react";
import { LegalHeaderIllustration, type LegalHeaderVariant } from "./LegalHeaderIllustration";
import LegalSection, { type LegalSectionData } from "./LegalSection";

export interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  intro: string;
  variant: LegalHeaderVariant;
  sections: LegalSectionData[];
  /** Pass a <LegalFooterNote> element — kept as a prop rather than baked in here so each page controls its own icon/link. */
  footerNote: ReactNode;
}

export default function LegalPageLayout({ title, lastUpdated, intro, variant, sections, footerNote }: LegalPageLayoutProps) {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 mt-15">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm shadow-violet-soft/30 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[22px] font-bold text-ink sm:text-[26px]">{title}</h1>
            <p className="mt-1 font-mono text-[11px] text-ink-dim sm:text-[11.5px]">Last updated: {lastUpdated}</p>
          </div>
          <LegalHeaderIllustration variant={variant} />
        </div>

        <p className="mt-4 text-[13.5px] leading-relaxed text-ink-muted sm:text-[14px]">{intro}</p>

        {/* Numbered sections, hairline divider between each */}
        <div className="mt-7 sm:mt-8">
          {sections.map((section, i) => (
            <div key={i}>
              <LegalSection {...section} />
              {i < sections.length - 1 && <div className="my-5 h-px bg-border-soft sm:my-6" />}
            </div>
          ))}
        </div>

        {/* Footer acknowledgement */}
        <div className="mt-7 sm:mt-8">{footerNote}</div>
      </div>
    </main>
  );
}