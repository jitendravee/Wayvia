"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SearchForm, {
  ALL_SEARCH_MODES,
  SearchFormValues,
} from "../components/SearchForm";
import { StopEntry } from "../components/JourneyStopsForm";
import NarrativeBanner from "../components/NarrativeBanner";
import MultiLegResults from "../components/MultiLegResults";
import { DEFAULT_FILTERS, FilterState } from "../components/filters";
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
    modes: ALL_SEARCH_MODES,
  });
  // "Add a stop" chain beyond form.to/form.date — B→C, C→D, etc. Empty means
  // this is an ordinary single-leg search — which, downstream, is just a
  // 1-leg trip, not a fundamentally different kind of result.
  const [extraStops, setExtraStops] = useState<StopEntry[]>([]);

  // SearchForm still takes a `filters`/`onFiltersChange` pair (used inside
  // the search bar itself, independent of the per-leg filters each
  // MultiLegResults tab manages on its own once results exist) — kept here
  // purely to satisfy that prop, not read anywhere else in this file.
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every search's results — a 1-leg trip (an ordinary single search) and
  // a multi-city trip are the exact same shape here, `MultiSearchResponse`.
  // There's no separate single-vs-multi state or rendering path: LegTabs
  // inside MultiLegResults simply renders nothing for a 1-leg trip, so it
  // already looks like an ordinary search result with no extra chrome.
  // `tripVersion` bumps on every new search so MultiLegResults remounts
  // with fresh internal per-leg state instead of carrying over the
  // previous trip's filters/tab/page.
  const [tripData, setTripData] = useState<MultiSearchResponse | null>(null);
  const [tripVersion, setTripVersion] = useState(0);

  const searchParams = useSearchParams();

  // Single-leg search — still hits the plain /api/search (simpler than the
  // multi endpoint's array wrapping for the common case), then wraps the
  // one result into the same MultiSearchResponse shape everything renders
  // from.
  async function doSearch(effective: SearchFormValues, targetPage = 1) {
    setLoading(true);
    setError(null);
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
        modes: effective.modes.join(","),
        // modes: "train",
      });
      const res = await fetch(`/api/search?${params}`);
      const json: SearchResponse = await res.json();
      if (!res.ok)
        throw new Error(json.error || `Request failed (${res.status})`);
      setTripData({
        legs: [
          { from: effective.from, to: effective.to, date: effective.date },
        ],
        results: [json],
      });
      setTripVersion((v) => v + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // Multi-city: A→B on date1, B→C on date2, ... — every leg is a person-
  // chosen stop, not an auto-discovered hub, so it goes to /api/search/multi
  // which just runs the same single-leg pipeline once per leg in parallel.
  async function doMultiSearch(legs: TripLeg[]) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        legs: JSON.stringify(legs),
        class: form.travelClass,
        quota: form.quota,
        maxHubs: String(form.maxHubs),
        maxConnections: String(form.maxConnections),
        pageSize: String(PAGE_SIZE),
        modes: form.modes.join(","),
        // modes: "train",

      });
      const res = await fetch(`/api/search/multi?${params}`);
      const json: MultiSearchResponse = await res.json();
      if (!res.ok)
        throw new Error(json.error || `Request failed (${res.status})`);
      setTripData(json);
      setTripVersion((v) => v + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
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
        if (
          Array.isArray(parsed) &&
          parsed.length >= 2 &&
          parsed.every((l) => l.from && l.to && l.date)
        ) {
          const cls = searchParams.get("class");
          const quota = searchParams.get("quota");
          if (cls || quota) {
            setForm((f) => ({
              ...f,
              ...(cls ? { travelClass: cls.toUpperCase() } : {}),
              ...(quota ? { quota: quota.toUpperCase() } : {}),
            }));
          }
          setExtraStops(
            parsed
              .slice(1)
              .map((l, i) => ({ id: `url-${i}`, to: l.to, date: l.date })),
          );
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
    const modesRaw = searchParams.get("modes");
    const modes = modesRaw
      ? modesRaw
          .split(",")
          .map((m) => m.trim().toLowerCase())
          .filter(
            (m): m is SearchFormValues["modes"][number] =>
              m === "train" || m === "bus" || m === "flight",
          )
      : null;

    if (!from && !to && !date && !cls && !quota && !modes) return;

    const effective: SearchFormValues = {
      ...form,
      ...(from ? { from: from.toUpperCase() } : {}),
      ...(to ? { to: to.toUpperCase() } : {}),
      ...(date ? { date } : {}),
      ...(cls ? { travelClass: cls.toUpperCase() } : {}),
      ...(quota ? { quota: quota.toUpperCase() } : {}),
      ...(modes && modes.length > 0 ? { modes } : {}),
    };
    setForm(effective);

    if (effective.from && effective.to && effective.date) {
      doSearch(effective, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto md:mx-10 px-5 pb-24 pt-10 sm:px-6">
      <SearchForm
        values={form}
        onChange={setForm}
        filters={filters}
        onFiltersChange={setFilters}
        extraStops={extraStops}
        onExtraStopsChange={setExtraStops}
        onSubmit={() => doSearch(form, 1)}
        onSubmitMulti={(legs) => doMultiSearch(legs)}
        loading={loading}
      />

      {error && (
        <div className="mb-5 rounded-lg border border-signal-red/30 border-l-4 border-l-signal-red bg-signal-red-soft/60 px-5 py-4">
          <div className="font-display text-[15px] font-semibold text-ink">
            That search hit a snag — no worries, it&rsquo;s not you.
          </div>
          <div className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            {error}
          </div>
        </div>
      )}

      {loading && !tripData && !error && (
        <NarrativeBanner
          tone="info"
          narrative={{
            headline:
              "Checking direct trains and nearby junctions at the same time…",
            detail:
              "We don't wait to see if direct trains are thin before looking at alternatives — both are checked together, every time.",
          }}
        />
      )}

      {tripData && !error && (
        <MultiLegResults
          key={tripVersion}
          initial={tripData}
          maxHubs={form.maxHubs}
          maxConnections={form.maxConnections}
          pageSize={PAGE_SIZE}
        />
      )}

      <p className="mt-10 border-t border-border pt-5 text-[12px] leading-relaxed text-ink-dim">
        Direct trains and junction-connection routes are always searched
        together — never one only after the other looks thin. Seat availability
        and fare come live from s.erail.in. Bus and flight results will slot in
        as additional modes above once wired up, alongside the same train
        alternatives shown here.
      </p>
    </main>
  );
}
