import { ixigoBusProvider } from "./ixigoBus";
import { mockFlightProvider } from "./mockFlight";
/**
 * Train isn't here — it's handled by lib/graph/discover.ts's own richer
 * hub-search pipeline, not this direct-only provider interface.
 *
 * bus: real ixigo-backed search (lib/providers/ixigoBus.ts). Flight is
 * still mock — swap it the same way once a real flight API is wired up,
 * one mode at a time, with zero changes anywhere else in the
 * search/rank/filter pipeline.
 */
export const MODE_PROVIDERS = {
    bus: ixigoBusProvider,
    flight: mockFlightProvider,
};
export const ALL_MODES = ["train", "bus", "flight"];
