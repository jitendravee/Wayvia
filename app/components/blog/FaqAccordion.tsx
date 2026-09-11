import React from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqAccordion({ faqs }: { faqs?: FaqItem[] }) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="mt-12 rounded-2xl border border-border bg-gradient-to-b from-surface to-surface-alt/50 p-6 sm:p-8">
      <div className="flex items-center gap-2.5 text-violet">
        <HelpCircle size={20} className="shrink-0" />
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">
          Frequently Asked Questions
        </h2>
      </div>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
        Verified answers to the most common questions about this topic.
      </p>

      <div className="mt-6 flex flex-col divide-y divide-border/70">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="group py-4 first:pt-0 last:pb-0 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-[15px] font-medium text-ink transition-colors hover:text-violet">
              <span>{faq.question}</span>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-alt transition-transform duration-200 group-open:rotate-180">
                <ChevronDown size={14} className="text-ink-muted" />
              </span>
            </summary>
            <div className="mt-3 pr-4 font-sans text-[14px] leading-relaxed text-ink-muted">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
