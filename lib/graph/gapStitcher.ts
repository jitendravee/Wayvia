import { stationDistanceKm, getStationCityName } from "../geo";
import type { Leg, JourneyCandidate, PartialCoverage } from "./types";
import type { AnnotatedJourney } from "../availability";

function formatMinutesToHHMM(absMin: number): string {
  const norm = ((absMin % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDurationHHMM(durationMin: number): string {
  const h = Math.floor(durationMin / 60);
  const m = durationMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Evaluates partial coverage matches and broken journeys to stitch together
 * "Composite Struggle Journeys" when 100% confirmed end-to-end routes are scarce.
 *
 * Travelers get to know:
 * "You have confirmed tickets covering 80%+ of your journey, with a short self-transfer/bus gap."
 */
export function stitchCompositeJourneys(
  fromCode: string,
  toCode: string,
  partialList: PartialCoverage[],
  existingJourneys: (JourneyCandidate | AnnotatedJourney)[],
  maxResults = 4
): JourneyCandidate[] {
  const fromUpper = fromCode.toUpperCase();
  const toUpper = toCode.toUpperCase();
  const totalDist = stationDistanceKm(fromUpper, toUpper) ?? 600;

  const results: JourneyCandidate[] = [];
  const seenKeys = new Set<string>();

  // Segregate partials into reaches_hub (origin -> hub) and from_hub (hub -> dest)
  const reachesHub = partialList.filter((p) => p.type === "reaches_hub");
  const fromHub = partialList.filter((p) => p.type === "from_hub");

  // --- Strategy 1: Dual-Leg Bridge (Origin -> Hub A, gap Hub A -> Hub B, Hub B -> Dest) ---
  for (const p1 of reachesHub) {
    const hubA = p1.hub.toUpperCase();
    const leg1 = p1.leg;

    for (const p2 of fromHub) {
      const hubB = p2.hub.toUpperCase();
      const leg2 = p2.leg;

      if (hubA === hubB) continue; // Same hub would be a normal 1-connection transfer

      const gapDist = stationDistanceKm(hubA, hubB);
      // Only bridge if the gap is within a manageable local transit distance (<= 160 km)
      if (gapDist === null || gapDist > 160) continue;

      // Estimate travel time for the gap at ~40 km/h average speed on regional roads
      const gapTravelMin = Math.max(45, Math.round((gapDist / 40) * 60));
      const bufferBeforeGap = 30; // 30 min buffer to deboard and reach bus stand / taxi
      const bufferAfterGap = 40;  // 40 min buffer to arrive at next railway station

      const gapDepMin = leg1.arrAbsMin + bufferBeforeGap;
      const gapArrMin = gapDepMin + gapTravelMin;

      // Check if leg2 connects within an allowable layover window (up to 14 hours)
      let adjustedLeg2 = { ...leg2 };
      if (adjustedLeg2.depAbsMin < gapArrMin + bufferAfterGap) {
        // Try next calendar day
        adjustedLeg2.depAbsMin += 1440;
        adjustedLeg2.arrAbsMin += 1440;
      }

      const totalLayover = adjustedLeg2.depAbsMin - gapArrMin;
      if (adjustedLeg2.depAbsMin < gapArrMin + bufferAfterGap || totalLayover > 14 * 60) {
        continue;
      }

      const key = `${leg1.trainNo}-${hubA}-${hubB}-${leg2.trainNo}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      const hubAName = getStationCityName(hubA);
      const hubBName = getStationCityName(hubB);

      const gapLeg: Leg = {
        mode: "bus",
        source: "mock",
        trainNo: "LOCAL-BUS",
        trainName: `Local Transit Gap (${hubAName} → ${hubBName})`,
        from: hubA,
        to: hubB,
        departure: formatMinutesToHHMM(gapDepMin),
        arrival: formatMinutesToHHMM(gapArrMin),
        travelTime: formatDurationHHMM(gapTravelMin),
        runningDays: "1111111",
        depAbsMin: gapDepMin,
        arrAbsMin: gapArrMin,
        bookingUrl: null,
        isGap: true,
        gapDetails: {
          distanceKm: Math.round(gapDist),
          estDurationMin: gapTravelMin,
          transitTip: `Frequent State Transport (ST) buses and local passenger trains operate between ${hubAName} and ${hubBName} (~${Math.round(gapDist)} km, ~${formatDurationHHMM(gapTravelMin)}). Self-transfer required between stations.`,
        },
      };

      const leg1Dist = stationDistanceKm(fromUpper, hubA) ?? (totalDist * 0.45);
      const leg2Dist = stationDistanceKm(hubB, toUpper) ?? (totalDist * 0.45);
      const coveredDist = leg1Dist + leg2Dist;
      const coveragePercent = Math.min(95, Math.max(55, Math.round((coveredDist / (coveredDist + gapDist)) * 100)));

      results.push({
        legs: [leg1, gapLeg, adjustedLeg2],
        hub: hubA,
        hub2: hubB,
        hubSource: "static",
        extensionType: "composite_gap",
        coveragePercent,
      });

      if (results.length >= maxResults) return results;
    }
  }

  // --- Strategy 2: High-Coverage Major Leg (> 55% of distance covered) ---
  for (const p of reachesHub) {
    if (results.length >= maxResults) break;
    const hub = p.hub.toUpperCase();
    const leg1 = p.leg;

    const coveredDist = stationDistanceKm(fromUpper, hub);
    const remainingDist = stationDistanceKm(hub, toUpper);

    if (coveredDist === null || remainingDist === null) continue;

    const coveragePercent = Math.round((coveredDist / (coveredDist + remainingDist)) * 100);
    // Only propose if this leg covers at least 55% of the total distance
    if (coveragePercent < 55) continue;

    const key = `major-hub-${leg1.trainNo}-${hub}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const hubName = getStationCityName(hub);
    const destName = getStationCityName(toUpper);
    const estTransitMin = Math.max(60, Math.round((remainingDist / 45) * 60));
    const gapDepMin = leg1.arrAbsMin + 30;
    const gapArrMin = gapDepMin + estTransitMin;

    const gapLeg: Leg = {
      mode: "bus",
      source: "mock",
      trainNo: "REGIONAL-BUS",
      trainName: `Connecting Regional Bus (${hubName} → ${destName})`,
      from: hub,
      to: toUpper,
      departure: formatMinutesToHHMM(gapDepMin),
      arrival: formatMinutesToHHMM(gapArrMin),
      travelTime: formatDurationHHMM(estTransitMin),
      runningDays: "1111111",
      depAbsMin: gapDepMin,
      arrAbsMin: gapArrMin,
      bookingUrl: null,
      isGap: true,
      gapDetails: {
        distanceKm: Math.round(remainingDist),
        estDurationMin: estTransitMin,
        transitTip: `Confirmed train gets you to ${hubName} (covers ${coveragePercent}% of journey). Take regular interstate buses, daytime passenger trains, or cabs for the remaining ${Math.round(remainingDist)} km to ${destName}.`,
      },
    };

    results.push({
      legs: [leg1, gapLeg],
      hub,
      hubSource: "static",
      extensionType: "composite_gap",
      coveragePercent,
    });
  }

  return results;
}

