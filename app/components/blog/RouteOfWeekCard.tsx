import Link from "next/link";
import { ArrowRight, Bus, Landmark, Palmtree, Plane, TrainFront, Users, Wallet } from "lucide-react";
import type { RouteOfWeek } from "@/lib/blog/posts";

const MODE_ICON = { train: TrainFront, bus: Bus, flight: Plane };

export default function RouteOfWeekCard({ route }: { route: RouteOfWeek }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-violet-ring bg-gradient-to-br from-violet-soft/70 via-violet-soft/40 to-white p-6 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-violet">Route of the week</span>
          <h3 className="mt-1.5 font-display text-[24px] font-semibold text-ink sm:text-[28px]">{route.title}</h3>
          <p className="mt-2 max-w-md font-sans text-[13.5px] leading-relaxed text-ink-muted">{route.description}</p>

          <div className="mt-4 flex items-center gap-5">
            <span className="flex items-center gap-1.5 font-mono text-[13px] text-ink">
              <Users size={14} className="text-violet" />
              {route.waysFound} ways found
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[13px] text-ink">
              <Wallet size={14} className="text-violet" />
              {route.bestValue} best value
            </span>
          </div>

          <Link
            href={route.href}
            className="mt-5 flex w-fit items-center gap-1.5 rounded-full bg-violet px-5 py-2.5 font-display text-[13.5px] font-semibold text-white! shadow-sm shadow-violet-soft transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Explore this route
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Step chain */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          {route.steps.map((step, i) => {
            const Icon = step.mode ? MODE_ICON[step.mode] : Landmark;
            const isLast = i === route.steps.length - 1;
            return (
              <div key={step.code} className="flex items-center gap-2">
                {i > 0 && (
                  <div className="flex flex-col items-center gap-0.5 px-1">
                    <span className="h-px w-6 border-t-2 border-dotted border-violet/50 sm:w-8" />
                    {step.legDuration && <span className="font-mono text-[10px] text-ink-dim">{step.legDuration}</span>}
                  </div>
                )}
                <div className="flex w-[92px] flex-col items-center gap-1.5 rounded-xl border border-border bg-white px-2 py-3 text-center shadow-sm">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isLast ? "bg-violet text-white" : "bg-violet-soft text-violet-dark"
                    }`}
                  >
                    {isLast ? <Palmtree size={15} /> : <Icon size={15} />}
                  </span>
                  <span className="font-display text-[11.5px] font-semibold leading-tight text-ink">{step.name}</span>
                  <span className="font-mono text-[9.5px] text-ink-dim">{step.code}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
