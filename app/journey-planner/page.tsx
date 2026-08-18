"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ModeSelector from "../components/ModeSelector";
import SearchForm, { SearchFormValues } from "../components/SearchForm";
import NarrativeBanner from "../components/NarrativeBanner";
import EmptyState from "../components/EmptyState";
import StatsStrip from "../components/StatsStrip";
import JourneyCard from "../components/JourneyCard";
import FiltersBar from "../components/FiltersBar";
import Pagination from "../components/Pagination";
import { applyFilters, DEFAULT_FILTERS, FilterState, maxFareInSet } from "../components/filters";
import { SearchResponse, AnnotatedJourney, RankedResults } from "../types";

const todayIso = () => new Date().toISOString().slice(0, 10);
const PAGE_SIZE = 10;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PageInner />
    </Suspense>
  );
}

export function PageInner() {
  const [form, setForm] = useState<SearchFormValues>({
    from: "NDLS",
    to: "BCT",
    date: todayIso(),
    travelClass: "3A",
    quota: "GN",
    maxHubs: 10,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();

  useEffect(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from || to) {
      setForm((f) => ({ ...f, ...(from ? { from: from.toUpperCase() } : {}), ...(to ? { to: to.toUpperCase() } : {}) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(e: React.FormEvent, targetPage = 1) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (targetPage === 1) setFilters(DEFAULT_FILTERS);
    try {
      const params = new URLSearchParams({
        from: form.from,
        to: form.to,
        date: form.date,
        class: form.travelClass,
        quota: form.quota,
        maxHubs: String(form.maxHubs),
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
    }
  }

  function goToPage(p: number) {
    runSearch({ preventDefault() {} } as React.FormEvent, p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const ranked = data?.results ?? null;

  const fareCeiling = useMemo(() => (ranked ? maxFareInSet(ranked.all) : 0), [ranked]);

  const filtered = useMemo(() => {
    if (!ranked) return [];
    return applyFilters(ranked.all, filters);
  }, [ranked, filters]);

  const restOfList = useMemo(() => {
    if (!ranked) return [];
    return filtered.filter((j) => j !== ranked.bestOverall);
  }, [filtered, ranked]);

  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 pt-10 sm:px-6">
      <header className="mb-6 border-b border-border pb-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet">Wayvia · journey discovery</div>
        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          You tell us where. We find the best way there.
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          Not just the direct train — we explore connecting routes through nearby junctions too, check live seat
          availability, and rank every real option by price, time, and reliability.
        </p>
      </header>

      <ModeSelector />

      <SearchForm values={form} onChange={setForm} onSubmit={(e) => runSearch(e, 1)} loading={loading} />

      {error && (
        <div className="mb-5 rounded-lg border border-signal-red/30 border-l-4 border-l-signal-red bg-signal-red-soft/60 px-5 py-4">
          <div className="font-display text-[15px] font-semibold text-ink">That search hit a snag — no worries, it&rsquo;s not you.</div>
          <div className="mt-1 text-[13px] leading-relaxed text-ink-muted">{error}</div>
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

      {data && !error && (
        <>
          <StatsStrip data={data} />

          {data.narrative && <NarrativeBanner narrative={data.narrative} tone={ranked ? "clear" : "empty"} />}

          {!ranked && <EmptyState from={data.from} to={data.to} />}

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
                  <FiltersBar filters={filters} onChange={setFilters} fareCeiling={fareCeiling} resultCount={filtered.length} />

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

function tagFor(journey: AnnotatedJourney, ranked: RankedResults): string | undefined {
  if (ranked.cheapest && journey === ranked.cheapest) return "Cheapest";
  if (journey === ranked.fastest) return "Fastest";
  if (journey === ranked.easiest) return "Fewest changes";
  if (journey === ranked.mostReliable && journey.fullyConfirmed) return "Fully confirmed backup";
  return journey.connections === 0 ? "Direct backup" : "Backup route";
}
