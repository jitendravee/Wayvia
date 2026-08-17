# Journey Recovery Engine — live erail.in edition

One Next.js app (no separate backend) that discovers alternate train
journeys — direct, then via hub stations if direct is thin — and checks
real seat availability + fare via `s.erail.in/getvalue`.

## What's verified vs. not

**Verified in this build environment** (no network access to erail.in here,
so verification was done differently for each piece):

- `lib/erail/prettify.ts` — ported line-for-line from the parser you supplied.
  Not independently re-tested against a fresh live response (couldn't reach
  erail.in from here), but it's a faithful port, not a rewrite.
- `lib/erail/avl.ts` (`parseAvlResponse`) — **tested against your actual
  captured sample** in `scripts/test-avl-parser.ts`. Run `npx ts-node
  scripts/test-avl-parser.ts` to see it: 11/11 checks pass, and a second
  pass over your full ~90-entry sample parses all of it with zero
  `UNKNOWN` categories.
- `lib/erail/avl.ts` (`buildAvlRequest`) — **request shape confirmed
  against a real captured request** (you pasted a `Copy as fetch` from
  DevTools). `scripts/test-avl-request.ts` verifies the generated body is
  structurally identical: JSON body, `Action: "AVL_Data"`, `~`-joined
  `Data` with a trailing `~`, and — the detail that would've silently
  broken fares otherwise — a `_f`-suffixed variant included alongside
  every plain key, since fare data only comes back if you ask for that
  variant explicitly.
- The whole app: `npx tsc --noEmit` and `next build` both pass clean.

**Not verified — still needs a real end-to-end test where erail.in is
reachable** (this sandbox gets a 403 from the network proxy on that
domain, confirmed):

- `lib/erail/client.ts` — the fetch calls to erail.in's `getTrains.aspx`
  and `data.aspx`. Direct ports of your working Express routes, so they
  should behave the same, but not fired for real from here.
- The end-to-end `/api/search` flow — direct search, hub fan-out, and the
  AVL batch call all wired together against live data. Each piece is
  individually verified (parser against real data, request shape against
  a real capture), but the full chain hasn't run against the live site.

## Architecture

```
lib/
  erail/
    prettify.ts     ported response parser (your original logic)
    client.ts        calls erail.in's getTrains.aspx / data.aspx endpoints
    avl.ts           calls s.erail.in/getvalue, parses seat + fare data
  graph/
    types.ts         Leg / JourneyCandidate shapes
    hubs.ts           curated list of major junction stations
    discover.ts       direct search + hub-based 1-connection search
  availability.ts     batches AVL key lookups across all candidates, annotates
  score.ts            ranks into bestOverall/cheapest/fastest/easiest/confirmedOnly

app/
  api/
    erail/*/route.ts  thin wrappers over each erail.in endpoint (for manual testing)
    search/route.ts   orchestrates: discover -> annotate -> rank
  page.tsx            search UI, hits /api/search directly (same app, no CORS)

scripts/
  test-avl-parser.ts  regression test against your real sample AVL response
```

## The pipeline, matching what we discussed earlier

```
USER QUERY (from, to, date, class, quota)
    |
    v
DIRECT SEARCH  (erail.in betweenStations)
    |
    v
if direct results are thin (< 3):
    v
HUB FAN-OUT  (candidate junctions from lib/graph/hubs.ts,
              parallel betweenStations calls per hub,
              filtered by running-day + transfer-time feasibility)
    |
    v
STRUCTURAL CANDIDATES  (direct + via-hub, no live data touched yet)
    |
    v
BATCH AVL LOOKUP  (one request to s.erail.in/getvalue for every unique
                    train+leg+class+quota+date key across ALL candidates —
                    not one request per candidate)
    |
    v
ANNOTATED JOURNEYS  (each leg tagged: AVAILABLE / WAITLIST / RAC /
                      NOT_AVAILABLE / REGRET, plus estimated fare)
    |
    v
RANKING  (bestOverall / cheapest / fastest / easiest / confirmedOnly —
          confirmed journeys are preferred but waitlisted ones are still
          shown, never silently dropped)
```

The key architectural difference from the earlier mock-data version of
this app: there's no pre-built "master graph" table anymore, because
erail.in doesn't hand you a bulk timetable dump the way a government
dataset would. Instead, `lib/graph/hubs.ts`'s curated station list stands
in for "which stations are worth querying," and the graph is effectively
erail.in itself, queried live per search.

## Known simplifications (same spirit as before — start simple, iterate)

- **Hub list is a starting curated set** of ~27 major junctions
  (`lib/graph/hubs.ts`). It's not exhaustive and isn't geographically
  aware — it doesn't know that a hub near Chennai is useless for a
  Delhi-Mumbai search. Worth adding a distance/relevance filter later if
  the hub count grows.
- **Overnight connections assume the connecting train's running-day
  pattern doesn't need re-checking against the shifted date** — if leg 1
  arrives after midnight, leg 2 is checked against the same running_days
  string that was fetched for the original search date, not the actual
  next calendar day. Flagged in a comment in `discover.ts`.
- **Fare field semantics in the AVL fare entries are inferred, not
  documented** — `estimatedFare` reads index 8 of the underscore-split
  fare blob based on pattern-matching your sample (it consistently looked
  like the largest early-position number). Cross-check against a real
  fare quote before trusting it for anything financial.
- **Quota is hardcoded to a single value per search** (`GN` by default).
  Tatkal (`TQ`) is wired through as an option but untested.

## Running it

```bash
npm install
npm run dev
```

Then open `localhost:3000`. Try NDLS → BCT for a date within the next
few weeks (matches the sample data you gave me, so you can sanity-check
against what you already know about that response).

To test just the AVL parser without touching the network at all:

```bash
npx ts-node scripts/test-avl-parser.ts
```

To manually poke the availability endpoint:

```
GET /api/erail/avl?keys=12908_NZM_BDTS_3A_GN_17-8,12926_NDLS_BDTS_3A_GN_17-8
```

## Next steps, in order

1. Run `npm run dev` locally and try a real search end-to-end. This is the
   one thing that hasn't been tested against the live site yet — everything
   feeding into it has been verified individually.
2. Sanity-check `estimatedFare` against a real IRCTC fare quote for the
   same train/class/date to confirm (or correct) the field-8 guess — the
   request/response shape is now confirmed, but the meaning of each
   number inside a fare entry is still inferred from pattern-matching.
3. Tune `lib/graph/hubs.ts` for the regions you actually care about —
   trim it down for faster searches, or add missing junctions for your
   corridor.
4. Extend `discover.ts` to support 2-connection journeys if 1-connection
   isn't enough for longer routes (same DFS-style extension we discussed
   for the mock-data version, just with erail calls instead of DB queries).# Wayvia
