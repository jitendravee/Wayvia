import type { Mode } from "../graph/types";

/**
 * The one canonical filter model. Every constraint here is applied DURING
 * graph exploration (lib/journey/graphSearch.ts), not as a post-hoc filter
 * over an already-fully-searched result set — see that file's pruning
 * calls for exactly where each field below gets enforced.
 */
export interface SearchFilters {
  /** Which providers get queried at all. Train-only means the bus/flight providers are never called — see lib/journey/searchService.ts. */
  modes: Mode[];

  /** Reject any (partial or complete) journey whose running total fare would exceed this, the moment a leg pushes it over — not after the full journey is built. Legs with unknown fare (fare === null) don't get pruned on this alone, since a partial-unknown total could still end up under budget. */
  maxBudget?: number;

  /** Minutes-since-midnight window the FIRST leg's departure must fall within. */
  departureFromMin?: number;
  departureToMin?: number;

  /** Minutes-since-midnight window the LAST leg's arrival must fall within. */
  arrivalFromMin?: number;
  arrivalToMin?: number;

  maxDurationMinutes?: number;

  /** 0 = direct only. 1 = one transfer (2 legs). 2 = two transfers (3 legs). Bounded at 2 regardless of a higher value — see lib/journey/graphSearch.ts's MAX_CONNECTIONS_CAP for why. */
  maxConnections: number;

  /** true = a leg with no confirmed availability (AvlStatusCategory other than "AVAILABLE") is excluded rather than just deprioritized. Left false by default since lib/score.ts already deprioritizes non-confirmed journeys without hiding them outright — hard-excluding is opt-in. */
  availabilityRequired?: boolean;

  /** Minutes required between one leg's arrival and the next leg's departure. Conservative and mode-pair-independent for this first implementation (see lib/journey/connectionValidator.ts) rather than modeling exact distance between e.g. a specific railway station and a specific bus stand within the same Place — that's a real future improvement, not implemented here. */
  transferBufferMin: number;
}

export const DEFAULT_TRANSFER_BUFFER_MIN = 30;
