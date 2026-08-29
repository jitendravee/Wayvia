import { ixigoBusProvider } from "../providers/ixigoBus";
/**
 * The text ixigo's own city resolution (lib/providers/ixigo/cityResolve.ts)
 * should search on for this place. A resolved bus location's name if we
 * have one; otherwise the place's own display name — resolveIxigoCity's
 * text fallback already handles arbitrary city text directly, so this
 * works correctly even for a place ixigo was never explicitly asked about
 * before.
 */
function busQueryText(place) {
    return place.bus?.locations[0]?.name ?? place.name;
}
/**
 * `TransportProvider.searchConnections` for bus — a thin adapter over the
 * existing ixigo-backed `ixigoBusProvider` (lib/providers/ixigoBus.ts),
 * which is untouched and fully reused here, per the "do not duplicate the
 * Ixigo implementation, adapt it into the provider abstraction"
 * instruction.
 */
export const busProvider = {
    mode: "bus",
    async searchConnections(from, to, date) {
        return ixigoBusProvider.search(busQueryText(from), busQueryText(to), date);
    },
};
