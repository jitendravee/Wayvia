import { directSearch, discoverJourneys, getHubCandidates, DiscoverOptions, GraphDiscoveryResult } from "./discover";
import type { JourneyCandidate, Leg, Mode } from "./types";
import { MODE_PROVIDERS, ALL_MODES } from "../providers/registry";

export interface MultimodalDiscoveryResult extends GraphDiscoveryResult {
  /** Every mode this search actually queried — reflects what was requested + has a registered provider, not just what came back with results. */
  modesAvailable: Mode[];
  /**
   * DEBUG: how many raw legs each mode actually contributed before
   * availability filtering (direct + every hub-crossing leg combined) —
   * *not* how many ended up in `results`, since that also requires
   * fullyConfirmed. Exists purely so you can tell "ixigo returned 0 legs"
   * apart from "ixigo returned legs but none had seats" from the API
   * response itself, without digging through server logs. Safe to drop
   * once the ixigo integration is confirmed working end to end.
   */
  candidatesByMode: Partial<Record<Mode, number>>;
}

/**
 * How many candidate hub places to try 2-leg mode-crossing through. This
 * used to mean "how many of the train search's own top hubs" — it no
 * longer does (see getHubCandidates below) — it's just "how many
 * candidate transfer places", period, independent of which modes are in
 * play.
 */
const MAX_CROSS_HUBS = 5;
/** Of those, how many to also try as the FIRST hub of a 3-leg (two-hub) chain — e.g. train→hubA→bus→hubB→train. Kept smaller than MAX_CROSS_HUBS because this tier costs an extra hubA→hubB call per (hub pair × mode), on top of the 2-leg tier's calls. */
const MAX_THREE_LEG_HUBS = 3;
/** Minimum minutes between arriving on one leg and departing on the next, when the two legs are different modes (bus/flight boarding tends to need more buffer than a same-station train-to-train change). Used whenever the caller didn't set transferBufferMin. */
const CROSS_MODE_BUFFER_MIN = 30;

export function tagLegs(c: JourneyCandidate, mode: Mode): JourneyCandidate {
  return { ...c, legs: c.legs.map((l) => ({ ...l, mode, source: l.source ?? "live" })) };
}

/** One mode's point-to-point legs between two stop codes on the search date — train via the tiered erail pipeline's plain direct lookup, everything else via its registered ModeProvider. Both return the same `Leg[]` shape so every combiner below can treat modes interchangeably. */
async function fetchModeLegs(mode: Mode, from: string, to: string, opts: DiscoverOptions): Promise<Leg[]> {
  if (mode === "train") {
    const candidates = await directSearch(from, to, opts);
    return candidates.map((c) => ({ ...c.legs[0], mode: "train" as const, source: c.legs[0].source ?? ("live" as const) }));
  }
  const provider = MODE_PROVIDERS[mode];
  if (!provider) return [];
  return provider.search(from, to, opts.date);
}

/** Whether `next` can follow `prev` given the transfer buffer — the same rule the train tiered engine's connectLegPairs applies, generalized to any mode pair. */
function chainable(prev: Leg, next: Leg, buffer: number): boolean {
  return next.depAbsMin >= prev.arrAbsMin + buffer;
}

/**
 * Runs the existing train-only discovery unchanged (when train is one of
 * the requested modes), then builds every other candidate journey shape
 * around a hub pool that is sourced purely geographically (see
 * lib/graph/discover.ts's getHubCandidates) rather than borrowed from the
 * train search's own results:
 *
 *  - direct bus/flight legs for the same origin→destination (from each
 *    enabled ModeProvider);
 *  - 2-leg candidates through a candidate hub place, for EVERY ordered
 *    pair of requested modes — train→bus, bus→train, AND, new here,
 *    bus→bus (indirect bus-only routing), flight→bus, etc.; and
 *  - 3-leg candidates through a pair of hub places (gated behind
 *    maxConnections >= 2, same as the train engine's own 2-junction
 *    tier) — this is what makes "train to a junction, bus onward to
 *    another junction, train the rest of the way" (or any other
 *    mode1→mode2→mode3 shape) discoverable, not just 2-leg mixes.
 *
 * A chain where every leg is "train" is intentionally skipped in both
 * tiers here — the dedicated tiered engine in lib/graph/discover.ts
 * already covers multi-hop train journeys (up to 3 changes) far more
 * thoroughly than a single- or double-hub pass in this file could, so
 * redoing that work here would just waste erail calls.
 *
 * This is also what makes a bus-only search ("modes: ['bus']") capable of
 * finding an indirect route (origin →bus→ hub →bus→ destination) even
 * when no direct bus exists — the hub-crossing logic used to ALWAYS
 * include a train leg on one side of every combination, which meant a
 * bus-only request silently got no indirect routing at all (and, worse,
 * wastefully still ran the full train discovery pipeline even though
 * train wasn't requested and its results were just thrown away).
 *
 * `modes` (default: every mode with a registered provider, plus train)
 * lets a caller narrow the search — e.g. the FE's Train only / Bus only /
 * All Modes toggle.
 */
export async function discoverMultimodal(
  from: string,
  to: string,
  opts: DiscoverOptions & { modes?: Mode[] }
): Promise<MultimodalDiscoveryResult> {
  const requestedModes = opts.modes ?? ALL_MODES;
  const trainRequested = requestedModes.includes("train");
  const otherModes = requestedModes.filter((m): m is Exclude<Mode, "train"> => m !== "train" && Boolean(MODE_PROVIDERS[m]));
  const buffer = opts.transferBufferMin ?? CROSS_MODE_BUFFER_MIN;
  const maxConnections = opts.maxConnections ?? 2;

  // Only run the (expensive, real-erail-network-calls) tiered train engine
  // when train was actually asked for — a bus-only or flight-only search
  // used to run this anyway and just discard the results.
  const trainResult: GraphDiscoveryResult = trainRequested
    ? await discoverJourneys(from, to, opts)
    : {
        direct: [],
        viaHub: [],
        viaTwoHub: [],
        viaThreeHub: [],
        partial: [],
        graph: { nodesDiscovered: 0, edgesDiscovered: 0, layers: 1, hubsExplored: [], dynamicHubsUsed: false, twoHubUsed: false, threeHubUsed: false },
        suggestion: null,
      };

  if (trainRequested) {
    trainResult.direct = trainResult.direct.map((c) => tagLegs(c, "train"));
    trainResult.viaHub = trainResult.viaHub.map((c) => tagLegs(c, "train"));
    trainResult.viaTwoHub = trainResult.viaTwoHub.map((c) => tagLegs(c, "train"));
    trainResult.viaThreeHub = trainResult.viaThreeHub.map((c) => tagLegs(c, "train"));
  }

  const directOther: JourneyCandidate[] = [];
  const mixedCandidates: JourneyCandidate[] = [];
  const threeLegCandidates: JourneyCandidate[] = [];
  // DEBUG counters — see candidatesByMode on the return value below.
  const modeCounts: Partial<Record<Mode, number>> = {};
  const bump = (mode: Mode, by: number) => {
    if (by <= 0) return;
    modeCounts[mode] = (modeCounts[mode] ?? 0) + by;
  };

  if (otherModes.length > 0) {
    // Direct bus/flight, same origin→destination.
    await Promise.all(
      otherModes.map(async (mode) => {
        const legs = await MODE_PROVIDERS[mode]!.search(from, to, opts.date);
        console.log(`[discoverMultimodal] direct ${mode} ${from}->${to}: ${legs.length} leg(s)`);
        bump(mode, legs.length);
        for (const leg of legs) directOther.push({ legs: [leg] });
      })
    );
  }

  // Geography-sourced hub pool — independent of whether/how the train search ran.
  // This is what lets bus-only (or bus+flight, no train at all) requests still get
  // a sensible set of candidate transfer places to route indirect journeys through.
  const needsHubCrossing = requestedModes.length > 0 && (trainRequested ? otherModes.length > 0 : true);
  const crossHubs = needsHubCrossing ? (await getHubCandidates(from, to, MAX_CROSS_HUBS)).map((h) => h.code) : [];
  const usableHubs = crossHubs.filter((h) => h !== from && h !== to);

  // legsByHubMode[hub][mode] = { toHub: from→hub legs, fromHub: hub→to legs }, fetched
  // exactly once per (hub, mode) regardless of how many mode *pairs* end up using them —
  // both the 2-leg and 3-leg combiners below read from this instead of refetching.
  const legsByHubMode = new Map<string, Partial<Record<Mode, { toHub: Leg[]; fromHub: Leg[] }>>>();

  if (usableHubs.length > 0) {
    await Promise.all(
      usableHubs.map(async (hub) => {
        const perMode: Partial<Record<Mode, { toHub: Leg[]; fromHub: Leg[] }>> = {};
        await Promise.all(
          requestedModes.map(async (mode) => {
            const [toHub, fromHub] = await Promise.all([fetchModeLegs(mode, from, hub, opts), fetchModeLegs(mode, hub, to, opts)]);
            perMode[mode] = { toHub, fromHub };
            if (mode !== "train") bump(mode, toHub.length + fromHub.length);
          })
        );
        legsByHubMode.set(hub, perMode);

        // --- 2-leg: from →(modeA)→ hub →(modeB)→ to, every ordered pair except train+train ---
        for (const modeA of requestedModes) {
          for (const modeB of requestedModes) {
            if (modeA === "train" && modeB === "train") continue;
            const leg1s = perMode[modeA]?.toHub ?? [];
            const leg2s = perMode[modeB]?.fromHub ?? [];
            if (leg1s.length === 0 || leg2s.length === 0) continue;
            for (const leg1 of leg1s) {
              for (const leg2 of leg2s) {
                if (!chainable(leg1, leg2, buffer)) continue;
                mixedCandidates.push({ legs: [leg1, leg2], hub, hubSource: "static" });
              }
            }
          }
        }
      })
    );
  }

  // --- 3-leg: from →(modeA)→ hubA →(modeB)→ hubB →(modeC)→ to ---
  // Gated behind maxConnections >= 2, mirroring the train engine's own "2-junction"
  // tier gating, and capped to a smaller hub pool since it costs an extra
  // hubA→hubB call per (hub pair × mode) on top of everything above.
  if (maxConnections >= 2 && usableHubs.length >= 2) {
    const threeLegHubs = usableHubs.slice(0, MAX_THREE_LEG_HUBS);
    const hubPairs: [string, string][] = [];
    for (const a of threeLegHubs) for (const b of threeLegHubs) if (a !== b) hubPairs.push([a, b]);

    // Middle hop hubA→hubB for each requested mode — fetched once per (pair, mode).
    const middleByPairMode = new Map<string, Leg[]>();
    await Promise.all(
      hubPairs.flatMap(([a, b]) =>
        requestedModes.map(async (mode) => {
          const legs = await fetchModeLegs(mode, a, b, opts);
          middleByPairMode.set(`${a}|${b}|${mode}`, legs);
          if (mode !== "train") bump(mode, legs.length);
        })
      )
    );

    for (const [hubA, hubB] of hubPairs) {
      const legsA = legsByHubMode.get(hubA);
      const legsB = legsByHubMode.get(hubB);
      if (!legsA || !legsB) continue;

      for (const modeA of requestedModes) {
        const leg1s = legsA[modeA]?.toHub ?? [];
        if (leg1s.length === 0) continue;

        for (const modeB of requestedModes) {
          const leg2s = middleByPairMode.get(`${hubA}|${hubB}|${modeB}`) ?? [];
          if (leg2s.length === 0) continue;

          for (const modeC of requestedModes) {
            // Skip the all-train chain — the tiered engine's own viaTwoHub already covers it.
            if (modeA === "train" && modeB === "train" && modeC === "train") continue;
            const leg3s = legsB[modeC]?.fromHub ?? [];
            if (leg3s.length === 0) continue;

            for (const leg1 of leg1s) {
              for (const leg2 of leg2s) {
                if (!chainable(leg1, leg2, buffer)) continue;
                for (const leg3 of leg3s) {
                  if (!chainable(leg2, leg3, buffer)) continue;
                  threeLegCandidates.push({ legs: [leg1, leg2, leg3], hub: hubA, hub2: hubB, hubSource: "static" });
                }
              }
            }
          }
        }
      }
    }
  }

  if (otherModes.length > 0) {
    for (const mode of otherModes) {
      console.log(`[discoverMultimodal] ${mode} total legs contributed (direct + hub-crossing): ${modeCounts[mode] ?? 0}`);
    }
  }

  const modesAvailable: Mode[] = [...(trainRequested ? (["train"] as Mode[]) : []), ...otherModes];
  if (trainRequested) modeCounts.train = trainResult.direct.length + trainResult.viaHub.length + trainResult.viaTwoHub.length + trainResult.viaThreeHub.length;

  // When train wasn't requested, trainResult.graph is the empty stub above —
  // surface the geo hub pool we actually explored instead, so the FE's graph
  // debug view still reflects what this search really looked at.
  const graph = trainRequested
    ? trainResult.graph
    : {
        ...trainResult.graph,
        nodesDiscovered: usableHubs.length + 2,
        edgesDiscovered: [...directOther, ...mixedCandidates, ...threeLegCandidates].reduce((n, c) => n + c.legs.length, 0),
        layers: threeLegCandidates.length > 0 ? 3 : mixedCandidates.length > 0 ? 2 : 1,
        hubsExplored: usableHubs.map((code) => ({ code, name: code, relevance: 1, source: "static/live" })),
      };

  return {
    ...trainResult,
    direct: [...trainResult.direct, ...directOther],
    viaHub: [...trainResult.viaHub, ...mixedCandidates],
    viaTwoHub: [...trainResult.viaTwoHub, ...threeLegCandidates],
    graph,
    modesAvailable,
    candidatesByMode: modeCounts,
  };
}
