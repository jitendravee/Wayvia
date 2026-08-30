import type { Mode } from "../graph/types";
import type { ModeProvider } from "./types";
import { ixigoBusProvider } from "./ixigoBus";
import { ixigoFlightProvider } from "./ixigo/flight";

/**
 * Train isn't here — it's handled by lib/graph/discover.ts's own richer
 * hub-search pipeline, not this direct-only provider interface.
 *
 * bus: real ixigo-backed search (lib/providers/ixigoBus.ts).
 * flight: real ixigo-backed search (lib/providers/ixigo/flight.ts).
 */
export const MODE_PROVIDERS: Partial<Record<Mode, ModeProvider>> = {
  bus: ixigoBusProvider,
  flight: ixigoFlightProvider,
};

export const ALL_MODES: Mode[] = ["train", "bus", "flight"];
