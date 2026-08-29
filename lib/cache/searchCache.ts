import type { JourneyCandidate, Mode } from "@/lib/graph/types";
import type { GraphStats } from "@/app/types";
import type { PartialCoverage } from "@/lib/graph/discover";
import type { ConnectionSuggestion } from "@/app/types";

/**
 * The result of the candidate generation phase (before availability annotation,
 * filtering, ranking, and pagination). This is what we cache to avoid
 * repeating the expensive graph search and provider discovery.
 */
export interface CandidateGenerationResult {
  direct: JourneyCandidate[];
  viaHub: JourneyCandidate[];
  viaTwoHub: JourneyCandidate[];
  viaThreeHub: JourneyCandidate[];
  partial: PartialCoverage[];
  graph: GraphStats;
  suggestion: ConnectionSuggestion | null;
  modesAvailable: Mode[];
  candidatesByMode: Partial<Record<Mode, number>>;
}

/**
 * Interface for a search result cache. Designed to be swappable (e.g.,
 * local memory -> Redis) without changing the search service.
 */
export interface SearchCache<T = CandidateGenerationResult> {
  /**
   * Get a cached candidate generation result by key.
   * Returns null if not found or expired.
   */
  get(key: string): Promise<T | null>;

  /**
   * Store a candidate generation result in the cache.
   * @param key The cache key
   * @param value The candidate generation result to cache
   * @param ttlSeconds Time to live in seconds (e.g., 20 * 60 for 20 minutes)
   */
  set(key: string, value: T, ttlSeconds: number): Promise<void>;

  /**
   * Delete a key from the cache.
   */
  delete(key: string): Promise<void>;

  /**
   * Optional: clear the entire cache (useful for testing).
   */
  clear?: () => Promise<void>;
}
