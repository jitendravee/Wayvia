"use client";

import { useMemo, useState } from "react";
import NarrativeBanner from "./NarrativeBanner";
import EmptyState from "./EmptyState";
import StatsStrip from "./StatsStrip";
import JourneyCard from "./JourneyCard";
import OverviewMap from "./OverviewMap";
import PartialMatchCard from "./PartialMatchCard";
import FiltersBar from "./FiltersBar";
import ModeSelector from "./ModeSelector";
import Pagination from "./Pagination";
import { applyFilters, DEFAULT_FILTERS, FilterState, maxDurationInSet, maxFareInSet, tagFor } from "./filters";
import type { MultiSearchResponse, SearchResponse, TripLeg } from "../types";

interface Props {
  initial: MultiSearchResponse;
  maxHubs: number;
  maxConnections: 1 | 2 | 3;
  pageSize: number;
}

/** One leg's worth of client-side state — mirrors what PageClient tracks for a single search. */
interface LegState {
  data: SearchResponse;
  filters: FilterState;
  loading: boolean;
}

export default function MultiLegResults({ initial, maxHubs, maxConnections, pageSize }: Props) {
  const [legs] = useState<TripLeg[]>(initial.legs);
  const [states, setStates] = useState<LegState[]>(
    initial.results.map((data) => ({ data, filters: DEFAULT_FILTERS, loading: false }))
  );

  function patchLeg(i: number, patch: Partial<LegState>) {
    setStates((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  // A leg's fare/availability is class & quota-specific, same as the single
  // search — so paginating or refining class/quota for one leg just calls
  // the ordinary single-leg /api/search for that leg only. Other legs, and
  // the rest of this leg's already-fetched data, are untouched.
  async function refetchLeg(i: number, opts: { page?: number; travelClass?: string; quota?: string }) {
    const leg = legs[i];
    const current = states[i].data;
    const travelClass = opts.travelClass ?? current.travelClass ?? "3A";
    const quota = opts.quota ?? current.quota ?? "GN";
    const page = opts.page ?? 1;

    patchLeg(i, { loading: true });
    try {
      const params = new URLSearchParams({
        from: leg.from,
        to: leg.to,
        date: leg.date,
        class: travelClass,
        quota,
        maxHubs: String(maxHubs),
        maxConnections: String(maxConnections),
        page: String(page),
        pageSize: String(pageSize),
        // Keep whatever mode restriction the original multi-city search used
        // for this leg (e.g. "train,bus") so paginating/refining doesn't
        // silently widen the search back to every mode.
        modes: (current.modesAvailable ?? []).join(","),
      });
      const res = await fetch(`/api/search?${params}`);
      const json: SearchResponse = await res.json();
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      patchLeg(i, {
        data: json,
        loading: false,
        // class/quota changed the result set under the person's feet — drop
        // any sort/connection/etc. filter they'd picked for the old set.
        ...(opts.page === undefined ? { filters: DEFAULT_FILTERS } : {}),
      });
    } catch {
      patchLeg(i, { loading: false });
    }
  }

  return (
    <div className="space-y-10">
      {states.map((state, i) => (
        <LegSection
          key={`${legs[i].from}-${legs[i].to}-${legs[i].date}-${i}`}
          index={i}
          leg={legs[i]}
          state={state}
          onFiltersChange={(filters) => patchLeg(i, { filters })}
          onRefine={(next) => refetchLeg(i, next)}
          onPageChange={(page) => refetchLeg(i, { page })}
        />
      ))}
    </div>
  );
}

function LegSection({
  index,
  leg,
  state,
  onFiltersChange,
  onRefine,
  onPageChange,
}: {
  index: number;
  leg: TripLeg;
  state: LegState;
  onFiltersChange: (f: FilterState) => void;
  onRefine: (next: { travelClass?: string; quota?: string }) => void;
  onPageChange: (page: number) => void;
}) {
  const { data, filters, loading } = state;
  const ranked = data.results;

  const fareCeiling = useMemo(() => (ranked ? maxFareInSet(ranked.all) : 0), [ranked]);
  const durationCeiling = useMemo(() => (ranked ? maxDurationInSet(ranked.all) : 0), [ranked]);
  const filtered = useMemo(() => (ranked ? applyFilters(ranked.all, filters) : []), [ranked, filters]);
  const restOfList = useMemo(() => (ranked ? filtered.filter((j) => j !== ranked.bestOverall) : []), [filtered, ranked]);
  const page = data.pagination?.page ?? 1;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-soft font-mono text-[12px] font-bold text-violet-dark">
          {index + 1}
        </span>
        <h2 className="font-display text-lg font-semibold text-ink">
          {leg.from} → {leg.to}
          <span className="ml-2 font-mono text-[12px] font-normal text-ink-dim">{leg.date}</span>
        </h2>
      </div>

      <StatsStrip data={data} />

      {data.narrative && <NarrativeBanner narrative={data.narrative} tone={ranked ? "clear" : "empty"} />}

      {!ranked && <EmptyState from={data.from} to={data.to} partialCount={data.partial?.length ?? 0} />}

      {page === 1 && data.mapOverview && data.mapOverview.length > 0 && <OverviewMap entries={data.mapOverview} />}

      {page === 1 && data.partial && data.partial.length > 0 && (
        <div className="mb-6">
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

      {ranked && (
        <>
          {page === 1 && (
            <div className="mb-6">
              <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted">Best match for this leg</div>
              <JourneyCard journey={ranked.bestOverall} tag="Best overall" />
            </div>
          )}

          {(ranked.all.length > 1 || (data.pagination && data.pagination.total > 1)) && (
            <>
              <ModeSelector value={filters.transport} onChange={(transport) => onFiltersChange({ ...filters, transport })} />

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

              <div>
                <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                  {restOfList.length > 0 ? "Other ways to do this leg" : "No other options match these filters"}
                </div>
                <div className="space-y-3">
                  {(page === 1 ? restOfList : filtered).map((j, i) => (
                    <JourneyCard key={i} journey={j} tag={tagFor(j, ranked)} />
                  ))}
                </div>
              </div>

              {data.pagination && (
                <>
                  <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={onPageChange} disabled={loading} />
                  <div className="mt-2 text-center font-mono text-[11px] text-ink-dim">
                    {data.pagination.total} total route{data.pagination.total === 1 ? "" : "s"} found · page {data.pagination.page} of{" "}
                    {data.pagination.totalPages}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}