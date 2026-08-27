"use client";

import { useMemo, useState } from "react";
import NarrativeBanner from "./NarrativeBanner";
import StatsStrip from "./StatsStrip";
import JourneyCard from "./JourneyCard";
import OverviewMap from "./OverviewMap";
import PartialMatchCard from "./PartialMatchCard";
import FiltersBar from "./FiltersBar";
import Pagination from "./Pagination";
import LegTabs, { LegTabItem } from "./LegTabs";
import {
  applyFilters,
  DEFAULT_FILTERS,
  FilterState,
  maxDurationInSet,
  maxFareInSet,
  tagFor,
} from "./filters";
import type { MultiSearchResponse, SearchResponse, TripLeg } from "../types";
import { useFillHeight } from "@/lib/hooks/useFillHeight";
import NoResultsState from "./Noresultsstate";

interface Props {
  initial: MultiSearchResponse;
  maxHubs: number;
  maxConnections: 1 | 2 | 3;
  pageSize: number;
}

/** One leg's worth of client-side state — mirrors what PageClient used to track for a single search, back when single and multi-city had separate rendering paths. */
interface LegState {
  data: SearchResponse;
  filters: FilterState;
  loading: boolean;
}

interface RefineOpts {
  page?: number;
  travelClass?: string;
  quota?: string;
  /** Bumped by the "search via N junctions" suggestion banner when a leg's direct/1-change search comes back thin. */
  maxConnections?: 1 | 2 | 3;
}

/**
 * Every trip's results, one leg at a time — whether that trip has 1 leg
 * (an ordinary single search) or several (multi-city). There's no separate
 * "single search" rendering path: a 1-leg trip is just a `MultiSearchResponse`
 * with one entry, LegTabs renders nothing for it, and everything below
 * behaves exactly like an ordinary search result.
 *
 * 2+ legs get a tab strip (LegTabs) above everything else — only the active
 * leg's data, filters, and list render at once, so "filters apply only to
 * the selected leg" is true by construction, not something each leg has to
 * re-declare.
 */
export default function MultiLegResults({
  initial,
  maxHubs,
  maxConnections,
  pageSize,
}: Props) {
  const [legs] = useState<TripLeg[]>(initial.legs);
  const [states, setStates] = useState<LegState[]>(
    initial.results.map((data) => ({
      data,
      filters: DEFAULT_FILTERS,
      loading: false,
    })),
  );
  const [activeIndex, setActiveIndex] = useState(0);

  function patchLeg(i: number, patch: Partial<LegState>) {
    setStates((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );
  }

  // A leg's fare/availability is class & quota-specific, same as the single
  // search always was — so paginating, refining class/quota, or accepting a
  // "search via N junctions" suggestion for one leg just calls the ordinary
  // single-leg /api/search for that leg only. Other legs, and the rest of
  // this leg's already-fetched data, are untouched.
  async function refetchLeg(i: number, opts: RefineOpts) {
    const leg = legs[i];
    const current = states[i].data;
    const travelClass = opts.travelClass ?? current.travelClass ?? "3A";
    const quota = opts.quota ?? current.quota ?? "GN";
    const page = opts.page ?? 1;
    const legMaxConnections =
      opts.maxConnections ?? current.maxConnections ?? maxConnections;
    // Preserve whichever mode(s) this leg was actually searched with —
    // `modesAvailable` on the leg's own last response is the source of
    // truth for that, the same way the single-search flow always resends
    // its own selected modes on every refine. Hardcoding "train" here
    // would silently drop bus/flight from a leg that originally had them
    // on EVERY refine action (class, quota, page, connections — not just
    // class), not only the one that happened to surface it.
    const modes =
      current.modesAvailable && current.modesAvailable.length > 0
        ? current.modesAvailable.join(",")
        : "train";

    patchLeg(i, { loading: true });
    try {
      const params = new URLSearchParams({
        from: leg.from,
        to: leg.to,
        date: leg.date,
        class: travelClass,
        quota,
        maxHubs: String(maxHubs),
        maxConnections: String(legMaxConnections),
        page: String(page),
        pageSize: String(pageSize),
        modes,
      });
      const res = await fetch(`/api/search?${params}`);
      const json: SearchResponse = await res.json();
      if (!res.ok)
        throw new Error(json.error || `Request failed (${res.status})`);
      patchLeg(i, {
        data: json,
        loading: false,
        // Anything other than a plain page turn changed the underlying
        // result set out from under the person — drop whatever sort/
        // connection/etc. filter they'd picked for the old set.
        ...(opts.page === undefined ? { filters: DEFAULT_FILTERS } : {}),
      });
    } catch {
      patchLeg(i, { loading: false });
    }
  }

  const tabs: LegTabItem[] = legs.map((leg, i) => ({
    key: String(i),
    label: `Leg ${i + 1}`,
    sublabel: `${leg.from} → ${leg.to}`,
  }));

  return (
    <div>
      <LegTabs
        tabs={tabs}
        active={String(activeIndex)}
        onChange={(k) => setActiveIndex(Number(k))}
      />

      <LegPanel
        leg={legs[activeIndex]}
        state={states[activeIndex]}
        onFiltersChange={(filters) => patchLeg(activeIndex, { filters })}
        onRefine={(next) => refetchLeg(activeIndex, next)}
        onPageChange={(page) => refetchLeg(activeIndex, { page })}
      />
    </div>
  );
}

function LegPanel({
  leg,
  state,
  onFiltersChange,
  onRefine,
  onPageChange,
}: {
  leg: TripLeg;
  state: LegState;
  onFiltersChange: (f: FilterState) => void;
  onRefine: (next: RefineOpts) => void;
  onPageChange: (page: number) => void;
}) {
  const { data, filters, loading } = state;
  const ranked = data.results;
  const page = data.pagination?.page ?? 1;

  // Below `md` there isn't room to show the list and the map side by side —
  // this toggles which one occupies that space. Ignored entirely at `md`
  // and up, where both always show (see the `md:hidden` / `md:block`
  // classes below).
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  const fareCeiling = useMemo(
    () => (ranked ? maxFareInSet(ranked.all) : 0),
    [ranked],
  );
  const durationCeiling = useMemo(
    () => (ranked ? maxDurationInSet(ranked.all) : 0),
    [ranked],
  );
  const filtered = useMemo(
    () => (ranked ? applyFilters(ranked.all, filters) : []),
    [ranked, filters],
  );

  // Best overall is just the first row of the list itself — no separate
  // card/heading above the filters. Only pinned to the top on page 1; later
  // pages are already a fresh slice from the backend with no "best" to pin.
  const listItems = useMemo(() => {
    if (!ranked || page !== 1) return filtered;
    const rest = filtered.filter((j) => j !== ranked.bestOverall);
    return filtered.includes(ranked.bestOverall)
      ? [ranked.bestOverall, ...rest]
      : filtered;
  }, [ranked, filtered, page]);

  const hasFilterableSet =
    ranked !== null &&
    (ranked.all.length > 1 ||
      (data.pagination !== undefined && data.pagination.total > 1));

  const hasMap =
    page === 1 && !!data.mapOverview && data.mapOverview.length > 0;
  const { ref: rowRef, height: fillHeight } = useFillHeight<HTMLDivElement>(
    24,
    360,
  );

  // The backend's own "you searched too narrowly" hint, when present.
  // Cast defensively — `suggestion` may not exist on every SearchResponse
  // shape in your types.ts yet; add it there once and this cast can go.
  const suggestion = (
    data as unknown as {
      suggestion?: { message: string; nextConnections: 1 | 2 | 3 };
    }
  ).suggestion;

  return (
    <section>
      {/* <StatsStrip data={data} /> */}

      {!ranked && (
        <NoResultsState
          from={data.from}
          to={data.to}
          date={leg.date}
          partialCount={data.partial?.length ?? 0}
          partialAnchorId="partial-matches"
          suggestion={suggestion}
          onWidenSearch={
            suggestion
              ? () => onRefine({ maxConnections: suggestion.nextConnections })
              : undefined
          }
          loading={loading}
        />
      )}

      {page === 1 && data.partial && data.partial.length > 0 && (
        <div id="partial-matches" className="mb-6 scroll-mt-24">
          <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Partway-there matches — real trains covering part of this leg
          </div>
          <div className="space-y-3">
            {data.partial.map((p, i) => (
              <PartialMatchCard
                key={`${p.type}-${p.hub}-${p.leg.trainNo}-${i}`}
                match={p}
              />
            ))}
          </div>
        </div>
      )}

      {ranked && (
        <>
          {hasFilterableSet && (
            <FiltersBar
              filters={filters}
              onChange={onFiltersChange}
              fareCeiling={fareCeiling}
              durationCeiling={durationCeiling}
              resultCount={filtered.length}
              travelClass={data.travelClass ?? "3A"}
              quota={data.quota ?? "GN"}
              onRefine={onRefine}
              refining={loading}
            />
          )}

          {/* List/Map switch — mobile only. On md+ both panes below just show at once. */}
          {hasMap && (
            <div className="mb-3 flex gap-1 rounded-full border border-border bg-surface-alt p-1 md:hidden">
              <button
                type="button"
                onClick={() => setMobileView("list")}
                aria-pressed={mobileView === "list"}
                className={`flex-1 rounded-full px-3 py-1.5 font-display text-[13px] font-semibold transition-colors ${
                  mobileView === "list"
                    ? "bg-white text-violet-dark shadow-sm"
                    : "text-ink-muted"
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setMobileView("map")}
                aria-pressed={mobileView === "map"}
                className={`flex-1 rounded-full px-3 py-1.5 font-display text-[13px] font-semibold transition-colors ${
                  mobileView === "map"
                    ? "bg-white text-violet-dark shadow-sm"
                    : "text-ink-muted"
                }`}
              >
                Map
              </button>
            </div>
          )}

          {/* List scrolls in its own bounded column on md+ and the map is
              sticky beside it (offset for the fixed navbar), so a long
              result list never pushes the map out of view — on smaller
              screens this is moot since only one of the two shows at a
              time via the List/Map switch above. */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start ">
            <div
              style={fillHeight ? { height: fillHeight } : undefined}
              className={`w-full md:overflow-y-auto md:pr-1 ${
                hasMap && mobileView !== "list" ? "hidden md:block" : ""
              }`}
            >
              <div className="space-y-3">
                {listItems.map((j, i) => (
                  <JourneyCard
                    key={i}
                    journey={j}
                    tag={
                      i === 0 && page === 1 ? "Best overall" : tagFor(j, ranked)
                    }
                  />
                ))}
              </div>

              {hasFilterableSet && data.pagination && (
                <>
                  <Pagination
                    page={data.pagination.page}
                    totalPages={data.pagination.totalPages}
                    onChange={onPageChange}
                    disabled={loading}
                  />
                  <div className="mt-2 text-center font-mono text-[11px] text-ink-dim">
                    {data.pagination.total} total route
                    {data.pagination.total === 1 ? "" : "s"} found · page{" "}
                    {data.pagination.page} of {data.pagination.totalPages}
                  </div>
                </>
              )}
            </div>

            {hasMap && (
              <div
                className={`md:sticky md:top-24   ${
                  mobileView !== "map" ? "hidden md:block" : ""
                }`}
              >
                <OverviewMap entries={data.mapOverview!} />
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}