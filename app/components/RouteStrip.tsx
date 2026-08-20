import type { AnnotatedLeg } from "../types";
import { signalFor, SIGNAL_DOT, SIGNAL_LINE, SIGNAL_TEXT, SIGNAL_LABEL } from "./status";

export default function RouteStrip({ legs }: { legs: AnnotatedLeg[] }) {
  const nodes: { code: string; time: string }[] = [];
  legs.forEach((leg, i) => {
    if (i === 0) nodes.push({ code: leg.from, time: leg.departure });
    nodes.push({ code: leg.to, time: leg.arrival });
  });

  return (
    <div className="my-4 flex items-start overflow-x-auto pb-1">
      {nodes.map((node, i) => {
        const leg = legs[i];
        const signal = leg ? signalFor(leg.availability?.category) : "unknown";
        // Interior nodes (not the origin, not the final destination) are the
        // via-junctions this journey changes trains at — flagged distinctly so a
        // 3-junction (4-leg) strip still reads clearly at a glance, not just as
        // "a lot of dots".
        const isJunction = i > 0 && i < nodes.length - 1;
        return (
          <div className="contents" key={`${node.code}-${i}`}>
            <div className="flex min-w-[64px] flex-col items-center">
              <div
                className={`h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                  i === 0 ? "bg-ink-dim" : SIGNAL_DOT[signalFor(legs[i - 1]?.availability?.category)]
                }`}
              />
              <div className="mt-1.5 font-mono text-[13px] font-semibold text-ink">{node.code}</div>
              <div className="font-mono text-[11px] text-ink-dim">{node.time}</div>
              {isJunction && (
                <div className="mt-0.5 rounded bg-surface-alt px-1 py-[1px] font-mono text-[9px] uppercase tracking-wide text-ink-dim">
                  junction
                </div>
              )}
            </div>

            {i < legs.length && (
              <div className="flex min-w-[92px] flex-1 flex-col items-center pt-[5px]">
                <div className={`h-[3px] w-full rounded-full ${SIGNAL_LINE[signal]}`} />
                <div className={`mt-1.5 whitespace-nowrap text-center font-mono text-[10px] font-medium ${SIGNAL_TEXT[signal]}`}>
                  #{leg.trainNo} · {SIGNAL_LABEL[leg.availability?.category ?? "UNKNOWN"]}
                  {leg.availability?.count != null ? ` (${leg.availability.count})` : ""}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
