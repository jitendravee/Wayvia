import type { GtfsFeedConfig } from "./types";

/**
 * Configured GTFS static sources — city, state, and interstate operators
 * all live in this one list, distinguished only by the `scope` field (see
 * lib/gtfs/types.ts). Every entry needs a stable, publicly-fetchable .zip
 * URL — no login, no API key, no session cookie. Add a new operator by
 * adding one entry; nothing else in the loading/search/merge pipeline
 * needs to change regardless of which scope it is.
 *
 * IMPORTANT — what's realistically available right now: freely, publicly
 * downloadable GTFS static feeds for Indian bus operators are rarer than
 * you'd expect, and this got specifically checked rather than assumed:
 *
 *  - City operators: several exist and are usable (see the two entries
 *    below).
 *  - STATE operators (KSRTC, TNSTC, TSRTC, APSRTC, MSRTC, Kerala KSRTC,
 *    Rajasthan Roadways, ...): none found with a public, no-auth .zip.
 *    Karnataka's KSRTC (mitra.ksrtc.in) is the closest — it DOES publish
 *    GTFS, but only after a manual, ID-verified access-agreement request;
 *    there's no plain public URL to put here until that request is made
 *    and approved by a real person on your team (see the commented-out
 *    placeholder below — drop the resulting URL in and it works
 *    immediately, same code path as everything else).
 *  - INTERSTATE operators (private Volvo/sleeper consortiums, or any
 *    state STU's own interstate routes): none found published as GTFS at
 *    all — this is genuinely unpublished data industry-wide, not
 *    something gated behind a request form the way KSRTC's state feed is.
 *    ixigo (lib/providers/ixigoBus.ts, already wired into the provider
 *    registry below) remains the only real interstate/intercity source
 *    until that changes.
 *
 * The two entries actually live here are confirmed reachable (HTTP 200,
 * no auth) as of this writing, and are CITY scope — their routes stay
 * within one metro area:
 *
 *  - BMTC (Bengaluru, Karnataka) — community-maintained, scraped from the
 *    Namma BMTC app: https://github.com/Vonter/bmtc-gtfs
 *  - Chennai (Tamil Nadu) — community-maintained unified feed, explicitly
 *    excludes intercity/mofussil KSRTC-style routes by the publisher's
 *    own description: https://github.com/ungalsoththu/ChennaiGTFS
 */
export const GTFS_FEEDS: GtfsFeedConfig[] = [
  {
    id: "bmtc",
    name: "BMTC",
    state: "Karnataka",
    scope: "city",
    url: "https://raw.githubusercontent.com/Vonter/bmtc-gtfs/main/gtfs/bmtc.zip",
    cityAliases: ["bengaluru", "bangalore", "blr"],
    hubStopHints: ["kempegowda bus station", "majestic", "kbs"],
  },
  {
    id: "chennai",
    name: "Chennai GTFS",
    state: "Tamil Nadu",
    scope: "city",
    url: "https://raw.githubusercontent.com/ungalsoththu/ChennaiGTFS/main/data/chennai-unified-gtfs.zip",
    cityAliases: ["chennai", "madras"],
    hubStopHints: ["mgr central", "central station", "koyambedu"],
  },

  // --- STATE scope — none live yet. The closest real path is below. ---
  // {
  //   id: "ksrtc-state",
  //   name: "KSRTC (Karnataka state-wide)",
  //   state: "Karnataka",
  //   scope: "state",
  //   // Obtain via mitra.ksrtc.in's Open Data access-agreement request —
  //   // not a public URL until that's been submitted and approved.
  //   url: "https://REPLACE-WITH-APPROVED-KSRTC-GTFS-URL/gtfs.zip",
  //   cityAliases: ["karnataka"],
  // },

  // --- INTERSTATE scope — no published source found industry-wide. ---
  // Add one here the moment a real operator/consortium publishes GTFS;
  // same shape, same code path, no other change needed.
];
