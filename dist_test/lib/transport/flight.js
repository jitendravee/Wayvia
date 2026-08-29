import { mockFlightProvider } from "../providers/mockFlight";
/** IATA code if this place has a resolved airport; otherwise falls back to the place name (mockFlightProvider generates deterministic mock legs from any two stop-code-shaped strings, so this still works — swap this for a real airport-code requirement once a real flight API replaces the mock). */
function flightQueryText(place) {
    return place.flight?.airports[0]?.code ?? place.name;
}
/**
 * `TransportProvider.searchConnections` for flight — thin adapter over
 * `mockFlightProvider` (lib/providers/mockFlight.ts). Swapping this for a
 * real flight API later only means changing this one file's import and
 * `flightQueryText`, per lib/providers/registry.ts's own existing note
 * about how mode swaps are meant to work — nothing in
 * lib/journey/graphSearch.ts or lib/transport/registry.ts needs to change.
 */
export const flightProvider = {
    mode: "flight",
    async searchConnections(from, to, date) {
        return mockFlightProvider.search(flightQueryText(from), flightQueryText(to), date);
    },
};
