/**
 * The canonical Place model. This is the "node" in the architecture:
 *
 *   PLACES → GRAPH → TRANSPORT PROVIDERS → JOURNEYS
 *
 * A Place is a real geographic city/town — "Pune", "Mumbai", "Adilabad" —
 * not a station, not a bus stand, not an airport. Those are transport
 * *locations* that live underneath a Place (see below). The train API
 * doesn't define which places exist; the bus API doesn't either. This file
 * defines what a place IS, independent of any transport provider.
 */
/** Every transport mode this place currently has at least one resolvable location for. Empty means the place is known to exist (e.g. resolved via geocoding) but no provider has confirmed a boardable location there yet. */
export function placeModes(place) {
    const modes = [];
    if (place.railway && place.railway.stations.length > 0)
        modes.push("train");
    if (place.bus && place.bus.locations.length > 0)
        modes.push("bus");
    if (place.flight && place.flight.airports.length > 0)
        modes.push("flight");
    return modes;
}
