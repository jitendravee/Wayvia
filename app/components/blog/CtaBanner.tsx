import Link from "next/link";
import { MapPin, TrainFront, Bus, Flag, ArrowRight } from "lucide-react";

export default function CtaBanner({ variant = "horizontal" }: { variant?: "horizontal" | "vertical" }) {
  const vertical = variant === "vertical";

  return (
    <div
      className={`overflow-hidden rounded-2xl bg-gradient-to-br from-violet to-violet-dark text-white ${
        vertical ? "flex flex-col gap-4 p-6" : "flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      }`}
    >
      <div className={vertical ? "" : "max-w-md"}>
        <h3 className={`font-display font-semibold leading-snug ${vertical ? "text-[19px]" : "text-[22px] sm:text-[26px]"}`}>
          Your destination is fixed. Your route doesn&rsquo;t have to be.
        </h3>
        <p className={`mt-2 font-sans leading-relaxed text-white/80 ${vertical ? "text-[13px]" : "text-[14px]"}`}>
          Wayvia helps you discover better ways to get where you need to go.
        </p>
      </div>

      <div className={`flex items-center gap-4 ${vertical ? "flex-col items-start gap-4" : ""}`}>
        <Link
          href="/journey-planner"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 font-display text-[13.5px] font-semibold text-violet-dark!  shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Find a Way
          <span aria-hidden><ArrowRight /></span>
        </Link>

        <div className="flex items-center gap-2 text-white/70">
          <MapPin size={16} />
          <span className="h-px w-4 bg-white/40" />
          <TrainFront size={16} />
          <span className="h-px w-4 bg-white/40" />
          <Bus size={16} />
          <span className="h-px w-4 bg-white/40" />
          <Flag size={16} />
        </div>
      </div>
    </div>
  );
}
