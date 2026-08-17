import type { Narrative } from "../types";

export default function NarrativeBanner({ narrative, tone }: { narrative: Narrative; tone: "clear" | "empty" | "info" }) {
  const border = tone === "empty" ? "border-l-flap" : tone === "info" ? "border-l-board-line" : "border-l-signal-green";
  const ring = tone === "empty" ? "border-flap-dim/50" : tone === "info" ? "border-board-line" : "border-signal-green/30";

  return (
    <div className={`mb-5 rounded-md border ${ring} border-l-4 ${border} bg-board-raised/60 px-5 py-4`}>
      <div className="font-display text-[15px] font-semibold text-ink">{narrative.headline}</div>
      <div className="mt-1 text-[13px] leading-relaxed text-ink-muted">{narrative.detail}</div>
    </div>
  );
}
