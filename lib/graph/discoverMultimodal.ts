import { directSearch, discoverJourneys, DiscoverOptions, GraphDiscoveryResult } from "./discover";
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

/** How many of the train search's own top-scored hubs to also try mode-crossing through (train→bus, bus→train, etc.). Kept small — each one costs a couple of extra provider calls per non-train mode. */
const MAX_CROSS_HUBS = 5;
/** Minimum minutes between arriving on one leg and departing on the next, when the two legs are different modes (bus/flight boarding tends to need more buffer than a same-station train-to-train change). */
const CROSS_MODE_BUFFER_MIN = 30;

function tagLegs(c: JourneyCandidate, mode: Mode): JourneyCandidate {
  return { ...c, legs: c.legs.map((l) => ({ ...l, mode, source: l.source ?? "live" })) };
}

/**
 * Runs the existing train-only discovery unchanged, then adds:
 *  - direct bus/flight legs for the same origin→destination (from each
 *    enabled ModeProvider), and
 *  - 2-leg mixed candidates through the train search's own top hubs —
 *    train-then-other-mode and other-mode-then-train, both directions,
 *    exactly the "New Delhi →(train)→ Vadodara →(bus)→ Mumbai" shape a
 *    real multimodal trip planner needs.
 *
 * `modes` (default: every mode with a registered provider, plus train)
 * lets a caller narrow the search — e.g. a future "trains only" toggle
 * upstream of this layer, distinct from the FE's after-the-fact Transport
 * filter which just hides already-fetched results.
 */
export async function discoverMultimodal(
  from: string,
  to: string,
  opts: DiscoverOptions & { modes?: Mode[] }
): Promise<MultimodalDiscoveryResult> {
  const requestedModes = opts.modes ?? ALL_MODES;
  const otherModes = requestedModes.filter((m): m is Exclude<Mode, "train"> => m !== "train" && Boolean(MODE_PROVIDERS[m]));

  const trainResult = await discoverJourneys(from, to, opts);
  if (!requestedModes.includes("train")) {
    // Train explicitly excluded — keep the graph stats (still useful for hub-crossing) but drop train-only candidates.
    trainResult.direct = [];
    trainResult.viaHub = [];
    trainResult.viaTwoHub = [];
    trainResult.viaThreeHub = [];
  } else {
    trainResult.direct = trainResult.direct.map((c) => tagLegs(c, "train"));
    trainResult.viaHub = trainResult.viaHub.map((c) => tagLegs(c, "train"));
    trainResult.viaTwoHub = trainResult.viaTwoHub.map((c) => tagLegs(c, "train"));
    trainResult.viaThreeHub = trainResult.viaThreeHub.map((c) => tagLegs(c, "train"));
  }

  const directOther: JourneyCandidate[] = [];
  const mixedCandidates: JourneyCandidate[] = [];
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

    // Mixed candidates through the train search's own top hubs.
    const crossHubs = trainResult.graph.hubsExplored.slice(0, MAX_CROSS_HUBS).map((h) => h.code);

    await Promise.all(
      crossHubs.map(async (hub) => {
        if (hub === from || hub === to) return;

        await Promise.all(
          otherModes.map(async (mode) => {
            const provider = MODE_PROVIDERS[mode]!;

            const [trainToHub, otherFromHub] = await Promise.all([directSearch(from, hub, opts), provider.search(hub, to, opts.date)]);
            bump(mode, otherFromHub.length);
            for (const c1 of trainToHub) {
              const leg1 = { ...c1.legs[0], mode: "train" as const, source: "live" as const };
              for (const leg2 of otherFromHub) {
                if (leg2.depAbsMin < leg1.arrAbsMin + CROSS_MODE_BUFFER_MIN) continue;
                mixedCandidates.push({ legs: [leg1, leg2], hub, hubSource: "static" });
              }
            }

            const [otherToHub, trainFromHub] = await Promise.all([provider.search(from, hub, opts.date), directSearch(hub, to, opts)]);
            bump(mode, otherToHub.length);
            for (const leg1 of otherToHub) {
              for (const c2 of trainFromHub) {
                const leg2 = { ...c2.legs[0], mode: "train" as const, source: "live" as const };
                if (leg2.depAbsMin < leg1.arrAbsMin + CROSS_MODE_BUFFER_MIN) continue;
                mixedCandidates.push({ legs: [leg1, leg2], hub, hubSource: "static" });
              }
            }
          })
        );
      })
    );

    for (const mode of otherModes) {
      console.log(`[discoverMultimodal] ${mode} total legs contributed (direct + hub-crossing): ${modeCounts[mode] ?? 0}`);
    }
  }

  const modesAvailable: Mode[] = [...(requestedModes.includes("train") ? (["train"] as Mode[]) : []), ...otherModes];
  if (requestedModes.includes("train")) modeCounts.train = trainResult.direct.length + trainResult.viaHub.length + trainResult.viaTwoHub.length + trainResult.viaThreeHub.length;

  return {
    ...trainResult,
    direct: [...trainResult.direct, ...directOther],
    viaHub: [...trainResult.viaHub, ...mixedCandidates],
    modesAvailable,
    candidatesByMode: modeCounts,
  };
}