/**
 * All blog content lives here. Add a new post by pushing another object
 * into BLOG_POSTS — every page and component (listing grid, detail page,
 * related-articles, sidebar, etc.) reads from this file and needs no
 * further changes.
 *
 * SEO note: `keywords` on each post is meant to be wired into that post's
 * generateMetadata() as `keywords: post.keywords` — the detail page
 * currently only sets title/description/openGraph, so add that one line
 * when you're ready to have it actually emitted into <meta name="keywords">
 * and considered by generateMetadata. Every post's `excerpt` also doubles
 * as its meta description, so it's written to read naturally AND lead with
 * the primary keyword phrase.
 *
 * 2026-09-05 content pass: added a cluster of posts targeting high-intent,
 * currently under-served Indian-rail search queries (chart preparation
 * timing, Vikalp scheme, Premium Tatkal vs Tatkal, child ticket rules,
 * duplicate/lost ticket rules, UTS unreserved-ticket app, and passenger
 * rights). These sit alongside the existing PNR/waitlist/Tatkal cluster
 * and cross-link into it via relatedSlugs so search + internal linking
 * reinforce each other. Facts were checked against multiple current
 * sources at time of writing; Indian Railways rules (refund windows,
 * chart timing, quotas) get revised periodically, so each post keeps a
 * light "verify on irctc.co.in" caveat rather than over-committing to a
 * single number that may drift.
 *
 * 2026-09-06 content pass: added an India Fort Travel cluster — a pillar
 * "best forts in India" guide plus route-specific posts (Rajasthan fort
 * circuit, Amer Fort access guide, Jaipur fort circuit, forts near Delhi,
 * fort trips by train) — deliberately cross-linked into the existing
 * PNR/WL/Vikalp cluster, since anyone planning a Rajasthan fort trip is a
 * near-certain match for "is my train to Jaipur/Jodhpur going to
 * confirm" searches. Specific ticket prices, exact timings and jeep/taxi
 * fares are intentionally left out or kept general — these change often
 * and should be verified against official sources (ASI/state tourism
 * sites) close to publish, rather than hard-coded here.
 */

export type BlogCategory =
  | "travel-guides"
  | "route-ideas"
  | "rail"
  | "bus"
  | "flights"
  | "wayvia"
  | "tips";

/** Pill label shown in the category filter row on the blog listing page. */
export const CATEGORY_PILL_LABEL: Record<BlogCategory, string> = {
  "travel-guides": "Travel Guides",
  "route-ideas": "Route Ideas",
  rail: "Rail",
  bus: "Bus",
  flights: "Flights",
  wayvia: "Wayvia",
  tips: "Tips",
};

/** Small badge label shown on each post card (e.g. "TRAVEL TIPS", "ROUTE GUIDE"). */
export const CATEGORY_BADGE_LABEL: Record<BlogCategory, string> = {
  "travel-guides": "Travel Guide",
  "route-ideas": "Route Guide",
  rail: "Rail",
  bus: "Bus",
  flights: "Flights",
  wayvia: "Wayvia",
  tips: "Travel Tips",
};

export interface BlogAuthor {
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export const DEFAULT_AUTHOR: BlogAuthor = {
  name: "Arjun Mehta",
  role: "Travel Writer at Wayvia",
  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
  bio: "Arjun loves exploring new places and helping travellers discover smarter ways to travel.",
};

/**
 * The article body is a list of blocks rendered in order by ArticleBody.
 * Headings automatically become numbered Table of Contents entries — give
 * every heading a stable, unique `id` (used as the scroll anchor).
 */
export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; id: string; text: string }
  | { type: "checklist"; items: string[] }
  | { type: "tip"; text: string }
  | { type: "modes"; items: { icon: "train-bus" | "flight-train" | "bus"; title: string; description: string }[] }
  | { type: "cta"; label: string; href: string };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  category: BlogCategory;
  readTime: string;
  /** ISO date, e.g. "2026-08-26". */
  date: string;
  featured?: boolean;
  author: BlogAuthor;
  content: ContentBlock[];
  /** Explicit related-post slugs. When omitted, the detail page falls back to other posts in the same category. */
  relatedSlugs?: string[];
  /** Target search phrases this post is written for — wire into generateMetadata's `keywords` field. */
  keywords?: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-to-do-when-your-train-is-fully-booked",
    title: "What to do when your train is fully booked",
    excerpt:
      "Smart alternatives, fallback routes and insider tips to help you reach your destination — even when plans change.",
    coverImage: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "7 min read",
    date: "2026-08-27",
    featured: true,
    author: DEFAULT_AUTHOR,
    keywords: [
      "train fully booked what to do",
      "alternative when train tickets not available",
      "no seats available train india",
      "how to travel when train is waitlisted",
    ],
    relatedSlugs: [
      "pnr-status-explained-cnf-rac-wl-meaning",
      "waitlist-ticket-confirmation-chances-explained",
      "vikalp-scheme-alternate-train-explained",
      "fort-trip-train-waitlisted-alternative-routes",
      "delhi-to-goa-7-ways-to-get-there",
      "how-to-find-cheaper-flight-train-combos",
    ],
    content: [
      {
        type: "paragraph",
        text: "We've all been there. You finally decide to take that trip, open the booking app, search for trains… and everything is WL 200+ or RAC. Frustrating, right?",
      },
      {
        type: "paragraph",
        text: "The good news is: a fully booked train doesn't mean a canceled trip. It just means you need to look at the journey differently.",
      },
      {
        type: "paragraph",
        text: "Here's how you can still reach your destination — smoothly, affordably, and sometimes even faster.",
      },
      { type: "heading", id: "check-alternate-trains-and-classes", text: "1. Check alternate trains and classes" },
      { type: "paragraph", text: "Sometimes the same train has seats in a different class or quota." },
      {
        type: "checklist",
        items: [
          "Check 3AC / 2AC if 3E is full.",
          "Look for tatkal, premium tatkal, and foreign tourist quota.",
          "Check nearby departure stations.",
        ],
      },
      { type: "tip", text: "Trains running at non-peak times (early morning or late night) have higher availability." },
      { type: "heading", id: "consider-nearby-stations", text: "2. Consider nearby stations" },
      {
        type: "paragraph",
        text: "A small change in boarding or destination station can open up many options. Use Wayvia to explore trains from stations near you. You might find a seat just 30–50 km away.",
      },
      { type: "heading", id: "try-alternative-modes", text: "3. Try alternative modes" },
      { type: "paragraph", text: "Mixing modes can unlock seat availability and better prices." },
      {
        type: "modes",
        items: [
          { icon: "train-bus", title: "Train + Bus", description: "Take a train till the nearest major city and continue by bus." },
          { icon: "flight-train", title: "Flight + Train", description: "Fly to a nearby city and take a short train connect." },
          { icon: "bus", title: "Bus Direct", description: "Overnight buses can be comfortable and budget-friendly." },
        ],
      },
      { type: "tip", text: "Wayvia finds thousands of combinations so you don't have to." },
      { type: "heading", id: "be-flexible-with-dates", text: "4. Be flexible with dates" },
      {
        type: "paragraph",
        text: "Traveling a day earlier or later can make a huge difference. Even 24 hours can open up confirmed seats.",
      },
      { type: "heading", id: "use-wayvia-to-find-better-ways", text: "5. Use Wayvia to find better ways" },
      {
        type: "paragraph",
        text: "Wayvia searches across trains, buses, flights and nearby stations to show you the best possible ways to reach your destination.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* High-intent booking & status guides — these target the biggest      */
  /* recurring search queries in Indian rail travel (PNR/waitlist        */
  /* terminology, Tatkal rules, festival rush, senior citizen status).   */
  /* ------------------------------------------------------------------ */
  {
    slug: "pnr-status-explained-cnf-rac-wl-meaning",
    title: "PNR status explained: what CNF, RAC, WL, GNWL, PQWL, RLWL and TQWL mean",
    excerpt:
      "PNR status meaning, explained simply: what CNF, RAC, WL, GNWL, PQWL, RLWL and TQWL actually mean on your ticket, and how to check your status.",
    coverImage: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-26",
    author: DEFAULT_AUTHOR,
    keywords: [
      "pnr status meaning",
      "what does rac mean in train ticket",
      "gnwl pqwl rlwl meaning",
      "cnf meaning train ticket",
      "how to check pnr status",
      "tqwl meaning railway",
      "what is gn quota in railway",
      "what is roadside waitlist",
    ],
    relatedSlugs: [
      "rswl-rqwl-gn-quota-explained",
      "waitlist-ticket-confirmation-chances-explained",
      "rac-vs-waitlist-difference-explained",
      "chart-preparation-time-explained-first-second-chart",
      "train-ticket-cancellation-refund-rules-2026",
    ],
    content: [
      {
        type: "paragraph",
        text: "Every Indian Railways ticket comes with a 10-digit PNR (Passenger Name Record) number, and that number is the key to one of the most confusing parts of train travel: the status code sitting next to it. Here's what each one actually means.",
      },
      { type: "heading", id: "the-status-codes-you-will-see", text: "The status codes you'll actually see" },
      {
        type: "checklist",
        items: [
          "CNF — Confirmed. You have a specific coach and berth number. You're travelling.",
          "RAC — Reservation Against Cancellation. You're guaranteed a seat, sharing a side-lower berth with one other passenger, and can board the train as-is.",
          "WL — Waitlisted. You don't have a seat or berth yet. You're in a queue that moves as confirmed passengers cancel.",
          "CAN — Cancelled. The booking has been cancelled or modified and is no longer valid.",
        ],
      },
      { type: "heading", id: "gnwl-pqwl-rlwl-tqwl-difference", text: "GNWL, PQWL, RLWL, TQWL — what's the difference" },
      {
        type: "paragraph",
        text: "\"Waitlisted\" isn't one single queue — which waitlist you're on has a big effect on your odds of confirming.",
      },
      {
        type: "checklist",
        items: [
          "GNWL (General Waitlist) — for passengers boarding at or near the train's originating station, booked under the General (GN) quota. This pool usually has the most cancellations, so it generally confirms best.",
          "PQWL (Pooled Quota Waitlist) — for journeys between two intermediate stations sharing a pooled quota, separate from the general quota.",
          "RLWL (Remote Location Waitlist) — a quota reserved for a specific station along the route. It only moves when passengers booked under that same quota cancel, so it can be slower to clear than GNWL.",
          "TQWL (Tatkal Waitlist) — a waitlist within the Tatkal quota itself. Because the Tatkal quota is small and booked a day before travel, TQWL tickets have the lowest confirmation chances of the four.",
        ],
      },
      {
        type: "paragraph",
        text: "There are a couple of rarer codes worth knowing too: RSWL (Roadside Waitlist, for tickets booked from the originating station to a smaller roadside stop) and RQWL (Request Waitlist, for journeys between two intermediate stations that don't fall under any quota). Both tend to confirm less often than GNWL — we cover them in more detail in our RSWL and GN quota guide.",
      },
      { type: "tip", text: "Between two waitlisted tickets with the same number, GNWL is almost always the safer bet — check which type yours is, not just the number." },
      { type: "heading", id: "how-to-check-your-pnr-status", text: "How to check your PNR status" },
      {
        type: "paragraph",
        text: "You can check it on the IRCTC website or app, by sending an SMS with \"PNR\" followed by your 10-digit number to 139, or by calling 139 and following the prompts. Most third-party train-status apps show the same data, often alongside a waitlist-confirmation estimate.",
      },
      {
        type: "paragraph",
        text: "One important rule: once the chart is prepared — typically a few hours before departure — any ticket still showing WL is automatically cancelled and refunded (minus a small clerkage charge). A ticket that says CAN or is still WL after chart preparation means you cannot board that train. Our chart preparation guide walks through exactly when that happens for your train.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "rswl-rqwl-gn-quota-explained",
    title: "RSWL, RQWL and GN quota explained: the waitlist codes most guides skip",
    excerpt:
      "What is roadside waitlist (RSWL)? What is GN quota in railway bookings? A clear breakdown of RSWL, RQWL and General quota — and how they differ from GNWL.",
    coverImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "5 min read",
    date: "2026-08-31",
    author: DEFAULT_AUTHOR,
    keywords: [
      "what is roadside waitlist",
      "rswl full form",
      "rs waiting list",
      "what is gn quota in railway",
      "rqwl meaning",
      "roadside station waiting list confirmation chances",
    ],
    relatedSlugs: [
      "pnr-status-explained-cnf-rac-wl-meaning",
      "waitlist-confirmation-prediction-and-trends",
      "rac-vs-waitlist-difference-explained",
    ],
    content: [
      {
        type: "paragraph",
        text: "Most PNR guides cover CNF, RAC, GNWL, PQWL, RLWL and TQWL and stop there — but two more codes show up often enough to confuse people: RSWL and RQWL. Both are waitlist types, and both are worth understanding before you assume the worst about your ticket.",
      },
      { type: "heading", id: "what-is-rswl", text: "RSWL: Roadside (Station) Waitlist" },
      {
        type: "paragraph",
        text: "RSWL stands for Roadside Waitlist (also written as Roadside Station Waitlist). It applies to tickets booked from the train's originating station through to a smaller \"roadside\" stop further down the route — a station that doesn't have its own large seat allocation.",
      },
      {
        type: "checklist",
        items: [
          "RSWL tickets are allotted from a separate, smaller pool than GNWL, so they generally confirm less easily than a general-waitlist ticket for the same train.",
          "You'll see RSWL specifically when your destination (or a mid-route drop-off point) is one of these smaller stations, not a major junction.",
          "Like any waitlist, an RSWL ticket that's still unconfirmed after chart preparation is automatically cancelled — you cannot board on it.",
        ],
      },
      { type: "heading", id: "what-is-rqwl", text: "RQWL: Request Waitlist" },
      {
        type: "paragraph",
        text: "RQWL (Request Waitlist) applies when you're booking between two intermediate stations — neither the train's origin nor its final destination — for a journey that doesn't fall under any specific pooled or remote-location quota. It's generally considered one of the slowest-moving and least likely to confirm of all the waitlist types, because it only clears after every other queue ahead of it has been satisfied.",
      },
      { type: "heading", id: "what-is-gn-quota", text: "What is GN quota?" },
      {
        type: "paragraph",
        text: "GN stands for General quota — the default, largest quota on every train, open to any passenger booking the standard way (as opposed to Tatkal, Ladies, Senior Citizen, Defence, or other special quotas). If you don't explicitly pick a different quota while booking on IRCTC, General is what you're booking into by default.",
      },
      {
        type: "checklist",
        items: [
          "General (GN) quota — the default, largest allocation on the train; this is what \"GNWL\" waitlist tickets are drawn from.",
          "Tatkal (TQ) quota — a small, separate allocation released one day before travel, at a premium fare.",
          "Ladies (LD), Senior Citizen (SR), Defence (DF) and a handful of other special quotas — each with their own eligibility rules and their own (usually much smaller) seat pool.",
        ],
      },
      { type: "tip", text: "If a train shows no seats under General quota, it's always worth checking whether Ladies, Senior Citizen, or Tatkal quota still has room for your journey — these pools are booked separately and don't always run out at the same time." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
   {
    slug: "waitlist-ticket-confirmation-chances-explained",
    title: "WL Confirmation Chances 2026: Will Your Waitlist Ticket Confirm?",
    excerpt:
      "WL 8 vs WL 80 — very different odds. See WL confirmation chances by number, quota (GNWL/RLWL/PQWL) and class, plus what to do when chances look low. 2026 guide.",
    coverImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "9 min read",
    date: "2026-08-25",
    author: DEFAULT_AUTHOR,
    keywords: [
      "wl confirmation chances",
      "waitlist confirmation chances",
      "wl ticket confirmation chances",
      "wl 80 confirmation chances",
      "wl 8 confirmation chances",
      "gnwl confirmation chances",
      "rac vs waitlist",
      "will my waitlist ticket confirm",
      "wl 30 confirm hoga ya nahi",
    ],
    relatedSlugs: [
      "waitlist-confirmation-prediction-and-trends",
      "vikalp-scheme-alternate-train-explained",
      "pnr-status-explained-cnf-rac-wl-meaning",
      "rswl-rqwl-gn-quota-explained",
      "rac-vs-waitlist-difference-explained",
      "chart-preparation-time-explained-first-second-chart",
      "train-ticket-cancellation-refund-rules-2026",
      "irctc-tatkal-booking-2026-timings-rules",
    ],
    content: [
      {
        type: "paragraph",
        text: "A waitlisted ticket isn't a rejection — most waitlisted tickets on Indian Railways do end up confirming, especially at lower numbers. But WL 8 confirmation chances and WL 80 confirmation chances are very different bets. This 2026 guide shows you how to read your WL number, how quota type (GNWL, RLWL, PQWL, TQWL) changes your odds, and exactly when to wait, book a backup, or switch trains.",
      },
      { type: "heading", id: "wl-confirmation-chances-by-number", text: "WL confirmation chances by number (GNWL)" },
      {
        type: "paragraph",
        text: "For General Waiting List (GNWL) tickets on popular long-distance trains, observed confirmation patterns look roughly like this:\n\n- WL 1–5: 85–95% — almost certain to confirm\n- WL 6–15: 70–85% — good chances\n- WL 16–30: 50–70% — moderate, worth watching closely\n- WL 31–50: 25–45% — risky; have a confirmed backup ready\n- WL 51–75: 10–20% — very low; book an alternative train now\n- WL 76+: below 10% — do not depend on this ticket\n\nThese are broad, observed patterns, not official IRCTC statistics or a guarantee for any specific train — the exact route, class, day of week and season all matter more than the number alone.",
      },
      {
        type: "paragraph",
        text: "On RLWL, PQWL or TQWL, the same number confirms less often than on GNWL — quota type changes your odds almost as much as the number itself. More on that below.",
      },
      { type: "heading", id: "what-wl-gnwl-rlwl-pqwl-tqwl-mean", text: "What WL, GNWL, RLWL, PQWL and TQWL actually mean" },
      {
        type: "paragraph",
        text: "Your ticket's waitlist type matters almost as much as the number. Two tickets both showing WL 25 can have very different odds depending on whether they're GNWL, RLWL, PQWL or TQWL. Observed confirmation order, best to worst, is typically: GNWL → RLWL → PQWL → TQWL.",
      },
      {
        type: "checklist",
        items: [
          "GNWL (General Waiting List): for passengers travelling from the train's origin or major stations; largest quota, best chances.",
          "RLWL (Remote Location Waiting List): for specific intermediate stations; smaller quota, lower chances than GNWL.",
          "PQWL (Pooled Quota Waiting List): shared across multiple short-distance routes; small pool, slow movement.",
          "TQWL (Tatkal Waiting List): a waitlist within the Tatkal quota; very low confirmation chances because Tatkal bookings rarely cancel.",
          "RSWL / RQWL: niche waitlists for roadside stations and certain intermediate legs — generally the lowest confirmation priority of all. See our RSWL and GN quota guide for the full breakdown.",
        ],
      },
      { type: "heading", id: "rac-vs-waiting-list-which-is-better", text: "RAC vs Waiting List: which is better?" },
      {
        type: "paragraph",
        text: "RAC (Reservation Against Cancellation) and Waiting List are not the same thing. The key difference: RAC guarantees you can board the train — a fully waitlisted e-ticket does not.",
      },
      {
        type: "checklist",
        items: [
          "RAC: you get a shared side-lower berth and can travel as-is; if confirmed passengers cancel, RAC holders are upgraded to full berths before any WL ticket moves.",
          "WL: no seat or berth until the ticket confirms; if it's still WL after chart preparation, an e-ticket is automatically cancelled and you cannot board.",
          "Rough RAC-to-full-berth odds: RAC 1–10 is high (80–90%), RAC 11–30 is moderate (50–70%), RAC 30+ is lower — but you still travel on a shared berth either way.",
        ],
      },
      { type: "tip", text: "If you're choosing between an RAC ticket and a WL ticket further down the list, the RAC ticket is almost always the safer pick — see our full RAC vs waitlist guide for boarding-rights detail." },
      { type: "heading", id: "why-your-number-moves", text: "How waitlist confirmation actually works" },
      {
        type: "paragraph",
        text: "Every cancellation nudges the queue forward in a fixed order: a confirmed passenger cancels → their berth goes to the first RAC passenger → that RAC passenger's old spot goes to the next RAC → once all RAC passengers have full berths, the first WL passenger moves up. Cancellations cluster in two windows: a slow trickle in the days after booking opens, and a sharper burst in the final 24–48 hours before departure as indecisive travellers cancel ahead of the trip.",
      },
      {
        type: "paragraph",
        text: "Class matters too. Sleeper usually sees more cancellations than 3AC or 2AC on the same train, so a WL 30 in Sleeper often has better odds than a WL 30 in 3AC. Premium trains like Rajdhani and Shatabdi tend to have fewer cancellations, so WL numbers there can be stickier than on regular Superfast trains.",
      },
      { type: "tip", text: "Check your PNR status every day rather than once — a WL 40 dropping steadily to WL 12 over a week tells a very different story than one that hasn't moved at all. Our guide to waitlist confirmation trends and history goes deeper on tracking this." },
      { type: "heading", id: "chart-preparation-final-cutoff", text: "Chart preparation: the final cutoff for WL tickets" },
      {
        type: "paragraph",
        text: "Indian Railways typically prepares a first chart some hours before departure and a final chart much closer to departure, incorporating last-minute cancellations. If your e-ticket is still fully waitlisted after the final chart, it's automatically cancelled and refunded (minus a small clerkage charge) — you cannot board on a WL e-ticket after chart preparation. Our chart preparation guide covers the exact timing windows and what changes for CNF, RAC and WL tickets.",
      },
      { type: "heading", id: "what-to-do-if-your-chances-look-low", text: "What to do if your WL chances look low" },
      {
        type: "paragraph",
        text: "Your best move depends on your WL number, quota type, and how many days are left:\n\n- WL ≤15 on GNWL: usually worth waiting; monitor daily and keep a soft backup.\n- WL 16–30 on GNWL: moderate odds; strongly consider a confirmed backup, especially for an important trip.\n- WL 31–60 on GNWL: risky; book a confirmed alternative now and treat the WL ticket as a bonus if it clears.\n- WL 60+ on GNWL, or WL 30+ on RLWL/PQWL/TQWL: very low odds; do not depend on this ticket.\n- RAC (any number): you can already travel; only look for alternatives if the shared berth doesn't work for you.",
      },
      {
        type: "checklist",
        items: [
          "Check a different class on the same train — 3AC might be waitlisted while Sleeper still has room.",
          "Check nearby trains on the same route and date, or a nearby boarding/drop station.",
          "Opt into the Vikalp scheme, which can auto-shift you to an alternate train with available seats — see our Vikalp guide for how to set it up.",
          "If you're inside the 72-hour refund window and your WL is 50+, compare cancelling now versus waiting for auto-cancellation — our 2026 refund rules guide breaks this down.",
          "Keep a Tatkal attempt, a bus, or a flight as your realistic backup — not your first choice, but a safety net.",
        ],
      },
      { type: "heading", id: "frequently-asked-questions", text: "Frequently asked questions" },
      { type: "heading", id: "wl-8-wl-10-wl-15-confirmation-chances", text: "WL 8 / WL 10 / WL 15 confirmation chances?" },
      {
        type: "paragraph",
        text: "For GNWL on popular long-distance trains, WL 8 and WL 10 fall in the 'good chances' band (roughly 70–85%). WL 15 is borderline moderate (around 50–70%) but still often confirms, especially on weekday, non-festival travel. Monitor your PNR daily — if the number is falling steadily, odds improve.",
      },
      { type: "heading", id: "wl-30-wl-50-wl-80-confirmation-chances", text: "WL 30 / WL 50 / WL 80 confirmation chances?" },
      {
        type: "paragraph",
        text: "Broad GNWL patterns: WL 30 is moderate (roughly 40–55%) — worth watching but keep a backup. WL 50 is low (around 20–35%) — treat as a long shot. WL 80 is very low (often under 15%) — don't depend on this ticket; book an alternative. On RLWL, PQWL or TQWL, the same numbers have even lower odds.",
      },
      { type: "heading", id: "is-rac-better-than-waiting-list-faq", text: "Is RAC better than waiting list?" },
      {
        type: "paragraph",
        text: "Yes. RAC guarantees you can board the train on a shared berth, while a fully waitlisted e-ticket doesn't allow boarding if it hasn't confirmed by chart preparation. RAC holders are also upgraded to full berths before any WL ticket moves.",
      },
      { type: "heading", id: "should-i-cancel-wl-50-early-or-wait", text: "Should I cancel WL 50+ early or wait till chart?" },
      {
        type: "paragraph",
        text: "If your WL is 50+ and you're inside the 72-hour window, compare cancelling now (a 25% or 50% deduction depending on timing) against waiting for auto-cancellation, which gives a full refund minus clerkage if the ticket stays fully WL through chart. If the trend shows no movement and the trip matters, booking a confirmed alternative early is usually smarter than gambling on a high WL number.",
      },
      { type: "heading", id: "does-wl-confirm-faster-on-rajdhani-shatabdi", text: "Does WL confirm faster on Rajdhani/Shatabdi?" },
      {
        type: "paragraph",
        text: "Not necessarily. Rajdhani and Shatabdi trains often have fewer cancellations because they're premium and booked by travellers with firmer plans, which can make WL numbers on these trains stickier than on regular Superfast trains — even though the trains themselves are faster.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "waitlist-confirmation-prediction-and-trends",
    title: "Waiting List Confirmation Prediction 2026: Read the Trend, Not Just the Number",
    excerpt:
      "WL trend > snapshot. See how to read waitlist confirmation history, factors that move WL, PNR prediction % meaning, and what to do when trend looks bad. 2026 guide.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "9 min read",
    date: "2026-08-31",
    author: DEFAULT_AUTHOR,
    keywords: [
      "waiting list confirmation prediction",
      "train waiting list confirmation history",
      "waiting list trends",
      "waiting list confirmation after chart preparation",
      "wl23 meaning in train",
      "will my wl ticket confirm calculator",
      "wl confirmation probability meaning",
      "factors affecting wl confirmation",
    ],
    relatedSlugs: [
      "waitlist-ticket-confirmation-chances-explained",
      "pnr-status-explained-cnf-rac-wl-meaning",
      "rswl-rqwl-gn-quota-explained",
      "chart-preparation-time-explained-first-second-chart",
      "train-ticket-cancellation-refund-rules-2026",
      "vikalp-scheme-alternate-train-explained",
      "irctc-tatkal-booking-2026-timings-rules",
      "what-to-do-when-your-train-is-fully-booked",
    ],
    content: [
      {
        type: "paragraph",
        text: "A single WL number is a snapshot, not a prediction. If you're trying to work out whether your ticket will actually confirm, the trend over the days leading up to your trip tells you far more than the number does on any one day. \"WL23\" simply means you're the 23rd person in that particular waitlist queue — but whether that ticket confirms depends on how fast that number is falling, how many days are left, and what type of train and quota you're on.",
      },
      { type: "heading", id: "why-a-single-snapshot-misleads", text: "Why a single snapshot misleads" },
      {
        type: "paragraph",
        text: "Two tickets can both show WL 23 today and have completely different odds. One might have been WL 60 a week ago and be falling fast — a strong sign. The other might have been sitting at WL 25 for ten days with barely any movement — a warning sign. The direction and speed of movement is the real signal, not the number on any single day.",
      },
      {
        type: "paragraph",
        text: "Worked examples:\n\n- Strong trend: WL 60 → WL 45 → WL 30 → WL 18 → WL 12 over 7 days. Even though WL 12 still looks 'risky' in isolation, the steady fall suggests a good chance of confirmation.\n- Weak trend: WL 25 → WL 24 → WL 24 → WL 23 → WL 23 over 10 days. The number is barely moving, which often means the ticket will stay WL or confirm only at the very last minute, if at all.\n\nComparing these two, a WL 12 with a fast-falling trend is often a safer bet than a 'stuck' WL 23. For a sense of what any given number roughly translates to, see our guide to WL confirmation chances by number — this post is about reading the trend around that number.",
      },
      { type: "heading", id: "how-to-track-your-own-confirmation-history", text: "How to track your own confirmation history" },
      {
        type: "checklist",
        items: [
          "Check your PNR status once a day, ideally at the same time — on the IRCTC website/app, the Indian Railways enquiry site, or by SMS ('PNR <10-digit number>' to 139 — and note the number rather than just glancing and closing the app.",
          "Most third-party PNR-status apps show a short history graph of your own ticket's movement — use it instead of relying on memory.",
          "Compare your number's movement against how many days are left, not just how many people are ahead of you — a WL 40 with two weeks to go is a very different situation from a WL 40 the night before departure.",
        ],
      },
      { type: "heading", id: "what-moves-a-waitlist-and-when", text: "What actually moves a waitlist, and when" },
      {
        type: "paragraph",
        text: "Cancellations are the only thing that clears a waitlist — there's no separate 'release' of extra berths. Movement tends to cluster in two windows: a slow trickle in the days after booking opens (as people finalise plans), and a much sharper burst in the final 24–48 hours as indecisive travellers cancel ahead of the trip.",
      },
      { type: "heading", id: "factors-that-affect-wl-movement", text: "Factors that affect WL movement speed" },
      {
        type: "paragraph",
        text: "Not all waitlists move at the same speed. The same WL number can have very different odds depending on several factors:",
      },
      {
        type: "checklist",
        items: [
          "Quota type: GNWL generally moves fastest, followed by RLWL, then PQWL, then TQWL (Tatkal) — see our quota-types guide for how these compare.",
          "Route length: long-distance routes usually see more cancellations than short ones, so waitlists tend to move faster on them.",
          "Class: Sleeper class tends to have more cancellations than 3AC or 2AC on the same train.",
          "Season: non-festival periods see more flexible cancellations; festival rushes (Diwali, Chhath, summer holidays) make WL numbers stickier.",
          "Day of week: weekday trains often have more cancellations than weekend or holiday-adjacent trains.",
          "Train type: premium trains like Rajdhani and Shatabdi can have fewer cancellations than regular Superfast trains, so WL numbers there may move slower even though the trains are faster.",
        ],
      },
      { type: "heading", id: "pnr-prediction-tools-what-they-are", text: "PNR prediction tools: what they are and how they work" },
      {
        type: "paragraph",
        text: "Several third-party sites and apps offer 'PNR prediction' or 'confirmation probability' tools that show a percentage — say, an 80% chance — instead of just a WL number. In simple terms, these tools compare your WL number, route, class, quota and days left against historical patterns for similar tickets, and estimate how often such tickets confirmed in the past. An '80% confirmation probability' roughly means that in 8 out of 10 similar historical cases, the ticket confirmed.",
      },
      {
        type: "paragraph",
        text: "The limitation worth keeping in mind: these are pattern-based estimates, not official Indian Railways guarantees, and they can't account for sudden changes — a newly announced holiday, an unexpected surge in demand — that shift cancellation behaviour. Treat a prediction percentage as one useful input alongside your own trend-tracking, not the only factor in your decision.",
      },
      { type: "heading", id: "after-chart-preparation", text: "Chart preparation: the final cutoff for WL predictions" },
      {
        type: "paragraph",
        text: "Indian Railways typically prepares a first chart some hours before departure, followed by a final chart much closer to departure time; RAC and waitlisted passengers can still move into vacated berths between the two. If your e-ticket is still fully waitlisted after the final chart, it's automatically cancelled and refunded (minus a small clerkage charge) — a WL ticket cannot be used to board after this point, regardless of how close the number was. Our chart preparation guide has the fuller breakdown of both windows and what changes for CNF, RAC and WL tickets at each.",
      },
      { type: "tip", text: "If your waitlist number hasn't moved at all three or four days out, that's a stronger signal to arrange a backup than the raw number itself — a stalled WL 20 can be riskier than a fast-falling WL 45." },
      { type: "heading", id: "if-the-trend-looks-bad", text: "Decision framework: what to do based on trend and days left" },
      {
        type: "paragraph",
        text: "Your best move depends on both your WL trend and how many days are left. Use this as a practical guide, not a guarantee:",
      },
      {
        type: "checklist",
        items: [
          "Strong trend (e.g. WL 60 → WL 12 in 7 days) with more than 7 days left: usually safe to wait; keep monitoring daily.",
          "Moderate trend (e.g. WL 30 → WL 20 in 5 days) with 4–7 days left: keep watching closely, and start lining up a confirmed backup — a different class, a nearby train, or Vikalp.",
          "Weak or stuck trend (e.g. WL 40 unchanged for 3–4 days) with less than 7 days left: book a confirmed alternative now and treat the WL ticket as a bonus if it clears.",
          "Any WL 50+ with poor movement and under 72 hours left: strongly consider cancelling or switching, especially once you're inside the 24-to-8-hour refund window where deductions jump sharply — our 2026 refund rules guide breaks down exactly what you'd get back at each stage.",
        ],
      },
      {
        type: "paragraph",
        text: "Don't wait until the final chart to react. Check nearby trains, a different class on the same train, opt into the Vikalp scheme, or line up a mixed-mode alternative a few days ahead of time, so you're not scrambling at the last minute if your ticket doesn't clear.",
      },
      { type: "heading", id: "frequently-asked-questions", text: "Frequently asked questions" },
      { type: "heading", id: "how-do-i-know-if-my-wl-trend-is-good", text: "How do I know if my WL trend is good?" },
      {
        type: "paragraph",
        text: "A good trend shows steady, consistent movement over several days — for example, WL 50 → WL 30 → WL 15 over a week. A weak trend shows little or no movement despite many days passing, like WL 25 → WL 24 → WL 24 → WL 23 over 10 days. The speed of the fall matters more than the absolute number on any given day.",
      },
      { type: "heading", id: "what-does-80-confirmation-probability-mean", text: "What does 80% confirmation probability mean?" },
      {
        type: "paragraph",
        text: "An 80% confirmation probability from a third-party PNR prediction tool roughly means that in 8 out of 10 similar historical cases — same route, class, quota, WL range and days left — the ticket confirmed. It's a useful signal, not a guarantee, since Indian Railways doesn't publish official confirmation statistics.",
      },
      { type: "heading", id: "does-wl-move-faster-on-rajdhani-shatabdi", text: "Does WL move faster on Rajdhani/Shatabdi?" },
      {
        type: "paragraph",
        text: "Not necessarily. Rajdhani and Shatabdi trains often have fewer cancellations because they're premium and booked by travellers with firmer plans, which can make WL numbers on these trains stickier than on regular Superfast trains — even though the trains themselves run faster.",
      },
      { type: "heading", id: "how-does-festival-season-affect-wl-movement", text: "How does festival season affect WL movement?" },
      {
        type: "paragraph",
        text: "During festival rushes like Diwali, Chhath, or summer holidays, cancellations drop because most passengers have fixed plans, so WL numbers tend to move slower and confirm less often. Outside festival periods, movement is usually faster and more predictable.",
      },
      { type: "heading", id: "wl-40-not-moving-for-3-days-should-i-wait", text: "WL 40 not moving for 3 days — should I wait?" },
      {
        type: "paragraph",
        text: "If your WL 40 hasn't moved for 3–4 days and you're within 7–10 days of departure, treat that as a warning sign and start arranging a confirmed backup. If you're inside the 72-hour refund window and the trend is still flat, it's usually smarter to switch than to keep gambling on a stuck number.",
      },
      { type: "heading", id: "what-happens-to-wl-trend-after-first-chart", text: "What happens to WL trend after first chart?" },
      {
        type: "paragraph",
        text: "After the first chart, WL tickets can still move into RAC or confirmed slots if cancellations come in before the final chart. Once the final chart is prepared, though, any ticket still fully waitlisted is automatically cancelled and cannot be used to board.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "rac-vs-waitlist-difference-explained",
    title: "RAC vs Waitlist 2026: Key Differences, Boarding Rules & Which Is Safer",
    excerpt:
      "RAC vs WL: can you travel on each? See boarding rights, berth allocation, confirmation chances, refund rules and chart cutoff. 2026 Indian Railways guide.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "8 min read",
    date: "2026-08-19",
    author: DEFAULT_AUTHOR,
    keywords: [
      "rac vs waitlist",
      "can rac passenger travel",
      "rac ticket meaning",
      "difference between rac and wl",
      "difference between rac and waitlist",
      "is rac and waiting list same",
      "rac or waiting list which is better",
      "rac confirmation chances",
    ],
    relatedSlugs: [
      "pnr-status-explained-cnf-rac-wl-meaning",
      "waitlist-ticket-confirmation-chances-explained",
      "rswl-rqwl-gn-quota-explained",
      "chart-preparation-time-explained-first-second-chart",
      "train-ticket-cancellation-refund-rules-2026",
      "irctc-tatkal-booking-2026-timings-rules",
      "what-to-do-when-your-train-is-fully-booked",
    ],
    content: [
      {
        type: "paragraph",
        text: "RAC and Waitlist are easy to mix up because both show up when a train is full — but they mean very different things for whether you'll actually get on board. Short answer: no, RAC and waitlist are not the same. RAC guarantees you can travel; WL does not — if your e-ticket is still fully waitlisted after chart preparation, you cannot board.",
      },
      { type: "heading", id: "rac-vs-waitlist-key-differences", text: "RAC vs Waiting List: key differences at a glance" },
      {
        type: "paragraph",
        text: "Feature | RAC | WL\n--- | --- | ---\nBoarding allowed? | Yes — guaranteed | No — only if confirmed before chart\nBerth allocation | Shared side-lower berth (upgradable to full) | None until the ticket confirms\nConfirmation chances | High — most RAC 1–30 convert to full berths | Variable — depends on WL number, quota, route, class\nRefund if cancelled | Treated like a confirmed ticket (72h/24h/8h slabs) | Auto-refunded if still WL after chart (minus clerkage)\nWhat happens at chart | Upgraded to a full berth if cancellations come in | Auto-cancelled if still fully WL; cannot board",
      },
      {
        type: "paragraph",
        text: "These RAC and WL confirmation patterns are based on observed trends across popular routes, not official Indian Railways statistics.",
      },
      { type: "heading", id: "rac-means-you-are-travelling", text: "What is RAC (Reservation Against Cancellation)?" },
      {
        type: "paragraph",
        text: "RAC — Reservation Against Cancellation — guarantees you a seat on the train. You'll share a side-lower berth with one other RAC passenger to start. If confirmed passengers cancel, RAC holders are the first to be upgraded to full berths, ahead of anyone on the waitlist.",
      },
      {
        type: "checklist",
        items: [
          "RAC 1–10: very high chance of a full berth (roughly 80–90%).",
          "RAC 11–30: good chance (roughly 50–70%).",
          "RAC 30+: moderate chance of upgrading, but you still travel on a shared berth either way.",
        ],
      },
      { type: "tip", text: "At chart preparation, RAC passengers are upgraded to full berths before any WL ticket moves — as per IRCTC's rules, only passengers whose status is fully confirmed or fully RAC after chart preparation are allowed to travel." },
      { type: "heading", id: "waitlist-means-not-yet", text: "What is WL (Waiting List)?" },
      {
        type: "paragraph",
        text: "A Waitlisted (WL) ticket doesn't reserve a seat or a berth. You're in a queue, and you'll only get to travel if enough cancellations happen before the chart is prepared. If your ticket is still WL after that point, it's automatically cancelled — you cannot board on a WL ticket.",
      },
      {
        type: "paragraph",
        text: "WL confirmation chances vary widely by number, quota type, route and class. For a fuller breakdown by WL number and quota, see our WL confirmation chances guide — but as a rough sense: lower GNWL numbers (roughly under 15) confirm often, the 16–30 range is closer to a coin-flip, and anything past 60 is a long shot.",
      },
      { type: "heading", id: "which-is-better-rac-or-waiting-list", text: "Which is better: RAC or Waiting List?" },
      {
        type: "paragraph",
        text: "In almost every realistic scenario, RAC is the safer pick compared to a WL ticket — even if the WL number looks 'better' on paper. RAC guarantees you can board; it's upgraded to full berths before any WL ticket moves; and even a high RAC number is often safer than a moderate WL number on the same train.",
      },
      {
        type: "paragraph",
        text: "Worked scenario: RAC 45 on a Delhi–Mumbai Superfast versus WL 20 (GNWL) on the same train. Even though '20' looks smaller than '45', the RAC 45 ticket guarantees travel on a shared berth, while the WL 20 ticket might never confirm. Unless you have a specific reason to gamble — a very low WL number on a long route with strong movement, say — the RAC ticket is the smarter choice.",
      },
      {
        type: "checklist",
        items: [
          "WL can still make sense when the number is very low (roughly WL ≤10) on GNWL, on a long route, outside festival season.",
          "It's also reasonable if you already have a confirmed backup and can afford to lose the WL ticket.",
          "Or if you're tracking the trend daily and seeing fast, consistent movement.",
        ],
      },
      { type: "heading", id: "refund-cancellation-rules-rac-vs-wl", text: "Refund and cancellation rules: RAC vs WL" },
      {
        type: "paragraph",
        text: "Indian Railways revised its cancellation and refund rules from April 2026, extending refund windows to 72/24/8 hours before departure — and RAC and WL tickets are treated differently under them.",
      },
      {
        type: "checklist",
        items: [
          "RAC tickets are treated like confirmed tickets for cancellation: full refund minus a flat fee beyond 72 hours, 25% deducted between 72–24 hours, 50% between 24–8 hours, and no refund under 8 hours — regardless of whether the RAC has converted to a full berth.",
          "A WL ticket you cancel yourself before chart preparation loses only a small clerkage charge, not the 72/24/8-hour slabs.",
          "A WL ticket still fully unconfirmed after the final chart is auto-cancelled and refunded in full, minus clerkage — you don't need to do anything.",
        ],
      },
      { type: "tip", text: "See our 2026 refund rules guide for the full breakdown of cancellation charges by class and timing." },
      { type: "heading", id: "chart-preparation-final-cutoff", text: "Chart preparation: the final cutoff" },
      {
        type: "paragraph",
        text: "Indian Railways typically prepares a first chart 4–6 hours before departure from the originating station, followed by a final chart 30 minutes to 2 hours before departure. CNF passengers see no change; RAC passengers are upgraded to full berths ahead of any WL tickets as cancellations come in; and a WL e-ticket still fully waitlisted after the final chart is automatically cancelled and refunded — it cannot be used to board.",
      },
      {
        type: "paragraph",
        text: "The upgrade order is fixed: a confirmed passenger cancels, their berth goes to the first RAC passenger, that RAC passenger's old spot goes to the next RAC, and once all RAC passengers have full berths, the first WL passenger moves up. See our chart preparation guide for the fuller timing breakdown.",
      },
      { type: "heading", id: "frequently-asked-questions", text: "Frequently asked questions" },
      { type: "heading", id: "can-rac-passenger-travel", text: "Can RAC passenger travel?" },
      {
        type: "paragraph",
        text: "Yes. An RAC ticket guarantees you can board the train on a shared side-lower berth, even if it doesn't convert to a full berth. Passengers with RAC status after chart preparation are allowed to travel.",
      },
      { type: "heading", id: "is-rac-better-than-waiting-list", text: "Is RAC better than waiting list?" },
      {
        type: "paragraph",
        text: "Yes. RAC guarantees travel; WL does not. Even a high RAC number is often safer than a moderate WL number on the same train, because RAC holders are upgraded to full berths before any WL ticket moves.",
      },
      { type: "heading", id: "what-are-rac-1-10-confirmation-chances", text: "What are RAC 1–10 / RAC 11–30 confirmation chances?" },
      {
        type: "paragraph",
        text: "Observed patterns on popular long-distance trains put RAC 1–10 around 80–90% likely to convert to a full berth, RAC 11–30 around 50–70%, and RAC 30+ more moderate — though you still travel on a shared berth either way. These are estimates based on historical patterns, not official statistics.",
      },
      { type: "heading", id: "what-happens-to-wl-after-chart-preparation", text: "What happens to WL after chart preparation?" },
      {
        type: "paragraph",
        text: "If your e-ticket is still fully waitlisted after the final chart, it's automatically cancelled and refunded, minus a small clerkage charge. You cannot board the train on a WL e-ticket after chart preparation.",
      },
      { type: "heading", id: "if-i-cancel-rac-vs-wl-what-refund-do-i-get", text: "If I cancel RAC vs WL, what refund do I get?" },
      {
        type: "paragraph",
        text: "RAC is treated like a confirmed ticket, so the 72/24/8-hour refund slabs apply. A WL ticket cancelled before chart only loses clerkage; if it stays unconfirmed through the final chart, it's auto-refunded in full minus clerkage.",
      },
      { type: "heading", id: "rac-45-vs-wl-20-which-is-safer", text: "RAC 45 vs WL 20 — which is safer?" },
      {
        type: "paragraph",
        text: "RAC 45 is almost always safer. It guarantees travel on a shared berth, while WL 20 may never confirm. Unless WL 20 is on a long route with strong, consistent movement and you have a confirmed backup, the RAC ticket is the smarter choice.",
      },
      { type: "heading", id: "does-rac-get-upgraded-before-wl", text: "Does RAC get upgraded before WL?" },
      {
        type: "paragraph",
        text: "Yes. The upgrade order is fixed: confirmed cancellations go to RAC passengers first, and only once every RAC passenger has a full berth does the first WL passenger move up.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
    {
    slug: "irctc-tatkal-booking-2026-timings-rules",
    title: "IRCTC Tatkal Booking 2026: Timings, Quota Seats & How to Get a Seat Fast",
    excerpt:
      "Tatkal timings 2026: AC 10 AM, SL 11 AM. See quota seats, Premium Tatkal vs Tatkal, Aadhaar OTP rules, refund policy and a step-by-step booking guide.",
    coverImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "10 min read",
    date: "2026-08-23",
    author: DEFAULT_AUTHOR,
    keywords: [
      "tatkal booking time",
      "tatkal timings",
      "irctc tatkal rules 2026",
      "tatkal ticket booking timing ac sleeper",
      "tatkal non ac timing",
      "tatkal quota seats",
      "premium tatkal vs tatkal",
      "how to book tatkal ticket fast",
      "tatkal aadhaar otp",
      "is first ac not available in tatkal",
      "tatkal wl refund",
    ],
    relatedSlugs: [
      "premium-tatkal-vs-tatkal-difference",
      "pnr-status-explained-cnf-rac-wl-meaning",
      "train-ticket-cancellation-refund-rules-2026",
      "diwali-chhath-puja-train-booking-tips",
      "irctc-website-down-what-to-do",
      "waitlist-ticket-confirmation-chances-explained",
      "vikalp-scheme-alternate-train-explained",
    ],
    content: [
      {
        type: "paragraph",
        text: "Tatkal is Indian Railways' emergency quota for travel that can't wait for regular booking — released exactly one day before the train's departure from its originating station. It's genuinely useful when you know how it works, and genuinely stressful when you don't. This guide covers timings, quota seats, Premium Tatkal, 2026 rules, refund policy, and a step-by-step flow to maximise your chances.",
      },
      { type: "heading", id: "tatkal-timings-ac-vs-sleeper-vs-2s", text: "Tatkal timings: AC vs Sleeper vs 2S" },
      {
        type: "paragraph",
        text: "Class | Opening time\n--- | ---\nAC classes (2A, 3A, CC, EC — 1A excluded) | 10:00 AM IST\nSleeper (SL) and Second Sitting (2S) | 11:00 AM IST\n\nBoth windows open exactly one day before the train's departure from its originating station — not necessarily your own boarding station. If a train leaves Delhi at 6 AM on the 10th, Tatkal for that train opens at 10 AM/11 AM on the 9th, even if you're boarding from a later station like Mathura or Agra.",
      },
      { type: "heading", id: "which-classes-tatkal-does-and-does-not-cover", text: "Which classes Tatkal does — and doesn't — cover" },
      {
        type: "paragraph",
        text: "Tatkal quota is not available in First AC (1A) at all — it's excluded from the Tatkal scheme entirely, which is part of why it's positioned as the top-tier, plan-ahead class rather than an emergency-booking one. Beyond that, Tatkal is available across 2A, 3A, SL, CC and EC, with seat availability in any class depending on how many berths that specific train has allocated to the quota — which varies train to train and can sell out within seconds on popular routes.",
      },
      { type: "heading", id: "tatkal-quota-seats-how-many-per-coach", text: "Tatkal quota seats: how many per coach or train?" },
      {
        type: "paragraph",
        text: "Class | Approx. Tatkal quota share\n--- | ---\nSleeper (SL) | roughly 10–15% of berths\n3AC (3A) | roughly 10–12% of berths\n2AC (2A) | roughly 8–10% of berths\nCC/EC | roughly 10–15% of seats\n\nThese are approximate ranges based on commonly observed patterns, not official fixed figures published by Indian Railways — the exact allocation varies by train, route and season. On high-demand corridors like Delhi–Mumbai, Delhi–Kolkata or Chennai–Bengaluru, Tatkal berths can sell out within seconds to a couple of minutes of the window opening.",
      },
      { type: "heading", id: "premium-tatkal-vs-tatkal-which-to-choose", text: "Premium Tatkal vs Tatkal: which should you choose?" },
      {
        type: "paragraph",
        text: "Premium Tatkal is a separate, dynamic-pricing quota that runs alongside regular Tatkal on many trains, opening at the same times.",
      },
      {
        type: "paragraph",
        text: "Feature | Tatkal | Premium Tatkal\n--- | --- | ---\nPricing | Fixed surcharge over base fare | Dynamic — starts near the Tatkal rate and climbs as seats fill\nConfirmation | Can go to waitlist (TQWL) | Confirmed-only, no waitlist offered\nRefund if you cancel | Confirmed: non-refundable; WL: refunded with clerkage | Confirmed: non-refundable under essentially any circumstance other than the train being cancelled\nAvailability | Larger quota, sells out fast | Smaller quota, disappears once gone",
      },
      {
        type: "checklist",
        items: [
          "Budget matters more than certainty and you can tolerate a waitlist: try regular Tatkal first.",
          "You absolutely must travel and can't risk a waitlisted seat: Premium Tatkal, if it's still showing availability.",
          "Regular Tatkal already waitlisted the moment you tried: check Premium Tatkal immediately — its fare is lowest right when the quota opens.",
        ],
      },
      { type: "tip", text: "For the fuller pricing and refund breakdown, see our dedicated Premium Tatkal vs Tatkal guide." },
      { type: "heading", id: "2026-tatkal-rules-you-must-know", text: "2026 Tatkal rules you must know" },
      {
        type: "checklist",
        items: [
          "Aadhaar-linked, OTP-verified IRCTC accounts are required for online Tatkal bookings — the OTP goes to the mobile number registered with Aadhaar, so confirm that number is active before booking day.",
          "Bookings are capped at 4 passengers per PNR for Tatkal.",
          "No senior citizen, child, or other concession applies under Tatkal, regardless of age or category.",
          "Confirmed Tatkal tickets are non-refundable if you cancel them yourself — only a waitlisted Tatkal ticket that never confirms gets refunded, minus a small clerkage charge.",
        ],
      },
      { type: "heading", id: "step-by-step-how-to-book-tatkal-ticket-fast", text: "Step-by-step: how to book Tatkal ticket fast" },
      {
        type: "paragraph",
        text: "Tatkal seats on popular routes can sell out in seconds, so a rehearsed flow matters more than luck. A practical plan:",
      },
      {
        type: "paragraph",
        text: "Pre-booking prep, the day before:\n\n- Confirm your IRCTC account is Aadhaar-linked and the registered mobile can receive the OTP.\n- Save passenger details in IRCTC's Master List so you're not typing during the rush.\n- Save your payment method — UPI or a stored card beats net banking for speed.\n- Note your train number, preferred class, and a backup class (e.g. 3A → SL → 2A).\n- Log in 10–15 minutes before the window opens.",
      },
      {
        type: "paragraph",
        text: "At opening time:\n\n- Select Tatkal quota immediately — don't leave it on General.\n- Choose your class and boarding station, then pull passengers from the Master List.\n- Move to payment without delay; every second counts.\n- If the OTP is delayed, request it again once rather than repeatedly refreshing the page.",
      },
      {
        type: "checklist",
        items: [
          "Aadhaar OTP not arriving: confirm the mobile number matches Aadhaar, try 'Resend OTP' once, or fall back to the Rail Connect app or a PRS counter.",
          "Payment times out but shows 'booking failed': check 'Booked Ticket History' before rebooking — the ticket may have actually gone through.",
          "Seat gone mid-booking: immediately try an alternate class or a nearby departure station rather than restarting the same search.",
          "Website or app slow: switch between the IRCTC website and the Rail Connect app — see our guide on what to do when IRCTC is down.",
        ],
      },
      { type: "heading", id: "tatkal-refund-rules-what-you-get-back", text: "Tatkal refund rules: what you get back" },
      {
        type: "paragraph",
        text: "Tatkal refund rules are stricter than for regular tickets. A confirmed Tatkal ticket you cancel yourself is non-refundable, except if the train itself is cancelled or delayed 3+ hours (claimable via TDR). A waitlisted Tatkal ticket (TQWL) that never confirms is automatically refunded after chart preparation, minus a small clerkage charge per passenger — you don't need to do anything. For the full 2026 refund windows on regular tickets, see our cancellation and refund rules guide.",
      },
      { type: "heading", id: "festival-rush-tatkal-tips-diwali-chhath-summer", text: "Festival rush Tatkal tips (Diwali, Chhath, summer)" },
      {
        type: "checklist",
        items: [
          "Log in even earlier than usual — 15–20 minutes ahead — since competition spikes sharply during festival windows.",
          "Watch for Suvidha or special trains (numbered in the 0XXXX series) that Railways typically adds during festival peaks, often with a separate, less crowded booking window.",
          "Keep alternate routes and nearby stations in mind as a fallback.",
          "If your regular ticket ends up waitlisted, opt into the Vikalp scheme for a shot at an alternate train.",
          "Have a mixed-mode backup — train plus bus, or a flight — ready in case Tatkal doesn't come through at all.",
        ],
      },
      { type: "heading", id: "frequently-asked-questions", text: "Frequently asked questions" },
      { type: "heading", id: "what-are-tatkal-timings-for-ac-and-sleeper", text: "What are Tatkal timings for AC and Sleeper?" },
      {
        type: "paragraph",
        text: "AC classes (2A, 3A, CC, EC) open at 10:00 AM IST; Sleeper and Second Sitting open at 11:00 AM IST. Both open exactly one day before the train's departure from its originating station.",
      },
      { type: "heading", id: "how-many-tatkal-seats-are-there-per-train", text: "How many Tatkal seats are there per train?" },
      {
        type: "paragraph",
        text: "Roughly 10–15% of Sleeper berths, 10–12% of 3AC berths, and 8–10% of 2AC berths are typically set aside for Tatkal, though the exact number varies by train and isn't published officially. On high-demand routes, the quota can sell out within seconds.",
      },
      { type: "heading", id: "what-is-premium-tatkal-and-how-is-it-different", text: "What is Premium Tatkal and how is it different?" },
      {
        type: "paragraph",
        text: "Premium Tatkal is a dynamic-pricing, confirmed-only quota — fares climb as seats fill, and no waitlist is offered once the quota is gone. Regular Tatkal has a fixed surcharge and can waitlist. Confirmed Premium Tatkal tickets are non-refundable under essentially any circumstance other than the train being cancelled.",
      },
      { type: "heading", id: "does-tatkal-wl-get-refunded", text: "Does Tatkal WL get refunded?" },
      {
        type: "paragraph",
        text: "Yes. A waitlisted Tatkal ticket that never confirms is automatically refunded after chart preparation, minus a small clerkage charge. A confirmed Tatkal ticket cancelled by you is not refunded.",
      },
      { type: "heading", id: "why-is-1a-not-available-in-tatkal", text: "Why is 1A not available in Tatkal?" },
      {
        type: "paragraph",
        text: "First AC is excluded from the Tatkal scheme entirely under IRCTC rules. Tatkal is available in 2A, 3A, Sleeper, CC and EC, but not 1A.",
      },
      { type: "heading", id: "what-if-aadhaar-otp-doesnt-come", text: "What if Aadhaar OTP doesn't come?" },
      {
        type: "paragraph",
        text: "Confirm the mobile number matches your Aadhaar registration, then try 'Resend OTP' once. If it still doesn't arrive, try the Rail Connect app, a different device, or a PRS counter — avoid repeatedly refreshing the payment page.",
      },
      { type: "heading", id: "can-i-book-tatkal-for-5-passengers", text: "Can I book Tatkal for 5 passengers?" },
      {
        type: "paragraph",
        text: "No — Tatkal bookings are capped at 4 passengers per PNR. For 5 or more, you'll need separate PNRs.",
      },
      { type: "heading", id: "tatkal-booking-during-festival-rush-any-special-tips", text: "Tatkal booking during festival rush — any special tips?" },
      {
        type: "paragraph",
        text: "Log in earlier than usual, watch for added Suvidha or special trains, keep nearby stations and alternate routes in mind, opt into Vikalp if your regular ticket is waitlisted, and have a mixed-mode backup ready.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "premium-tatkal-vs-tatkal-difference",
    title: "Tatkal vs Premium Tatkal: which one should you actually book?",
    excerpt:
      "The difference between Tatkal and Premium Tatkal isn't just the price — it's refund rules, confirmation odds, and how the fare behaves as seats sell out. Here's the honest breakdown.",
    coverImage: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-09-02",
    author: DEFAULT_AUTHOR,
    keywords: [
      "tatkal vs premium tatkal",
      "difference between tatkal and premium tatkal",
      "premium tatkal refund rules",
      "premium tatkal booking timing",
      "is premium tatkal refundable",
      "premium tatkal price increase",
    ],
    relatedSlugs: [
      "irctc-tatkal-booking-2026-timings-rules",
      "waitlist-ticket-confirmation-chances-explained",
      "train-ticket-cancellation-refund-rules-2026",
      "pnr-status-explained-cnf-rac-wl-meaning",
    ],
    content: [
      {
        type: "paragraph",
        text: "Tatkal and Premium Tatkal open at the same time, on the same day, for the same trains — which is exactly why people confuse them. But once you look past the shared timing, they behave quite differently, especially around price and refunds.",
      },
      { type: "heading", id: "same-window-different-pricing", text: "Same booking window, different pricing model" },
      {
        type: "paragraph",
        text: "Both quotas open one day before the date of journey, from the train's origin station: 10:00 AM for AC classes, 11:00 AM for Sleeper and Second Sitting. Regular Tatkal charges a fixed, pre-set extra fare on top of the base ticket price. Premium Tatkal instead uses a dynamic, demand-based fare that starts around the Tatkal rate and climbs as more seats in that quota get booked — similar in spirit to how flight prices move.",
      },
      { type: "heading", id: "confirmed-seat-vs-waitlist-risk", text: "Confirmed seat vs. waitlist risk" },
      {
        type: "paragraph",
        text: "Regular Tatkal can and does waitlist once its allocation runs out — you might end up with a TQWL ticket and no guarantee of travel. Premium Tatkal, by design, only sells confirmed berths; once the quota's seats are gone, the option simply disappears from booking rather than offering you a waitlisted ticket. That's the trade-off: you're paying a rising fare specifically to avoid the waitlist.",
      },
      { type: "heading", id: "refund-rules-the-part-that-trips-people-up", text: "Refund rules — the part that trips people up" },
      {
        type: "checklist",
        items: [
          "Confirmed regular Tatkal ticket, cancelled by you: no refund, except if the train itself is cancelled or delayed 3+ hours (claimable via TDR).",
          "Confirmed Premium Tatkal ticket, cancelled by you: no refund under essentially any circumstance other than the train being cancelled by Railways.",
          "A Tatkal or Premium Tatkal ticket that stays waitlisted and never confirms by chart preparation: refunded automatically, just like a regular waitlisted ticket, minus a small clerkage charge.",
        ],
      },
      { type: "tip", text: "Because Premium Tatkal can't waitlist, there's no version of \"it might still confirm later\" — if you book it and then need to cancel, treat that money as spent. Only choose it when the trip is genuinely locked in." },
      { type: "heading", id: "so-which-one-should-you-pick", text: "So which one should you pick?" },
      {
        type: "checklist",
        items: [
          "Budget matters more than certainty, and you can tolerate a waitlist: try regular Tatkal first.",
          "You absolutely must travel and can't risk a waitlisted seat: Premium Tatkal, if it's still showing availability.",
          "Regular Tatkal already waitlisted the moment you tried: check Premium Tatkal immediately — its fare is lowest right when the quota opens and climbs from there.",
          "Neither has room at all: compare nearby stations, a connecting route, or a different mode for the same date.",
        ],
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "vikalp-scheme-alternate-train-explained",
    title: "What is the Vikalp scheme? How IRCTC's free alternate-train upgrade works",
    excerpt:
      "Vikalp scheme explained: how the Alternate Train Accommodation Scheme (ATAS) can move your waitlisted ticket to a confirmed seat on a different train — for free.",
    coverImage: "https://images.unsplash.com/photo-1685858874777-b87106319be7?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "5 min read",
    date: "2026-09-03",
    author: DEFAULT_AUTHOR,
    keywords: [
      "vikalp scheme irctc",
      "alternate train accommodation scheme",
      "vikalp scheme kya hai",
      "how to opt vikalp scheme",
      "vikalp scheme confirmed seat",
      "atas irctc full form",
    ],
    relatedSlugs: [
      "waitlist-ticket-confirmation-chances-explained",
      "waitlist-confirmation-prediction-and-trends",
      "chart-preparation-time-explained-first-second-chart",
      "pnr-status-explained-cnf-rac-wl-meaning",
    ],
    content: [
      {
        type: "paragraph",
        text: "Most waitlisted passengers only find out about Vikalp after they've already given up on a train — which is a shame, because it's a free, official Indian Railways scheme built specifically for this situation.",
      },
      { type: "heading", id: "what-vikalp-actually-is", text: "What Vikalp actually is" },
      {
        type: "paragraph",
        text: "Vikalp — short for the Alternate Train Accommodation Scheme (ATAS) — automatically looks for vacant berths on other trains running the same route around the same time, and shifts eligible waitlisted passengers into them at chart preparation. It costs nothing extra, even if you end up moved onto a premium train like a Rajdhani or Shatabdi.",
      },
      { type: "heading", id: "how-it-works-step-by-step", text: "How it works, step by step" },
      {
        type: "checklist",
        items: [
          "Opt into Vikalp while booking your ticket, or later from your booking history — but only before chart preparation.",
          "Choose up to a handful of alternate trains you'd be willing to travel on instead.",
          "If your original ticket is still fully waitlisted at chart time, the system checks those alternate trains for vacant seats.",
          "If a seat is found, you're allotted it — your original PNR is cancelled and a brand-new PNR is generated for the alternate train.",
        ],
      },
      { type: "heading", id: "what-vikalp-does-not-do", text: "What Vikalp doesn't do" },
      {
        type: "paragraph",
        text: "It isn't a guarantee — you're only in the running if one of your chosen alternate trains actually has a vacant berth. You also don't get to pick the exact seat or coach, and once you're moved, there's no reverting to your original train even if it later clears its own waitlist.",
      },
      { type: "tip", text: "Select alternate trains spread across a wider time window (not just the one departing an hour later) — the more genuinely different options you give the system, the better your odds of it finding a vacant seat." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "chart-preparation-time-explained-first-second-chart",
    title: "Chart preparation time explained: what happens to your ticket, and when",
    excerpt:
      "Chart preparation time confuses almost every train traveller at some point. Here's when the first and final charts are typically prepared, and exactly what changes for CNF, RAC and WL tickets.",
    coverImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-09-04",
    author: DEFAULT_AUTHOR,
    keywords: [
      "chart preparation time",
      "irctc chart preparation time",
      "first chart second chart timing",
      "reservation chart kab banta hai",
      "current booking after chart preparation",
      "what happens to waitlist ticket after chart preparation",
    ],
    relatedSlugs: [
      "pnr-status-explained-cnf-rac-wl-meaning",
      "waitlist-confirmation-prediction-and-trends",
      "vikalp-scheme-alternate-train-explained",
      "train-ticket-cancellation-refund-rules-2026",
    ],
    content: [
      {
        type: "paragraph",
        text: "\"Chart preparation\" is the moment Indian Railways finalises who's actually travelling on a train — and it's the single biggest turning point for anyone sitting on a waitlisted or RAC ticket. Here's what it means in practice.",
      },
      { type: "heading", id: "two-charts-not-one", text: "There are two charts, not one" },
      {
        type: "paragraph",
        text: "Every train gets a first (main) chart, followed later by a second (final) chart. As a general rule of thumb, the first chart is prepared a few hours before departure from the originating station — earlier in the evening for trains that leave very early the next morning — and the final chart is prepared shortly before departure, updating for last-minute cancellations and current bookings. The exact windows have been revised by Indian Railways more than once in recent years, so treat this as the general pattern rather than a fixed number, and check your PNR status close to departure for your specific train.",
      },
      { type: "heading", id: "what-changes-at-each-chart", text: "What changes for CNF, RAC and WL at each chart" },
      {
        type: "checklist",
        items: [
          "CNF (Confirmed) — nothing changes for you; your coach and berth were already assigned at booking.",
          "RAC — you can already board and share a berth; at chart time, RAC passengers move into any full berth that's opened up through cancellations, ahead of anyone still on the waitlist.",
          "WL (Waitlisted) e-ticket — if it's still not confirmed or RAC by the first chart, it can still move at the final chart as more cancellations come in. If it's still fully waitlisted after the final chart, it's automatically cancelled and refunded, minus a small clerkage charge — you cannot board on it.",
        ],
      },
      { type: "heading", id: "current-booking-after-the-chart", text: "\"Current booking\" after the chart" },
      {
        type: "paragraph",
        text: "Once the first chart is out, any berths that remain vacant (or open up from cancellations) become available again as \"current\" bookings — through IRCTC, the app, or a reservation counter — right up until shortly before departure. This is worth checking if your search shows WL for the full route but you're flexible about boarding partway along it: seats can appear on a shorter segment even when the full origin-to-destination search doesn't show any.",
      },
      { type: "tip", text: "If your ticket is fully waitlisted going into chart preparation, don't wait passively — opt into the Vikalp scheme in advance, and have a backup train, bus, or flight ready so you're not scrambling in the final hour." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "child-ticket-rules-indian-railways",
    title: "Child train ticket rules in India: age limits, half fare, and berth rules",
    excerpt:
      "Do kids need a train ticket in India? Here's exactly when children travel free, when half fare applies, and when a full adult ticket with a berth is required.",
    coverImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "5 min read",
    date: "2026-09-04",
    author: DEFAULT_AUTHOR,
    keywords: [
      "child ticket rules indian railway",
      "train ticket for child age",
      "half ticket railway rules",
      "child fare train india",
      "do kids need train ticket",
      "nosb ticket meaning",
    ],
    relatedSlugs: [
      "senior-citizen-train-travel-india-guide",
      "train-passenger-rights-you-should-know",
      "irctc-tatkal-booking-2026-timings-rules",
    ],
    content: [
      {
        type: "paragraph",
        text: "Booking for a family trip is where child fare rules trip up even experienced travellers — one wrong option during checkout and you've either overpaid or under-ticketed your child. Indian Railways splits children into three age bands, and each works differently.",
      },
      { type: "heading", id: "under-5-free-but-no-berth", text: "Under 5: free, but no separate berth" },
      {
        type: "paragraph",
        text: "Children under 5 years old travel completely free — no ticket is required at all. The condition: they don't get their own seat or berth and are expected to share with the accompanying adult. If you specifically want a dedicated berth for a child under 5, you'll be charged the full adult fare for it.",
      },
      { type: "heading", id: "5-to-under-12-your-choice", text: "5 to under 12: half fare or full fare, your choice" },
      {
        type: "paragraph",
        text: "This is the band most people get wrong. You have two options at booking: pick \"No Seat/No Berth\" (often shown as NOSB) and pay roughly half the adult fare, with the child sharing your berth — or request a dedicated berth and pay the full adult fare, same as for yourself.",
      },
      {
        type: "checklist",
        items: [
          "Half fare (NOSB): child shares your berth, no separate seat allotted.",
          "Full fare: child gets their own confirmed berth, treated the same as an adult passenger for allocation purposes.",
          "Changing your mind after booking generally isn't simple — switching a half-fare, no-berth ticket to a full-fare berth ticket usually means cancelling and rebooking, subject to availability.",
        ],
      },
      { type: "heading", id: "12-and-above-always-adult-fare", text: "12 and above: always treated as an adult" },
      {
        type: "paragraph",
        text: "Once a child turns 12, Indian Railways treats them exactly like an adult passenger — full fare, own berth, no half-price option of any kind.",
      },
      { type: "tip", text: "Carry a valid age proof for children you've booked at a discounted or free fare — Aadhaar, a birth certificate, or a school ID. TTEs are authorised to ask for it, and misrepresenting a child's age to save on fare can mean an on-the-spot penalty." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "lost-or-damaged-train-ticket-duplicate-ticket-rules",
    title: "Lost or torn train ticket? Duplicate ticket rules and charges explained",
    excerpt:
      "Lost your train ticket, or is it torn beyond recognition? Here's exactly what to do — and what it costs — depending on whether you booked an e-ticket or a counter ticket.",
    coverImage: "https://images.unsplash.com/photo-1545941962-1b6654eb8072?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "5 min read",
    date: "2026-09-05",
    author: DEFAULT_AUTHOR,
    keywords: [
      "duplicate train ticket rules",
      "lost train ticket what to do",
      "torn train ticket replacement",
      "how to get duplicate irctc ticket",
      "lost e-ticket train travel",
      "railway ticket lost fine",
    ],
    relatedSlugs: [
      "train-passenger-rights-you-should-know",
      "irctc-website-down-what-to-do",
      "train-ticket-cancellation-refund-rules-2026",
    ],
    content: [
      {
        type: "paragraph",
        text: "What you do about a lost or damaged train ticket depends heavily on whether you booked online (an e-ticket) or from a physical counter (a PRS/window ticket) — the two are treated very differently.",
      },
      { type: "heading", id: "lost-an-e-ticket-booked-online", text: "Lost an e-ticket booked online" },
      {
        type: "paragraph",
        text: "This is the easier case. An e-ticket doesn't have a single physical original the way a counter ticket does, so there's no \"duplicate ticket fee\" to pay. Log back into your IRCTC account and pull it up from your booking history to reprint or re-download it, or simply show your PNR and a valid photo ID to the TTE on board.",
      },
      { type: "heading", id: "lost-a-counter-prs-ticket", text: "Lost a counter (PRS) ticket" },
      {
        type: "paragraph",
        text: "Counter tickets are treated as physical financial documents, so a screenshot or photo of one isn't valid for travel — you need an official duplicate. Head to a computerised reservation counter, explain the loss in writing to the Chief Reservation Supervisor, and show a valid ID.",
      },
      {
        type: "checklist",
        items: [
          "Reported before chart preparation: a duplicate confirmed or RAC ticket can usually be issued for a small flat fee per passenger.",
          "Reported after chart preparation: a duplicate can still be issued, but generally for a higher fee (a percentage of the original fare) rather than a flat charge.",
          "A lost RAC ticket after the final chart: railways typically won't issue a duplicate or process a refund for it at that point — treat this window as your last chance to sort it out.",
          "A torn or mutilated (but still identifiable) ticket: can usually be exchanged for a duplicate at a reservation counter without the same loss-reporting process.",
        ],
      },
      { type: "tip", text: "If you realise you've lost a ticket while already on the train, tell the TTE immediately and show your ID — sorting it proactively is far better than being found without a valid ticket during a routine check, which can mean paying the fare afresh plus a penalty." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "uts-app-unreserved-ticket-booking-guide",
    title: "UTS app: how to book unreserved and platform tickets from your phone",
    excerpt:
      "Skip the ticket-counter queue: the UTS app lets you book unreserved (general class), season, and platform tickets on Indian Railways straight from your smartphone.",
    coverImage: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "5 min read",
    date: "2026-09-05",
    author: DEFAULT_AUTHOR,
    keywords: [
      "uts app train ticket booking",
      "unreserved ticket app",
      "platform ticket app booking",
      "general ticket booking online india",
      "uts app kya hai",
      "book unreserved ticket without queue",
    ],
    relatedSlugs: [
      "irctc-website-down-what-to-do",
      "train-vs-flight-vs-bus-how-to-choose",
    ],
    content: [
      {
        type: "paragraph",
        text: "If your journey doesn't need a reserved berth — a short unreserved (general/second class) hop, a platform ticket, or a season pass — you don't need to queue at a counter at all. UTS, Indian Railways' official Unreserved Ticketing System app, handles all three from your phone.",
      },
      { type: "heading", id: "what-you-can-and-cannot-book-on-uts", text: "What you can — and can't — book on UTS" },
      {
        type: "checklist",
        items: [
          "Unreserved (general/second class) point-to-point journey tickets.",
          "Season tickets (monthly and longer passes for regular commuters).",
          "Platform tickets, if you're within the app's set radius of the station.",
          "Not available: Sleeper, AC, or any other reserved-berth class — UTS is strictly for unreserved travel.",
        ],
      },
      { type: "heading", id: "paper-vs-paperless-mode", text: "Paper vs. paperless mode" },
      {
        type: "paragraph",
        text: "In paperless mode, the app checks your location via GPS to confirm you're near the station or track before letting you book, and your journey needs to start within a set window after booking (the app shows a live countdown, so rely on that rather than a fixed number) — after which you'll need to travel or rebook. In paper mode, you still need to print the ticket at an ATVM or counter kiosk before boarding.",
      },
      {
        type: "checklist",
        items: [
          "Register with your mobile number, name, gender and date of birth; you'll receive an OTP/MPIN to complete setup.",
          "Once a paperless ticket is booked, you can show it to the TTE straight from the app, even without an internet connection at that moment.",
          "Paperless tickets generally can't be cancelled once booked, so double-check your journey details before confirming.",
        ],
      },
      { type: "tip", text: "For a platform ticket when you're just seeing someone off (not travelling yourself), UTS is usually the fastest option — no counter queue, and it's valid the moment it's issued." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "train-passenger-rights-you-should-know",
    title: "Train passenger rights in India that most people don't know about",
    excerpt:
      "From a one-hour grace period if you miss your train to refunds for a broken AC, here are the Indian Railways passenger rights that rarely get mentioned — but can genuinely save your trip.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-09-05",
    author: DEFAULT_AUTHOR,
    keywords: [
      "indian railway passenger rights",
      "tte rules after 10pm",
      "train delay refund rules",
      "ac coach not working refund",
      "missed train reserved seat rule",
      "railway passenger rights india",
    ],
    relatedSlugs: [
      "train-ticket-cancellation-refund-rules-2026",
      "senior-citizen-train-travel-india-guide",
      "lost-or-damaged-train-ticket-duplicate-ticket-rules",
    ],
    content: [
      {
        type: "paragraph",
        text: "Indian Railways carries millions of passengers a day, and along with that scale comes a set of passenger-protection rules that hardly anyone actually knows about until they need them. A few are worth keeping in your back pocket.",
      },
      { type: "heading", id: "tte-cannot-check-tickets-after-10pm", text: "TTEs generally can't check tickets after 10 PM" },
      {
        type: "paragraph",
        text: "Ticket verification is meant to be completed before 10 PM, so a TTE shouldn't be waking sleeping passengers for routine checks after that — unless you board the train after 10 PM yourself, in which case your ticket is checked at boarding.",
      },
      { type: "heading", id: "if-you-miss-the-train-at-boarding", text: "If you miss the train at your boarding station" },
      {
        type: "paragraph",
        text: "Missing your train doesn't automatically forfeit your reserved seat. Your berth can't be reallocated to another passenger for at least one hour, or until the train passes the next two stops — whichever comes first — which means you may be able to board at the next station and still claim your original seat.",
      },
      { type: "heading", id: "ac-not-working-en-route", text: "If the AC isn't working" },
      {
        type: "paragraph",
        text: "Travelling in an AC class where the air conditioning fails partway through the journey entitles you to a refund covering the fare difference for the distance or duration it wasn't functioning — this is a genuine, claimable right, not just a complaint you can raise.",
      },
      { type: "heading", id: "big-delays-and-cut-short-journeys", text: "Big delays and journeys cut short" },
      {
        type: "checklist",
        items: [
          "If your train is delayed more than three hours and you decide not to travel at all, you're entitled to a full refund (filed as a TDR).",
          "If the journey is terminated early due to a natural calamity or a technical issue with no alternative arrangement offered, you get a full refund; if an alternate train is offered and you decline it, the fare is adjusted for the distance actually travelled.",
          "If Indian Railways cancels your train outright, you get a full refund regardless of ticket type or how close to departure the cancellation happens.",
        ],
      },
      { type: "tip", text: "None of these rights are automatic paperwork-free refunds in every case — several (delay refunds, AC-failure refunds) need a TDR filed through IRCTC. Keep your PNR and any TTE acknowledgment handy, since that's usually what supports the claim." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "train-ticket-cancellation-refund-rules-2026",
    title: "Train ticket cancellation and refund rules 2026: what you actually get back",
    excerpt:
      "IRCTC's 2026 cancellation rules changed the refund windows to 72, 24 and 8 hours before departure — here's exactly what you get back, by class and by ticket status.",
    coverImage: "https://images.unsplash.com/photo-1545941962-1b6654eb8072?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "7 min read",
    date: "2026-09-01",
    author: DEFAULT_AUTHOR,
    keywords: [
      "irctc cancellation charges 2026",
      "train ticket refund policy",
      "irctc refund rules",
      "tdr filing guide",
      "waitlist ticket refund",
      "tatkal ticket refund",
      "how much refund train ticket cancellation",
    ],
    relatedSlugs: [
      "pnr-status-explained-cnf-rac-wl-meaning",
      "irctc-tatkal-booking-2026-timings-rules",
      "premium-tatkal-vs-tatkal-difference",
      "waitlist-ticket-confirmation-chances-explained",
      "chart-preparation-time-explained-first-second-chart",
      "lost-or-damaged-train-ticket-duplicate-ticket-rules",
      "train-passenger-rights-you-should-know",
      "irctc-website-down-what-to-do",
    ],
    content: [
      {
        type: "paragraph",
        text: "Indian Railways revised its cancellation and refund rules from April 2026, extending every refund window — good news if you tend to cancel plans a day or two out, but the rules still depend heavily on your ticket status and how close to departure you cancel. Here's the current picture.",
      },
      { type: "heading", id: "the-2026-refund-windows", text: "The 2026 refund windows for confirmed tickets" },
      {
        type: "paragraph",
        text: "The 2026 revision widened the old 48/12/4-hour cutoffs to 72/24/8 hours, giving passengers more breathing room to cancel without losing a large chunk of the fare.",
      },
      {
        type: "checklist",
        items: [
          "72+ hours before departure: full refund, minus a flat cancellation fee per passenger (roughly ₹60 for 2S up to ₹240+GST for 1A/EC, scaled by class).",
          "72 to 24 hours before departure: 25% of the fare is deducted.",
          "24 to 8 hours before departure: 50% of the fare is deducted.",
          "Less than 8 hours before departure: no refund on a confirmed ticket.",
        ],
      },
      { type: "tip", text: "The single biggest lever you have is cancelling before the 72-hour mark — miss it by even an hour and you move straight into the 25% deduction band." },
      { type: "heading", id: "rac-and-waitlisted-tickets", text: "RAC and waitlisted tickets work differently" },
      {
        type: "paragraph",
        text: "If your ticket is still fully waitlisted when the chart is prepared, it's cancelled automatically and refunded in full, minus a small clerkage charge per passenger — you don't need to do anything. If you choose to cancel a RAC or waitlisted ticket yourself before that point, only the clerkage charge applies, not the 72/24/8-hour deduction scale that governs confirmed tickets.",
      },
      { type: "heading", id: "tatkal-tickets-are-the-exception", text: "Tatkal and Premium Tatkal tickets are the exception" },
      {
        type: "paragraph",
        text: "A confirmed Tatkal ticket is non-refundable if you cancel it yourself — this hasn't changed under the 2026 revision, and Premium Tatkal is stricter still. The one exception for regular Tatkal is a ticket that never confirms and is still waitlisted at chart preparation: that portion is refunded automatically, just like a regular waitlisted ticket, minus the applicable clerkage charge.",
      },
      { type: "heading", id: "what-is-a-tdr-and-when-you-need-one", text: "What is a TDR, and when do you need one" },
      {
        type: "paragraph",
        text: "TDR (Ticket Deposit Receipt) is the process for claiming a refund in situations the standard cancellation flow doesn't cover — the train being delayed by three hours or more, running in a lower class than booked, being cancelled by Railways after chart preparation, or you missing the train due to a genuine, documentable reason. TDR must be filed within the specified window (generally before or shortly after the train's actual departure, depending on the reason) through the IRCTC website or app, and it's reviewed rather than automatically approved — filing one doesn't guarantee the refund.",
      },
      { type: "heading", id: "if-railways-cancels-the-train", text: "If Railways cancels the train" },
      {
        type: "paragraph",
        text: "If Indian Railways cancels your train outright, you get a full refund regardless of ticket type, class, or how close to departure the cancellation happens — this rule sits outside the normal time-window structure entirely.",
      },
      {
        type: "checklist",
        items: [
          "Refunds are typically credited back to the original payment method within roughly 5–10 working days, though your bank's own processing time can add to that.",
          "Cancellation charges are calculated per passenger, not per ticket — cancelling for one person on a multi-passenger PNR only deducts that person's share.",
          "Some ticket types (Foreign Tourist Quota, and certain counter-booked tickets) can't be cancelled online and need a PRS counter visit instead.",
        ],
      },
      { type: "tip", text: "Rules like these get revised periodically — always cross-check the current cancellation policy on irctc.co.in before relying on any specific number, including the ones here, if your trip is months away." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "diwali-chhath-puja-train-booking-tips",
    title: "How to book confirmed train tickets during Diwali and Chhath Puja rush",
    excerpt:
      "Festival season is Indian Railways' busiest stretch of the year. Here's how the advance booking window works and how to actually get a confirmed seat home.",
    coverImage: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-21",
    author: DEFAULT_AUTHOR,
    keywords: [
      "diwali train ticket booking tips",
      "chhath puja train booking rush",
      "advance reservation period train ticket",
      "festival season train booking india",
      "how many days before can i book train ticket",
    ],
    relatedSlugs: [
      "irctc-tatkal-booking-2026-timings-rules",
      "waitlist-ticket-confirmation-chances-explained",
      "vikalp-scheme-alternate-train-explained",
      "irctc-website-down-what-to-do",
    ],
    content: [
      {
        type: "paragraph",
        text: "Diwali and Chhath Puja together make up the single biggest travel rush on the Indian rail network every year, especially on routes into Uttar Pradesh, Bihar, and Jharkhand. Tickets on the most popular trains can go from open to fully waitlisted within minutes of the booking window opening.",
      },
      { type: "heading", id: "know-your-booking-window", text: "Know your booking window" },
      {
        type: "paragraph",
        text: "Indian Railways' advance reservation period (ARP) currently opens tickets 60 days before the date of journey, at 8:00 AM IST — this window has changed in the past (it was 120 days for a long stretch), so it's worth double-checking the current ARP on irctc.co.in close to your travel dates.",
      },
      {
        type: "checklist",
        items: [
          "Count exactly 60 days back from your travel date and be logged in a few minutes early.",
          "Double-check the festival date for your specific state — Chhath, Durga Puja, and Diwali don't always fall on the same day everywhere.",
          "Book your return leg at the same time as your outward journey — return availability disappears just as fast, usually while you're still celebrating.",
        ],
      },
      { type: "tip", text: "Save your passenger list in IRCTC's Master List well before booking day — during festival rush, every extra second typing details costs you seats." },
      { type: "heading", id: "if-general-quota-is-already-gone", text: "If general quota is already gone" },
      {
        type: "paragraph",
        text: "Watch for special or Suvidha trains (numbered in the 0XXXX series) that Indian Railways typically adds during festival peaks — they're announced closer to the date and often have a separate, less crowded booking window. Opting into Vikalp for your existing waitlisted booking, and keeping Tatkal as a day-before backup, both remain useful even after the main window has closed.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "senior-citizen-train-travel-india-guide",
    title: "Senior citizen train travel in India: concession status and lower berth priority (2026)",
    excerpt:
      "Senior citizen railway concession status in 2026, plus how the lower berth senior citizen quota actually works when booking a reserved sleeper or AC ticket.",
    coverImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-17",
    author: DEFAULT_AUTHOR,
    keywords: [
      "senior citizen train concession 2026",
      "senior citizen railway concession status",
      "lower berth priority senior citizen",
      "lower berth senior citizen quota",
      "indian railway senior citizen quota",
    ],
    relatedSlugs: [
      "pnr-status-explained-cnf-rac-wl-meaning",
      "rswl-rqwl-gn-quota-explained",
      "irctc-tatkal-booking-2026-timings-rules",
      "child-ticket-rules-indian-railways",
      "train-passenger-rights-you-should-know",
    ],
    content: [
      {
        type: "paragraph",
        text: "Train travel has long been the most practical way for senior citizens in India to get around — affordable, comfortable, and (before 2020) discounted. Here's exactly where things stand in 2026.",
      },
      { type: "heading", id: "concession-status", text: "The fare concession: still suspended" },
      {
        type: "paragraph",
        text: "Before March 2020, men aged 60 and above got a 40% fare discount, and women aged 58 and above got 50% off, on most reserved classes. That concession was suspended during the pandemic and, as of 2026, has not been reinstated — the Railway Ministry has cited the financial cost as the reason in Parliament, even as budget discussions about restoring it continue to come up periodically. Because this is an actively discussed policy, it's worth checking irctc.co.in for the latest before you assume either way.",
      },
      { type: "tip", text: "The concession never applied to Tatkal, Premium Tatkal, or Suvidha tickets even before 2020 — that hasn't changed either." },
      { type: "heading", id: "what-is-still-available", text: "What's still available" },
      {
        type: "checklist",
        items: [
          "Automatic lower-berth priority for senior citizens booking a reserved sleeper or AC class ticket — no separate request needed if age is entered correctly under the Senior Citizen (SR) quota option.",
          "Station-level assistance, including wheelchair and porter support at major stations.",
          "Separate concessions for other categories (Divyangjan/persons with disabilities, patients with specific medical conditions, and students) that are unrelated to the general senior citizen concession and have their own eligibility rules.",
        ],
      },
      { type: "heading", id: "lower-berth-quota-in-practice", text: "How the lower berth senior citizen quota actually works" },
      {
        type: "paragraph",
        text: "A small number of lower berths are earmarked per coach for senior citizens (and separately for pregnant women and passengers with disabilities). If you enter your age correctly while booking, the system tries to auto-allot one of these automatically — it isn't guaranteed on every train, since the earmarked pool is limited, but it's the default behaviour rather than something you need to specifically request.",
      },
      { type: "heading", id: "booking-tips", text: "Booking tips" },
      {
        type: "paragraph",
        text: "Make sure the age entered while booking exactly matches the ID you'll be carrying — a mismatch can cause problems during ticket checking, even without a fare discount involved. If a lower berth isn't auto-allotted, it can usually still be requested during booking or checked afterward through your PNR.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* India Fort Travel cluster — a pillar guide plus route-specific       */
  /* posts, deliberately cross-linked into the PNR/WL/Vikalp cluster      */
  /* above, since a lot of fort-trip searches (Jaipur, Jodhpur, Udaipur)  */
  /* overlap heavily with "will my train confirm" searches.               */
  /* ------------------------------------------------------------------ */
  {
    slug: "best-forts-in-india-to-visit",
    title: "Best forts in India to visit: history, routes and travel tips",
    excerpt:
      "The best forts in India, from Rajasthan's UNESCO hill forts to Golconda and the Maratha forts of Maharashtra — with practical notes on how to actually get to each one.",
    coverImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "9 min read",
    date: "2026-09-06",
    author: DEFAULT_AUTHOR,
    keywords: [
      "best forts in india",
      "famous forts in india",
      "historical forts in india",
      "top forts to visit in india",
      "most beautiful forts in india",
      "unesco forts in india",
      "hill forts in india",
      "forts in india for a weekend trip",
    ],
    relatedSlugs: [
      "rajasthan-fort-tour-route",
      "best-fort-trips-in-india-by-train",
      "best-forts-near-delhi-for-weekend-trip",
      "how-to-reach-amer-fort-from-jaipur",
    ],
    content: [
      {
        type: "paragraph",
        text: "India's forts range from single hilltop citadels you can see in an afternoon to entire fortified cities you could spend a full day exploring. This is a starting map of the best-known ones, grouped by region, with a pointer to a deeper guide for each cluster.",
      },
      { type: "heading", id: "rajasthan-the-heaviest-concentration", text: "Rajasthan: the heaviest concentration" },
      {
        type: "paragraph",
        text: "Rajasthan is home to the Hill Forts of Rajasthan, a UNESCO World Heritage listing covering six forts: Chittorgarh, Kumbhalgarh, Ranthambore (Sawai Madhopur), Gagron (Jhalawar), Amber/Amer (Jaipur), and Jaisalmer. Together they cover roughly a thousand years of Rajput military and courtly architecture.",
      },
      {
        type: "checklist",
        items: [
          "Amer Fort, Jaipur — the most visited of the six, a short trip from the city and easy to combine with Jaigarh and Nahargarh forts.",
          "Mehrangarh Fort, Jodhpur — not part of the UNESCO listing but one of India's most dramatic hill forts, towering over the Blue City.",
          "Jaisalmer Fort — a rare \"living fort\" with homes, shops and temples still inside its walls, deep in the Thar Desert.",
          "Chittorgarh Fort — one of India's largest forts by area, associated with Rajput history and several well-known sieges.",
          "Kumbhalgarh Fort — famous for its massive perimeter wall, often described as one of the longest continuous walls in the world.",
        ],
      },
      { type: "tip", text: "If Rajasthan is your main draw, our dedicated Rajasthan fort tour route guide covers the full Jaipur–Jodhpur–Udaipur–Jaisalmer circuit with transport options for each leg." },
      { type: "heading", id: "delhi-and-agra", text: "Delhi and Agra" },
      {
        type: "checklist",
        items: [
          "Red Fort, Delhi — the Mughal seat of power for two centuries, right in the heart of Old Delhi.",
          "Agra Fort — the Mughal fort that predates the Taj Mahal, an easy add-on to any Agra day trip.",
          "Purana Qila, Delhi — older and quieter than the Red Fort, worth an hour if you're already in the city.",
        ],
      },
      { type: "heading", id: "central-and-south-india", text: "Central and South India" },
      {
        type: "checklist",
        items: [
          "Gwalior Fort — a hilltop fort in Madhya Pradesh, an easy stop on the Delhi–Gwalior rail corridor.",
          "Golconda Fort, Hyderabad — famous for its acoustics and its history as a diamond-trading centre.",
          "Bekal Fort, Kerala — a coastal fort on the Arabian Sea, a very different setting from the desert forts of Rajasthan.",
        ],
      },
      { type: "heading", id: "maharashtra-hill-forts", text: "Maharashtra's hill forts" },
      {
        type: "paragraph",
        text: "Maharashtra has a completely different fort culture — dozens of Maratha-era hill forts around Mumbai and Pune, many reached by trekking rather than by road all the way to the top. Sinhagad, Raigad, Rajgad and Lohagad are among the most popular for a day trip from either city.",
      },
      { type: "heading", id: "how-to-actually-get-to-these", text: "How to actually get to these" },
      {
        type: "paragraph",
        text: "Most forts sit some distance from the nearest railway station, so the realistic journey is almost always a train or flight into the nearest city, followed by a local bus, taxi, or (for the Maharashtra forts) a trek. Our fort-trips-by-train guide breaks down the nearest useful station for each major fort.",
      },
      { type: "tip", text: "Fort entry fees, opening hours, and local jeep or taxi fares change fairly often — treat any specific number you read (including elsewhere on this site) as a starting estimate and confirm it close to your travel date." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "rajasthan-fort-tour-route",
    title: "Rajasthan fort tour route: Jaipur, Jodhpur, Udaipur and Jaisalmer itinerary",
    excerpt:
      "A practical Rajasthan fort tour route from Jaipur to Jodhpur, Udaipur and Jaisalmer, with train, bus and car options for every leg of the circuit.",
    coverImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "9 min read",
    date: "2026-09-06",
    author: DEFAULT_AUTHOR,
    keywords: [
      "rajasthan fort tour route",
      "rajasthan fort tour itinerary",
      "rajasthan forts road trip",
      "rajasthan fort circuit by train",
      "jaipur jodhpur udaipur fort itinerary",
      "rajasthan heritage tour itinerary",
      "7 day rajasthan fort tour",
    ],
    relatedSlugs: [
      "best-forts-in-india-to-visit",
      "jaipur-fort-circuit-amer-jaigarh-nahargarh",
      "how-to-reach-amer-fort-from-jaipur",
      "best-fort-trips-in-india-by-train",
      "wl-80-confirmation-chances-fort-trip",
    ],
    content: [
      {
        type: "paragraph",
        text: "Rajasthan's forts are spread across a state roughly the size of a small country, so the route you pick matters as much as the list of forts on it. Here's a practical circuit, plus a shorter version if you're tighter on time.",
      },
      { type: "heading", id: "the-full-circuit", text: "The full circuit: Jaipur → Jodhpur → Udaipur → Jaisalmer" },
      {
        type: "paragraph",
        text: "This is the route that covers the most UNESCO-listed hill forts in one trip, roughly in this order: Jaipur (Amer Fort), an optional stop at Ajmer/Pushkar, Jodhpur (Mehrangarh Fort), Kumbhalgarh, Udaipur, Chittorgarh, and Jaisalmer. Doing it justice comfortably takes 8–10 days if you want a day at each major stop rather than a rushed pass-through.",
      },
      { type: "heading", id: "the-shorter-version", text: "The shorter version: Jaipur → Jodhpur → Udaipur" },
      {
        type: "paragraph",
        text: "If Jaisalmer's distance is the sticking point, dropping it gives you a tighter, still very complete circuit covering Amer Fort, Mehrangarh Fort, and Udaipur's palace-and-lake city (with Kumbhalgarh and Chittorgarh as day trips from Udaipur). This version is realistic in 5–6 days.",
      },
      { type: "heading", id: "leg-by-leg-transport-options", text: "Leg-by-leg transport options" },
      {
        type: "checklist",
        items: [
          "Delhi to Jaipur — train, bus or flight; the fastest trains cover it in well under 5 hours, making this the easiest entry point into the circuit.",
          "Jaipur to Jodhpur — a direct train or an overnight bus; the train is generally the more comfortable choice for this stretch.",
          "Jodhpur to Udaipur — mostly a bus or car journey, since direct train options are limited; the road route passes close to Kumbhalgarh, which is worth timing your travel around.",
          "Udaipur to Chittorgarh — an easy train or car day trip, doable as a there-and-back from Udaipur without changing hotels.",
          "Udaipur to Jaisalmer — the longest leg by far; a direct train or a flight connection through Jodhpur is usually more realistic than driving straight through.",
          "Jaisalmer back to Delhi — flight or train, depending on how much time is left in your trip.",
        ],
      },
      { type: "tip", text: "Rather than locking into one mode for the whole circuit, mix train for the longer legs and car or bus for the shorter, scenery-heavy stretches like Jodhpur–Udaipur — it's usually both cheaper and more comfortable than an all-road or all-rail trip." },
      { type: "heading", id: "booking-the-train-legs", text: "Booking the train legs" },
      {
        type: "paragraph",
        text: "Jaipur, Jodhpur and Udaipur are all well-connected, high-demand routes, especially in the October–March travel season — book as early in the 60-day advance reservation window as you can. If a leg still shows up waitlisted close to your date, check our guide on what a WL number actually means for a Rajasthan trip before assuming you need to rebook everything.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "how-to-reach-amer-fort-from-jaipur",
    title: "How to reach Amer Fort from Jaipur: bus, taxi, car and visit guide",
    excerpt:
      "Amer Fort is a short trip from central Jaipur — here's how to actually get there by bus, taxi or car, how much time to keep, and how to combine it with Jaigarh Fort.",
    coverImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "6 min read",
    date: "2026-09-06",
    author: DEFAULT_AUTHOR,
    keywords: [
      "how to reach amer fort from jaipur",
      "jaipur to amer fort distance",
      "jaipur to amer fort bus",
      "amer fort by bus",
      "amer fort route",
      "amer fort and jaigarh fort itinerary",
      "amer fort travel guide",
    ],
    relatedSlugs: [
      "jaipur-fort-circuit-amer-jaigarh-nahargarh",
      "rajasthan-fort-tour-route",
      "delhi-to-jaipur-best-ways-to-plan-your-trip",
      "best-forts-in-india-to-visit",
    ],
    content: [
      {
        type: "paragraph",
        text: "Amer Fort sits just outside central Jaipur, which makes it one of the easiest major forts in India to combine with a short city stay rather than needing a whole separate trip.",
      },
      { type: "heading", id: "distance-and-general-travel-time", text: "Distance and general travel time" },
      {
        type: "paragraph",
        text: "Amer Fort is roughly 11 km from central Jaipur, and the trip typically takes somewhere in the 30–45 minute range by road depending on traffic and your exact starting point in the city.",
      },
      { type: "heading", id: "ways-to-get-there", text: "Ways to get there" },
      {
        type: "checklist",
        items: [
          "Local bus — the cheapest option, with regular services running from central Jaipur toward Amer; ask locally or check current routes, since numbers and stops can change.",
          "App-based taxi or a pre-paid taxi from the station/airport — the most convenient door-to-door option, especially if you're combining Amer with Jaigarh Fort in the same trip.",
          "Auto-rickshaw — negotiable and flexible for a one-way trip, less ideal if you want the driver to wait through your visit.",
          "Rental car or self-drive — worth it if you're also planning to see Jaigarh Fort and the Jal Mahal viewpoint on the way back.",
          "Organised half-day or full-day tour — bundles Amer with Jaigarh and sometimes Nahargarh, useful if you'd rather not plan transport yourself.",
        ],
      },
      { type: "heading", id: "how-much-time-to-keep", text: "How much time to keep" },
      {
        type: "paragraph",
        text: "Give yourself at least half a day for Amer Fort alone if you want to walk it properly rather than rush through — it's a large complex with courtyards, palace rooms and viewpoints spread across several levels. If you're combining it with Jaigarh Fort (a short uphill drive away) and Panna Meena ka Kund on the way in, plan for closer to a full day.",
      },
      { type: "tip", text: "Start early — Amer Fort gets significantly busier by mid-morning, both with visitors and with heat during the warmer months, and an early start also leaves more of the day for Jaigarh Fort or a Nahargarh Fort sunset afterward." },
      { type: "heading", id: "what-to-carry", text: "What to carry" },
      {
        type: "checklist",
        items: [
          "Comfortable walking shoes — there's a lot of uneven stone flooring and stairs throughout the complex.",
          "Water and sun protection, especially outside the winter months.",
          "Cash in small denominations for local transport and minor purchases, alongside your usual digital payment options.",
        ],
      },
      {
        type: "paragraph",
        text: "For a fuller day plan that strings Amer together with Jaigarh and Nahargarh forts, see our Jaipur fort circuit guide. And since exact ticket prices, timings, and taxi fares shift over time, it's worth a quick check against current official information shortly before you go rather than relying on any single source, including this one.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "jaipur-fort-circuit-amer-jaigarh-nahargarh",
    title: "Jaipur fort circuit: Amer, Jaigarh and Nahargarh in one day",
    excerpt:
      "A practical one-day route linking Amer Fort, Jaigarh Fort and a Nahargarh Fort sunset — Jaipur's three major forts, in a sensible order.",
    coverImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "6 min read",
    date: "2026-09-06",
    author: DEFAULT_AUTHOR,
    keywords: [
      "jaipur fort circuit",
      "amer jaigarh nahargarh fort itinerary",
      "jaipur forts tour",
      "forts near jaipur",
      "jaipur one day fort tour",
      "amer fort to jaigarh fort",
      "nahargarh fort sunset",
    ],
    relatedSlugs: [
      "how-to-reach-amer-fort-from-jaipur",
      "rajasthan-fort-tour-route",
      "best-forts-in-india-to-visit",
      "delhi-to-jaipur-best-ways-to-plan-your-trip",
    ],
    content: [
      {
        type: "paragraph",
        text: "Jaipur has three major forts within a short drive of each other, and doing all three in a well-planned order turns into one of the better single days you can spend in Rajasthan.",
      },
      { type: "heading", id: "a-sensible-order-for-the-day", text: "A sensible order for the day" },
      {
        type: "checklist",
        items: [
          "Start at Panna Meena ka Kund — a stepwell just below Amer, worth ten quiet minutes before the crowds arrive at the fort itself.",
          "Amer Fort — arrive early; this is the largest of the three and deserves the most time.",
          "Jagat Shiromani Temple — a short stop in Amer town, easy to fold in between Amer and Jaigarh.",
          "Jaigarh Fort — connected to Amer by a short uphill road, home to sweeping views over the whole complex.",
          "Jal Mahal viewpoint — a quick photo stop on the way back into the city, right on the lake.",
          "Nahargarh Fort — save this for late afternoon; it's best known for sunset views over Jaipur.",
        ],
      },
      { type: "heading", id: "getting-between-the-stops", text: "Getting between the stops" },
      {
        type: "paragraph",
        text: "A car or taxi for the full day is the simplest way to do this circuit, since the stops aren't really walkable between each other (Amer to Jaigarh is a short drive, and Nahargarh is on the opposite side of the city). If you'd rather use public transport, buses run toward Amer, but you'll likely still need a taxi or auto for the Jaigarh and Nahargarh legs.",
      },
      { type: "tip", text: "If you only have time for two of the three, pair Amer with Nahargarh — Amer for the history and scale in the morning, Nahargarh for the sunset over the city in the evening — and treat Jaigarh as the one to add back in if your schedule allows." },
      { type: "heading", id: "practical-notes", text: "Practical notes" },
      {
        type: "paragraph",
        text: "This circuit works well as a single day if you start early, but it's a genuinely full day, not a leisurely one — build in buffer time, especially around midday heat outside the cooler months. See our Amer Fort access guide for more detail on the first and longest stop.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "best-forts-near-delhi-for-weekend-trip",
    title: "Best forts near Delhi for a weekend trip",
    excerpt:
      "From the Red Fort in the city itself to Neemrana, Alwar and Gwalior a few hours out — the best forts within weekend-trip range of Delhi, by route.",
    coverImage: "https://images.unsplash.com/photo-1545941962-1b6654eb8072?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "6 min read",
    date: "2026-09-06",
    author: DEFAULT_AUTHOR,
    keywords: [
      "forts near delhi",
      "forts near delhi for one day trip",
      "best forts near delhi",
      "delhi to neemrana fort",
      "delhi to gwalior fort",
      "weekend trips from delhi",
      "forts near delhi by train",
    ],
    relatedSlugs: [
      "best-forts-in-india-to-visit",
      "delhi-to-jaipur-best-ways-to-plan-your-trip",
      "best-fort-trips-in-india-by-train",
    ],
    content: [
      {
        type: "paragraph",
        text: "Delhi's own forts are worth an afternoon on their own, but the real appeal for a weekend trip is what's within a few hours' reach — a genuinely wide spread of fort styles without needing to fly anywhere.",
      },
      { type: "heading", id: "in-the-city-itself", text: "In the city itself" },
      {
        type: "checklist",
        items: [
          "Red Fort — the Mughal seat of power in Old Delhi, worth two to three hours including the museum galleries inside.",
          "Purana Qila — quieter and less crowded than the Red Fort, near the zoo and Humayun's Tomb if you want to combine stops.",
        ],
      },
      { type: "heading", id: "a-half-day-out", text: "A half-day out" },
      {
        type: "checklist",
        items: [
          "Neemrana Fort, Rajasthan — now partly a heritage hotel, a popular half-day or overnight escape from Delhi.",
        ],
      },
      { type: "heading", id: "a-full-day-or-overnight-trip", text: "A full day or overnight trip" },
      {
        type: "checklist",
        items: [
          "Agra Fort — usually paired with the Taj Mahal on a Delhi–Agra day trip, well served by fast trains.",
          "Alwar and Bala Qila, Rajasthan — a less-visited hill fort with good views, further off the main tourist trail.",
          "Deeg Fort and Palace, Rajasthan — known more for its palace and water gardens than for military architecture.",
        ],
      },
      { type: "heading", id: "a-proper-weekend-trip", text: "A proper weekend trip" },
      {
        type: "checklist",
        items: [
          "Gwalior Fort, Madhya Pradesh — a hilltop fort well connected to Delhi by train, comfortably doable as an overnight trip.",
        ],
      },
      { type: "tip", text: "Delhi–Agra and Delhi–Jaipur are both fast, high-frequency train corridors, which makes those two the easiest forts to bolt onto a weekend without much planning. Neemrana and Alwar work better with a car, since train connections are thinner." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "best-fort-trips-in-india-by-train",
    title: "Best fort trips in India by train: routes, stations and how to plan them",
    excerpt:
      "Which station gets you closest to which fort? A practical guide to reaching India's major forts by train, from Agra and Jaipur to Gwalior and Golconda.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "7 min read",
    date: "2026-09-06",
    author: DEFAULT_AUTHOR,
    keywords: [
      "fort trips in india by train",
      "forts in india accessible by train",
      "forts near railway stations",
      "india fort tour by train",
      "train routes to forts",
      "rajasthan forts by train",
      "delhi agra fort train route",
    ],
    relatedSlugs: [
      "best-forts-in-india-to-visit",
      "rajasthan-fort-tour-route",
      "waitlist-ticket-confirmation-chances-explained",
      "pnr-status-explained-cnf-rac-wl-meaning",
      "wl-80-confirmation-chances-fort-trip",
    ],
    content: [
      {
        type: "paragraph",
        text: "Most of India's best-known forts sit close enough to a well-connected railway station that a train-based trip is genuinely practical — you just need to know which station to book to, and what's left to sort out once you arrive.",
      },
      { type: "heading", id: "fort-by-fort-nearest-station", text: "Fort by fort: nearest useful station" },
      {
        type: "checklist",
        items: [
          "Agra Fort → Agra Cantt or Agra Fort station — an easy Delhi–Agra day trip on any of the fast morning trains.",
          "Amer Fort → Jaipur Junction — from there it's a local bus, taxi, or auto for the last stretch out to the fort.",
          "Mehrangarh Fort → Jodhpur Junction — the fort towers over the city, an easy taxi or auto ride from the station.",
          "Chittorgarh Fort → Chittorgarh station — a compact station-to-fort trip, easily doable as a day stop.",
          "Gwalior Fort → Gwalior station — well connected to Delhi by several daily trains, comfortable as an overnight trip.",
          "Golconda Fort → Hyderabad's Secunderabad or Hyderabad Deccan stations — from there, metro plus a short taxi ride covers the rest.",
          "Sinhagad Fort → Pune Junction — the station gets you into the city; the fort itself needs a road transfer (and some walking or a jeep) from there.",
        ],
      },
      { type: "heading", id: "train-plus-last-mile-is-the-norm", text: "Train + last-mile transport is the norm, not the exception" },
      {
        type: "paragraph",
        text: "Almost none of these forts sit directly next to a station — the realistic plan for every one of them is a train (or flight) into the nearest city, then a local bus, taxi, auto, or short trek for the final stretch. Budget that last leg into your day rather than assuming the fort is walkable from the platform.",
      },
      { type: "tip", text: "For the Rajasthan forts especially, book your train leg as early in the advance reservation window as you reasonably can — Jaipur, Jodhpur and Agra are all high-demand corridors, particularly October through March." },
      { type: "heading", id: "if-your-train-is-waitlisted", text: "If your train to a fort city is waitlisted" },
      {
        type: "paragraph",
        text: "A waitlisted ticket to Jaipur, Jodhpur, or Agra doesn't have to derail a fort trip — see our guide on reading a WL number and our fully-booked-train guide for the same fallback options (alternate trains, Vikalp, nearby stations, or a mixed-mode connection) that apply to any Indian rail journey.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "wl-80-confirmation-chances-fort-trip",
    title: "WL 80 confirmation chances for a fort trip: what to do if your train is waitlisted",
    excerpt:
      "Booked a train to Jaipur, Jodhpur or Agra for a fort trip and it's sitting at WL 80? Here's what that actually means, and what to do about it.",
    coverImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "5 min read",
    date: "2026-09-06",
    author: DEFAULT_AUTHOR,
    keywords: [
      "wl 80 confirmation chances",
      "wl 80 will confirm or not",
      "wl 80 train ticket confirmation",
      "waitlisted ticket for rajasthan trip",
      "train ticket waitlist for jaipur",
      "wl 80 jaipur ticket",
      "alternative route if train is waitlisted",
    ],
    relatedSlugs: [
      "waitlist-ticket-confirmation-chances-explained",
      "vikalp-scheme-alternate-train-explained",
      "rajasthan-fort-tour-route",
      "fort-trip-train-waitlisted-alternative-routes",
      "rac-vs-waitlist-difference-explained",
    ],
    content: [
      {
        type: "paragraph",
        text: "If you booked a train to Jaipur, Jodhpur, Udaipur or Agra for a fort trip and it's showing WL 80, the honest answer is: that's a long shot on its own, but it's not the end of the trip. Here's how to actually think about it.",
      },
      { type: "heading", id: "why-wl-80-alone-does-not-tell-you-much", text: "Why WL 80 on its own doesn't tell you much" },
      {
        type: "paragraph",
        text: "The number is just your position in the queue on that specific waitlist — it doesn't tell you the class, the quota (GNWL, RLWL, PQWL or TQWL), the season, or how fast that particular train's waitlist tends to move. See our full guide to reading a WL number for how these bands generally play out — but treat any general band as illustrative, not a prediction for your exact ticket.",
      },
      { type: "heading", id: "what-actually-changes-the-odds", text: "What actually changes the odds for a Rajasthan or Agra trip" },
      {
        type: "checklist",
        items: [
          "Which quota you're on — a GNWL 80 clears very differently from an RLWL 80 or a TQWL 80 on the same train.",
          "Season — festival months and the peak October–March travel window into Rajasthan move much slower than the off-season.",
          "Class — 3AC waitlists on popular Jaipur and Jodhpur trains are often longer than Sleeper on the same route.",
          "Route — the most heavily booked trains on Delhi–Jaipur–Jodhpur have deep waitlists precisely because they're the most convenient; a slightly less convenient train can have real availability.",
        ],
      },
      { type: "heading", id: "what-to-do-if-you-are-heading-to-jaipur-jodhpur-udaipur-or-agra", text: "What to do if you're heading to Jaipur, Jodhpur, Udaipur or Agra" },
      {
        type: "checklist",
        items: [
          "Check nearby stations — a change in boarding station can put you on a different quota entirely.",
          "Opt into the Vikalp scheme so the system automatically checks alternate trains on the same route for a vacant seat.",
          "Check a different class on the same train, or a different train on the same date.",
          "Keep a bus, flight, or a mixed train-plus-bus route as a genuine backup rather than a last-minute panic option.",
        ],
      },
      { type: "tip", text: "Track the number daily rather than checking once — a WL 80 that's dropped to WL 30 over a week is a very different situation from a WL 80 that hasn't moved in ten days. Our waitlist trend guide covers this in more detail." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "fort-trip-train-waitlisted-alternative-routes",
    title: "Train waitlisted for your fort trip? Alternative routes that still work",
    excerpt:
      "A waitlisted train doesn't have to cancel your Rajasthan or Agra fort trip. Here are the practical alternative routes and backups worth checking first.",
    coverImage: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-09-06",
    author: DEFAULT_AUTHOR,
    keywords: [
      "train waitlisted alternative route",
      "train ticket not confirmed for trip",
      "alternative route when train is full",
      "jaipur train waitlist alternative",
      "rajasthan train ticket not available",
      "how to reach jaipur when trains are full",
    ],
    relatedSlugs: [
      "what-to-do-when-your-train-is-fully-booked",
      "wl-80-confirmation-chances-fort-trip",
      "vikalp-scheme-alternate-train-explained",
      "rajasthan-fort-tour-route",
    ],
    content: [
      {
        type: "paragraph",
        text: "A fort trip planned around a fixed date is exactly the kind of journey where a waitlisted train stings the most — you can't easily shift the whole itinerary, but you also don't want to overpay in a panic. Here's the order worth checking things in.",
      },
      { type: "heading", id: "start-with-the-same-station", text: "1. Start with the same route, different options" },
      {
        type: "checklist",
        items: [
          "Check a different class on the same train — Sleeper or 3AC availability doesn't always run out at the same time.",
          "Check other trains on the same date to the same city — Jaipur, Jodhpur and Agra are all served by more than one useful train.",
          "Opt into the Vikalp scheme on your existing waitlisted ticket so the system can auto-shift you to a vacant seat on an alternate train at chart time.",
        ],
      },
      { type: "heading", id: "widen-the-search-a-little", text: "2. Widen the search a little" },
      {
        type: "checklist",
        items: [
          "Try a nearby departure or arrival station — a slightly different boarding point can put you on an entirely different, less crowded quota.",
          "Consider a connecting route — train to a nearby hub plus a shorter bus or train leg on to your fort-city destination.",
          "For longer routes like Delhi–Jaisalmer, check whether a flight into Jodhpur plus a shorter onward train or car leg beats waiting on a long-haul waitlist.",
        ],
      },
      { type: "heading", id: "keep-a-genuine-backup", text: "3. Keep a genuine backup, not a last-minute scramble" },
      {
        type: "paragraph",
        text: "An overnight AC sleeper bus is a realistic backup on most Delhi–Rajasthan and Agra routes, and often has more last-minute availability than trains during the busiest season. If your date is fixed and non-negotiable, book the backup a few days ahead rather than waiting for the final chart to confirm one way or the other.",
      },
      { type: "tip", text: "This is exactly the situation our general \"what to do when your train is fully booked\" guide is written for — the same fallback options apply whether you're headed to a fort circuit or anywhere else on the network." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Rail knowledge / product-adjacent content                           */
  /* ------------------------------------------------------------------ */
  {
    slug: "vande-bharat-express-routes-guide",
    title: "Vande Bharat Express: how many trains, full route list, and what makes it different",
    excerpt:
      "How many Vande Bharat trains run in India? Over 160 services across 100+ routes as of 2026, including the first Sleeper — here's the full route list and how to book smart.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "rail",
    readTime: "8 min read",
    date: "2026-08-31",
    author: DEFAULT_AUTHOR,
    keywords: [
      "vande bharat express routes list",
      "vande bharat train route",
      "vande bharat rail route",
      "how many vande bharat express in india",
      "vande bharat sleeper train route list",
      "vande bharat sleeper train",
      "vande bharat vs shatabdi vs rajdhani",
      "new vande bharat trains 2026",
    ],
    relatedSlugs: [
      "rajdhani-vs-tejas-vs-vande-bharat-compared",
      "rajdhani-express-routes-classes-guide",
      "tejas-express-current-routes-guide",
      "how-wayvia-finds-alternative-journeys",
    ],
    content: [
      {
        type: "paragraph",
        text: "Vande Bharat has gone from a single showcase train in 2019 to one of the backbones of India's premium rail network. As of early 2026, more than 160 Vande Bharat services operate across upwards of 100 routes, plus the country's first Sleeper variant — and Indian Railways continues to add new corridors regularly, so exact counts shift month to month.",
      },
      { type: "heading", id: "how-many-vande-bharat-trains-are-there", text: "How many Vande Bharat trains are there right now?" },
      {
        type: "paragraph",
        text: "The network has grown from a single Delhi–Varanasi service in 2019 to well over 160 trains today, spread across every major railway zone in the country. Because new routes are flagged off every few weeks, the most reliable way to confirm the current count for a specific corridor is IRCTC's train search rather than any fixed number — treat any \"as of\" figure, including this one, as a snapshot rather than a permanent total.",
      },
      { type: "heading", id: "chair-car-network", text: "The chair-car network" },
      {
        type: "paragraph",
        text: "Most Vande Bharat services are self-propelling AC chair-car trainsets, built under the Make in India programme, designed for fast daytime intercity travel — the same slot Shatabdi Express used to own, but with quicker acceleration and a noticeably smoother ride.",
      },
      {
        type: "checklist",
        items: [
          "Popular corridors include New Delhi–Varanasi, New Delhi–Katra (Mata Vaishno Devi), Mumbai–Ahmedabad, Chennai–Bengaluru, and Howrah–New Jalpaiguri.",
          "The Howrah–New Jalpaiguri route is a favourite with travellers heading onward to Darjeeling.",
          "South and East India have both seen steady additions, including Secunderabad–Visakhapatnam and Durg–Visakhapatnam services, alongside newer corridors into previously underserved cities like Ranchi.",
          "Newer additions, including a Jammu–Srinagar service, continue to extend the network into previously underserved corridors.",
        ],
      },
      { type: "heading", id: "vande-bharat-sleeper", text: "Vande Bharat Sleeper — the overnight version" },
      {
        type: "paragraph",
        text: "The first Vande Bharat Sleeper service, connecting Howrah and Kamakhya, began regular operation in January 2026 — India's first sleeper Vande Bharat and, for now, the only one you can actually book. It's aimed squarely at routes currently served by Rajdhani-class trains, with more sleeper corridors expected to follow as additional rakes clear testing.",
      },
      { type: "tip", text: "On popular Vande Bharat routes, especially around festival season, check your PNR status soon after booking — seats fill and waitlists move fast." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "rajdhani-express-routes-classes-guide",
    title: "Rajdhani Express: routes, classes and what to know before you book",
    excerpt:
      "Rajdhani Express routes, classes and fare rules explained — India's original premium overnight train, with meals included and priority on the network.",
    coverImage: "https://images.unsplash.com/photo-1580442374555-3def8fb41738?w=1600&h=900&fit=crop",
    category: "rail",
    readTime: "6 min read",
    date: "2026-09-01",
    author: DEFAULT_AUTHOR,
    keywords: [
      "rajdhani express routes",
      "rajdhani express classes",
      "rajdhani express fare",
      "is food included in rajdhani ticket",
      "rajdhani express timetable",
      "fastest rajdhani express",
    ],
    relatedSlugs: [
      "rajdhani-vs-tejas-vs-vande-bharat-compared",
      "tejas-express-current-routes-guide",
      "vande-bharat-express-routes-guide",
      "waitlist-ticket-confirmation-chances-explained",
    ],
    content: [
      {
        type: "paragraph",
        text: "Rajdhani Express has been connecting state capitals to Delhi since 1969, and it's still the benchmark for overnight rail travel in India — fully air-conditioned, given priority over most other trains on the network, and running with meals built into the fare rather than sold separately.",
      },
      { type: "heading", id: "what-makes-rajdhani-different", text: "What makes Rajdhani different" },
      {
        type: "paragraph",
        text: "Unlike Vande Bharat or Tejas, which run chair-car style for daytime trips, every Rajdhani service is an overnight sleeper train with fully air-conditioned coaches — there's no unreserved or general-quota travel on a Rajdhani at all, and no non-AC classes.",
      },
      { type: "heading", id: "classes-on-rajdhani", text: "Classes on Rajdhani" },
      {
        type: "checklist",
        items: [
          "AC First Class (1A) — private lockable coupes, the most spacious and expensive option.",
          "AC 2 Tier (2A) — open bays of four berths plus two side berths, with curtains for privacy.",
          "AC 3 Tier (3A) — open bays of six berths plus two side berths, no curtains, the most affordable Rajdhani class.",
        ],
      },
      { type: "heading", id: "meals-included-in-the-fare", text: "Meals are included in the fare" },
      {
        type: "paragraph",
        text: "Rajdhani fares bundle in catering by default — tea, breakfast, lunch or dinner and snacks depending on the timing of your journey, served at your seat or berth. This is one of the clearest differences from a regular Mail/Express ticket, where food is always an optional, separate purchase.",
      },
      { type: "heading", id: "popular-rajdhani-routes", text: "Popular Rajdhani routes" },
      {
        type: "checklist",
        items: [
          "Mumbai (Central or CSMT)–New Delhi — the original and still one of the fastest Rajdhani corridors.",
          "Howrah–New Delhi and Sealdah–New Delhi — the classic Kolkata-side connections.",
          "Thiruvananthapuram, Chennai, Secunderabad and Bengaluru all run long-haul Rajdhani services into Delhi, some of the longest scheduled train journeys in the country.",
          "Jammu Tawi–New Delhi — a shorter, high-frequency daily Rajdhani used heavily for onward travel to the Kashmir valley.",
        ],
      },
      { type: "tip", text: "Rajdhani fares are noticeably higher than a regular Mail/Express ticket in the same class, partly because of the included catering and partly because of the priority scheduling — factor that into your budget, not just the travel time saved." },
      { type: "heading", id: "booking-tips", text: "Booking tips" },
      {
        type: "paragraph",
        text: "Rajdhani tickets open under the same 60-day advance reservation period as other trains, and on the busiest corridors (especially into Kolkata, Kerala and the Northeast around festival season) they can waitlist quickly. Booking as early in that window as you can is the single biggest lever you have over your odds of a confirmed seat.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "tejas-express-current-routes-guide",
    title: "Tejas Express: is it still running, and which routes are active in 2026?",
    excerpt:
      "Tejas Express current status for 2026 — India's first IRCTC-operated train is still running on two routes, after several others were suspended. Here's what's live and what changed.",
    coverImage: "https://images.unsplash.com/photo-1637995735729-c43250f1ef47?w=1600&h=900&fit=crop",
    category: "rail",
    readTime: "5 min read",
    date: "2026-09-01",
    author: DEFAULT_AUTHOR,
    keywords: [
      "tejas express current status",
      "is tejas express running",
      "tejas express routes 2026",
      "tejas express vs vande bharat",
      "irctc private train",
    ],
    relatedSlugs: [
      "rajdhani-vs-tejas-vs-vande-bharat-compared",
      "vande-bharat-express-routes-guide",
      "rajdhani-express-routes-classes-guide",
    ],
    content: [
      {
        type: "paragraph",
        text: "Tejas Express launched in 2017 as India's first corporate-operated train, run by IRCTC (a subsidiary of Indian Railways) rather than the Railways directly — same tracks, locomotives and crew, but ticketing, catering and service standards handled separately, with a more airline-style experience: attendants, entertainment screens, and complimentary travel insurance.",
      },
      { type: "heading", id: "what-is-actually-running-now", text: "What's actually running now" },
      {
        type: "paragraph",
        text: "As of 2026, IRCTC's corporate-run Tejas Express operates on two routes: Lucknow–New Delhi and Ahmedabad–Mumbai Central. Several other routes that were announced or trialled over the years — including Mumbai–Surat and a proposed New Delhi–Jalandhar service — were put on hold and haven't resumed. This has shifted over time due to occupancy and pandemic-era disruptions, so it's genuinely worth checking live running status before you plan around it, rather than assuming an older route list is still accurate.",
      },
      {
        type: "checklist",
        items: [
          "Lucknow–New Delhi Tejas Express — around 6 hours, AC Executive Chair Car and AC Chair Car, no pantry car but on-board catering included.",
          "Ahmedabad–Mumbai Central Tejas Express — around 6.5 hours, same class structure and catering setup.",
          "Both are chair-car (seated) services, not overnight sleeper trains.",
        ],
      },
      { type: "heading", id: "what-happened-to-the-wider-private-train-plan", text: "What happened to the wider private-train plan" },
      {
        type: "paragraph",
        text: "Indian Railways originally floated a much larger plan to have private operators run around 150 modern trains across roughly 100 routes, with Tejas as the proof of concept. That broader bidding round drew limited interest from private players and never really took off — in practice, premium daytime rail travel investment has largely shifted to Indian Railways' own Vande Bharat programme instead, which has scaled far faster than Tejas ever did.",
      },
      { type: "tip", text: "If you're comparing a Tejas route against a Vande Bharat on the same corridor, check both — on several routes Vande Bharat has effectively taken over the premium daytime slot Tejas used to occupy, sometimes with better frequency." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "rajdhani-vs-tejas-vs-vande-bharat-compared",
    title: "Rajdhani vs Tejas vs Vande Bharat: which premium train should you book?",
    excerpt:
      "Rajdhani vs Tejas vs Vande Bharat, compared honestly — overnight sleeper vs day chair car, network size, catering, and which one actually fits your trip.",
    coverImage: "https://images.unsplash.com/photo-1685858874777-b87106319be7?w=1600&h=900&fit=crop",
    category: "rail",
    readTime: "6 min read",
    date: "2026-09-01",
    author: DEFAULT_AUTHOR,
    keywords: [
      "rajdhani vs tejas vs vande bharat",
      "difference between rajdhani and vande bharat",
      "tejas vs vande bharat",
      "best premium train india",
      "rajdhani vs vande bharat which is better",
    ],
    relatedSlugs: [
      "rajdhani-express-routes-classes-guide",
      "tejas-express-current-routes-guide",
      "vande-bharat-express-routes-guide",
    ],
    content: [
      {
        type: "paragraph",
        text: "All three get called \"premium\" trains, but they're not really competing for the same trip. The honest answer to \"which is better\" depends almost entirely on whether you're travelling overnight or during the day, and how big the network is on your specific route.",
      },
      { type: "heading", id: "the-core-difference-day-vs-overnight", text: "The core difference: day trip vs. overnight" },
      {
        type: "checklist",
        items: [
          "Rajdhani — overnight sleeper only, fully AC (1A/2A/3A), meals included in the fare. Built for long-haul routes where you want to sleep through the distance.",
          "Vande Bharat — daytime AC chair car (with one Sleeper route so far), self-propelled and quick off the mark, built for same-day city-to-city travel.",
          "Tejas — daytime AC chair car like Vande Bharat, IRCTC-operated with airline-style service and included travel insurance, but currently limited to just two routes.",
        ],
      },
      { type: "heading", id: "network-size-and-availability", text: "Network size and availability" },
      {
        type: "paragraph",
        text: "This is where the three diverge sharply. Rajdhani has been running for over five decades and covers dozens of long-distance corridors into Delhi from almost every state capital. Vande Bharat has scaled to 160+ trains across 100+ routes in just a few years and keeps expanding. Tejas, by contrast, has shrunk from its original ambitions down to two active corporate-run routes — so for most journeys, the real choice in practice is between Rajdhani and Vande Bharat, not all three.",
      },
      { type: "heading", id: "cost-and-comfort", text: "Cost and comfort" },
      {
        type: "paragraph",
        text: "Rajdhani fares include full catering across a long journey, which partly explains why they run higher than an equivalent-distance Vande Bharat chair-car fare — you're also paying for a berth to sleep on, not just a seat. Vande Bharat and Tejas fares are lower for a comparable distance but assume you're travelling for a matter of hours, not overnight.",
      },
      { type: "heading", id: "so-which-should-you-book", text: "So which should you book?" },
      {
        type: "checklist",
        items: [
          "Route is 700+ km and you'd rather sleep than sit: Rajdhani, if one runs on your route.",
          "Route is under roughly 500–600 km and doable in a day: Vande Bharat, for speed and frequency.",
          "Your route happens to be Lucknow–Delhi or Ahmedabad–Mumbai and you want the airline-style extras: Tejas is worth checking, but compare it against Vande Bharat on the same corridor first.",
          "Unsure which trains actually run on your route: search live availability rather than assuming — Tejas coverage in particular has changed a lot over the past few years.",
        ],
      },
      { type: "tip", text: "Don't assume Tejas exists on your route just because you've heard the name — as of 2026 it's down to two corridors. Vande Bharat and Rajdhani cover far more ground, so check those first for anything outside Lucknow–Delhi or Ahmedabad–Mumbai." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "irctc-website-down-what-to-do",
    title: "IRCTC website or app not working? What to do when booking fails",
    excerpt:
      "IRCTC slows down or times out during Tatkal and festival peaks more often than anyone would like — here's what actually helps when booking fails.",
    coverImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "5 min read",
    date: "2026-08-13",
    author: DEFAULT_AUTHOR,
    keywords: [
      "irctc website not working",
      "irctc app down what to do",
      "irctc booking failed payment deducted",
      "irctc server slow tatkal",
    ],
    relatedSlugs: ["irctc-tatkal-booking-2026-timings-rules", "diwali-chhath-puja-train-booking-tips", "uts-app-unreserved-ticket-booking-guide"],
    content: [
      {
        type: "paragraph",
        text: "IRCTC's servers see enormous spikes the moment Tatkal opens or a festival booking window starts — lakhs of people logging in within the same minute. Slowness or outright failures during those windows are common, not a sign something is uniquely wrong with your account.",
      },
      { type: "heading", id: "first-things-to-try", text: "First things to try" },
      {
        type: "checklist",
        items: [
          "Refresh once, then wait a few seconds rather than repeatedly resubmitting — repeated submissions can sometimes create duplicate booking attempts.",
          "Switch between the IRCTC website and the Rail Connect app (or vice versa) — one occasionally responds when the other is timing out.",
          "Check IRCTC's official social media accounts for an outage acknowledgement before assuming it's a problem on your end.",
          "If payment was deducted but no ticket was generated, don't panic or rebook immediately — failed transactions are auto-refunded, usually within a few business days.",
        ],
      },
      { type: "tip", text: "Avoid third-party ticket resellers or \"guaranteed booking\" services during an outage — they add a relay step that's typically slower, not faster, and carries its own risk." },
      { type: "heading", id: "if-you-still-cannot-book", text: "If you still can't book" },
      {
        type: "paragraph",
        text: "A physical PRS (Passenger Reservation System) counter can sometimes succeed when the app can't, particularly for non-Tatkal bookings. And if the train you wanted is genuinely sold out — not just slow to load — it's worth comparing a connecting route or another mode entirely instead of refreshing indefinitely.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "train-vs-flight-vs-bus-how-to-choose",
    title: "Train vs flight vs bus: how to actually choose for your route",
    excerpt: "There's no single \"best\" mode of travel — here's the framework to actually decide between train, flight, and bus for any given trip.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-11",
    author: DEFAULT_AUTHOR,
    keywords: [
      "train vs flight vs bus india",
      "should i take train or flight",
      "cheapest way to travel india",
      "fastest way to travel long distance india",
    ],
    relatedSlugs: ["how-to-find-cheaper-flight-train-combos", "how-wayvia-finds-alternative-journeys", "uts-app-unreserved-ticket-booking-guide"],
    content: [
      {
        type: "paragraph",
        text: "\"Which is better, train or flight?\" doesn't have one answer — it depends on distance, how flexible your dates are, and what you actually value on the day: cost, time, or comfort. Here's how to think about it route by route.",
      },
      { type: "heading", id: "distance-changes-the-math", text: "Distance changes the math" },
      {
        type: "paragraph",
        text: "Under roughly 300–400 km, a train or bus usually wins on total door-to-door time once you account for airport check-in and transfer time. Beyond about 800–1000 km, flights start to pull ahead on time, even after factoring in airport overhead — a fact that only really pays off if your fare isn't inflated by a last-minute booking.",
      },
      { type: "heading", id: "budget-vs-time", text: "Budget vs. time" },
      {
        type: "checklist",
        items: [
          "Tight on money, flexible on time: an AC train class or an overnight bus typically beats flying, sometimes by a wide margin.",
          "Tight on time, flexible on budget: a flight (or a flight + train combo) usually wins on very long routes.",
          "Somewhere in between: mixed-mode journeys — train to a hub, then a short flight or bus onward — often land the best balance of the three.",
        ],
      },
      { type: "tip", text: "Airfares spike hardest on thin, less-flown routes and small airports. Flying into a major hub and finishing the last stretch by train is frequently cheaper than a single-flight ticket, even though it's two bookings instead of one." },
      { type: "heading", id: "let-the-search-do-the-comparing", text: "Let the search do the comparing" },
      {
        type: "paragraph",
        text: "Rather than checking three separate apps for the same trip, Wayvia checks trains, buses, and flights together — including mixed-mode combinations — so you can actually compare real options instead of guessing.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Route guides — existing                                             */
  /* ------------------------------------------------------------------ */
  {
    slug: "delhi-to-goa-7-ways-to-get-there",
    title: "Delhi to Goa: 7 ways to get there",
    excerpt: "Delhi to Goa train, flight and bus options compared — from direct trains to coastal routes, the best combinations for every kind of traveller.",
    coverImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "8 min read",
    date: "2026-08-24",
    author: DEFAULT_AUTHOR,
    keywords: ["delhi to goa train", "delhi to goa best way to travel", "delhi goa flight train combo"],
    content: [
      {
        type: "paragraph",
        text: "Delhi to Goa is one of India's most-searched long-distance routes, and it rarely has just one good answer. Your best option changes depending on your budget, how much time you can spare, and how much of the journey you actually want to enjoy versus just endure.",
      },
      { type: "heading", id: "the-direct-train", text: "1. The direct train" },
      {
        type: "paragraph",
        text: "A handful of direct trains connect Delhi to Goa, typically taking 24–30 hours. It's the classic option — comfortable in 2AC/3AC, but it's a long single sitting.",
      },
      { type: "heading", id: "train-plus-bus-via-jaipur", text: "2. Train + bus via Jaipur and Ahmedabad" },
      {
        type: "paragraph",
        text: "Breaking the journey through Jaipur and Ahmedabad often turns up better availability and a lower total fare, at the cost of a longer overall trip with a layover or two.",
      },
      { type: "heading", id: "fly-into-goa", text: "3. Fly into Goa, take the scenic train out" },
      {
        type: "paragraph",
        text: "Flying one way and taking the Konkan Railway back (or vice versa) is a popular pick for people who want the coastal train views without committing to it in both directions.",
      },
      { type: "tip", text: "Wayvia checks all of these combinations together, live, so you can compare real fares instead of guessing." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "best-bus-routes-between-major-cities-in-india",
    title: "Best bus routes between major cities in India",
    excerpt: "Comfort, affordability and scenic views — our top picks.",
    coverImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-22",
    author: DEFAULT_AUTHOR,
    keywords: ["best bus routes india", "overnight bus travel india tips", "sleeper bus vs ac bus"],
    content: [
      {
        type: "paragraph",
        text: "Buses don't get the credit they deserve. On plenty of routes — especially where trains are scarce or badly timed — an overnight Volvo or sleeper coach beats waiting on a waitlist.",
      },
      { type: "heading", id: "what-to-look-for", text: "What to actually look for" },
      {
        type: "checklist",
        items: [
          "AC sleeper for anything over 6 hours overnight.",
          "Boarding point close to a real landmark, not a vague street name.",
          "Operator reviews from the last few weeks, not just the overall rating.",
        ],
      },
      { type: "tip", text: "Front-row upper berths near the driver tend to be the smoothest ride on hill routes." },
    ],
  },
  {
    slug: "how-wayvia-finds-alternative-journeys",
    title: "How Wayvia finds alternative journeys",
    excerpt: "A look behind the scenes at our multimodal search engine.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "wayvia",
    readTime: "5 min read",
    date: "2026-08-20",
    author: DEFAULT_AUTHOR,
    keywords: ["wayvia multimodal search", "how does wayvia work", "train bus flight combined search"],
    content: [
      {
        type: "paragraph",
        text: "Most search tools only ever show you the direct option. Wayvia starts from a different question: if the direct route is full, slow, or expensive, what's the best real alternative — and is it actually bookable?",
      },
      { type: "heading", id: "structural-discovery", text: "Structural discovery, mode by mode" },
      {
        type: "paragraph",
        text: "We map out every plausible junction between your origin and destination, then check trains, buses, and flights through each one — in parallel, not as an afterthought once the direct search comes up short.",
      },
      { type: "heading", id: "live-availability", text: "Live availability, not guesswork" },
      {
        type: "paragraph",
        text: "Every candidate route gets checked against live seat and fare data before it's ever shown to you, so what you see is what you can actually book.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "mumbai-to-kochi-scenic-routes-by-train",
    title: "Mumbai to Kochi: Scenic routes by train",
    excerpt: "The Konkan Railway is one of India's most beautiful stretches of track — here's how to make the most of it.",
    coverImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "7 min read",
    date: "2026-08-18",
    author: DEFAULT_AUTHOR,
    keywords: ["mumbai to kochi train", "konkan railway scenic route", "mumbai kochi best train"],
    content: [
      {
        type: "paragraph",
        text: "The Mumbai–Kochi run along the Konkan Railway passes through some of the most dramatic coastal and Western Ghats scenery in the country. Here's how to plan it well.",
      },
      { type: "heading", id: "pick-a-daylight-window", text: "Pick a daylight window" },
      {
        type: "paragraph",
        text: "Try to time the Ratnagiri–Goa–Karwar stretch for daylight hours — it's the most scenic section by a wide margin.",
      },
      { type: "tip", text: "Window seats on the left side (heading south) generally face the coast." },
    ],
  },
  {
    slug: "delhi-to-jaipur-best-ways-to-plan-your-trip",
    title: "Delhi to Jaipur: Best ways to plan your trip",
    excerpt: "Delhi to Jaipur train timings compared to bus — a short, popular route with more options than you'd think.",
    coverImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "5 min read",
    date: "2026-08-16",
    author: DEFAULT_AUTHOR,
    keywords: ["delhi to jaipur train", "delhi jaipur fastest train", "delhi to jaipur bus vs train"],
    relatedSlugs: [
      "how-to-reach-amer-fort-from-jaipur",
      "jaipur-fort-circuit-amer-jaigarh-nahargarh",
      "rajasthan-fort-tour-route",
    ],
    content: [
      {
        type: "paragraph",
        text: "Delhi to Jaipur is short enough that mode choice comes down to timing and comfort more than availability — but it's still worth comparing before you book.",
      },
      { type: "heading", id: "fastest-vs-cheapest", text: "Fastest vs. cheapest" },
      {
        type: "paragraph",
        text: "The fastest trains cover it in under 5 hours; overnight buses take longer but let you sleep through the trip and arrive with a full day ahead of you.",
      },
    ],
  },
  {
    slug: "monsoon-travel-tips-for-safe-and-smooth-journeys",
    title: "Monsoon travel: Tips for safe and smooth journeys",
    excerpt: "Rain-proof your travel plans with these practical tips.",
    coverImage: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-14",
    author: DEFAULT_AUTHOR,
    keywords: ["monsoon travel tips india", "train delays monsoon", "safe travel rainy season india"],
    content: [
      {
        type: "paragraph",
        text: "Monsoon season can turn a straightforward trip into a scheduling puzzle. A little slack in your plans goes a long way.",
      },
      { type: "heading", id: "build-in-buffer-time", text: "Build in buffer time" },
      {
        type: "paragraph",
        text: "Avoid tight same-day connections during heavy-rain months — waterlogging and speed restrictions are common causes of delay.",
      },
      { type: "checklist", items: ["Check the weather along your whole route, not just at the destination.", "Keep a backup mode in mind before you travel, not after a delay."] },
    ],
  },
  {
    slug: "how-to-find-cheaper-flight-train-combos",
    title: "How to find cheaper flight + train combos",
    excerpt: "Mixing modes can save you real money — if you know where to look.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "5 min read",
    date: "2026-08-12",
    author: DEFAULT_AUTHOR,
    keywords: ["cheap flight train combo india", "fly and train combination ticket", "cheaper than direct flight"],
    content: [
      {
        type: "paragraph",
        text: "A full-route flight isn't always the cheapest way to fly. Landing at a nearby hub and finishing the trip by train is often significantly less expensive.",
      },
      { type: "heading", id: "why-this-works", text: "Why this works" },
      {
        type: "paragraph",
        text: "Airfares spike sharply for less-flown routes and last-mile airports. A cheap flight into a major hub plus a short train leg frequently beats booking the whole thing as one flight.",
      },
      { type: "tip", text: "Wayvia checks flight+train combinations automatically, so you don't have to book two separate searches." },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* More route guides — new                                             */
  /* ------------------------------------------------------------------ */
  {
    slug: "mumbai-to-goa-train-bus-flight-compared",
    title: "Mumbai to Goa: train, bus, or flight — which is actually best?",
    excerpt: "One of India's most popular short-haul routes, compared honestly across all three modes.",
    coverImage: "https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "6 min read",
    date: "2026-08-10",
    author: DEFAULT_AUTHOR,
    keywords: ["mumbai to goa train vs flight", "mumbai goa best way to travel", "mumbai goa bus or train"],
    relatedSlugs: ["delhi-to-goa-7-ways-to-get-there", "train-vs-flight-vs-bus-how-to-choose"],
    content: [
      {
        type: "paragraph",
        text: "Mumbai to Goa is short enough that all three modes are genuinely competitive — which one wins depends mostly on what you're doing with the time you save (or don't).",
      },
      { type: "heading", id: "train-the-konkan-classic", text: "Train: the Konkan classic" },
      {
        type: "paragraph",
        text: "Trains along the Konkan Railway take roughly 8–12 hours depending on the exact train, but the coastal scenery is genuinely part of the trip, not just a means to an end.",
      },
      { type: "heading", id: "flight-fastest-pricier", text: "Flight: fastest, pricier" },
      {
        type: "paragraph",
        text: "Under 90 minutes in the air makes flying the clear choice if your weekend is short — the trade-off is fare volatility, which spikes hard on Friday evenings and holiday weekends.",
      },
      { type: "heading", id: "bus-flexible-and-cheap", text: "Bus: flexible and cheap" },
      {
        type: "paragraph",
        text: "Overnight AC sleeper buses cover it in about 10–12 hours and often have more last-minute availability than trains during peak weekends.",
      },
      { type: "tip", text: "For a long weekend, an overnight train or bus down and a quick flight back (or vice versa) is a popular way to get both the scenery and the time saving." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "bengaluru-to-chennai-fastest-ways-to-travel",
    title: "Bengaluru to Chennai: fastest ways to get there",
    excerpt: "A short, high-frequency corridor with strong train, bus, and Vande Bharat options.",
    coverImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "5 min read",
    date: "2026-08-09",
    author: DEFAULT_AUTHOR,
    keywords: ["bengaluru to chennai train", "bangalore chennai vande bharat", "bengaluru chennai fastest train"],
    relatedSlugs: ["vande-bharat-express-routes-guide", "delhi-to-jaipur-best-ways-to-plan-your-trip"],
    content: [
      {
        type: "paragraph",
        text: "Bengaluru–Chennai is one of South India's busiest corridors, and it's short enough that speed differences between trains actually matter for a same-day trip.",
      },
      { type: "heading", id: "vande-bharat-and-shatabdi", text: "Vande Bharat and Shatabdi" },
      {
        type: "paragraph",
        text: "The Vande Bharat service on this route covers the distance in around 4–5 hours, making a there-and-back day trip realistic for business travel.",
      },
      { type: "heading", id: "overnight-options", text: "Overnight options" },
      {
        type: "paragraph",
        text: "For a more relaxed pace, overnight trains and AC sleeper buses let you sleep through the trip and arrive with a full day ahead of you — a solid choice if you don't need to be there first thing in the morning.",
      },
      { type: "tip", text: "This route has enough frequency that checking two or three departure times before settling on one is usually worth the extra minute." },
    ],
  },
  {
    slug: "kolkata-to-delhi-travel-options-compared",
    title: "Kolkata to Delhi: train, flight and route options compared",
    excerpt: "One of India's classic long-distance corridors — Rajdhani, regular trains, and flights, compared.",
    coverImage: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "6 min read",
    date: "2026-08-08",
    author: DEFAULT_AUTHOR,
    keywords: ["kolkata to delhi train", "howrah delhi rajdhani", "kolkata delhi flight vs train"],
    relatedSlugs: ["waitlist-ticket-confirmation-chances-explained", "train-vs-flight-vs-bus-how-to-choose"],
    content: [
      {
        type: "paragraph",
        text: "At roughly 1,450 km, Kolkata–Delhi is a genuine long-haul route where every mode has a real case to make.",
      },
      { type: "heading", id: "rajdhani-and-duronto", text: "Rajdhani and Duronto" },
      {
        type: "paragraph",
        text: "The Rajdhani Express covers this in about 17 hours overnight — historically the gold standard for this route, and still a comfortable, reliable option in 2AC or 3AC.",
      },
      { type: "heading", id: "flying-instead", text: "Flying instead" },
      {
        type: "paragraph",
        text: "A flight takes around 2.5 hours in the air, which is the obvious pick if your trip is short on days — but demand on this route means fares can swing widely depending on how far ahead you book.",
      },
      { type: "tip", text: "Because this route is so heavily travelled, waitlist movement on the Rajdhani can be unpredictable during festival season — book as early in the ARP window as you can." },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "chennai-to-kochi-how-to-plan-your-trip",
    title: "Chennai to Kochi: how to plan your trip",
    excerpt: "Crossing from Tamil Nadu into Kerala — the train, bus, and flight trade-offs for this route.",
    coverImage: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&h=900&fit=crop",
    category: "route-ideas",
    readTime: "5 min read",
    date: "2026-08-07",
    author: DEFAULT_AUTHOR,
    keywords: ["chennai to kochi train", "chennai kochi best route", "chennai to kerala travel options"],
    relatedSlugs: ["mumbai-to-kochi-scenic-routes-by-train", "monsoon-travel-tips-for-safe-and-smooth-journeys"],
    content: [
      {
        type: "paragraph",
        text: "Chennai to Kochi crosses through the Western Ghats, and the route you pick changes both the scenery and the total time more than you'd expect for a same-state-ish trip.",
      },
      { type: "heading", id: "the-direct-train", text: "The direct train" },
      {
        type: "paragraph",
        text: "Direct trains take roughly 11–12 hours, comfortably doable overnight in Sleeper or 3AC.",
      },
      { type: "heading", id: "flying-in-under-two-hours", text: "Flying in under two hours" },
      {
        type: "paragraph",
        text: "A direct flight covers it in around 1.5 hours — a strong option if your schedule is tight, though it's worth comparing against a night train plus a free day on arrival.",
      },
      { type: "tip", text: "This route sees heavier demand during Kerala's monsoon-adjacent festival season — check availability a little earlier than you would for an off-season trip." },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getFeaturedPost(): BlogPost {
  return BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0];
}

export function getRelatedPosts(post: BlogPost, limit = 4): BlogPost[] {
  if (post.relatedSlugs && post.relatedSlugs.length > 0) {
    const bySlug = post.relatedSlugs.map((s) => getPostBySlug(s)).filter((p): p is BlogPost => Boolean(p));
    if (bySlug.length > 0) return bySlug.slice(0, limit);
  }
  return BLOG_POSTS.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* "Route of the week" panel — a separate, small piece of content, not */
/* a blog post, but edited the same way: change the data, not the UI.  */
/* ------------------------------------------------------------------ */

export interface RouteOfWeekStep {
  code: string;
  name: string;
  /** Mode of the leg arriving at this stop. Omit for the first stop (the origin). */
  mode?: "train" | "bus" | "flight";
  /** Duration label for the leg arriving at this stop, e.g. "15h 30m". Omit for the origin. */
  legDuration?: string;
}

export interface RouteOfWeek {
  title: string;
  description: string;
  waysFound: number;
  bestValue: string;
  steps: RouteOfWeekStep[];
  href: string;
}

export const ROUTE_OF_THE_WEEK: RouteOfWeek = {
  title: "Delhi → Goa",
  description: "There's more than one way to get there. We found these top combinations for this route.",
  waysFound: 3,
  bestValue: "₹2,140",
  href: "/journey-planner?from=NDLS&to=GOA",
  steps: [
    { code: "NDLS", name: "New Delhi" },
    { code: "JP", name: "Jaipur", mode: "train", legDuration: "15h 30m" },
    { code: "ADI", name: "Ahmedabad", mode: "bus", legDuration: "8h 20m" },
    { code: "GOA", name: "Goa", mode: "train", legDuration: "10h 10m" },
  ],
};