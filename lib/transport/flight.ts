import { ixigoFlightProvider } from "../providers/ixigo/flight";
import type { Place } from "../places/model";
import type { TransportProvider } from "./types";

/** IATA code if this place has a resolved airport; otherwise falls back to the place name. */
function flightQueryText(place: Place): string {
  return place.flight?.airports[0]?.code ?? place.name;
}

/**
 * `TransportProvider.searchConnections` for flight — thin adapter over
 * the real ixigoFlightProvider. Swapping this for a different flight API
 * later only means changing this one file's import and `flightQueryText`,
 * per lib/providers/registry.ts's own existing note about how mode swaps
 * are meant to work — nothing in lib/journey/graphSearch.ts or
 * lib/transport/registry.ts needs to change.
 */
export const flightProvider: TransportProvider = {
  mode: "flight",
  async searchConnections(from, to, date) {
    return ixigoFlightProvider.search(flightQueryText(from), flightQueryText(to), date);
  },
};
