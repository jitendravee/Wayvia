import type { IxigoAutocompleteResult, IxigoGetBusListResponse, IxigoFlightResponse } from "./types";

/**
 * Bus-specific headers — used for GetBusList and (tentatively) the
 * autocompleter, matching what ixigo.com/buses' own frontend sends.
 */
const IXIGO_BUS_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Content-Type": "application/json",
  "x-app-name": "ixibusweb",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.ixigo.com/buses",
  Origin: "https://www.ixigo.com",
};

/**
 * Flight-specific headers — the flight fare-calendar endpoint
 * (outlook/v1/onward/ranged) wants ixigo's flight-site identity, in
 * particular the `apikey` header and a referer that looks like a real
 * flight search results page.
 */
const IXIGO_FLIGHT_HEADERS = {
  Accept: "application/json",
  apikey: "ixiweb!2$",
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
};

const AUTOCOMPLETE_URL = "https://www.ixigo.com/abus-autocompleter/api/v1/results";
const BUS_LIST_URL = "https://www.ixigo.com/wap/GetBusList";

// ---------------------------------------------------------------------
// Concurrency + rate-limit control.
//
// The graph search (lib/journey/graphSearch.ts) fans out into dozens of
// hub-to-hub candidate legs and calls each provider once per leg, all
// roughly simultaneously (see the "viaTwoHub: 62933" candidate count in
// logs — even after structural dedupe, the *provider call* count per
// search can be in the dozens). ixigo's real edge rate limit has no
// interest in why we're calling it that fast, so we cap concurrency and
// back off on 429 here rather than trying to fix it at every call site.
// ---------------------------------------------------------------------

class Semaphore {
  private active = 0;
  private queue: Array<() => void> = [];
  constructor(private readonly max: number) {}

  async acquire(): Promise<() => void> {
    if (this.active < this.max) {
      this.active++;
      return () => this.release();
    }
    return new Promise<() => void>((resolve) => {
      this.queue.push(() => {
        this.active++;
        resolve(() => this.release());
      });
    });
  }

  private release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }
}

// At most this many concurrent requests to ixigo across flight+bus+autocomplete
// combined. Tune down further if 429s persist, up if ixigo tolerates more.
const ixigoSemaphore = new Semaphore(4);

async function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
  const release = await ixigoSemaphore.acquire();
  try {
    return await fn();
  } finally {
    release();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** fetch() that retries on 429 with exponential backoff + jitter, honoring Retry-After if present. */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let attempt = 0;
  for (;;) {
    const res = await fetch(url, options);
    if (res.status !== 429 || attempt >= maxRetries) return res;
    attempt++;
    const retryAfter = res.headers.get("retry-after");
    const backoffMs = retryAfter ? Number(retryAfter) * 1000 : Math.min(1500 * 2 ** attempt, 12000);
    await sleep(backoffMs + Math.random() * 300);
  }
}

// ---------------------------------------------------------------------
// Request dedup / short-TTL cache.
//
// Different graph paths frequently resolve to the *same* origin/destination
// code pair (e.g. "NEW DELHI"→"MUMBAI" and "Thane"→"MUMBAI" both bottom out
// near DEL/BOM once hub expansion converges) and re-query it independently.
// This collapses concurrent/duplicate identical requests into one real call,
// and caches the result briefly so near-simultaneous callers reuse it.
// ---------------------------------------------------------------------

const FLIGHT_CACHE_TTL_MS = 60_000;
const flightCache = new Map<string, { expiresAt: number; value: IxigoFlightResponse }>();
const flightInflight = new Map<string, Promise<IxigoFlightResponse>>();

const BUS_CACHE_TTL_MS = 60_000;
const busCache = new Map<string, { expiresAt: number; value: IxigoGetBusListResponse }>();
const busInflight = new Map<string, Promise<IxigoGetBusListResponse>>();

function buildFlightReferer(params: Record<string, string>): string {
  const rawDate = params.departureDate ?? "";
  const compactDate = rawDate.includes("-") ? rawDate.split("-").join("") : rawDate;

  const qs = new URLSearchParams({
    from: params.origin ?? "",
    to: params.destination ?? "",
    date: compactDate,
    adults: "1",
    children: "0",
    infants: "0",
    class: params.fareClass ?? "e",
    source: "Search Form",
  });

  return `https://www.ixigo.com/search/result/flight?${qs.toString()}`;
}

/** City/place search — same endpoint the ixigo.com search box itself calls. Never throws; a bad/empty query or a network hiccup just returns []. */
export async function ixigoAutocomplete(query: string): Promise<IxigoAutocompleteResult[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await withConcurrencyLimit(() =>
      fetchWithRetry(`${AUTOCOMPLETE_URL}?s=${encodeURIComponent(q)}`, { headers: IXIGO_BUS_HEADERS })
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as IxigoAutocompleteResult[]) : [];
  } catch (err) {
    console.error("ixigoAutocomplete failed:", err);
    return [];
  }
}

/**
 * Bus service search. UNLIKE ixigoAutocomplete, this one DOES throw on
 * failure — a failed bus search needs to be distinguishable from "zero
 * buses on this route" by the caller (lib/providers/ixigoBus.ts), which
 * decides for itself whether to fail soft.
 */
export async function ixigoGetBusList(body: Record<string, unknown>): Promise<IxigoGetBusListResponse> {
  const key = JSON.stringify(body);

  const cached = busCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const inflight = busInflight.get(key);
  if (inflight) return inflight;

  const promise = withConcurrencyLimit(async () => {
    const res = await fetchWithRetry(BUS_LIST_URL, {
      method: "POST",
      headers: IXIGO_BUS_HEADERS,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`ixigo GetBusList failed with status ${res.status}`);
    const value = (await res.json()) as IxigoGetBusListResponse;
    busCache.set(key, { expiresAt: Date.now() + BUS_CACHE_TTL_MS, value });
    return value;
  }).finally(() => {
    busInflight.delete(key);
  });

  busInflight.set(key, promise);
  return promise;
}

/**
 * Flight fare calendar search. Returns a list of fares for each day in a
 * range. Note: this endpoint does not return flight times; times must be
 * obtained from another endpoint or assumed. For now, we leave times as
 * placeholders and rely on the fare and availability.
 */
export async function ixigoGetFlightList(params: Record<string, string>): Promise<IxigoFlightResponse> {
  const key = new URLSearchParams(params).toString();

  const cached = flightCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const inflight = flightInflight.get(key);
  if (inflight) return inflight;

  const promise = withConcurrencyLimit(async () => {
    const url = `https://www.ixigo.com/outlook/v1/onward/ranged?${key}`;
    const res = await fetchWithRetry(url, {
      headers: {
        ...IXIGO_FLIGHT_HEADERS,
        Referer: buildFlightReferer(params),
      },
    });
    if (!res.ok) throw new Error(`ixigo flight list failed with status ${res.status}`);
    const value = (await res.json()) as IxigoFlightResponse;
    flightCache.set(key, { expiresAt: Date.now() + FLIGHT_CACHE_TTL_MS, value });
    return value;
  }).finally(() => {
    flightInflight.delete(key);
  });

  flightInflight.set(key, promise);
  return promise;
}