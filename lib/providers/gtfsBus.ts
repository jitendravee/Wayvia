import type { Leg } from "../graph/types";
import type { ModeProvider } from "./types";
import { searchGtfsBusConnections } from "../gtfs/search";

/**
 * GTFS-static-backed bus search — the free, open-data layer of the
 * multi-layer bus provider (see lib/transport/bus.ts for how this gets
 * merged with the ixigo layer). Same ModeProvider contract as every other
 * mode: given place-name text (not a station code — see
 * lib/transport/bus.ts's busQueryText) and a date, return whatever direct
 * trips exist.
 *
 * Fails soft everywhere — see lib/gtfs/search.ts's searchGtfsBusConnections,
 * which never throws, same contract ixigoBusProvider follows.
 */
export const gtfsBusProvider: ModeProvider = {
  mode: "bus",
  async search(from, to, date): Promise<Leg[]> {
    return searchGtfsBusConnections(from, to, date);
  },
};
