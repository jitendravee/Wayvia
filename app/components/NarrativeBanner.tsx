import type { Narrative } from "../types";

export default function NarrativeBanner({ narrative, tone }: { narrative: Narrative; tone: "clear" | "empty" | "info" }) {
  const border = tone === "empty" ? "border-l-violet" : tone === "info" ? "border-l-border" : "border-l-signal-green";
  const ring = tone === "empty" ? "border-violet-ring" : tone === "info" ? "border-border" : "border-signal-green/30";
  const bg = tone === "empty" ? "bg-violet-soft/50" : tone === "info" ? "bg-surface-alt" : "bg-signal-green-soft/50";

  return (
    <div className={`mb-5 rounded-lg border ${ring} border-l-4 ${border} ${bg} px-5 py-4`}>
      <div className="font-display text-[15px] font-semibold text-ink">{narrative.headline}</div>
      <div className="mt-1 text-[13px] leading-relaxed text-ink-muted">{narrative.detail}</div>
    </div>
  );
}
