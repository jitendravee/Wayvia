import type { Leg } from "../graph/types";
import type { ModeProvider } from "./types";
import { ixigoGetBusList } from "./ixigo/client";
import { resolveIxigoCity, IxigoCityMatch } from "./ixigo/cityResolve";
import { mapIxigoServiceToLeg } from "./ixigo/mapResponse";

function isoToDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

/**
 * ⚠️ UNCERTAIN — the exact request body GetBusList expects was never
 * captured, only its response was (see ixigo/types.ts). These field names
 * are a best-effort guess based on standard patterns for this kind of API
 * and on what the response itself echoes back (source/destination name and
 * id-shaped fields). If `ixigoBusProvider.search()` comes back empty for a
 * route you know ixigo actually serves, open ixigo.com/buses in a browser,
 * search that same route, and copy the real POST body from DevTools'
 * Network tab for the GetBusList request — then this is the ONLY function
 * that needs to change; nothing else in the pipeline does.
 */
function buildBusListRequest(src: IxigoCityMatch, dst: IxigoCityMatch, date: string) {
  const doj = isoToDDMMYYYY(date);
  return {
    sourceId: src.id,
    destinationId: dst.id,
    source: src.label,
    destination: dst.label,
    doj,
    date: doj,
  };
}

/**
 * Real ixigo-backed bus search, replacing the old mockBusProvider. Same
 * ModeProvider contract as every other mode (see lib/providers/types.ts):
 * given two station codes and a date, return whatever direct bus legs
 * exist — no via-junction reasoning here, that's what
 * lib/graph/discoverMultimodal.ts's hub-crossing layer is for.
 *
 * Fails soft everywhere: an unresolvable city, an ixigo outage, or a
 * malformed response all just mean "no buses found for this pair" ([]),
 * never an exception that would take down the rest of a multimodal search.
 */
export const ixigoBusProvider: ModeProvider = {
  mode: "bus",
  async search(from, to, date): Promise<Leg[]> {
    const [src, dst] = await Promise.all([resolveIxigoCity(from), resolveIxigoCity(to)]);
    if (!src || !dst) return []; // no ixigo coverage for one (or both) ends of this pair

    let raw;
    try {
      raw = await ixigoGetBusList(buildBusListRequest(src, dst, date));
    } catch (err) {
      console.error(`ixigoBusProvider.search(${from} -> ${to}) failed:`, err);
      return [];
    }

    const services = raw.serviceDetailsList ?? [];
    const legs: Leg[] = [];
    for (const item of services) {
      const leg = mapIxigoServiceToLeg(item, from, to, date);
      if (leg) legs.push(leg);
    }
    return legs;
  },
};