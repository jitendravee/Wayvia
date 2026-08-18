"use client";

/**
 * Berth-type diagram for a coach. Indian Railways sleeper (SL) and AC
 * 3-tier (3A) coaches both repeat the same 8-berth bay: seats 1-3 are
 * Lower/Middle/Upper against the window wall, 4-6 mirror that against the
 * aisle wall, and 7-8 are the two side berths (Side Lower / Side Upper).
 * This was confirmed against erail.in's own SeatMapSL.html template
 * (72-berth SL coach = 9 repeats of that bay); 3A coaches use the identical
 * pattern over 64 berths (8 bays), just without the side-middle berth SL
 * doesn't have either. 2A/1A use a different (4-berth + 2 side, no middle)
 * layout that isn't reproduced here — those classes fall back to a plain
 * list rather than a guessed diagram.
 */

type BerthType = "L" | "M" | "U" | "S" | "C";

const BERTH_LABEL: Record<BerthType, string> = {
  L: "Lower",
  M: "Middle",
  U: "Upper",
  S: "Side Lower",
  C: "Side Upper",
};

const BERTH_STYLE: Record<BerthType, string> = {
  L: "bg-signal-green-soft text-signal-green border-signal-green/30",
  M: "bg-signal-amber-soft text-signal-amber border-signal-amber/30",
  U: "bg-violet-soft text-violet-dark border-violet/30",
  S: "bg-surface-alt text-ink-muted border-border",
  C: "bg-surface-alt text-ink-muted border-border",
};

function berthTypeForSeat(seatNo: number): BerthType {
  const posInBay = ((seatNo - 1) % 8) + 1; // 1..8
  const map: Record<number, BerthType> = { 1: "L", 2: "M", 3: "U", 4: "L", 5: "M", 6: "U", 7: "S", 8: "C" };
  return map[posInBay];
}

const SUPPORTED = new Set(["SL", "3A", "3E"]);

export default function SeatMap({
  coachClass,
  totalBerths,
  highlightSeat,
}: {
  coachClass: string;
  totalBerths?: number;
  highlightSeat?: number | null;
}) {
  const normalized = coachClass.toUpperCase();
  if (!SUPPORTED.has(normalized)) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface-alt px-4 py-3 font-mono text-[12px] text-ink-dim">
        Seat diagram isn&rsquo;t available for {coachClass} coaches yet — only SL and 3A bay layouts are supported right
        now.
      </div>
    );
  }

  const seats = totalBerths ?? (normalized === "SL" ? 72 : 64);
  const bays = Math.ceil(seats / 8);

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-2.5">
        {Array.from({ length: bays }).map((_, bayIdx) => {
          const base = bayIdx * 8;
          const windowSeats = [1, 2, 3].map((n) => base + n).filter((n) => n <= seats);
          const aisleSeats = [4, 5, 6].map((n) => base + n).filter((n) => n <= seats);
          const sideSeats = [7, 8].map((n) => base + n).filter((n) => n <= seats);

          return (
            <div key={bayIdx} className="flex gap-1 rounded-lg border border-border-soft bg-surface-alt/60 p-1.5">
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  {windowSeats.map((n) => (
                    <Seat key={n} n={n} type={berthTypeForSeat(n)} active={n === highlightSeat} />
                  ))}
                </div>
                <div className="flex gap-1">
                  {aisleSeats.map((n) => (
                    <Seat key={n} n={n} type={berthTypeForSeat(n)} active={n === highlightSeat} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 justify-between">
                {sideSeats.map((n) => (
                  <Seat key={n} n={n} type={berthTypeForSeat(n)} active={n === highlightSeat} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2.5">
        {(Object.keys(BERTH_LABEL) as BerthType[]).map((t) => (
          <span key={t} className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[10px] ${BERTH_STYLE[t]}`}>
            <span className="font-semibold">{t}</span>
            {BERTH_LABEL[t]}
          </span>
        ))}
      </div>
    </div>
  );
}

function Seat({ n, type, active }: { n: number; type: BerthType; active?: boolean }) {
  return (
    <div
      title={`Seat ${n} · ${BERTH_LABEL[type]}`}
      className={`flex h-9 w-9 flex-col items-center justify-center rounded-md border font-mono text-[10px] leading-none ${BERTH_STYLE[type]} ${
        active ? "ring-2 ring-violet ring-offset-1 scale-105 font-bold" : ""
      }`}
    >
      <span className="font-semibold">{n}</span>
      <span className="text-[8px]">{type}</span>
    </div>
  );
}
