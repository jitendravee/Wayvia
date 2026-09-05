import type { ModeProvider } from "./types";
import { gtfsBusProvider } from "./gtfsBus";
import { ixigoBusProvider } from "./ixigoBus";

/**
 * One bus data source in the multi-layer search (see lib/transport/bus.ts
 * for how these get combined). Adding a new provider — another scraped
 * operator, a future state/interstate GTFS feed, anything implementing
 * ModeProvider — is just adding one entry here; the search/merge code in
 * lib/transport/bus.ts iterates this array generically and doesn't need
 * to change no matter how many entries it has.
 */
export interface BusProviderEntry {
  id: string;
  /** Shown in logs and, indirectly, in each leg's trainName (via the underlying provider's own leg-building — see lib/gtfs/toLeg.ts and lib/providers/ixigo/mapResponse.ts). */
  label: string;
  provider: ModeProvider;
  /**
   * Lower wins when two providers report what looks like the same
   * physical bus (see lib/transport/bus.ts's mergeMultiSourceBusLegs).
   * ixigo carries live seat availability, fare, and a booking link, none
   * of which a schedule-only GTFS source can have — so it should always
   * win a duplicate. A future second live-booking provider would sit at
   * the same priority tier as ixigo (0), not above or below it, unless
   * it's demonstrably more reliable.
   */
  priority: number;
}

export const BUS_PROVIDERS: BusProviderEntry[] = [
  { id: "ixigo", label: "ixigo", provider: ixigoBusProvider, priority: 0 },
  { id: "gtfs", label: "GTFS (open data)", provider: gtfsBusProvider, priority: 1 },
];
