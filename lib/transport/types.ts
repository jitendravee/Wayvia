import type { Mode, Leg } from "../graph/types";
import type { Place } from "../places/model";

/**
 * The provider-neutral contract every transport mode implements. This is
 * the "TransportProvider" from the architecture doc — the graph/search
 * layer only ever calls `searchConnections`, never eRail or ixigo
 * directly.
 *
 * Reuses the existing `Leg` type (lib/graph/types.ts) as the connection
 * representation rather than inventing a parallel `TransportConnection`
 * shape — `Leg` already IS provider-neutral (mode, from/to codes,
 * departure/arrival, depAbsMin/arrAbsMin, fare, source) and is deeply
 * threaded through lib/availability.ts, lib/score.ts, and every frontend
 * journey component. A second parallel type would just be a lossy copy
 * that needs constant translation at the boundary; there's no boundary
 * left to draw one at.
 */
export interface TransportProvider {
  mode: Mode;
  /** Every direct connection from `from` to `to` on `date` — no via-hub reasoning here, that's lib/journey/graphSearch.ts's job. */
  searchConnections(from: Place, to: Place, date: string, opts: { transferBufferMin?: number; maxTransferMin?: number }): Promise<Leg[]>;
}
