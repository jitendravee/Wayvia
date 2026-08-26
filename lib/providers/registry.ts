import type { Mode } from "../graph/types";
import type { ModeProvider } from "./types";
import { mockBusProvider } from "./mockBus";
import { mockFlightProvider } from "./mockFlight";

/**
 * Train isn't here — it's handled by lib/graph/discover.ts's own richer
 * hub-search pipeline, not this direct-only provider interface. Everything
 * in this map is currently mock data; swap a value here for a real
 * provider (same ModeProvider shape) as real APIs get wired up, one mode
 * at a time, with zero changes anywhere else in the search/rank/filter
 * pipeline.
 */
export const MODE_PROVIDERS: Partial<Record<Mode, ModeProvider>> = {
  bus: mockBusProvider,
  flight: mockFlightProvider,
};

export const ALL_MODES: Mode[] = ["train", "bus", "flight"];