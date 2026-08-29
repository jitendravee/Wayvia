"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import JourneyCard from "./JourneyCard";
import OverviewMap from "./OverviewMap";
import PartialMatchCard from "./PartialMatchCard";
import FiltersBar from "./FiltersBar";
import Pagination from "./Pagination";
import LegTabs, { LegTabItem } from "./LegTabs";
import {
  DEFAULT_FILTERS,
  FilterState,
  maxDurationInSet,
  maxFareInSet,
  tagFor,
} from "./filters";
import type { MultiSearchResponse, SearchResponse, TripLeg } from "../types";
import { useFillHeight } from "@/lib/hooks/useFillHeight";
import { useDebouncedArray } from "@/lib/hooks/useDebouncedValue";
import { toSearchParams, fetchSearch, SearchParams } from "@/lib/query/search";
import NoResultsState from "./Noresultsstate";

interface Props {
  initial: MultiSearchResponse;
  maxHubs: number;
  maxConnections: 1 | 2 | 3;
  pageSize: number;
}

/**
 * Everything about a leg's *search breadth* (as opposed to display
 * filtering) that the person can refine — class/quota/maxConnections/
 * maxHubs — plus the two things that now ALSO drive the server request:
 * `page` and `filters`. This is the entire client-side state for a leg;
 * the actual results come from TanStack Query (useQueries below), keyed
 * off all of this, so there's no separate "loading"/"data" useState pair
 * to keep in sync by hand anymore.
 */
interface LegQueryState {
  travelClass: string;
  quota: string;
  maxConnections: 1 | 2 | 3;
  maxHubs: number;
  modes: string[];
  page: number;
  filters: FilterState;
}

interface RefineOpts {
  travelClass?: string;
  quota?: string;
  maxConnections?: 1 | 2 | 3;
  maxHubs?: number;
}

/**
 * One trip's results, one leg at a time — whether the trip has 1 leg (an
 * ordinary single search) or several (multi-city). There's no separate
 * "single search" rendering path: a 1-leg trip is just a `MultiSearchResponse`
 * with one entry, LegTabs renders nothing for it, and everything below
 * behaves exactly like an ordinary search result.
 *
 * Filters are GLOBAL, not page-local: changing a filter updates that leg's
 * `filters` state and resets `page` to 1, both of which flow straight into
 * the /api/search query params AND the TanStack Query key (see
 * lib/query/search.ts's toSearchParams / SearchParams). The backend
 * filters the complete candidate set and paginates what's left
 * (lib/searchJourney.ts) — this component only ever renders the page it's
 * given back. It never fetches every page to filter client-side, and it
 * never re-filters `ranked.all` itself — that was the original bug
 * ("results.filter(...)" operating on only the currently loaded page).
 *
 * 2+ legs get a tab strip (LegTabs) above everything else — only the active
 * leg's panel renders, but every leg's query state (and TanStack Query
 * cache entry) lives here via useQueries, so switching tabs back doesn't
 * lose a leg's filters/page or refetch unnecessarily.
 */
export default function MultiLegResults({
  initial,
  maxHubs,
  maxConnections,
  pageSize,
}: Props) {
  const [legs] = useState<TripLeg[]>(initial.legs);

  const [legStates, setLegStates] = useState<LegQueryState[]>(
    initial.results.map((data) => ({
      travelClass: data.travelClass ?? "3A",
      quota: data.quota ?? "GN",
      maxConnections: data.maxConnections ?? maxConnections,
      maxHubs,
      // The modes this leg was actually searched with — same fallback the
      // old refetch logic used, so refining never silently drops bus/flight
      // from a leg that originally had them.
      modes:
        data.modesAvailable && data.modesAvailable.length > 0
          ? data.modesAvailable
          : ["train"],
      page: 1,
      filters: DEFAULT_FILTERS,
    }))
  );

  const [activeIndex, setActiveIndex] = useState(0);

  function patchLegState(i: number, patch: Partial<LegQueryState>) {
    setLegStates((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  // Debounce only the two continuous slider filters (maxFare/maxDuration) —
  // every other filter (connections, transport, departure/arrival window,
  // confirmed-only, sort) is a single click/tap and refetches immediately.
  // One hook call each (not one per leg, which would break rules-of-hooks
  // for a variable-length leg list) debouncing the whole per-leg array.
  const debouncedMaxFares = useDebouncedArray(legStates.map((s) => s.filters.maxFare), 400);
  const debouncedMaxDurations = useDebouncedArray(legStates.map((s) => s.filters.maxDuration), 400);

  const searchParamsPerLeg: SearchParams[] = legs.map((leg, i) => {
    const s = legStates[i];
    const effectiveFilters: FilterState = {
      ...s.filters,
      maxFare: debouncedMaxFares[i],
      maxDuration: debouncedMaxDurations[i],
    };
    return toSearchParams(
      {
        from: leg.from,
        to: leg.to,
        date: leg.date,
        travelClass: s.travelClass,
        quota: s.quota,
        maxHubs: s.maxHubs,
        maxConnections: s.maxConnections,
        modes: s.modes as SearchParams["modes"],
        page: s.page,
        pageSize,
      },
      effectiveFilters
    );
  });

  // Does this leg's current params still match exactly what PageClient's
  // initial fetch (doSearch/doMultiSearch — page 1, DEFAULT_FILTERS) sent?
  // If so, hydrate from the response already in hand instead of refetching
  // it on mount.
  function matchesInitialFetch(params: SearchParams, leg: TripLeg): boolean {
    return (
      params.page === 1 &&
      params.sort === DEFAULT_FILTERS.sort &&
      params.connections === DEFAULT_FILTERS.connections &&
      params.confirmedOnly === DEFAULT_FILTERS.confirmedOnly &&
      params.departure === DEFAULT_FILTERS.departure &&
      params.arrival === DEFAULT_FILTERS.arrival &&
      params.maxFare === DEFAULT_FILTERS.maxFare &&
      params.maxDuration === DEFAULT_FILTERS.maxDuration &&
      params.transport === DEFAULT_FILTERS.transport &&
      params.from === leg.from &&
      params.to === leg.to &&
      params.date === leg.date
    );
  }

  // One query per leg, all declared up front (legs.length is fixed for a
  // given trip) — useQueries is the array-based counterpart to useQuery for
  // exactly this "N independent, parallel queries" shape. The query key
  // includes every server-side filter param plus page, so a filter change
  // (or a page turn) is a genuinely different query/cache entry — never a
  // stale response for the wrong filter being reused.
  const legQueries = useQueries({
    queries: searchParamsPerLeg.map((params, i) => ({
      queryKey: ["journey-search", params] as const,
      queryFn: () => fetchSearch(params),
      initialData: matchesInitialFetch(params, legs[i]) ? initial.results[i] : undefined,
      // Keep the previous page's results on screen (instead of flashing to
      // a loading state) while a filter/page change is in flight.
      placeholderData: (prev: SearchResponse | undefined) => prev,
    })),
  });

  const tabs: LegTabItem[] = legs.map((leg, i) => ({
    key: String(i),
    label: `Leg ${i + 1}`,
    sublabel: `${leg.from} → ${leg.to}`,
  }));

  const activeQuery = legQueries[activeIndex];
  const activeState = legStates[activeIndex];
  const activeData = activeQuery.data ?? initial.results[activeIndex];

  return (
    <div>
      <LegTabs tabs={tabs} active={String(activeIndex)} onChange={(k) => setActiveIndex(Number(k))} />

      <LegPanel
        leg={legs[activeIndex]}
        data={activeData}
        loading={activeQuery.isFetching}
        filters={activeState.filters}
        maxHubs={activeState.maxHubs}
        onFiltersChange={(filters) => patchLegState(activeIndex, { filters, page: 1 })}
        onRefine={(next: RefineOpts) =>
          patchLegState(activeIndex, {
            ...(next.travelClass !== undefined ? { travelClass: next.travelClass } : {}),
            ...(next.quota !== undefined ? { quota: next.quota } : {}),
            ...(next.maxConnections !== undefined ? { maxConnections: next.maxConnections } : {}),
            ...(next.maxHubs !== undefined ? { maxHubs: next.maxHubs } : {}),
            // A refine changes the underlying candidate set out from under
            // the person — same as before, drop whatever display filter
            // they'd picked for the old set, and go back to page 1.
            filters: DEFAULT_FILTERS,
            page: 1,
          })
        }
        onPageChange={(page) => patchLegState(activeIndex, { page })}
      />
    </div>
  );
}

function LegPanel({
  leg,
  data,
  loading,
  filters,
  maxHubs,
  onFiltersChange,
  onRefine,
  onPageChange,
}: {
  leg: TripLeg;
  data: SearchResponse;
  loading: boolean;
  filters: FilterState;
  maxHubs: number;
  onFiltersChange: (f: FilterState) => void;
  onRefine: (next: RefineOpts) => void;
  onPageChange: (page: number) => void;
}) {
  const ranked = data.results;
  const page = data.pagination?.page ?? 1;

  // Below `md` there isn't room to show the list and the map side by side —
  // this toggles which one occupies that space. Ignored entirely at `md`
  // and up, where both always show (see the `md:hidden` / `md:block`
  // classes below).
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  // These slider bounds come from the *currently loaded page* of results,
  // same as before this fix — the backend doesn't (yet) report a global
  // max fare/duration across the whole filtered set, only this page's.
  // Pre-existing limitation, not something this filtering/pagination fix
  // changes; noted here so it isn't mistaken for a new regression.
  const fareCeiling = useMemo(() => (ranked ? maxFareInSet(ranked.all) : 0), [ranked]);
  const durationCeiling = useMemo(() => (ranked ? maxDurationInSet(ranked.all) : 0), [ranked]);

  // `ranked.all` is now already the globally-filtered, paginated slice the
  // backend computed (filter → paginate, see lib/searchJourney.ts) — no
  // client-side re-filtering of it here. Filtering the *currently loaded
  // page* a second time was exactly the bug: results on later pages of the
  // unfiltered set were never considered.
  const listItems = useMemo(() => {
    if (!ranked) return [];
    if (page !== 1) return ranked.all;
    const rest = ranked.all.filter((j) => j !== ranked.bestOverall);
    return ranked.all.includes(ranked.bestOverall) ? [ranked.bestOverall, ...rest] : ranked.all;
  }, [ranked, page]);

  const hasFilterableSet =
    ranked !== null && (ranked.all.length > 1 || (data.pagination !== undefined && data.pagination.total > 1));

  const hasMap = page === 1 && !!data.mapOverview && data.mapOverview.length > 0;
  const { ref: mapRef, height: fillHeight } = useFillHeight<HTMLDivElement>(24, 360);

  // The backend's own "you searched too narrowly" hint, when present.
  const suggestion = (
    data as unknown as {
      suggestion?: { message: string; nextConnections: 1 | 2 | 3 };
    }
  ).suggestion;

  return (
    <section>
      {page === 1 && data.partial && data.partial.length > 0 && (
        <div id="partial-matches" className="mb-6 scroll-mt-24">
          <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            Partway-there matches — real trains covering part of this leg
          </div>
          <div className="space-y-3">
            {data.partial.map((p, i) => (
              <PartialMatchCard key={`${p.type}-${p.hub}-${p.leg.trainNo}-${i}`} match={p} />
            ))}
          </div>
        </div>
      )}

      {/* FiltersBar is deliberately NOT gated behind `ranked` — a leg with
          zero results is exactly when class/quota/junctions need to be
          reachable, since they're the way to retry with different search
          parameters. Only the results list + map below stay gated. */}
      <FiltersBar
        filters={filters}
        onChange={onFiltersChange}
        fareCeiling={fareCeiling}
        durationCeiling={durationCeiling}
        resultCount={data.pagination?.total ?? (ranked ? ranked.all.length : 0)}
        travelClass={data.travelClass ?? "3A"}
        quota={data.quota ?? "GN"}
        maxHubs={maxHubs}
        maxConnections={data.maxConnections ?? 2}
        onRefine={onRefine}
        refining={loading}
      />
      {!ranked && (
        <NoResultsState
          from={data.from}
          to={data.to}
          date={leg.date}
          partialCount={data.partial?.length ?? 0}
          partialAnchorId="partial-matches"
          suggestion={suggestion}
          onWidenSearch={
            suggestion ? () => onRefine({ maxConnections: suggestion.nextConnections }) : undefined
          }
          loading={loading}
        />
      )}
      {ranked && (
        <>
          {hasMap && (
            <div className="mb-3 flex gap-1 rounded-full border border-border bg-surface-alt p-1 md:hidden">
              <button
                type="button"
                onClick={() => setMobileView("list")}
                aria-pressed={mobileView === "list"}
                className={`flex-1 rounded-full px-3 py-1.5 font-display text-[13px] font-semibold transition-colors ${
                  mobileView === "list" ? "bg-white text-violet-dark shadow-sm" : "text-ink-muted"
                }`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setMobileView("map")}
                aria-pressed={mobileView === "map"}
                className={`flex-1 rounded-full px-3 py-1.5 font-display text-[13px] font-semibold transition-colors ${
                  mobileView === "map" ? "bg-white text-violet-dark shadow-sm" : "text-ink-muted"
                }`}
              >
                Map
              </button>
            </div>
          )}

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
                    tag={i === 0 && page === 1 ? "Best overall" : tagFor(j, ranked)}
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
                ref={mapRef}
                className={`md:sticky md:top-24   ${mobileView !== "map" ? "hidden md:block" : ""}`}
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
