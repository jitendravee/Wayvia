"use client";

import { AnnotatedLeg } from "./types";

function durationLabel(mins: number) {
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  return `${h}h ${m}m`;
}

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Available",
  WAITLIST: "Waitlisted",
  RAC: "RAC",
  NOT_AVAILABLE: "Not available",
  REGRET: "Regret",
};

function statusClass(category?: string) {
  switch (category) {
    case "AVAILABLE":
      return "statusAvailable";

    case "WAITLIST":
    case "RAC":
      return "statusWaitlist";

    case "NOT_AVAILABLE":
    case "REGRET":
      return "statusBlocked";

    default:
      // No UNKNOWN status is shown to the user.
      return "";
  }
}

/**
 * Renders a journey's legs as a horizontal strip of station nodes.
 *
 * Each segment is colored by the leg's real seat-availability status
 * pulled from s.erail.in.
 *
 * UNKNOWN / missing availability is intentionally not displayed.
 * The backend should filter UNKNOWN statuses before sending them,
 * but this component also safely handles them if they somehow arrive.
 */
export default function RouteStrip({ legs }: { legs: AnnotatedLeg[] }) {
  const nodes: { code: string; time: string }[] = [];

  legs.forEach((leg, i) => {
    if (i === 0) {
      nodes.push({
        code: leg.from,
        time: leg.departure,
      });
    }

    nodes.push({
      code: leg.to,
      time: leg.arrival,
    });
  });

  return (
    <div className="routeStrip">
      {nodes.map((node, i) => {
        const leg = legs[i];

        return (
          <div
            key={`${node.code}-${i}`}
            style={{ display: "contents" }}
          >
            {/* Station node */}
            <div className="node">
              <div className="nodeDot" />

              <div className="nodeCode">
                {node.code}
              </div>

              <div className="nodeTime">
                {node.time}
              </div>
            </div>

            {/* Train segment */}
            {i < legs.length && leg && (
              <div
                className={`segment ${statusClass(
                  leg.availability?.category
                )}`.trim()}
              >
                {leg.availability &&
                  STATUS_LABEL[leg.availability.category] && (
                    <div
                      className={`segLabel ${statusClass(
                        leg.availability.category
                      )}`.trim()}
                    >
                      #{leg.trainNo} ·{" "}
                      {STATUS_LABEL[leg.availability.category]}

                      {leg.availability.count != null
                        ? ` (${leg.availability.count})`
                        : ""}
                    </div>
                  )}

                {/* If availability is missing or UNKNOWN,
                    show only the train number. */}
                {!leg.availability && (
                  <div className="segLabel">
                    #{leg.trainNo}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { durationLabel };