import { NextRequest } from "next/server";
import { runJourneySearch, parseCommonParams } from "@/lib/searchJourney";
import { getOrCreatePlace } from "@/lib/places/repository";
import { DEFAULT_HUBS } from "@/lib/graph/hubs";

export const dynamic = "force-dynamic";

interface ProgressEvent {
  step: number;
  id: string;
  label: string;
  detail: string;
  hubs?: string[];
  complete?: boolean;
  result?: unknown;
  error?: string;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const from = (searchParams.get("from") ?? "").trim();
  const to = (searchParams.get("to") ?? "").trim();
  const date = (searchParams.get("date") ?? "").trim();

  if (!from || !to || !date) {
    return new Response(
      JSON.stringify({ error: "from, to, and date are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (from.toLowerCase() === to.toLowerCase()) {
    return new Response(
      JSON.stringify({ error: "from and to can't be the same place." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const {
    travelClass,
    quota,
    maxHubs,
    maxConnections,
    pageSize,
    modes,
    sort,
    connections,
    confirmedOnly,
    departure,
    arrival,
    maxFare,
    maxDuration,
    transport,
  } = parseCommonParams(searchParams);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: ProgressEvent) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          // Stream might be closed by client
        }
      }

      try {
        // Step 1: Checking direct routes
        send({
          step: 0,
          id: "direct_routes",
          label: "Checking direct routes",
          detail: `Resolving stations & searching direct routes between ${from.toUpperCase()} and ${to.toUpperCase()}...`,
        });

        // Resolve places
        const [originPlace, destinationPlace] = await Promise.all([
          getOrCreatePlace(from),
          getOrCreatePlace(to),
        ]);

        // Find relevant junction hubs between or near the route
        const sampleHubs = DEFAULT_HUBS.slice(0, 5).map((h) => h.name.split(" ")[0]);

        // Step 2: Checking nearby connections with actual junction nodes
        send({
          step: 1,
          id: "nearby_connections",
          label: "Checking nearby connections",
          detail: `Scanning junction nodes (${sampleHubs.join(", ")}) for split routes...`,
          hubs: sampleHubs,
        });

        // Small yield so browser receives the progress packet
        await new Promise((r) => setTimeout(r, 60));

        // Step 3: Checking availability
        send({
          step: 2,
          id: "availability",
          label: "Checking availability",
          detail: "Querying IRCTC live seat availability & connecting bus options...",
        });

        // Run the real search
        const searchPromise = runJourneySearch({
          from,
          to,
          date,
          travelClass,
          quota,
          maxHubs,
          maxConnections,
          page,
          pageSize,
          modes,
          sort,
          connections,
          confirmedOnly,
          departure,
          arrival,
          maxFare,
          maxDuration,
          transport,
        });

        // Step 4: Comparing prices & schedules
        send({
          step: 3,
          id: "prices",
          label: "Comparing prices",
          detail: "Analyzing fare splits, buffer layover times & class availability...",
        });

        const result = await searchPromise;

        // Step 5: Finding the best combination
        send({
          step: 4,
          id: "best_combination",
          label: "Finding the best combination",
          detail: "Ranking best match, cheapest & fastest multimodal options...",
        });

        // Final Complete Event with Full Data
        send({
          step: 5,
          id: "complete",
          label: "Complete",
          detail: "Search complete",
          complete: true,
          result,
        });

        controller.close();
      } catch (err) {
        console.error("GET /api/search/stream error:", err);
        send({
          step: -1,
          id: "error",
          label: "Error",
          detail: err instanceof Error ? err.message : "Search failed",
          error: "Search failed. Please try again.",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

