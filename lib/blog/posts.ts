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
    title: "Waitlist ticket confirmation chances: how to read your WL number",
    excerpt:
      "WL 8 confirmation chances and WL 80 confirmation chances are not the same bet. Here's how waitlist ticket confirmation actually works, and what to do when your number looks risky.",
    coverImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-25",
    author: DEFAULT_AUTHOR,
    keywords: [
      "waitlist confirmation chances",
      "wl ticket confirmation chances",
      "wl 80 confirmation chances",
      "wl8 confirmation chances",
      "railway confirmation chances calculator",
      "will my waitlist ticket confirm",
      "wl 30 confirm hoga ya nahi",
    ],
    relatedSlugs: [
      "waitlist-confirmation-prediction-and-trends",
      "vikalp-scheme-alternate-train-explained",
      "pnr-status-explained-cnf-rac-wl-meaning",
      "rac-vs-waitlist-difference-explained",
      "irctc-tatkal-booking-2026-timings-rules",
    ],
    content: [
      {
        type: "paragraph",
        text: "A waitlisted ticket isn't a rejection — most waitlisted tickets on Indian Railways do end up confirming, especially at lower numbers. But WL 8 confirmation chances and WL 80 confirmation chances are very different bets, and knowing roughly where the line is helps you decide whether to wait it out or make a backup plan.",
      },
      { type: "heading", id: "rough-confirmation-bands", text: "Rough confirmation bands (not a guarantee)" },
      {
        type: "paragraph",
        text: "These are general patterns seen across popular routes, not a promise for any specific train — the exact route, class, day of week and season all matter more than the number alone.",
      },
      {
        type: "checklist",
        items: [
          "WL 1–15 on GNWL (this covers a WL 8-type ticket): confirms in the large majority of cases.",
          "WL 16–30: roughly a coin-flip to moderately favourable — worth watching closely.",
          "WL 60 and above (this covers a WL 80-type ticket): confirmation becomes unlikely; treat it as a long shot, not a plan.",
          "RAC: not really a \"chance\" at all — you're already guaranteed to travel, sharing a berth.",
        ],
      },
      { type: "heading", id: "why-your-number-moves", text: "Why your number moves (and when)" },
      {
        type: "paragraph",
        text: "Every cancellation nudges the queue forward — RAC passengers move to a full berth first, then waitlisted passengers move into RAC or confirmed slots. Cancellations cluster heavily in the final 24–48 hours before departure, as other travellers finalise their own plans, so a lot of movement often happens right before chart preparation.",
      },
      { type: "tip", text: "Check your PNR status every day rather than once — a WL 40 dropping steadily to WL 12 over a week tells a very different story than one that hasn't moved at all. Our guide to waitlist confirmation trends and history goes deeper on tracking this." },
      { type: "heading", id: "what-to-do-if-your-chances-look-low", text: "What to do if your chances look low" },
      {
        type: "checklist",
        items: [
          "Check a different class on the same train — 3AC might be waitlisted while Sleeper still has room.",
          "Check nearby trains on the same route and date.",
          "Opt into the Vikalp scheme, which can auto-shift you to an alternate train with available seats — see our Vikalp guide for how to set it up.",
          "Keep a Tatkal attempt, a bus, or a flight as your realistic backup — not your first choice, but a safety net.",
        ],
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "waitlist-confirmation-prediction-and-trends",
    title: "Waitlist confirmation prediction: how to read the trend, not just the number",
    excerpt:
      "Waiting list confirmation prediction isn't guesswork if you know what to watch. Here's how to read waitlist confirmation history and trends after chart preparation.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "6 min read",
    date: "2026-08-31",
    author: DEFAULT_AUTHOR,
    keywords: [
      "waiting list confirmation prediction",
      "train waiting list confirmation history",
      "waiting list trends",
      "waiting list confirmation after chart preparation",
      "wl23 meaning in train",
      "will my wl ticket confirm calculator",
    ],
    relatedSlugs: [
      "waitlist-ticket-confirmation-chances-explained",
      "rswl-rqwl-gn-quota-explained",
      "chart-preparation-time-explained-first-second-chart",
      "irctc-tatkal-booking-2026-timings-rules",
    ],
    content: [
      {
        type: "paragraph",
        text: "A single WL number is a snapshot, not a prediction. If you're trying to work out whether your ticket will actually confirm, the trend over the days leading up to your trip tells you far more than the number does on any one day — and \"WL23\" simply means you're the 23rd person in that particular waitlist queue, nothing more sinister than that.",
      },
      { type: "heading", id: "why-a-single-snapshot-misleads", text: "Why a single snapshot misleads" },
      {
        type: "paragraph",
        text: "Two tickets can both show WL 23 today and have completely different odds — one might have been WL 60 a week ago and be falling fast, the other might have been sitting at WL 25 for ten days with barely any movement. The direction and speed of movement is the real signal.",
      },
      { type: "heading", id: "how-to-track-your-own-confirmation-history", text: "How to track your own confirmation history" },
      {
        type: "checklist",
        items: [
          "Check your PNR status once a day, ideally at the same time, and note the number rather than just glancing and closing the app.",
          "Most third-party PNR-status apps (and some train-status tools) show a short history graph of your own ticket's movement — use it instead of relying on memory.",
          "Compare your number's movement against how many days are left, not just how many people are ahead of you — a WL 40 with two weeks to go is a very different situation from a WL 40 the night before departure.",
        ],
      },
      { type: "heading", id: "what-moves-a-waitlist-and-when", text: "What actually moves a waitlist, and when" },
      {
        type: "paragraph",
        text: "Cancellations are the only thing that clears a waitlist — there's no separate \"release\" of extra berths. Movement tends to cluster in two windows: a slow trickle in the days after booking opens (as people finalise plans), and a much sharper burst in the final 24–48 hours as indecisive travellers cancel ahead of the trip.",
      },
      { type: "heading", id: "after-chart-preparation", text: "What happens after chart preparation" },
      {
        type: "paragraph",
        text: "Indian Railways typically prepares a first chart some hours before departure, followed by a final chart much closer to departure time; RAC and waitlisted passengers can still move into vacated berths between the two. But once the final chart is out, any ticket still showing WL is automatically cancelled — a WL ticket cannot be used to board after this point, regardless of how close the number was. Our chart preparation guide has the fuller breakdown of both windows.",
      },
      { type: "tip", text: "If your waitlist number hasn't moved at all three or four days out, that's a stronger signal to arrange a backup than the raw number itself — a stalled WL 20 can be riskier than a fast-falling WL 45." },
      { type: "heading", id: "if-the-trend-looks-bad", text: "If the trend looks bad" },
      {
        type: "paragraph",
        text: "Don't wait until the final chart to react. Check nearby trains, a different class on the same train, opt into Vikalp, or a mixed-mode alternative a few days ahead of time, so you're not scrambling at the last minute if your ticket doesn't clear.",
      },
      { type: "cta", label: "Find a Way Now", href: "/journey-planner" },
    ],
  },
  {
    slug: "rac-vs-waitlist-difference-explained",
    title: "RAC vs waitlist: what's the difference, and can you still travel?",
    excerpt:
      "Is RAC and waiting list the same? No — here's the real difference between RAC and WL, and which one actually guarantees you'll board the train.",
    coverImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "4 min read",
    date: "2026-08-19",
    author: DEFAULT_AUTHOR,
    keywords: [
      "rac vs waitlist",
      "can rac passenger travel",
      "rac ticket meaning",
      "difference between rac and wl",
      "difference between rac and waitlist",
      "is rac and waiting list same",
      "waiting list and rac",
    ],
    relatedSlugs: [
      "pnr-status-explained-cnf-rac-wl-meaning",
      "waitlist-ticket-confirmation-chances-explained",
      "rswl-rqwl-gn-quota-explained",
    ],
    content: [
      {
        type: "paragraph",
        text: "RAC and Waitlist are easy to mix up because both show up when a train is full — but they mean very different things for whether you'll actually get on board. Short answer: no, RAC and waitlist are not the same.",
      },
      { type: "heading", id: "rac-means-you-are-travelling", text: "RAC means you're travelling" },
      {
        type: "paragraph",
        text: "RAC — Reservation Against Cancellation — guarantees you a seat. You'll share a side-lower berth with one other RAC passenger to start, and if a confirmed passenger cancels, RAC holders are the first to be upgraded to a full berth, ahead of anyone on the waitlist.",
      },
      { type: "heading", id: "waitlist-means-not-yet", text: "Waitlist means \"not yet\"" },
      {
        type: "paragraph",
        text: "A Waitlisted (WL) ticket doesn't reserve a seat or a berth. You're in a queue, and you'll only get to travel if enough cancellations happen before the chart is prepared. If your ticket is still WL after that point, it's automatically cancelled — you cannot board on a WL ticket.",
      },
      {
        type: "checklist",
        items: [
          "RAC: guaranteed to travel, comfort improves with cancellations.",
          "WL: not guaranteed at all — confirmation depends entirely on other people cancelling.",
          "Movement order: RAC upgrades to CNF before any WL ticket does.",
        ],
      },
      { type: "tip", text: "If you're choosing between an RAC ticket and a WL ticket further down the list on a different train, the RAC ticket is almost always the safer pick." },
    ],
  },
  {
    slug: "irctc-tatkal-booking-2026-timings-rules",
    title: "IRCTC Tatkal booking 2026: timings, rules and how to actually get a seat",
    excerpt:
      "Tatkal timings for 2026: AC classes open at 10 AM, Sleeper and non-AC open at 11 AM, one day before travel. Here's exactly how the rules, quota, and seat availability work.",
    coverImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1600&h=900&fit=crop",
    category: "tips",
    readTime: "8 min read",
    date: "2026-08-23",
    author: DEFAULT_AUTHOR,
    keywords: [
      "tatkal booking time",
      "tatkal timings",
      "irctc tatkal rules 2026",
      "tatkal ticket booking timing ac sleeper",
      "tatkal non ac timing",
      "tatkal timings for sleeper",
      "how to book tatkal ticket fast",
      "tatkal aadhaar otp",
      "tatkal quota seats",
      "tatkal seat availability",
      "is first ac not available in tatkal",
    ],
    relatedSlugs: [
      "premium-tatkal-vs-tatkal-difference",
      "pnr-status-explained-cnf-rac-wl-meaning",
      "rswl-rqwl-gn-quota-explained",
      "diwali-chhath-puja-train-booking-tips",
      "irctc-website-down-what-to-do",
    ],
    content: [
      {
        type: "paragraph",
        text: "Tatkal is Indian Railways' emergency quota for travel that can't wait for regular booking — released exactly one day before the train's departure from its originating station. It's genuinely useful when you know it, and genuinely stressful when you don't.",
      },
      { type: "heading", id: "tatkal-timings", text: "Tatkal timings" },
      {
        type: "checklist",
        items: [
          "AC classes (1A, 2A, 3A, CC, EC): booking opens at 10:00 AM IST.",
          "Sleeper (SL) and Second Sitting (2S) — the non-AC classes: booking opens at 11:00 AM IST.",
          "The window opens one day before the date of journey, counted from the train's origin station — not necessarily your own boarding station.",
        ],
      },
      { type: "heading", id: "which-classes-tatkal-does-and-does-not-cover", text: "Which classes Tatkal does — and doesn't — cover" },
      {
        type: "paragraph",
        text: "Tatkal quota is not available in First AC (1A) or in Executive Chair Car on trains that don't run it as a separate Tatkal-eligible class — First AC is excluded from Tatkal booking entirely. Beyond that, Tatkal seat availability in any class depends on how many berths the train has allocated to the quota for that specific journey, which varies train to train and can sell out within minutes on popular routes.",
      },
      { type: "heading", id: "what-changed-recently", text: "What's changed recently" },
      {
        type: "paragraph",
        text: "Aadhaar-linked, OTP-verified IRCTC accounts are now required for online Tatkal bookings — the OTP goes to the mobile number registered with Aadhaar, so make sure that number is active before booking day. Bookings are capped at 4 passengers per PNR, and no senior citizen, child, or other concession applies under Tatkal, regardless of age.",
      },
      { type: "tip", text: "Confirmed Tatkal tickets are non-refundable if you cancel them yourself — only a waitlisted Tatkal ticket that never confirms gets refunded. Only book Tatkal when the trip is certain." },
      { type: "heading", id: "how-to-actually-get-a-seat", text: "How to actually get a seat" },
      {
        type: "checklist",
        items: [
          "Log in 10–15 minutes before the window opens — don't wait until the exact minute.",
          "Save passenger details in IRCTC's Master List in advance so you're not typing during the rush.",
          "Use a fast payment method with details already saved — UPI or a stored card beats net banking for speed.",
          "Have your train number and preferred class already selected before the clock hits the opening time.",
        ],
      },
      {
        type: "paragraph",
        text: "If Tatkal on your exact train is gone in seconds, check nearby departure stations or a connecting route — sometimes a train + bus or train + train combination has room even when the direct Tatkal quota doesn't. If it's the pricing that's the problem rather than availability, it's worth comparing against Premium Tatkal before you assume the seat is gone entirely.",
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