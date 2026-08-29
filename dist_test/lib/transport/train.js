import { directSearch, discoverJourneys } from "../graph/discover";
/**
 * The station this place's train searches should actually use. A Place
 * can have several railway stations (Mumbai has BCT/CSMT/LTT/...) — for
 * now the first one resolved is used, same single-station-per-search
 * assumption the pre-refactor code already made (the person picks a
 * specific station from the search box, same as before). Multi-station
 * fan-out per Place is a real future improvement, not implemented here to
 * keep the blast radius on the already-solid train pipeline at zero.
 */
function primaryStationCode(place) {
    return place.railway?.stations[0]?.code ?? null;
}
/**
 * `TransportProvider.searchConnections` for train — a thin adapter over
 * the existing `directSearch`. This is deliberately NOT a rewrite of the
 * eRail integration: lib/graph/discover.ts, lib/erail/* are untouched and
 * fully reused, per the "do not duplicate the eRail implementation, adapt
 * it into the provider abstraction" instruction.
 */
export const trainProvider = {
    mode: "train",
    async searchConnections(from, to, date, opts) {
        const fromCode = primaryStationCode(from);
        const toCode = primaryStationCode(to);
        if (!fromCode || !toCode)
            return [];
        const candidates = await directSearch(fromCode, toCode, { date, ...opts });
        return candidates.map((c) => ({ ...c.legs[0], mode: "train", source: c.legs[0].source ?? "live" }));
    },
};
/**
 * Train's OWN multi-hop discovery — the tiered live-directory + dynamic +
 * two/three-hub engine in lib/graph/discover.ts. Exposed separately (not
 * through the generic TransportProvider.searchConnections contract, which
 * only does point-to-point edges) because it already explores far deeper
 * and more cheaply for pure-train journeys than the generic Place-graph
 * BFS in lib/journey/graphSearch.ts could — re-deriving that logic
 * generically would be strictly worse for the one mode that already has a
 * mature implementation. lib/journey/searchService.ts calls this directly
 * for train-train chains, and leaves genuinely cross-mode chains to the
 * generic engine.
 */
export async function trainMultiHopSearch(from, to, opts) {
    const fromCode = primaryStationCode(from);
    const toCode = primaryStationCode(to);
    if (!fromCode || !toCode)
        return null;
    return discoverJourneys(fromCode, toCode, opts);
}
