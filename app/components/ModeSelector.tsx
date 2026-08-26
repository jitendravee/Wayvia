"use client";

import {BusFront, Plane, Shuffle, TrainFront, Waypoints } from "lucide-react";
import type { TransportFilter } from "./filters";
import { TRANSPORT_OPTIONS } from "./filters";

const ICON: Record<TransportFilter, React.ComponentType<{ size?: number }>> = {
  any: Waypoints,
  train: TrainFront,
  bus: BusFront,
  flight: Plane,
  mixed: Shuffle,
};

/**
 * Which mode(s) of transport to show. Purely a client-side view over
 * results the backend already fetched for every mode — same principle as
 * the rest of the filters, since a person switching this tab shouldn't
 * have to wait on a new network round trip.
 */
export default function ModeSelector({ value, onChange }: { value: TransportFilter; onChange: (v: TransportFilter) => void }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {TRANSPORT_OPTIONS.map((m) => {
        const Icon = ICON[m.value];
        const active = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            className={
              active
                ? "flex items-center gap-1.5 rounded-full border border-violet bg-violet px-4 py-1.5 font-display text-sm font-semibold text-white"
                : "flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-4 py-1.5 font-display text-sm text-ink-muted transition-colors hover:border-violet-ring hover:text-ink"
            }
          >
            <Icon size={14} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}