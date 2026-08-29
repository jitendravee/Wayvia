import { getRoute } from "../erail/client";
import { registerDiscoveredStations } from "../erail/stationDirectory";
/**
 * Given a handful of real train numbers known to depart `from`, fetches
 * each one's actual route and returns every real intermediate stop as a
 * scored hub candidate for a follow-up betweenStations() pass toward `to`.
 * Also registers every stop it sees with the live station directory, so
 * autocomplete and future searches benefit even if this particular journey
 * doesn't pan out.
 */
export async function discoverHubsFromRoutes(from, to, seedTrainNos, opts = {}) {
    const maxSeedTrains = opts.maxSeedTrains ?? 5;
    const maxStopsPerTrain = opts.maxStopsPerTrain ?? 8;
    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();
    const seeds = Array.from(new Set(seedTrainNos)).slice(0, maxSeedTrains);
    if (seeds.length === 0)
        return [];
    const routeResults = await Promise.all(seeds.map(async (trainNo) => {
        try {
            const result = await getRoute(trainNo);
            if (!result || !result.success)
                return null;
            return { trainNo, stops: result.data };
        }
        catch {
            return null;
        }
    }));
    const byCode = new Map();
    for (const entry of routeResults) {
        if (!entry)
            continue;
        const { trainNo, stops } = entry;
        if (!Array.isArray(stops) || stops.length === 0)
            continue;
        // Feed the live directory regardless of whether this train ends up useful for this search.
        registerDiscoveredStations(stops.map((s) => ({ code: s.source_stn_code, name: s.source_stn_name })));
        const fromIdx = stops.findIndex((s) => s.source_stn_code?.toUpperCase() === fromCode);
        if (fromIdx === -1)
            continue; // this train's route doesn't actually touch our origin under this code — skip
        const toIdx = stops.findIndex((s) => s.source_stn_code?.toUpperCase() === toCode);
        // If the train's own route already reaches `to`, that's really a direct-train case, not a hub —
        // let the normal direct search surface it; nothing extra to learn here as a *hub* candidate.
        const stopsAfterFrom = stops.slice(fromIdx + 1, toIdx === -1 ? undefined : toIdx);
        let taken = 0;
        for (let i = 0; i < stopsAfterFrom.length && taken < maxStopsPerTrain; i++) {
            const stop = stopsAfterFrom[i];
            const code = stop.source_stn_code?.toUpperCase();
            if (!code || code === fromCode || code === toCode)
                continue;
            // Heuristic: a stop roughly in the first half of the remaining route is more likely to leave
            // enough onward network reach to still connect toward `to`; taper relevance toward the tail end.
            const positionRatio = stopsAfterFrom.length > 1 ? i / (stopsAfterFrom.length - 1) : 0;
            const relevance = Math.max(0.25, 0.85 - positionRatio * 0.5);
            const existing = byCode.get(code);
            if (!existing || relevance > existing.relevance) {
                byCode.set(code, {
                    code,
                    name: stop.source_stn_name || code,
                    lat: 0,
                    lon: 0,
                    relevance,
                    detourRatio: null,
                    source: "route-topology",
                    viaTrainNo: trainNo,
                });
            }
            taken++;
        }
    }
    return Array.from(byCode.values()).sort((a, b) => b.relevance - a.relevance);
}
