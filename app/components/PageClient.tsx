"use client"
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ModeSelector from "../components/ModeSelector";
import SearchForm, { SearchFormValues } from "../components/SearchForm";
import { StopEntry } from "../components/JourneyStopsForm";
import NarrativeBanner from "../components/NarrativeBanner";
import EmptyState from "../components/EmptyState";
import StatsStrip from "../components/StatsStrip";
import JourneyCard from "../components/JourneyCard";
import PartialMatchCard from "../components/PartialMatchCard";
import FiltersBar from "../components/FiltersBar";
import Pagination from "../components/Pagination";
import MultiLegResults from "../components/MultiLegResults";
import { applyFilters, DEFAULT_FILTERS, FilterState, maxDurationInSet, maxFareInSet, tagFor } from "../components/filters";
import { SearchResponse, MultiSearchResponse, TripLeg } from "../types";
import { todayIso } from "@/lib/date";
const PAGE_SIZE = 10;

export function PageInner() {
  const [form, setForm] = useState<SearchFormValues>({
    from: "NDLS",
    to: "BCT",
    date: todayIso(),
    travelClass: "3A",
    quota: "GN",
    maxHubs: 10,
    maxConnections: 2,
  });
  // "Add a stop" chain beyond form.to/form.date — B→C, C→D, etc. Empty means
  // this is an ordinary single-leg search.
  const [extraStops, setExtraStops] = useState<StopEntry[]>([]);

  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  // Multi-city search results live separately from the single-leg `data`
  // above — the two are mutually exclusive. `multiVersion` is bumped on
  // every new multi search so MultiLegResults remounts with fresh internal
  // per-leg state instead of carrying over the previous trip's filters/pages.
  const [multiData, setMultiData] = useState<MultiSearchResponse | null>(null);
  const [multiVersion, setMultiVersion] = useState(0);
  const [multiLoading, setMultiLoading] = useState(false);
  const [multiError, setMultiError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  // Core single-leg search call, decoupled from any specific form-submit
  // event so it can be triggered by: the search form's submit, the filters
  // bar's class/quota "ask the backend again" action, pagination, or — on
  // first load — a from/to/date already sitting in the URL (e.g. someone
  // arrived here via the hero search or a JourneySearchButton elsewhere on
  // the site).
  async function doSearch(effective: SearchFormValues, targetPage: number, opts?: { resetFilters?: boolean; asRefine?: boolean }) {
    setMultiData(null); // single and multi results never show at once
    const resetFilters = opts?.resetFilters ?? true;
    if (opts?.asRefine) setRefining(true);
    else setLoading(true);
    setError(null);
    if (targetPage === 1 && resetFilters) setFilters(DEFAULT_FILTERS);
    try {
      const params = new URLSearchParams({
        from: effective.from,
        to: effective.to,
        date: effective.date,
        class: effective.travelClass,
        quota: effective.quota,
        maxHubs: String(effective.maxHubs),
        maxConnections: String(effective.maxConnections),
        page: String(targetPage),
        pageSize: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/search?${params}`);
      const json: SearchResponse = await res.json();
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      setData(json);
      setPage(targetPage);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefining(false);
    }
  }

  // Multi-city: A→B on date1, B→C on date2, ... — every leg is a person-
  // chosen stop, not an auto-discovered hub, so it goes to /api/search/multi
  // which just runs the same single-leg pipeline once per leg in parallel.
  async function doMultiSearch(legs: TripLeg[]) {
    setData(null); // single and multi results never show at once
    setMultiLoading(true);
    setMultiError(null);
    try {
      const params = new URLSearchParams({
        legs: JSON.stringify(legs),
        class: form.travelClass,
        quota: form.quota,
        maxHubs: String(form.maxHubs),
        maxConnections: String(form.maxConnections),
        pageSize: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/search/multi?${params}`);
      const json: MultiSearchResponse = await res.json();
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      setMultiData(json);
      setMultiVersion((v) => v + 1);
    } catch (err: unknown) {
      setMultiError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setMultiLoading(false);
    }
  }

  // Picks up from/to/date/class/quota (single) or mode=multi&legs=... from
  // the URL on first mount and, if enough is present, runs the search
  // immediately — so landing on /journey-planner?from=NDLS&to=BCT&date=...
  // (or ?mode=multi&legs=[...]) from the hero search or any
  // JourneySearchButton shows results without an extra click.
  useEffect(() => {
    const mode = searchParams.get("mode");
    const legsRaw = searchParams.get("legs");

    if (mode === "multi" && legsRaw) {
      try {
        const parsed = JSON.parse(legsRaw) as TripLeg[];
        if (Array.isArray(parsed) && parsed.length >= 2 && parsed.every((l) => l.from && l.to && l.date)) {
          const cls = searchParams.get("class");
          const quota = searchParams.get("quota");
          if (cls || quota) {
            setForm((f) => ({ ...f, ...(cls ? { travelClass: cls.toUpperCase() } : {}), ...(quota ? { quota: quota.toUpperCase() } : {}) }));
          }
          setExtraStops(parsed.slice(1).map((l, i) => ({ id: `url-${i}`, to: l.to, date: l.date })));
          doMultiSearch(parsed);
          return;
        }
      } catch {
        /* fall through to single-search parsing below */
      }
    }

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date");
    const cls = searchParams.get("class");
    const quota = searchParams.get("quota");

    if (!from && !to && !date && !cls && !quota) return;

    const effective: SearchFormValues = {
      ...form,
      ...(from ? { from: from.toUpperCase() } : {}),
      ...(to ? { to: to.toUpperCase() } : {}),
      ...(date ? { date } : {}),
      ...(cls ? { travelClass: cls.toUpperCase() } : {}),
      ...(quota ? { quota: quota.toUpperCase() } : {}),
    };
    setForm(effective);

    if (effective.from && effective.to && effective.date) {
      doSearch(effective, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runSearch(e: React.FormEvent, targetPage = 1, overrides?: Partial<SearchFormValues>) {
    e.preventDefault();
    const effective = overrides ? { ...form, ...overrides } : form;
    if (overrides) setForm(effective);
    doSearch(effective, targetPage);
  }

  // Class/quota live on FiltersBar, not the search form — picking a new one
  // asks the backend again for this same from/to/date (fares and seat status
  // are class/quota-specific), but keeps whatever sort/connections/etc. the
  // person already picked instead of resetting them.
  function refineByClassQuota(next: { travelClass?: string; quota?: string }) {
    const effective = { ...form, ...next };
    setForm(effective);
    doSearch(effective, 1, { resetFilters: false, asRefine: true });
  }

  function goToPage(p: number) {
    doSearch(form, p, { resetFilters: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const ranked = data?.results ?? null;

  const fareCeiling = useMemo(() => (ranked ? maxFareInSet(ranked.all) : 0), [ranked]);
  const durationCeiling = useMemo(() => (ranked ? maxDurationInSet(ranked.all) : 0), [ranked]);

  const filtered = useMemo(() => {
    if (!ranked) return [];
    return applyFilters(ranked.all, filters);
  }, [ranked, filters]);

  const restOfList = useMemo(() => {
    if (!ranked) return [];
    return filtered.filter((j) => j !== ranked.bestOverall);
  }, [filtered, ranked]);

  const anyLoading = loading || multiLoading;

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-10 sm:px-6">
      <header className="mb-6 border-b border-border pb-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet">Wayvia · journey discovery</div>
        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          You tell us where. We find the best way there.
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          Not just the direct train — we explore connecting routes through nearby junctions too, check live seat
          availability, and rank every real option by price, time, and reliability. Adding a stop turns this into a
          multi-city trip, searched leg by leg.
        </p>
      </header>

      <SearchForm
        values={form}
        onChange={setForm}
        extraStops={extraStops}
        onExtraStopsChange={setExtraStops}
        onSubmit={() => doSearch(form, 1)}
        onSubmitMulti={(legs) => doMultiSearch(legs)}
        loading={anyLoading}
      />

      {(error || multiError) && (
        <div className="mb-5 rounded-lg border border-signal-red/30 border-l-4 border-l-signal-red bg-signal-red-soft/60 px-5 py-4">
          <div className="font-display text-[15px] font-semibold text-ink">That search hit a snag — no worries, it&rsquo;s not you.</div>
          <div className="mt-1 text-[13px] leading-relaxed text-ink-muted">{error || multiError}</div>
        </div>
      )}

      {loading && !data && !error && (
        <NarrativeBanner
          tone="info"
          narrative={{
            headline: "Checking direct trains and nearby junctions at the same time…",
            detail: "We don't wait to see if direct trains are thin before looking at alternatives — both are checked together, every time.",
          }}
        />
      )}

      {multiLoading && !multiData && !multiError && (
        <NarrativeBanner
          tone="info"
          narrative={{
            headline: "Searching every leg of this trip at the same time…",
            detail: "Each stop is checked independently — direct trains and junction connections together — so the whole itinerary comes back at once.",
          }}
        />
      )}

      {multiData && !multiError && (
        <MultiLegResults key={multiVersion} initial={multiData} maxHubs={form.maxHubs} maxConnections={form.maxConnections} pageSize={PAGE_SIZE} />
      )}

      {data && !error && (
        <>
          <StatsStrip data={data} />

          {data.narrative && <NarrativeBanner narrative={data.narrative} tone={ranked ? "clear" : "empty"} />}

          {data.suggestion && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-ring bg-violet-soft/40 px-5 py-3.5">
              <div className="text-[13px] leading-relaxed text-ink">{data.suggestion.message}</div>
              <button
                type="button"
                disabled={loading}
                onClick={() => runSearch({ preventDefault() {} } as React.FormEvent, 1, { maxConnections: data.suggestion!.nextConnections })}
                className="shrink-0 rounded-full bg-violet px-4 py-2 font-display text-[12.5px] font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-50"
              >
                Search via {data.suggestion.nextConnections} junctions
              </button>
            </div>
          )}

          {!ranked && <EmptyState from={data.from} to={data.to} partialCount={data.partial?.length ?? 0} />}

          {page === 1 && data.partial && data.partial.length > 0 && (
            <section className="mb-6">
              <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                Partway-there matches — real trains covering part of this route
              </div>
              <div className="space-y-3">
                {data.partial.map((p, i) => (
                  <PartialMatchCard key={`${p.type}-${p.hub}-${p.leg.trainNo}-${i}`} match={p} />
                ))}
              </div>
            </section>
          )}

          {ranked && (
            <>
              {page === 1 && (
                <section className="mb-6">
                  <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted">Your best match</div>
                  <JourneyCard journey={ranked.bestOverall} tag="Best overall" />
                </section>
              )}

              {(ranked.all.length > 1 || (data.pagination && data.pagination.total > 1)) && (
                <>
                  <ModeSelector value={filters.transport} onChange={(transport) => setFilters({ ...filters, transport })} />

                  <FiltersBar
                    filters={filters}
                    onChange={setFilters}
                    fareCeiling={fareCeiling}
                    durationCeiling={durationCeiling}
                    resultCount={filtered.length}
                    travelClass={form.travelClass}
                    quota={form.quota}
                    onRefine={refineByClassQuota}
                    refining={refining}
                  />

                  <section>
                    <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                      {restOfList.length > 0 ? "Other ways to get there" : "No other options match these filters"}
                    </div>
                    <div className="space-y-3">
                      {(page === 1 ? restOfList : filtered).map((j, i) => (
                        <JourneyCard key={i} journey={j} tag={tagFor(j, ranked)} />
                      ))}
                    </div>
                  </section>

                  {data.pagination && (
                    <>
                      <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={goToPage} disabled={loading} />
                      <div className="mt-2 text-center font-mono text-[11px] text-ink-dim">
                        {data.pagination.total} total route{data.pagination.total === 1 ? "" : "s"} found · page {data.pagination.page} of {data.pagination.totalPages}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      <p className="mt-10 border-t border-border pt-5 text-[12px] leading-relaxed text-ink-dim">
        Direct trains and junction-connection routes are always searched together — never one only after the other looks
        thin. Seat availability and fare come live from s.erail.in. Bus and flight results will slot in as additional
        modes above once wired up, alongside the same train alternatives shown here.
      </p>
    </main>
  );
}