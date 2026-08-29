import { FileCheck2, Lock, Sparkle } from "lucide-react";

export type LegalHeaderVariant = "privacy" | "terms";

const VARIANT_ICON = {
  privacy: Lock,
  terms: FileCheck2,
} as const;

/** Small illustrated badge for the top-right of a legal page header — hidden on the smallest screens so it never crowds the title. */
export function LegalHeaderIllustration({ variant }: { variant: LegalHeaderVariant }) {
  const Icon = VARIANT_ICON[variant];

  return (
    <div className="relative hidden h-[72px] w-[72px] shrink-0 xs:block sm:h-[84px] sm:w-[84px]">
      <Sparkle className="absolute -left-2 top-0 h-3 w-3 text-violet/40" />
      <Sparkle className="absolute -right-1 top-6 h-2.5 w-2.5 text-violet/30" />
      <Sparkle className="absolute -bottom-1 left-3 h-2 w-2 text-violet/30" />

      <div className="flex h-full w-full items-center justify-center rounded-3xl bg-gradient-to-br from-violet-soft to-white shadow-sm shadow-violet-soft">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet to-violet-dark text-white shadow-md shadow-violet-soft sm:h-12 sm:w-12">
          <Icon size={20} strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}