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

export interface RailwayLocation {
  /** erail.in station code, e.g. "PUNE", "BCT". */
  code: string;
  /** Raw station name as erail knows it, e.g. "Pune Junction" — kept verbatim (not city-cleaned) since it's still needed to disambiguate multiple stations serving the same place. */
  name: string;
}

export interface BusLocation {
  /** The text ixigo's own autocompleter matches on — for most places this is just the place name itself, since lib/providers/ixigo/cityResolve.ts already resolves arbitrary city text to an ixigo city id at search time. Kept as a distinct field (not reusing Place.name) so a place whose bus-searchable name differs from its display name (rare, but possible) still works. */
  name: string;
  provider: "ixigo";
}

export interface AirportLocation {
  /** IATA code, e.g. "PNQ". Optional — most places don't have one. */
  code: string;
  name: string;
}

export type PlaceType = "city" | "town" | "village" | "region";

export interface Place {
  /** Stable identifier — a normalized slug of the place's canonical name (see resolver.ts). Two different spellings/provider-names of the same city must resolve to the same id. */
  id: string;

  name: string;
  normalizedName: string;

  latitude: number;
  longitude: number;
  /** True only when latitude/longitude came from an actual coordinate source (DEFAULT_HUBS seed or a successful geocode) — false for the (0,0) sentinel used when no coordinate source matched, so geographic scoring can tell "unknown location" apart from "actually near the equator/prime meridian". */
  hasCoords: boolean;

  country?: string;
  state?: string;

  type: PlaceType;

  railway?: { stations: RailwayLocation[] };
  bus?: { locations: BusLocation[] };
  flight?: { airports: AirportLocation[] };

  /**
   * "Important place for journey exploration" — NOT "has a train station".
   * A place earns this by being in the curated geo seed list (which was
   * built around major-city/junction importance, not railway-specific
   * significance) — see lib/places/resolver.ts's placeFromHubSeed. Plenty
   * of real, well-connected cities aren't in that curated list and simply
   * aren't hubs; that's fine, the place graph still routes through them
   * via provider-returned edges, they just aren't preferentially explored
   * as a transfer point the way hubs are.
   */
  isHub: boolean;
}

/** Every transport mode this place currently has at least one resolvable location for. Empty means the place is known to exist (e.g. resolved via geocoding) but no provider has confirmed a boardable location there yet. */
export function placeModes(place: Place): Array<"train" | "bus" | "flight"> {
  const modes: Array<"train" | "bus" | "flight"> = [];
  if (place.railway && place.railway.stations.length > 0) modes.push("train");
  if (place.bus && place.bus.locations.length > 0) modes.push("bus");
  if (place.flight && place.flight.airports.length > 0) modes.push("flight");
  return modes;
}
