import type { AnnotatedJourney } from "./availability";

export interface RankedResults {
  bestOverall: AnnotatedJourney;
  cheapest: AnnotatedJourney | null; // null if no journey has full fare data
  fastest: AnnotatedJourney;
  easiest: AnnotatedJourney;
  mostReliable: AnnotatedJourney; // best confirmed journey, or bestOverall if none confirmed
  confirmedOnly: AnnotatedJourney[]; // fullyConfirmed === true, sorted by bestOverall order
  all: AnnotatedJourney[];
  /**
   * Journeys worth mentioning as "here's another way" alongside whatever
   * the user's top pick is — e.g. noticeably cheaper, or a backup with
   * open seats when the top pick is waitlisted. Never empty if `all` has
   * more than one journey.
   */
  alternatives: AnnotatedJourney[];
}

/**
 * Ranking philosophy:
 * - Prefer fully-confirmed journeys over waitlisted/unknown ones.
 * - Among confirmed journeys, balance fare and duration.
 * - Waitlisted-but-structurally-valid journeys are still surfaced (never
 *   silently dropped) since a WL2 on a good train is often worth showing,
 *   just ranked below anything actually confirmed.
 * - Alternatives are computed regardless of whether the top pick looks
 *   fine — a cheaper or more reliable option is worth surfacing even when
 *   the "best" journey is a perfectly good direct train.
 */
export function rankJourneys(journeys: AnnotatedJourney[]): RankedResults | null {
  if (journeys.length === 0) return null;

  const withFare = journeys.filter((j) => j.totalFare !== null);
  const confirmedOnly = journeys.filter((j) => j.fullyConfirmed);

  const fastest = [...journeys].sort((a, b) => a.totalDurationMin - b.totalDurationMin)[0];
  const easiest = [...journeys].sort((a, b) => a.connections - b.connections)[0];
  const cheapest = withFare.length > 0 ? [...withFare].sort((a, b) => (a.totalFare ?? 0) - (b.totalFare ?? 0))[0] : null;

  const maxDuration = Math.max(...journeys.map((j) => j.totalDurationMin));
  const maxFare = withFare.length > 0 ? Math.max(...withFare.map((j) => j.totalFare ?? 0)) : 1;

  function balancedScore(j: AnnotatedJourney): number {
    const durationScore = j.totalDurationMin / maxDuration;
    const fareScore = j.totalFare !== null ? j.totalFare / maxFare : 0.5; // neutral if unknown
    const connectionPenalty = j.connections * 0.1;
    const confirmedBonus = j.fullyConfirmed ? -0.3 : j.hasBlockedLeg ? 0.4 : 0;
    return durationScore * 0.4 + fareScore * 0.4 + connectionPenalty + confirmedBonus;
  }

  const allSorted = [...journeys].sort((a, b) => balancedScore(a) - balancedScore(b));
  const bestOverall = allSorted[0];
  const sortedConfirmed = [...confirmedOnly].sort((a, b) => balancedScore(a) - balancedScore(b));
  const mostReliable = sortedConfirmed[0] ?? bestOverall;

  // Alternatives: anything meaningfully different from bestOverall - cheaper,
  // fewer connections while still confirmed, or a backup when bestOverall isn't confirmed.
  const alternatives = allSorted
    .filter((j) => j !== bestOverall)
    .filter((j, idx, arr) => arr.findIndex((x) => sameJourney(x, j)) === idx)
    .slice(0, 4);

  return {
    bestOverall,
    cheapest,
    fastest,
    easiest,
    mostReliable,
    confirmedOnly: sortedConfirmed,
    all: allSorted,
    alternatives,
  };
}

function sameJourney(a: AnnotatedJourney, b: AnnotatedJourney): boolean {
  if (a.legs.length !== b.legs.length) return false;
  return a.legs.every((leg, i) => leg.trainNo === b.legs[i].trainNo);
}

/**
 * Builds the human-facing narrative for a search. Always reassuring, never
 * a bare "no results" — if nothing structurally feasible was found, this
 * still gives the person something to do next. If results exist, it calls
 * out anything worth knowing beyond just "here's the best one" (e.g. a
 * meaningfully cheaper alternative even though direct trains exist).
 */
export function buildNarrative(
  ranked: RankedResults | null,
  directCount: number,
  viaHubCount: number,
  structuralCount = 0,
  availableCount = 0,
  partialCount = 0,
  twoHubCount = 0
): { headline: string; detail: string } {
  if (!ranked) {
    if (structuralCount > 0 && availableCount === 0) {
      // Routes exist, we just don't have confirmed seats on any of them right now.
      return {
        headline: `Found ${structuralCount} route${structuralCount === 1 ? "" : "s"}, but no confirmed seats right now — no worries, this changes fast.`,
        detail:
          "Seats open up as people cancel or quota releases happen, so it's worth checking again closer to your date. Waitlisted and RAC options exist for this route too — we're just not showing those yet until that status gets cleaner handling here.",
      };
    }
    if (partialCount > 0) {
      return {
        headline: `No complete route found yet, but ${partialCount} real train${partialCount === 1 ? "" : "s"} cover part of the way.`,
        detail:
          "No direct or fully-connecting train matched this date, even after checking nearby junctions and real route data — but some of the leg-by-leg matches below are genuinely running trains that get you partway there. Worth combining with a manual search for the remaining leg, or widening \"junctions to explore\" and trying again.",
      };
    }
    return {
      headline: "No trains found for this route on this date — no worries, here's what to try.",
      detail:
        "Nothing came back structurally feasible, direct, via a nearby junction, or via a second connection. Try a nearby date, double check the station codes, or widen the hub search. As soon as bus and flight results are wired in, they'll show up here automatically as a backup for this exact search.",
    };
  }

  const { bestOverall, cheapest, mostReliable } = ranked;

  if (directCount === 0 && twoHubCount > 0 && viaHubCount === 0) {
    return {
      headline: `No direct or single-junction trains today — but a 2-junction route gets you there.`,
      detail: "We had to go two connections deep to find this one, so double-check the transfer windows, but it's a real, running option.",
    };
  }

  if (directCount === 0) {
    return {
      headline: `No direct trains today, but there's a way through — ${viaHubCount} connecting option${viaHubCount === 1 ? "" : "s"} found.`,
      detail: "No worries — we built out routes via nearby junctions and checked real seat availability on all of them, so you're not stuck.",
    };
  }

  if (cheapest && bestOverall.totalFare !== null && cheapest.totalFare !== null && cheapest !== bestOverall) {
    const savings = bestOverall.totalFare - cheapest.totalFare;
    if (savings > 0) {
      return {
        headline: `Direct trains are running fine — but there's a cheaper way too.`,
        detail: `The top pick works, but a connecting route saves about ₹${savings}. Both are listed below so you can pick what matters more today: speed or price.`,
      };
    }
  }

  if (!bestOverall.fullyConfirmed && mostReliable.fullyConfirmed) {
    return {
      headline: "Top match has a waitlisted leg — here's a fully confirmed backup.",
      detail: "We didn't stop at the first option. A slower or slightly pricier route below is fully confirmed right now if you'd rather not risk the waitlist.",
    };
  }

  return {
    headline: "Found a solid match, plus a few backups in case anything changes.",
    detail: "Availability shifts fast, so alternatives are listed below too — not just the single best pick.",
  };
}